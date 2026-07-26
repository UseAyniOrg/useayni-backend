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
const MiscellaneousRepository_1 = require("../repositories/MiscellaneousRepository");
const MemberRepository_1 = require("../repositories/MemberRepository");
const MiscellaneousSubRepositories_1 = require("../repositories/MiscellaneousSubRepositories");
const miscellaneous_1 = require("../models/miscellaneous");
const miscellaneousOwner_1 = require("../models/miscellaneousOwner");
const miscellaneousApprovalLog_1 = require("../models/miscellaneousApprovalLog");
const miscellaneousScope_1 = require("../helpers/miscellaneousScope");
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
function generateSlug(title, suffix) {
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
        const visibility = dto.participation_type === 'private' ? 'private' : 'public';
        const legacyScope = this.resolveLegacyScope(dto.scope_rules);
        const misc = await this.miscRepo.create({
            ...dto,
            start_date: startDate,
            end_date: endDate,
            participation_type: dto.participation_type ?? 'public',
            visibility,
            scope: legacyScope,
            scope_rules: dto.scope_rules,
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
    async findAll(filters, userId) {
        const { data, total } = await this.miscRepo.findWithFilters(filters, userId);
        if (!userId)
            return { data: [], total: 0 };
        const member = await this.memberRepo.findByIdWithRelations(userId);
        const visibleData = data.filter(misc => this.canAccessMiscellaneous(misc, userId, member));
        return { data: visibleData, total: visibleData.length };
    }
    async findById(id) {
        const misc = await this.miscRepo.findById(id);
        if (!misc)
            throw new common_1.NotFoundException('Miscelânea não encontrada');
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
    async update(id, dto, userId) {
        const misc = await this.findById(id);
        await this.ensureOwner(id, userId);
        // Scope change may require re-approval
        let newStatus = misc.status;
        if (dto.scope && dto.scope !== misc.scope) {
            throw new common_1.BadRequestException('Mudança de escopo não é permitida via PATCH direto. Use o endpoint de reaprovação.');
        }
        const updated = await this.miscRepo.update(id, {
            ...dto,
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
        return updated;
    }
    async archive(id, userId) {
        await this.findById(id);
        await this.ensureOwner(id, userId);
        await this.miscRepo.archive(id);
    }
    async remove(id, userId) {
        const misc = await this.findById(id);
        const isOwner = await this.ownerRepo.findOne(id, userId);
        if (!isOwner && misc.created_by !== userId) {
            throw new common_1.ForbiddenException('Apenas o criador ou donos podem excluir esta miscelânea');
        }
        await this.miscRepo.softDelete(id);
        // Children become orphans (parent_id set to null via SET NULL on delete)
    }
    async approve(id, actorId, dto) {
        const misc = await this.findById(id);
        if (misc.status !== miscellaneous_1.MiscellaneousStatus.PENDING_APPROVAL &&
            misc.status !== miscellaneous_1.MiscellaneousStatus.UNDER_REVIEW) {
            throw new common_1.BadRequestException('Miscelânea não está aguardando aprovação');
        }
        await this.miscRepo.update(id, { status: miscellaneous_1.MiscellaneousStatus.ACTIVE });
        await this.approvalLogRepo.create(id, actorId, miscellaneousApprovalLog_1.ApprovalAction.APPROVE, dto.comment);
    }
    async reject(id, actorId, dto) {
        const misc = await this.findById(id);
        if (misc.status !== miscellaneous_1.MiscellaneousStatus.PENDING_APPROVAL &&
            misc.status !== miscellaneous_1.MiscellaneousStatus.UNDER_REVIEW) {
            throw new common_1.BadRequestException('Miscelânea não está aguardando aprovação');
        }
        await this.miscRepo.update(id, { status: miscellaneous_1.MiscellaneousStatus.REJECTED });
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
    async addOwner(id, targetMemberId, requesterId) {
        await this.ensureOwner(id, requesterId);
        const existing = await this.ownerRepo.findOne(id, targetMemberId);
        if (existing)
            throw new common_1.BadRequestException('Usuário já é dono desta miscelânea');
        return this.ownerRepo.add(id, targetMemberId, miscellaneousOwner_1.OwnerRole.CO_OWNER);
    }
    async searchMembers(id, requesterId, query) {
        await this.ensureOwner(id, requesterId);
        const normalized = query?.trim();
        if (!normalized)
            return [];
        return this.memberRepo.search(normalized, 10);
    }
    async resolveMemberTarget(identifier, query) {
        const searchTerm = (identifier ?? query ?? '').trim();
        if (!searchTerm)
            throw new common_1.BadRequestException('Informe um membro válido');
        if ((0, class_validator_1.isUUID)(searchTerm))
            return searchTerm;
        const members = await this.memberRepo.search(searchTerm, 10);
        if (members.length === 1)
            return members[0].id;
        if (members.length > 1) {
            throw new common_1.BadRequestException('Mais de um membro encontrado. Use o UUID ou refine a busca');
        }
        throw new common_1.BadRequestException('Membro não encontrado');
    }
    async removeOwner(id, targetMemberId, requesterId) {
        await this.ensureOwner(id, requesterId);
        const count = await this.ownerRepo.countOwners(id);
        if (count <= 1)
            throw new common_1.BadRequestException('Não é possível remover o último dono');
        const target = await this.ownerRepo.findOne(id, targetMemberId);
        if (target?.is_creator && targetMemberId !== requesterId) {
            throw new common_1.ForbiddenException('O criador original só pode ser removido por si mesmo');
        }
        await this.ownerRepo.remove(id, targetMemberId);
    }
    async addMember(id, targetMemberId, requesterId) {
        await this.ensureOwner(id, requesterId);
        const already = await this.participantRepo.isParticipant(id, targetMemberId);
        if (already)
            throw new common_1.BadRequestException('Usuário já é membro desta miscelânea');
        return this.participantRepo.add(id, targetMemberId);
    }
    async removeMember(id, targetMemberId, requesterId) {
        await this.ensureOwner(id, requesterId);
        await this.participantRepo.remove(id, targetMemberId);
    }
    async getPeople(id) {
        const [owners, members] = await Promise.all([
            this.ownerRepo.findByMiscellaneous(id),
            this.participantRepo.findByMiscellaneous(id),
        ]);
        return { owners, members };
    }
    async enablePublicAccess(id, userId) {
        await this.ensureOwner(id, userId);
        const misc = await this.findById(id);
        if (misc.public_slug) {
            await this.miscRepo.update(id, { public_access_enabled: true });
            return misc.public_slug;
        }
        let slug;
        do {
            slug = generateSlug(misc.title, randomSuffix());
        } while (await this.miscRepo.slugExists(slug));
        await this.miscRepo.update(id, { public_slug: slug, public_access_enabled: true });
        return slug;
    }
    async closeRegistrations(id) {
        await this.miscRepo.update(id, { registration_end_date: new Date() });
    }
    async disablePublicAccess(id, userId) {
        await this.ensureOwner(id, userId);
        await this.miscRepo.update(id, { public_access_enabled: false });
    }
    // Helpers
    resolveLegacyScope(scopeRules) {
        if (!scopeRules?.length)
            return miscellaneous_1.MiscellaneousScope.GENERAL;
        const firstRule = scopeRules[0];
        if (!firstRule?.type)
            return miscellaneous_1.MiscellaneousScope.GENERAL;
        switch (firstRule.type) {
            case 'cae': return miscellaneous_1.MiscellaneousScope.CAE;
            case 'car': return miscellaneous_1.MiscellaneousScope.CAR;
            case 'city': return miscellaneous_1.MiscellaneousScope.CITY;
            case 'university': return miscellaneous_1.MiscellaneousScope.UNIVERSITY;
            case 'course': return miscellaneous_1.MiscellaneousScope.COURSE;
            case 'semester': return miscellaneous_1.MiscellaneousScope.SEMESTER;
            default: return miscellaneous_1.MiscellaneousScope.GENERAL;
        }
    }
    resolveStatus(scopeRules, creatorRoles) {
        if (!scopeRules?.length)
            return miscellaneous_1.MiscellaneousStatus.ACTIVE;
        const hasWideScope = scopeRules.some(r => ['cae', 'car', 'city', 'general'].includes(r.type));
        if (!hasWideScope)
            return miscellaneous_1.MiscellaneousStatus.ACTIVE;
        const highestRole = creatorRoles.find(r => ROLE_MAX_SCOPE[r] !== undefined) ?? 'MEMBRO';
        const maxScope = ROLE_MAX_SCOPE[highestRole] ?? miscellaneous_1.MiscellaneousScope.INDIVIDUAL;
        if (SCOPE_LEVEL[maxScope] >= SCOPE_LEVEL[miscellaneous_1.MiscellaneousScope.CAR])
            return miscellaneous_1.MiscellaneousStatus.ACTIVE;
        return miscellaneous_1.MiscellaneousStatus.PENDING_APPROVAL;
    }
    canAccessMiscellaneous(misc, userId, member) {
        if (misc.created_by === userId)
            return true;
        const isPublic = misc.visibility === 'public' || misc.participation_type === 'public';
        if (!isPublic)
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
    async ensureOwner(miscellaneousId, userId) {
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
