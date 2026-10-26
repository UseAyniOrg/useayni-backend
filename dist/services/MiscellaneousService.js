"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.MiscellaneousService = void 0;
const common_1 = require("@nestjs/common");
const class_validator_1 = require("class-validator");
const typeorm_1 = require("typeorm");
const MiscellaneousRepository_1 = require("../repositories/MiscellaneousRepository");
const MemberRepository_1 = require("../repositories/MemberRepository");
const MiscellaneousSubRepositories_1 = require("../repositories/MiscellaneousSubRepositories");
const miscellaneous_1 = require("../models/miscellaneous");
const miscellaneousOwner_1 = require("../models/miscellaneousOwner");
const miscellaneousApprovalLog_1 = require("../models/miscellaneousApprovalLog");
const orgUnit_1 = require("../models/orgUnit");
const miscellaneousScope_1 = require("../helpers/miscellaneousScope");
const db_1 = require("../db");
const miscellaneousSlug_1 = require("../helpers/miscellaneousSlug");
// Tabela de aninhamento válida (pai -> filhos permitidos)
const ALLOWED_CHILDREN = {
    [miscellaneous_1.MiscellaneousType.PROJECT]: [
        miscellaneous_1.MiscellaneousType.EVENT,
        miscellaneous_1.MiscellaneousType.GOAL,
        miscellaneous_1.MiscellaneousType.MEETING,
        miscellaneous_1.MiscellaneousType.ACTIVITY,
        miscellaneous_1.MiscellaneousType.FORM,
    ],
    [miscellaneous_1.MiscellaneousType.EVENT]: [
        miscellaneous_1.MiscellaneousType.ACTIVITY,
        miscellaneous_1.MiscellaneousType.GOAL,
        miscellaneous_1.MiscellaneousType.MEETING,
        miscellaneous_1.MiscellaneousType.FORM,
    ],
    [miscellaneous_1.MiscellaneousType.MEETING]: [
        miscellaneous_1.MiscellaneousType.ACTIVITY,
        miscellaneous_1.MiscellaneousType.GOAL,
        miscellaneous_1.MiscellaneousType.FORM,
    ],
    [miscellaneous_1.MiscellaneousType.ACTIVITY]: [],
    [miscellaneous_1.MiscellaneousType.FORM]: [],
    [miscellaneous_1.MiscellaneousType.GOAL]: [],
};
// Ordem hierárquica dos escopos (menor = mais restrito)
const SCOPE_LEVEL = {
    [miscellaneous_1.MiscellaneousScope.INDIVIDUAL]: 0,
    [miscellaneous_1.MiscellaneousScope.SEMESTER]: 1,
    [miscellaneous_1.MiscellaneousScope.COURSE]: 2,
    [miscellaneous_1.MiscellaneousScope.UNIVERSITY]: 3,
    [miscellaneous_1.MiscellaneousScope.CITY]: 4,
    [miscellaneous_1.MiscellaneousScope.CAR]: 5,
    [miscellaneous_1.MiscellaneousScope.CAE]: 6,
    [miscellaneous_1.MiscellaneousScope.GENERAL]: 7,
};
// Nível hierárquico do membro por role/posição → escopo máximo sem aprovação
const ROLE_MAX_SCOPE = {
    EQUIPE_TECNICA: miscellaneous_1.MiscellaneousScope.GENERAL,
    CAE: miscellaneous_1.MiscellaneousScope.CAE,
    CAR: miscellaneous_1.MiscellaneousScope.CAR,
    DIRIGENTE: miscellaneous_1.MiscellaneousScope.COURSE,
    REPRESENTANTE: miscellaneous_1.MiscellaneousScope.SEMESTER,
    MEMBRO: miscellaneous_1.MiscellaneousScope.INDIVIDUAL,
    EGRESSO: miscellaneous_1.MiscellaneousScope.INDIVIDUAL,
};
function randomSuffix() {
    return Math.random().toString(36).slice(2, 7);
}
let MiscellaneousService = class MiscellaneousService {
    constructor(miscRepo, ownerRepo, participantRepo, approvalLogRepo, memberRepo) {
        this.miscRepo = miscRepo;
        this.ownerRepo = ownerRepo;
        this.participantRepo = participantRepo;
        this.approvalLogRepo = approvalLogRepo;
        this.memberRepo = memberRepo;
    }
    async create(dto, creatorId, creatorRoles) {
        let endDate = dto.end_date ? new Date(dto.end_date) : undefined;
        const startDate = new Date(dto.start_date);
        // Validate parent + inherit/clamp dates
        if (dto.parent_id) {
            const parent = await this.validateParent(dto.parent_id, dto.type, dto.scope_rules);
            if (parent.end_date) {
                if (!endDate)
                    endDate = parent.end_date;
                else if (endDate > parent.end_date)
                    endDate = parent.end_date;
            }
            if (parent.start_date && startDate < parent.start_date) {
                throw new common_1.BadRequestException('A data de início não pode ser anterior à do pai');
            }
            if (parent.end_date && startDate > parent.end_date) {
                throw new common_1.BadRequestException('A data de início não pode ser após o término do pai');
            }
        }
        const status = this.resolveStatus(dto.scope_rules, creatorRoles);
        const externalRegistrationSchema = this.validateExternalRegistrationSchema(dto.type, dto.external_registration_schema);
        const visibility = dto.participation_type === 'private' ? 'private' : 'public';
        const legacyScope = this.resolveLegacyScope(dto.scope_rules);
        const organizationId = dto.organization_id;
        const unitIds = (dto.scope_rules ?? [])
            .filter((rule) => rule.type === 'org_unit')
            .map((rule) => rule.org_unit_id)
            .filter((id) => Boolean(id));
        if ((dto.scope_rules ?? []).some((rule) => rule.type === 'org_unit' && !rule.org_unit_id)) {
            throw new common_1.BadRequestException('Selecione uma unidade para cada regra de escopo.');
        }
        if (unitIds.length > 0) {
            const units = await db_1.AppDataBase.getRepository(orgUnit_1.OrgUnit).find({
                where: { organization_id: organizationId, id: (0, typeorm_1.In)(unitIds), status: orgUnit_1.OrgUnitStatus.ACTIVE },
                select: { id: true },
            });
            if (units.length !== new Set(unitIds).size) {
                throw new common_1.BadRequestException('Uma ou mais unidades não pertencem à organização ou estão inativas.');
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
            scope_rules: dto.scope_rules,
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
        await this.ownerRepo.add(misc.id, creatorId, miscellaneousOwner_1.OwnerRole.OWNER, true);
        if (dto.co_owner_ids?.length) {
            for (const id of dto.co_owner_ids) {
                await this.ownerRepo.add(misc.id, id, miscellaneousOwner_1.OwnerRole.CO_OWNER);
            }
        }
        if (dto.initial_member_ids?.length) {
            for (const id of dto.initial_member_ids) {
                await this.participantRepo.add(misc.id, id);
            }
        }
        return { miscellaneous: misc, status };
    }
    async findAll(filters, userId, canManageOrganization = false) {
        const { data, total } = await this.miscRepo.findWithFilters(filters, userId, canManageOrganization);
        if (!userId)
            return { data: [], total: 0 };
        if (canManageOrganization)
            return { data, total };
        const member = await this.memberRepo.findByIdWithRelations(userId);
        if (member) {
            const mandates = await db_1.AppDataBase.query(`SELECT DISTINCT org_unit_id
         FROM mandates
         WHERE member_id = $1
           AND status = 'ACTIVE'
           AND start_date <= CURRENT_DATE
           AND (end_date IS NULL OR end_date >= CURRENT_DATE)`, [userId]);
            member.org_unit_ids =
                mandates.map((mandate) => mandate.org_unit_id);
        }
        const visibleData = data.filter(misc => this.canAccessMiscellaneous(misc, userId, member));
        return { data: visibleData, total: visibleData.length };
    }
    async findById(id) {
        const misc = await this.miscRepo.findById(id);
        if (!misc)
            throw new common_1.NotFoundException('Miscelânea não encontrada');
        return misc;
    }
    async findVisibleById(id, organizationId, userId, roles) {
        const misc = await this.findById(id);
        if (organizationId && misc.organization_id !== organizationId) {
            throw new common_1.NotFoundException('Miscelânea não encontrada');
        }
        const canManageOrganization = roles.some((role) => ['EQUIPE_TECNICA', 'organization.admin', 'organization.manage'].includes(role));
        if (canManageOrganization)
            return misc;
        const member = await this.memberRepo.findByIdWithRelations(userId, organizationId);
        if (member) {
            const mandates = await db_1.AppDataBase.query(`SELECT DISTINCT org_unit_id
         FROM mandates
         WHERE member_id = $1
           AND status = 'ACTIVE'
           AND start_date <= CURRENT_DATE
           AND (end_date IS NULL OR end_date >= CURRENT_DATE)`, [userId]);
            member.org_unit_ids =
                mandates.map((mandate) => mandate.org_unit_id);
        }
        if (!this.canAccessMiscellaneous(misc, userId, member)) {
            throw new common_1.NotFoundException('Miscelânea não encontrada');
        }
        return misc;
    }
    async getChildren(id) {
        const misc = await this.findById(id);
        const children = await this.miscRepo.findChildren(misc.id);
        // Group by type
        const grouped = children.reduce((acc, child) => {
            if (!acc[child.type])
                acc[child.type] = [];
            acc[child.type].push(child);
            return acc;
        }, {});
        return grouped;
    }
    async update(id, dto, userId, context) {
        const misc = await this.findById(id);
        await this.ensureOwner(id, userId, context);
        // Scope change may require re-approval
        let newStatus = misc.status;
        if (dto.scope && dto.scope !== misc.scope) {
            throw new common_1.BadRequestException('Mudança de escopo não é permitida via PATCH direto. Use o endpoint de reaprovação.');
        }
        const externalRegistrationSchema = dto.external_registration_schema === undefined
            ? undefined
            : this.validateExternalRegistrationSchema(misc.type, dto.external_registration_schema);
        await this.validateMediaAssets(misc.organization_id ?? undefined, [
            dto.cover_asset_id !== undefined ? dto.cover_asset_id : misc.cover_asset_id,
            dto.banner_asset_id !== undefined ? dto.banner_asset_id : misc.banner_asset_id,
            dto.map_asset_id !== undefined ? dto.map_asset_id : misc.map_asset_id,
            ...(dto.sponsor_asset_ids ?? misc.sponsor_asset_ids ?? []),
        ]);
        const updated = await this.miscRepo.update(id, {
            ...dto,
            external_registration_schema: externalRegistrationSchema,
            scope: dto.scope ?? this.resolveLegacyScope(dto.scope_rules),
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
    async validateMediaAssets(organizationId, assetIds) {
        const ids = [...new Set(assetIds.filter((id) => Boolean(id)))];
        if (ids.length === 0)
            return;
        if (!organizationId) {
            throw new common_1.BadRequestException('Não foi possível identificar a organização das mídias.');
        }
        const rows = (await db_1.AppDataBase.query(`SELECT id, mime_type
       FROM media_assets
       WHERE organization_id = $1 AND id = ANY($2::uuid[]) AND status = 'ACTIVE'`, [organizationId, ids]));
        if (rows.length !== ids.length) {
            throw new common_1.BadRequestException('Uma ou mais mídias não pertencem a esta organização ou ainda não estão ativas.');
        }
        if (rows.some((row) => !row.mime_type.startsWith('image/'))) {
            throw new common_1.BadRequestException('Somente imagens podem ser usadas em capas, mapas e patrocinadores.');
        }
    }
    validateExternalRegistrationSchema(type, schema) {
        if (schema === undefined)
            return [];
        if (type !== miscellaneous_1.MiscellaneousType.EVENT && schema.length > 0) {
            throw new common_1.BadRequestException('Campos de inscrição externos só podem ser configurados em eventos.');
        }
        if (schema.length > 40)
            throw new common_1.BadRequestException('O evento aceita até 40 campos externos.');
        const keys = new Set();
        for (const field of schema) {
            if (!/^[a-zA-Z][a-zA-Z0-9_]{0,63}$/.test(field.key)) {
                throw new common_1.BadRequestException(`Chave inválida no campo "${field.label}".`);
            }
            if (keys.has(field.key)) {
                throw new common_1.BadRequestException(`A chave "${field.key}" está repetida nos campos externos.`);
            }
            if (field.type === 'select' && (!field.options || field.options.length < 1 || field.options.length > 50)) {
                throw new common_1.BadRequestException(`Defina de 1 a 50 opções para "${field.label}".`);
            }
            keys.add(field.key);
        }
        return schema;
    }
    async archive(id, userId, context) {
        const misc = await this.findById(id);
        await this.ensureOwner(id, userId, context);
        await this.miscRepo.archive(id);
        await this.syncPublicMediaVisibility(misc);
    }
    async remove(id, userId, context) {
        const misc = await this.findById(id);
        if (context && (!context.organization_id || misc.organization_id !== context.organization_id)) {
            throw new common_1.NotFoundException('Miscelânea não encontrada nesta organização.');
        }
        if (misc.created_by !== userId)
            await this.ensureOwner(id, userId, context);
        await this.miscRepo.softDelete(id);
        await this.syncPublicMediaVisibility(misc);
        // Children become orphans (parent_id set to null via SET NULL on delete)
    }
    async approve(id, actorId, dto) {
        const misc = await this.findById(id);
        if (misc.status !== miscellaneous_1.MiscellaneousStatus.PENDING_APPROVAL &&
            misc.status !== miscellaneous_1.MiscellaneousStatus.UNDER_REVIEW) {
            throw new common_1.BadRequestException('Miscelânea não está aguardando aprovação');
        }
        await this.miscRepo.update(id, { status: miscellaneous_1.MiscellaneousStatus.ACTIVE });
        await this.syncPublicMediaVisibility(misc);
        await this.approvalLogRepo.create(id, actorId, miscellaneousApprovalLog_1.ApprovalAction.APPROVE, dto.comment);
    }
    async reject(id, actorId, dto) {
        const misc = await this.findById(id);
        if (misc.status !== miscellaneous_1.MiscellaneousStatus.PENDING_APPROVAL &&
            misc.status !== miscellaneous_1.MiscellaneousStatus.UNDER_REVIEW) {
            throw new common_1.BadRequestException('Miscelânea não está aguardando aprovação');
        }
        await this.miscRepo.update(id, { status: miscellaneous_1.MiscellaneousStatus.REJECTED });
        await this.syncPublicMediaVisibility(misc);
        await this.approvalLogRepo.create(id, actorId, miscellaneousApprovalLog_1.ApprovalAction.REJECT, dto.comment);
    }
    async requestReview(id, actorId, dto) {
        const misc = await this.findById(id);
        if (misc.status !== miscellaneous_1.MiscellaneousStatus.PENDING_APPROVAL) {
            throw new common_1.BadRequestException('Miscelânea não está pendente de aprovação');
        }
        await this.miscRepo.update(id, { status: miscellaneous_1.MiscellaneousStatus.UNDER_REVIEW });
        await this.approvalLogRepo.create(id, actorId, miscellaneousApprovalLog_1.ApprovalAction.REQUEST_REVIEW, dto.comment);
    }
    async getPendingApprovals() {
        return this.miscRepo.findPendingForApproval();
    }
    async getApprovalHistory(id) {
        await this.findById(id);
        return this.approvalLogRepo.findByMiscellaneous(id);
    }
    // Owners & Members
    async addOwner(id, targetMemberId, requesterId, context) {
        await this.ensureOwner(id, requesterId, context);
        const existing = await this.ownerRepo.findOne(id, targetMemberId);
        if (existing)
            throw new common_1.BadRequestException('Usuário já é dono desta miscelânea');
        return this.ownerRepo.add(id, targetMemberId, miscellaneousOwner_1.OwnerRole.CO_OWNER);
    }
    async searchMembers(id, requesterId, query, organizationId, context) {
        await this.ensureOwner(id, requesterId, context);
        const normalized = query?.trim();
        if (!normalized)
            return [];
        return this.memberRepo.search(normalized, 10, organizationId);
    }
    async resolveMemberTarget(identifier, organizationId, query) {
        const searchTerm = (identifier ?? query ?? '').trim();
        if (!searchTerm)
            throw new common_1.BadRequestException('Informe um membro válido');
        if ((0, class_validator_1.isUUID)(searchTerm)) {
            const member = await this.memberRepo.findById(searchTerm, organizationId);
            if (!member)
                throw new common_1.BadRequestException('Membro não encontrado nesta organização');
            return member.id;
        }
        const members = await this.memberRepo.search(searchTerm, 10, organizationId);
        if (members.length === 1)
            return members[0].id;
        if (members.length > 1) {
            throw new common_1.BadRequestException('Mais de um membro encontrado. Use o UUID ou refine a busca');
        }
        throw new common_1.BadRequestException('Membro não encontrado');
    }
    async removeOwner(id, targetMemberId, requesterId, context) {
        await this.ensureOwner(id, requesterId, context);
        const count = await this.ownerRepo.countOwners(id);
        if (count <= 1)
            throw new common_1.BadRequestException('Não é possível remover o último dono');
        const target = await this.ownerRepo.findOne(id, targetMemberId);
        if (target?.is_creator && targetMemberId !== requesterId) {
            throw new common_1.ForbiddenException('O criador original só pode ser removido por si mesmo');
        }
        await this.ownerRepo.remove(id, targetMemberId);
    }
    async joinSelf(id, memberId) {
        const misc = await this.findById(id);
        if (misc.status !== miscellaneous_1.MiscellaneousStatus.ACTIVE) {
            throw new common_1.BadRequestException('Esta miscelânea não está ativa para inscrições');
        }
        const already = await this.participantRepo.isParticipant(id, memberId);
        if (already)
            throw new common_1.BadRequestException('Você já está vinculado a esta miscelânea');
        const isOwner = await this.ownerRepo.findOne(id, memberId);
        if (isOwner)
            throw new common_1.BadRequestException('Você já é dono desta miscelânea');
        return this.participantRepo.add(id, memberId);
    }
    async addMember(id, targetMemberId, requesterId, context) {
        await this.ensureOwner(id, requesterId, context);
        const already = await this.participantRepo.isParticipant(id, targetMemberId);
        if (already)
            throw new common_1.BadRequestException('Usuário já é membro desta miscelânea');
        return this.participantRepo.add(id, targetMemberId);
    }
    async removeMember(id, targetMemberId, requesterId, context) {
        await this.ensureOwner(id, requesterId, context);
        await this.participantRepo.remove(id, targetMemberId);
    }
    async getPeople(id, requesterId, organizationId, context) {
        await this.findVisibleById(id, organizationId, requesterId, context.roles);
        const [owners, members] = await Promise.all([
            this.ownerRepo.findByMiscellaneous(id),
            this.participantRepo.findByMiscellaneous(id),
        ]);
        const managesOrganization = context.organization_id === organizationId &&
            context.roles.some(role => ['EQUIPE_TECNICA', 'organization.admin', 'organization.manage'].includes(role));
        const managesEvent = managesOrganization || owners.some(owner => owner.member_id === requesterId);
        const details = managesEvent ? await db_1.AppDataBase.query(`SELECT member.id, member.email_personal, member.phone, member.cpf, member.registration_status,
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
       WHERE member.organization_id = $2::uuid AND member.id = ANY($3::uuid[])`, [id, organizationId, [...new Set([...owners, ...members].map(person => person.member_id))]]) : [];
        const byId = new Map(details.map(detail => [detail.id, detail]));
        const sanitize = (person) => {
            const detail = byId.get(person.member_id);
            return { ...person, member: {
                    id: person.member.id, name: person.member.name, profile_picture_url: person.member.profile_picture_url,
                    ...(detail ? { email_personal: detail.email_personal, phone: detail.phone, cpf: detail.cpf, registration_status: detail.registration_status } : {}),
                }, ...(detail ? { details: { membership_type: detail.membership_type, shared_profile: detail.shared_profile,
                        registration_data: detail.registration_data, custom_fields: detail.custom_fields } } : {}) };
        };
        return { owners: owners.map(sanitize), members: members.map(sanitize) };
    }
    async getExternalRegistrations(id, requesterId, organizationId, context) {
        const misc = await this.findById(id);
        if (misc.organization_id !== organizationId) {
            throw new common_1.NotFoundException('Evento não encontrado nesta organização.');
        }
        await this.ensureOwner(id, requesterId, context);
        return db_1.AppDataBase.query(`SELECT registration.id, registration.profile_type,
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
       ORDER BY registration.created_at ASC`, [id, organizationId]);
    }
    async enablePublicAccess(id, userId, context) {
        await this.ensureOwner(id, userId, context);
        const misc = await this.findById(id);
        if (misc.public_slug) {
            await this.miscRepo.update(id, { public_access_enabled: true });
            if (misc.status === miscellaneous_1.MiscellaneousStatus.ACTIVE)
                await this.syncPublicMediaVisibility(misc);
            return misc.public_slug;
        }
        let slug;
        do {
            slug = (0, miscellaneousSlug_1.generateMiscellaneousPublicSlug)(misc.title, randomSuffix());
        } while (await this.miscRepo.slugExists(slug));
        await this.miscRepo.update(id, { public_slug: slug, public_access_enabled: true });
        if (misc.status === miscellaneous_1.MiscellaneousStatus.ACTIVE)
            await this.syncPublicMediaVisibility(misc);
        return slug;
    }
    async closeRegistrations(id) {
        await this.miscRepo.update(id, { registration_end_date: new Date() });
    }
    async disablePublicAccess(id, userId, context) {
        await this.ensureOwner(id, userId, context);
        const misc = await this.findById(id);
        await this.miscRepo.update(id, { public_access_enabled: false });
        await this.syncPublicMediaVisibility(misc);
    }
    // Helpers
    async syncPublicMediaVisibility(misc) {
        if (!misc?.organization_id)
            return;
        const assetIds = [
            misc.cover_asset_id,
            misc.banner_asset_id,
            misc.map_asset_id,
            ...(misc.sponsor_asset_ids ?? []),
        ].filter((id) => typeof id === 'string' && (0, class_validator_1.isUUID)(id));
        if (assetIds.length === 0)
            return;
        await db_1.AppDataBase.query(`UPDATE media_assets AS asset
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
       WHERE asset.organization_id = $1 AND asset.id = ANY($2::uuid[])`, [misc.organization_id, assetIds]);
    }
    resolveLegacyScope(scopeRules) {
        if (!scopeRules?.length)
            return miscellaneous_1.MiscellaneousScope.GENERAL;
        const firstRule = scopeRules[0];
        if (!firstRule?.type)
            return miscellaneous_1.MiscellaneousScope.GENERAL;
        switch (firstRule.type) {
            case 'org_unit':
                return miscellaneous_1.MiscellaneousScope.GENERAL;
            case 'cae':
                return miscellaneous_1.MiscellaneousScope.CAE;
            case 'car':
                return miscellaneous_1.MiscellaneousScope.CAR;
            case 'city':
                return miscellaneous_1.MiscellaneousScope.CITY;
            case 'university':
                return miscellaneous_1.MiscellaneousScope.UNIVERSITY;
            case 'course':
                return miscellaneous_1.MiscellaneousScope.COURSE;
            case 'semester':
                return miscellaneous_1.MiscellaneousScope.SEMESTER;
            default:
                return miscellaneous_1.MiscellaneousScope.GENERAL;
        }
    }
    resolveStatus(scopeRules, creatorRoles) {
        if (!scopeRules?.length)
            return miscellaneous_1.MiscellaneousStatus.ACTIVE;
        const hasWideScope = scopeRules.some(r => ['cae', 'car', 'city', 'general', 'org_unit'].includes(r.type));
        if (!hasWideScope)
            return miscellaneous_1.MiscellaneousStatus.ACTIVE;
        const highestRole = creatorRoles.some((role) => ['organization.admin', 'organization.manage'].includes(role))
            ? 'EQUIPE_TECNICA'
            : creatorRoles.find(r => ROLE_MAX_SCOPE[r] !== undefined) ?? 'MEMBRO';
        const maxScope = ROLE_MAX_SCOPE[highestRole] ?? miscellaneous_1.MiscellaneousScope.INDIVIDUAL;
        if (SCOPE_LEVEL[maxScope] >= SCOPE_LEVEL[miscellaneous_1.MiscellaneousScope.CAR])
            return miscellaneous_1.MiscellaneousStatus.ACTIVE;
        return miscellaneous_1.MiscellaneousStatus.PENDING_APPROVAL;
    }
    canAccessMiscellaneous(misc, userId, member) {
        if (misc.created_by === userId)
            return true;
        if (!misc.scope_rules?.length)
            return true;
        const contexts = this.buildMemberScopeContexts(member);
        return contexts.some(context => (0, miscellaneousScope_1.matchesScopeRules)(misc.scope_rules, context));
    }
    buildMemberScopeContexts(member) {
        const primaryContext = {
            city_id: member?.city_id ?? member?.city?.id ?? null,
            university_id: null,
            course_id: null,
            course_university_id: null,
            semester: member?.current_semester ?? null,
            org_unit_ids: member?.org_unit_ids ?? [],
        };
        const courseContexts = (member?.memberCourses ?? []).map((memberCourse) => {
            const courseUniversity = memberCourse?.courseUniversity;
            return {
                city_id: member?.city_id ?? member?.city?.id ?? null,
                university_id: courseUniversity?.university?.id ?? courseUniversity?.university_id ?? null,
                course_id: courseUniversity?.course?.id ?? courseUniversity?.course_id ?? null,
                course_university_id: courseUniversity?.id ?? null,
                semester: memberCourse?.semester_number ?? member?.current_semester ?? null,
            };
        });
        return [primaryContext, ...courseContexts];
    }
    async validateParent(parentId, childType, childScopeRules) {
        const parent = await this.miscRepo.findById(parentId);
        if (!parent)
            throw new common_1.BadRequestException('Miscelânea pai não encontrada');
        const allowed = ALLOWED_CHILDREN[parent.type] ?? [];
        if (!allowed.includes(childType)) {
            throw new common_1.BadRequestException(`Tipo "${childType}" não pode ser filho de "${parent.type}"`);
        }
        return parent;
    }
    async ensureOwner(miscellaneousId, userId, context) {
        if (context) {
            const misc = await this.findById(miscellaneousId);
            if (!context.organization_id || misc.organization_id !== context.organization_id) {
                throw new common_1.NotFoundException('Miscelânea não encontrada nesta organização.');
            }
            if (context.roles.some((role) => ['organization.admin', 'organization.manage', 'EQUIPE_TECNICA'].includes(role)))
                return;
        }
        const isOwner = await this.ownerRepo.isOwner(miscellaneousId, userId);
        if (!isOwner)
            throw new common_1.ForbiddenException('Apenas donos podem realizar esta ação');
    }
};
exports.MiscellaneousService = MiscellaneousService;
exports.MiscellaneousService = MiscellaneousService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [MiscellaneousRepository_1.MiscellaneousRepository,
        MiscellaneousSubRepositories_1.MiscellaneousOwnerRepository,
        MiscellaneousSubRepositories_1.MiscellaneousParticipantRepository,
        MiscellaneousSubRepositories_1.MiscellaneousApprovalLogRepository,
        MemberRepository_1.MemberRepository])
], MiscellaneousService);
