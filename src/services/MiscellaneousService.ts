import {
  Injectable,
  BadRequestException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { isUUID } from 'class-validator';
import { In } from 'typeorm';
import { MiscellaneousRepository } from '../repositories/MiscellaneousRepository';
import { MemberRepository } from '../repositories/MemberRepository';
import {
  MiscellaneousOwnerRepository,
  MiscellaneousParticipantRepository,
  MiscellaneousApprovalLogRepository,
} from '../repositories/MiscellaneousSubRepositories';
import {
  CreateMiscellaneousDto,
  ExternalRegistrationFieldDto,
  UpdateMiscellaneousDto,
  MiscellaneousFiltersDto,
} from '../dto/miscellaneous/miscellaneous.dto';
import { ApprovalActionDto } from '../dto/miscellaneous/actions.dto';
import {
  Miscellaneous,
  MiscellaneousType,
  MiscellaneousStatus,
  MiscellaneousScope,
} from '../models/miscellaneous';
import { OwnerRole } from '../models/miscellaneousOwner';
import { ApprovalAction } from '../models/miscellaneousApprovalLog';
import { OrgUnit, OrgUnitStatus } from '../models/orgUnit';
import { matchesScopeRules, MemberScopeContext } from '../helpers/miscellaneousScope';
import { AppDataBase } from '../db';
import { generateMiscellaneousPublicSlug } from '../helpers/miscellaneousSlug';

export interface MiscellaneousManagementContext {
  roles: string[];
  organization_id?: string;
}

// Tabela de aninhamento válida (pai -> filhos permitidos)
const ALLOWED_CHILDREN: Partial<Record<MiscellaneousType, MiscellaneousType[]>> = {
  [MiscellaneousType.PROJECT]: [
    MiscellaneousType.EVENT,
    MiscellaneousType.GOAL,
    MiscellaneousType.MEETING,
    MiscellaneousType.ACTIVITY,
    MiscellaneousType.FORM,
  ],
  [MiscellaneousType.EVENT]: [
    MiscellaneousType.ACTIVITY,
    MiscellaneousType.GOAL,
    MiscellaneousType.MEETING,
    MiscellaneousType.FORM,
  ],
  [MiscellaneousType.MEETING]: [
    MiscellaneousType.ACTIVITY,
    MiscellaneousType.GOAL,
    MiscellaneousType.FORM,
  ],
  [MiscellaneousType.ACTIVITY]: [],
  [MiscellaneousType.FORM]: [],
  [MiscellaneousType.GOAL]: [],
};

// Ordem hierárquica dos escopos (menor = mais restrito)
const SCOPE_LEVEL: Record<MiscellaneousScope, number> = {
  [MiscellaneousScope.INDIVIDUAL]: 0,
  [MiscellaneousScope.SEMESTER]: 1,
  [MiscellaneousScope.COURSE]: 2,
  [MiscellaneousScope.UNIVERSITY]: 3,
  [MiscellaneousScope.CITY]: 4,
  [MiscellaneousScope.CAR]: 5,
  [MiscellaneousScope.CAE]: 6,
  [MiscellaneousScope.GENERAL]: 7,
};

// Nível hierárquico do membro por role/posição → escopo máximo sem aprovação
const ROLE_MAX_SCOPE: Record<string, MiscellaneousScope> = {
  EQUIPE_TECNICA: MiscellaneousScope.GENERAL,
  CAE: MiscellaneousScope.CAE,
  CAR: MiscellaneousScope.CAR,
  DIRIGENTE: MiscellaneousScope.COURSE,
  REPRESENTANTE: MiscellaneousScope.SEMESTER,
  MEMBRO: MiscellaneousScope.INDIVIDUAL,
  EGRESSO: MiscellaneousScope.INDIVIDUAL,
};

function randomSuffix(): string {
  return Math.random().toString(36).slice(2, 7);
}

@Injectable()
export class MiscellaneousService {
  constructor(
    private readonly miscRepo: MiscellaneousRepository,
    private readonly ownerRepo: MiscellaneousOwnerRepository,
    private readonly participantRepo: MiscellaneousParticipantRepository,
    private readonly approvalLogRepo: MiscellaneousApprovalLogRepository,
    private readonly memberRepo: MemberRepository
  ) {}

  async create(dto: CreateMiscellaneousDto, creatorId: string, creatorRoles: string[]) {
    let endDate = dto.end_date ? new Date(dto.end_date) : undefined;
    const startDate = new Date(dto.start_date);

    // Validate parent + inherit/clamp dates
    if (dto.parent_id) {
      const parent = await this.validateParent(dto.parent_id, dto.type, dto.scope_rules);
      if (parent.end_date) {
        if (!endDate) endDate = parent.end_date;
        else if (endDate > parent.end_date) endDate = parent.end_date;
      }
      if (parent.start_date && startDate < parent.start_date) {
        throw new BadRequestException('A data de início não pode ser anterior à do pai');
      }
      if (parent.end_date && startDate > parent.end_date) {
        throw new BadRequestException('A data de início não pode ser após o término do pai');
      }
    }

    const status = this.resolveStatus(dto.scope_rules, creatorRoles);
    const externalRegistrationSchema = this.validateExternalRegistrationSchema(
      dto.type,
      dto.external_registration_schema,
    );

    const visibility = dto.participation_type === 'private' ? 'private' : 'public';
    const legacyScope = this.resolveLegacyScope(dto.scope_rules);
    const organizationId = (dto as CreateMiscellaneousDto & { organization_id?: string }).organization_id;
    const unitIds = (dto.scope_rules ?? [])
      .filter((rule) => rule.type === 'org_unit')
      .map((rule) => rule.org_unit_id)
      .filter((id): id is string => Boolean(id));
    if ((dto.scope_rules ?? []).some((rule) => rule.type === 'org_unit' && !rule.org_unit_id)) {
      throw new BadRequestException('Selecione uma unidade para cada regra de escopo.');
    }
    if (unitIds.length > 0) {
      const units = await AppDataBase.getRepository(OrgUnit).find({
        where: { organization_id: organizationId, id: In(unitIds), status: OrgUnitStatus.ACTIVE },
        select: { id: true },
      });
      if (units.length !== new Set(unitIds).size) {
        throw new BadRequestException('Uma ou mais unidades não pertencem à organização ou estão inativas.');
      }
    }
    await this.validateMediaAssets(organizationId, [
      dto.cover_asset_id,
      dto.banner_asset_id,
      dto.map_asset_id,
      ...(dto.sponsor_asset_ids ?? []),
    ]);

    const misc = await this.miscRepo.create({
      ...dto,
      start_date: startDate,
      end_date: endDate,
      participation_type: dto.participation_type ?? 'public',
      visibility,
      scope: legacyScope,
      scope_rules: dto.scope_rules as any,
      max_participants: dto.max_participants,
      external_registration_schema: externalRegistrationSchema,
      registration_start_date: dto.registration_start_date
        ? new Date(dto.registration_start_date)
        : undefined,
      registration_end_date: dto.registration_end_date
        ? new Date(dto.registration_end_date)
        : undefined,
      created_by: creatorId,
      status,
    });

    await this.ownerRepo.add(misc.id, creatorId, OwnerRole.OWNER, true);

    if (dto.co_owner_ids?.length) {
      for (const id of dto.co_owner_ids) {
        await this.ownerRepo.add(misc.id, id, OwnerRole.CO_OWNER);
      }
    }

    if (dto.initial_member_ids?.length) {
      for (const id of dto.initial_member_ids) {
        await this.participantRepo.add(misc.id, id);
      }
    }

    return { miscellaneous: misc, status };
  }

  async findAll(filters: MiscellaneousFiltersDto, userId: string, canManageOrganization = false) {
    const { data, total } = await this.miscRepo.findWithFilters(filters, userId, canManageOrganization);
    if (!userId) return { data: [], total: 0 };
    if (canManageOrganization) return { data, total };

    const member = await this.memberRepo.findByIdWithRelations(userId);
    if (member) {
      const mandates = await AppDataBase.query(
        `SELECT DISTINCT org_unit_id
         FROM mandates
         WHERE member_id = $1
           AND status = 'ACTIVE'
           AND start_date <= CURRENT_DATE
           AND (end_date IS NULL OR end_date >= CURRENT_DATE)`,
        [userId],
      ) as { org_unit_id: string }[];
      (member as typeof member & { org_unit_ids?: string[] }).org_unit_ids =
        mandates.map((mandate) => mandate.org_unit_id);
    }
    const visibleData = data.filter(misc => this.canAccessMiscellaneous(misc, userId, member));
    return { data: visibleData, total: visibleData.length };
  }

  async findById(id: string) {
    const misc = await this.miscRepo.findById(id);
    if (!misc) throw new NotFoundException('Miscelânea não encontrada');
    return misc;
  }

  async findVisibleById(
    id: string,
    organizationId: string | undefined,
    userId: string,
    roles: string[],
  ) {
    const misc = await this.findById(id);
    if (organizationId && misc.organization_id !== organizationId) {
      throw new NotFoundException('Miscelânea não encontrada');
    }
    const canManageOrganization = roles.some((role) =>
      ['EQUIPE_TECNICA', 'organization.admin', 'organization.manage'].includes(role),
    );
    if (canManageOrganization) return misc;

    const member = await this.memberRepo.findByIdWithRelations(userId, organizationId);
    if (member) {
      const mandates = await AppDataBase.query(
        `SELECT DISTINCT org_unit_id
         FROM mandates
         WHERE member_id = $1
           AND status = 'ACTIVE'
           AND start_date <= CURRENT_DATE
           AND (end_date IS NULL OR end_date >= CURRENT_DATE)`,
        [userId],
      ) as { org_unit_id: string }[];
      (member as typeof member & { org_unit_ids?: string[] }).org_unit_ids =
        mandates.map((mandate) => mandate.org_unit_id);
    }
    if (!this.canAccessMiscellaneous(misc, userId, member)) {
      throw new NotFoundException('Miscelânea não encontrada');
    }
    return misc;
  }

  async getChildren(id: string) {
    const misc = await this.findById(id);
    const children = await this.miscRepo.findChildren(misc.id);
    // Group by type
    const grouped = children.reduce(
      (acc, child) => {
        if (!acc[child.type]) acc[child.type] = [];
        acc[child.type].push(child);
        return acc;
      },
      {} as Record<string, Miscellaneous[]>
    );
    return grouped;
  }

  async update(id: string, dto: UpdateMiscellaneousDto, userId: string, context?: MiscellaneousManagementContext) {
    const misc = await this.findById(id);
    await this.ensureOwner(id, userId, context);

    // Scope change may require re-approval
    let newStatus = misc.status;
    if (dto.scope && dto.scope !== misc.scope) {
      throw new BadRequestException(
        'Mudança de escopo não é permitida via PATCH direto. Use o endpoint de reaprovação.'
      );
    }
    const externalRegistrationSchema =
      dto.external_registration_schema === undefined
        ? undefined
        : this.validateExternalRegistrationSchema(
            misc.type,
            dto.external_registration_schema,
          );
    await this.validateMediaAssets(misc.organization_id ?? undefined, [
      dto.cover_asset_id !== undefined ? dto.cover_asset_id : misc.cover_asset_id,
      dto.banner_asset_id !== undefined ? dto.banner_asset_id : misc.banner_asset_id,
      dto.map_asset_id !== undefined ? dto.map_asset_id : misc.map_asset_id,
      ...(dto.sponsor_asset_ids ?? misc.sponsor_asset_ids ?? []),
    ]);

    const updated = await this.miscRepo.update(id, {
      ...dto,
      external_registration_schema: externalRegistrationSchema,
      scope: dto.scope ?? this.resolveLegacyScope((dto as any).scope_rules),
      start_date: dto.start_date ? new Date(dto.start_date) : undefined,
      end_date: dto.end_date ? new Date(dto.end_date) : undefined,
      registration_start_date: dto.registration_start_date
        ? new Date(dto.registration_start_date)
        : undefined,
      registration_end_date: dto.registration_end_date
        ? new Date(dto.registration_end_date)
        : undefined,
    });

    await this.syncPublicMediaVisibility(misc);
    await this.syncPublicMediaVisibility(updated);
    return updated;
  }

  private async validateMediaAssets(
    organizationId: string | undefined,
    assetIds: Array<string | null | undefined>,
  ): Promise<void> {
    const ids = [...new Set(assetIds.filter((id): id is string => Boolean(id)))];
    if (ids.length === 0) return;
    if (!organizationId) {
      throw new BadRequestException('Não foi possível identificar a organização das mídias.');
    }
    const rows = (await AppDataBase.query(
      `SELECT id, mime_type
       FROM media_assets
       WHERE organization_id = $1 AND id = ANY($2::uuid[]) AND status = 'ACTIVE'`,
      [organizationId, ids],
    )) as { id: string; mime_type: string }[];
    if (rows.length !== ids.length) {
      throw new BadRequestException(
        'Uma ou mais mídias não pertencem a esta organização ou ainda não estão ativas.',
      );
    }
    if (rows.some((row) => !row.mime_type.startsWith('image/'))) {
      throw new BadRequestException('Somente imagens podem ser usadas em capas, mapas e patrocinadores.');
    }
  }

  private validateExternalRegistrationSchema(
    type: MiscellaneousType,
    schema?: ExternalRegistrationFieldDto[],
  ) {
    if (schema === undefined) return [];
    if (type !== MiscellaneousType.EVENT && schema.length > 0) {
      throw new BadRequestException('Campos de inscrição externos só podem ser configurados em eventos.');
    }
    if (schema.length > 40) throw new BadRequestException('O evento aceita até 40 campos externos.');
    const keys = new Set<string>();
    for (const field of schema) {
      if (!/^[a-zA-Z][a-zA-Z0-9_]{0,63}$/.test(field.key)) {
        throw new BadRequestException(`Chave inválida no campo "${field.label}".`);
      }
      if (keys.has(field.key)) {
        throw new BadRequestException(`A chave "${field.key}" está repetida nos campos externos.`);
      }
      if (field.type === 'select' && (!field.options || field.options.length < 1 || field.options.length > 50)) {
        throw new BadRequestException(`Defina de 1 a 50 opções para "${field.label}".`);
      }
      keys.add(field.key);
    }
    return schema;
  }

  async archive(id: string, userId: string, context?: MiscellaneousManagementContext) {
    const misc = await this.findById(id);
    await this.ensureOwner(id, userId, context);
    await this.miscRepo.archive(id);
    await this.syncPublicMediaVisibility(misc);
  }

  async remove(id: string, userId: string, context?: MiscellaneousManagementContext) {
    const misc = await this.findById(id);
    if (context && (!context.organization_id || misc.organization_id !== context.organization_id)) {
      throw new NotFoundException('Miscelânea não encontrada nesta organização.');
    }
    if (misc.created_by !== userId) await this.ensureOwner(id, userId, context);
    await this.miscRepo.softDelete(id);
    await this.syncPublicMediaVisibility(misc);
    // Children become orphans (parent_id set to null via SET NULL on delete)
  }

  async approve(id: string, actorId: string, dto: ApprovalActionDto) {
    const misc = await this.findById(id);
    if (
      misc.status !== MiscellaneousStatus.PENDING_APPROVAL &&
      misc.status !== MiscellaneousStatus.UNDER_REVIEW
    ) {
      throw new BadRequestException('Miscelânea não está aguardando aprovação');
    }
    await this.miscRepo.update(id, { status: MiscellaneousStatus.ACTIVE });
    await this.syncPublicMediaVisibility(misc);
    await this.approvalLogRepo.create(id, actorId, ApprovalAction.APPROVE, dto.comment);
  }

  async reject(id: string, actorId: string, dto: ApprovalActionDto) {
    const misc = await this.findById(id);
    if (
      misc.status !== MiscellaneousStatus.PENDING_APPROVAL &&
      misc.status !== MiscellaneousStatus.UNDER_REVIEW
    ) {
      throw new BadRequestException('Miscelânea não está aguardando aprovação');
    }
    await this.miscRepo.update(id, { status: MiscellaneousStatus.REJECTED });
    await this.syncPublicMediaVisibility(misc);
    await this.approvalLogRepo.create(id, actorId, ApprovalAction.REJECT, dto.comment);
  }

  async requestReview(id: string, actorId: string, dto: ApprovalActionDto) {
    const misc = await this.findById(id);
    if (misc.status !== MiscellaneousStatus.PENDING_APPROVAL) {
      throw new BadRequestException('Miscelânea não está pendente de aprovação');
    }
    await this.miscRepo.update(id, { status: MiscellaneousStatus.UNDER_REVIEW });
    await this.approvalLogRepo.create(id, actorId, ApprovalAction.REQUEST_REVIEW, dto.comment);
  }

  async getPendingApprovals() {
    return this.miscRepo.findPendingForApproval();
  }

  async getApprovalHistory(id: string) {
    await this.findById(id);
    return this.approvalLogRepo.findByMiscellaneous(id);
  }

  // Owners & Members
  async addOwner(id: string, targetMemberId: string, requesterId: string, context?: MiscellaneousManagementContext) {
    await this.ensureOwner(id, requesterId, context);
    const existing = await this.ownerRepo.findOne(id, targetMemberId);
    if (existing) throw new BadRequestException('Usuário já é dono desta miscelânea');
    return this.ownerRepo.add(id, targetMemberId, OwnerRole.CO_OWNER);
  }

  async searchMembers(id: string, requesterId: string, query: string, organizationId: string, context?: MiscellaneousManagementContext) {
    await this.ensureOwner(id, requesterId, context);
    const normalized = query?.trim();
    if (!normalized) return [];
    return this.memberRepo.search(normalized, 10, organizationId);
  }

  async resolveMemberTarget(
    identifier: string | undefined,
    organizationId: string,
    query?: string,
  ) {
    const searchTerm = (identifier ?? query ?? '').trim();
    if (!searchTerm) throw new BadRequestException('Informe um membro válido');

    if (isUUID(searchTerm)) {
      const member = await this.memberRepo.findById(searchTerm, organizationId);
      if (!member) throw new BadRequestException('Membro não encontrado nesta organização');
      return member.id;
    }

    const members = await this.memberRepo.search(searchTerm, 10, organizationId);
    if (members.length === 1) return members[0].id;
    if (members.length > 1) {
      throw new BadRequestException('Mais de um membro encontrado. Use o UUID ou refine a busca');
    }
    throw new BadRequestException('Membro não encontrado');
  }

  async removeOwner(id: string, targetMemberId: string, requesterId: string, context?: MiscellaneousManagementContext) {
    await this.ensureOwner(id, requesterId, context);
    const count = await this.ownerRepo.countOwners(id);
    if (count <= 1) throw new BadRequestException('Não é possível remover o último dono');
    const target = await this.ownerRepo.findOne(id, targetMemberId);
    if (target?.is_creator && targetMemberId !== requesterId) {
      throw new ForbiddenException('O criador original só pode ser removido por si mesmo');
    }
    await this.ownerRepo.remove(id, targetMemberId);
  }

  async joinSelf(id: string, memberId: string) {
    const misc = await this.findById(id);
    if (misc.status !== MiscellaneousStatus.ACTIVE) {
      throw new BadRequestException('Esta miscelânea não está ativa para inscrições');
    }
    const already = await this.participantRepo.isParticipant(id, memberId);
    if (already) throw new BadRequestException('Você já está vinculado a esta miscelânea');
    const isOwner = await this.ownerRepo.findOne(id, memberId);
    if (isOwner) throw new BadRequestException('Você já é dono desta miscelânea');
    return this.participantRepo.add(id, memberId);
  }

  async addMember(id: string, targetMemberId: string, requesterId: string, context?: MiscellaneousManagementContext) {
    await this.ensureOwner(id, requesterId, context);
    const already = await this.participantRepo.isParticipant(id, targetMemberId);
    if (already) throw new BadRequestException('Usuário já é membro desta miscelânea');
    return this.participantRepo.add(id, targetMemberId);
  }

  async removeMember(id: string, targetMemberId: string, requesterId: string, context?: MiscellaneousManagementContext) {
    await this.ensureOwner(id, requesterId, context);
    await this.participantRepo.remove(id, targetMemberId);
  }

  async getPeople(id: string, requesterId: string, organizationId: string, context: MiscellaneousManagementContext) {
    await this.findVisibleById(id, organizationId, requesterId, context.roles);
    const [owners, members] = await Promise.all([
      this.ownerRepo.findByMiscellaneous(id),
      this.participantRepo.findByMiscellaneous(id),
    ]);
    const managesOrganization = context.organization_id === organizationId &&
      context.roles.some(role => ['EQUIPE_TECNICA', 'organization.admin', 'organization.manage'].includes(role));
    const managesEvent = managesOrganization || owners.some(owner => owner.member_id === requesterId);
    const details = managesEvent ? await AppDataBase.query(
      `SELECT member.id, member.email_personal, member.phone, member.cpf, member.registration_status,
        CASE WHEN EXISTS (SELECT 1 FROM member_roles mr JOIN roles role ON role.id = mr.role_id WHERE mr.member_id = member.id AND role.name = 'EXTERNO')
          THEN 'external' ELSE 'internal' END AS membership_type,
        jsonb_build_object(
          'organization_profile_name', profile.additional_attributes->'organization_profiles'->$2::text->>'name',
          'profile_fields', profile.additional_attributes->'organization_profiles'->$2::text->'fields',
          'profile_data', profile.additional_attributes->'organization_profiles'->$2::text->'data')
          || COALESCE(registration.shared_profile, '{}'::jsonb) AS shared_profile,
        COALESCE(registration.registration_data, '{}'::jsonb) AS registration_data,
        COALESCE((SELECT jsonb_object_agg(value.field_key, value.value) FROM member_custom_field_values value
          WHERE value.member_id = member.id), '{}'::jsonb) AS custom_fields
       FROM members member
       LEFT JOIN external_event_registrations registration ON registration.member_id = member.id AND registration.miscellaneous_id = $1
       LEFT JOIN external_account_profiles profile ON profile.account_id = member.account_id
       WHERE member.organization_id = $2::uuid AND member.id = ANY($3::uuid[])`,
      [id, organizationId, [...new Set([...owners, ...members].map(person => person.member_id))]],
    ) as { id: string; email_personal: string; phone: string | null; cpf: string | null; registration_status: string;
      membership_type: string; shared_profile: Record<string, unknown>; registration_data: Record<string, unknown>; custom_fields: Record<string, unknown> }[] : [];
    const byId = new Map(details.map(detail => [detail.id, detail]));
    const sanitize = <T extends { member_id: string; member: { id: string; name: string; profile_picture_url?: string } }>(person: T) => {
      const detail = byId.get(person.member_id);
      return { ...person, member: {
        id: person.member.id, name: person.member.name, profile_picture_url: person.member.profile_picture_url,
        ...(detail ? { email_personal: detail.email_personal, phone: detail.phone, cpf: detail.cpf, registration_status: detail.registration_status } : {}),
      }, ...(detail ? { details: { membership_type: detail.membership_type, shared_profile: detail.shared_profile,
        registration_data: detail.registration_data, custom_fields: detail.custom_fields } } : {}) };
    };
    return { owners: owners.map(sanitize), members: members.map(sanitize) };
  }

  async getExternalRegistrations(id: string, requesterId: string, organizationId: string, context?: MiscellaneousManagementContext) {
    const misc = await this.findById(id);
    if (misc.organization_id !== organizationId) {
      throw new NotFoundException('Evento não encontrado nesta organização.');
    }
    await this.ensureOwner(id, requesterId, context);
    return AppDataBase.query(
      `SELECT registration.id, registration.profile_type,
              registration.shared_profile, registration.registration_data,
              registration.profile_consent_at, registration.profile_consent_version,
              registration.created_at,
              CASE WHEN EXISTS (
                SELECT 1 FROM member_roles mr JOIN roles r ON r.id = mr.role_id
                WHERE mr.member_id = registration.member_id AND r.name = 'EXTERNO'
              ) THEN 'external' ELSE 'internal' END AS membership_type
       FROM external_event_registrations AS registration
       WHERE registration.miscellaneous_id = $1
         AND registration.organization_id = $2
       ORDER BY registration.created_at ASC`,
      [id, organizationId],
    );
  }

  async enablePublicAccess(id: string, userId: string, context?: MiscellaneousManagementContext): Promise<string> {
    await this.ensureOwner(id, userId, context);
    const misc = await this.findById(id);
    if (misc.public_slug) {
      await this.miscRepo.update(id, { public_access_enabled: true });
      if (misc.status === MiscellaneousStatus.ACTIVE) await this.syncPublicMediaVisibility(misc);
      return misc.public_slug;
    }
    let slug: string;
    do {
      slug = generateMiscellaneousPublicSlug(misc.title, randomSuffix());
    } while (await this.miscRepo.slugExists(slug));
    await this.miscRepo.update(id, { public_slug: slug, public_access_enabled: true });
    if (misc.status === MiscellaneousStatus.ACTIVE) await this.syncPublicMediaVisibility(misc);
    return slug;
  }

  async closeRegistrations(id: string) {
    await this.miscRepo.update(id, { registration_end_date: new Date() });
  }

  async disablePublicAccess(id: string, userId: string, context?: MiscellaneousManagementContext) {
    await this.ensureOwner(id, userId, context);
    const misc = await this.findById(id);
    await this.miscRepo.update(id, { public_access_enabled: false });
    await this.syncPublicMediaVisibility(misc);
  }

  // Helpers
  private async syncPublicMediaVisibility(misc: Miscellaneous | null) {
    if (!misc?.organization_id) return;
    const assetIds = [
      misc.cover_asset_id,
      misc.banner_asset_id,
      misc.map_asset_id,
      ...(misc.sponsor_asset_ids ?? []),
    ].filter((id): id is string => typeof id === 'string' && isUUID(id));
    if (assetIds.length === 0) return;

    await AppDataBase.query(
      `UPDATE media_assets AS asset
       SET visibility = CASE WHEN EXISTS (
         SELECT 1
         FROM miscellaneous AS visible
         WHERE visible.organization_id = $1
           AND visible.status = 'active'
           AND visible.visibility = 'public'
           AND visible.participation_type = 'public'
           AND visible.public_access_enabled = true
           AND (
             visible.cover_asset_id = asset.id
             OR visible.banner_asset_id = asset.id
             OR visible.map_asset_id = asset.id
             OR visible.sponsor_asset_ids @> jsonb_build_array(asset.id::text)
           )
       ) THEN 'PUBLIC' ELSE 'PRIVATE' END
       WHERE asset.organization_id = $1 AND asset.id = ANY($2::uuid[])`,
      [misc.organization_id, assetIds],
    );
  }

  private resolveLegacyScope(scopeRules: any[] | undefined): MiscellaneousScope {
    if (!scopeRules?.length) return MiscellaneousScope.GENERAL;

    const firstRule = scopeRules[0];
    if (!firstRule?.type) return MiscellaneousScope.GENERAL;

    switch (firstRule.type) {
      case 'org_unit':
        return MiscellaneousScope.GENERAL;
      case 'cae':
        return MiscellaneousScope.CAE;
      case 'car':
        return MiscellaneousScope.CAR;
      case 'city':
        return MiscellaneousScope.CITY;
      case 'university':
        return MiscellaneousScope.UNIVERSITY;
      case 'course':
        return MiscellaneousScope.COURSE;
      case 'semester':
        return MiscellaneousScope.SEMESTER;
      default:
        return MiscellaneousScope.GENERAL;
    }
  }

  private resolveStatus(
    scopeRules: any[] | undefined,
    creatorRoles: string[]
  ): MiscellaneousStatus {
    if (!scopeRules?.length) return MiscellaneousStatus.ACTIVE;
    const hasWideScope = scopeRules.some(r => ['cae', 'car', 'city', 'general', 'org_unit'].includes(r.type));
    if (!hasWideScope) return MiscellaneousStatus.ACTIVE;
    const highestRole = creatorRoles.some((role) => ['organization.admin', 'organization.manage'].includes(role))
      ? 'EQUIPE_TECNICA'
      : creatorRoles.find(r => ROLE_MAX_SCOPE[r] !== undefined) ?? 'MEMBRO';
    const maxScope = ROLE_MAX_SCOPE[highestRole] ?? MiscellaneousScope.INDIVIDUAL;
    if (SCOPE_LEVEL[maxScope] >= SCOPE_LEVEL[MiscellaneousScope.CAR])
      return MiscellaneousStatus.ACTIVE;
    return MiscellaneousStatus.PENDING_APPROVAL;
  }

  private canAccessMiscellaneous(misc: Miscellaneous, userId: string, member: any): boolean {
    if (misc.created_by === userId) return true;
    if (!misc.scope_rules?.length) return true;

    const contexts = this.buildMemberScopeContexts(member);
    return contexts.some(context => matchesScopeRules(misc.scope_rules, context));
  }

  private buildMemberScopeContexts(member: any): MemberScopeContext[] {
    const primaryContext: MemberScopeContext = {
      city_id: member?.city_id ?? member?.city?.id ?? null,
      university_id: null,
      course_id: null,
      course_university_id: null,
      semester: member?.current_semester ?? null,
      org_unit_ids: member?.org_unit_ids ?? [],
    };

    const courseContexts = (member?.memberCourses ?? []).map((memberCourse: any) => {
      const courseUniversity = memberCourse?.courseUniversity;
      return {
        city_id: member?.city_id ?? member?.city?.id ?? null,
        university_id: courseUniversity?.university?.id ?? courseUniversity?.university_id ?? null,
        course_id: courseUniversity?.course?.id ?? courseUniversity?.course_id ?? null,
        course_university_id: courseUniversity?.id ?? null,
        semester: memberCourse?.semester_number ?? member?.current_semester ?? null,
      } satisfies MemberScopeContext;
    });

    return [primaryContext, ...courseContexts];
  }

  private async validateParent(
    parentId: string,
    childType: MiscellaneousType,
    childScopeRules?: any[]
  ) {
    const parent = await this.miscRepo.findById(parentId);
    if (!parent) throw new BadRequestException('Miscelânea pai não encontrada');
    const allowed = ALLOWED_CHILDREN[parent.type] ?? [];
    if (!allowed.includes(childType)) {
      throw new BadRequestException(`Tipo "${childType}" não pode ser filho de "${parent.type}"`);
    }
    return parent;
  }

  async ensureOwner(miscellaneousId: string, userId: string, context?: MiscellaneousManagementContext) {
    if (context) {
      const misc = await this.findById(miscellaneousId);
      if (!context.organization_id || misc.organization_id !== context.organization_id) {
        throw new NotFoundException('Miscelânea não encontrada nesta organização.');
      }
      if (context.roles.some((role) => ['organization.admin', 'organization.manage', 'EQUIPE_TECNICA'].includes(role))) return;
    }
    const isOwner = await this.ownerRepo.isOwner(miscellaneousId, userId);
    if (!isOwner) throw new ForbiddenException('Apenas donos podem realizar esta ação');
  }
}
