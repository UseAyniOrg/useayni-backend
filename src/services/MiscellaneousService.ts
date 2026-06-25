import {
  Injectable,
  BadRequestException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { isUUID } from 'class-validator';
import { MiscellaneousRepository } from '../repositories/MiscellaneousRepository';
import { MemberRepository } from '../repositories/MemberRepository';
import {
  MiscellaneousOwnerRepository,
  MiscellaneousParticipantRepository,
  MiscellaneousApprovalLogRepository,
} from '../repositories/MiscellaneousSubRepositories';
import {
  CreateMiscellaneousDto,
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
import { matchesScopeRules, MemberScopeContext } from '../helpers/miscellaneousScope';

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

function generateSlug(title: string, suffix: string): string {
  const base = title
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .slice(0, 60);
  return `${base}-${suffix}`;
}

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

    const visibility = dto.participation_type === 'private' ? 'private' : 'public';
    const legacyScope = this.resolveLegacyScope(dto.scope_rules);

    const misc = await this.miscRepo.create({
      ...dto,
      start_date: startDate,
      end_date: endDate,
      participation_type: dto.participation_type ?? 'public',
      visibility,
      scope: legacyScope,
      scope_rules: dto.scope_rules as any,
      max_participants: dto.max_participants,
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

  async findAll(filters: MiscellaneousFiltersDto, userId: string) {
    const { data, total } = await this.miscRepo.findWithFilters(filters, userId);
    if (!userId) return { data: [], total: 0 };

    const member = await this.memberRepo.findByIdWithRelations(userId);
    const visibleData = data.filter(misc => this.canAccessMiscellaneous(misc, userId, member));
    return { data: visibleData, total: visibleData.length };
  }

  async findById(id: string) {
    const misc = await this.miscRepo.findById(id);
    if (!misc) throw new NotFoundException('Miscelânea não encontrada');
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

  async update(id: string, dto: UpdateMiscellaneousDto, userId: string) {
    const misc = await this.findById(id);
    await this.ensureOwner(id, userId);

    // Scope change may require re-approval
    let newStatus = misc.status;
    if (dto.scope && dto.scope !== misc.scope) {
      throw new BadRequestException(
        'Mudança de escopo não é permitida via PATCH direto. Use o endpoint de reaprovação.'
      );
    }

    const updated = await this.miscRepo.update(id, {
      ...dto,
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

    return updated;
  }

  async archive(id: string, userId: string) {
    await this.findById(id);
    await this.ensureOwner(id, userId);
    await this.miscRepo.archive(id);
  }

  async remove(id: string, userId: string) {
    const misc = await this.findById(id);
    const isOwner = await this.ownerRepo.findOne(id, userId);
    if (!isOwner && misc.created_by !== userId) {
      throw new ForbiddenException('Apenas o criador ou donos podem excluir esta miscelânea');
    }
    await this.miscRepo.softDelete(id);
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
  async addOwner(id: string, targetMemberId: string, requesterId: string) {
    await this.ensureOwner(id, requesterId);
    const existing = await this.ownerRepo.findOne(id, targetMemberId);
    if (existing) throw new BadRequestException('Usuário já é dono desta miscelânea');
    return this.ownerRepo.add(id, targetMemberId, OwnerRole.CO_OWNER);
  }

  async searchMembers(id: string, requesterId: string, query: string) {
    await this.ensureOwner(id, requesterId);
    const normalized = query?.trim();
    if (!normalized) return [];
    return this.memberRepo.search(normalized, 10);
  }

  async resolveMemberTarget(identifier: string | undefined, query?: string) {
    const searchTerm = (identifier ?? query ?? '').trim();
    if (!searchTerm) throw new BadRequestException('Informe um membro válido');

    if (isUUID(searchTerm)) return searchTerm;

    const members = await this.memberRepo.search(searchTerm, 10);
    if (members.length === 1) return members[0].id;
    if (members.length > 1) {
      throw new BadRequestException('Mais de um membro encontrado. Use o UUID ou refine a busca');
    }
    throw new BadRequestException('Membro não encontrado');
  }

  async removeOwner(id: string, targetMemberId: string, requesterId: string) {
    await this.ensureOwner(id, requesterId);
    const count = await this.ownerRepo.countOwners(id);
    if (count <= 1) throw new BadRequestException('Não é possível remover o último dono');
    const target = await this.ownerRepo.findOne(id, targetMemberId);
    if (target?.is_creator && targetMemberId !== requesterId) {
      throw new ForbiddenException('O criador original só pode ser removido por si mesmo');
    }
    await this.ownerRepo.remove(id, targetMemberId);
  }

  async addMember(id: string, targetMemberId: string, requesterId: string) {
    await this.ensureOwner(id, requesterId);
    const already = await this.participantRepo.isParticipant(id, targetMemberId);
    if (already) throw new BadRequestException('Usuário já é membro desta miscelânea');
    return this.participantRepo.add(id, targetMemberId);
  }

  async removeMember(id: string, targetMemberId: string, requesterId: string) {
    await this.ensureOwner(id, requesterId);
    await this.participantRepo.remove(id, targetMemberId);
  }

  async getPeople(id: string) {
    const [owners, members] = await Promise.all([
      this.ownerRepo.findByMiscellaneous(id),
      this.participantRepo.findByMiscellaneous(id),
    ]);
    return { owners, members };
  }

  async enablePublicAccess(id: string, userId: string): Promise<string> {
    await this.ensureOwner(id, userId);
    const misc = await this.findById(id);
    if (misc.public_slug) {
      await this.miscRepo.update(id, { public_access_enabled: true });
      return misc.public_slug;
    }
    let slug: string;
    do {
      slug = generateSlug(misc.title, randomSuffix());
    } while (await this.miscRepo.slugExists(slug));
    await this.miscRepo.update(id, { public_slug: slug, public_access_enabled: true });
    return slug;
  }

  async closeRegistrations(id: string) {
    await this.miscRepo.update(id, { registration_end_date: new Date() });
  }

  async disablePublicAccess(id: string, userId: string) {
    await this.ensureOwner(id, userId);
    await this.miscRepo.update(id, { public_access_enabled: false });
  }

  // Helpers
  private resolveLegacyScope(scopeRules: any[] | undefined): MiscellaneousScope {
    if (!scopeRules?.length) return MiscellaneousScope.GENERAL;

    const firstRule = scopeRules[0];
    if (!firstRule?.type) return MiscellaneousScope.GENERAL;

    switch (firstRule.type) {
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
    const hasWideScope = scopeRules.some(r => ['cae', 'car', 'city', 'general'].includes(r.type));
    if (!hasWideScope) return MiscellaneousStatus.ACTIVE;
    const highestRole = creatorRoles.find(r => ROLE_MAX_SCOPE[r] !== undefined) ?? 'MEMBRO';
    const maxScope = ROLE_MAX_SCOPE[highestRole] ?? MiscellaneousScope.INDIVIDUAL;
    if (SCOPE_LEVEL[maxScope] >= SCOPE_LEVEL[MiscellaneousScope.CAR])
      return MiscellaneousStatus.ACTIVE;
    return MiscellaneousStatus.PENDING_APPROVAL;
  }

  private canAccessMiscellaneous(misc: Miscellaneous, userId: string, member: any): boolean {
    if (misc.created_by === userId) return true;
    const isPublic = misc.visibility === 'public' || misc.participation_type === 'public';
    if (!isPublic) return true;

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

  async ensureOwner(miscellaneousId: string, userId: string) {
    const isOwner = await this.ownerRepo.isOwner(miscellaneousId, userId);
    if (!isOwner) throw new ForbiddenException('Apenas donos podem realizar esta ação');
  }
}
