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
var OrganizationService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.OrganizationService = void 0;
const common_1 = require("@nestjs/common");
const OrganizationRepository_1 = require("../repositories/OrganizationRepository");
const auditLog_1 = require("../models/auditLog");
const db_1 = require("../db");
const organization_1 = require("../models/organization");
const featureCatalog_1 = require("../config/featureCatalog");
const OrgHomeService_1 = require("./OrgHomeService");
const AccountProvisioningService_1 = require("./AccountProvisioningService");
const AccountEmailService_1 = require("./AccountEmailService");
const EmailService_1 = require("./EmailService");
const organization_2 = require("../models/organization");
const organizationFeature_1 = require("../models/organizationFeature");
let OrganizationService = OrganizationService_1 = class OrganizationService {
    constructor(orgRepo, orgHomeService, accountProvisioning, accountEmails = new AccountEmailService_1.AccountEmailService(new EmailService_1.EmailService(), accountProvisioning)) {
        this.orgRepo = orgRepo;
        this.orgHomeService = orgHomeService;
        this.accountProvisioning = accountProvisioning;
        this.accountEmails = accountEmails;
        this.logger = new common_1.Logger(OrganizationService_1.name);
    }
    async findAll() {
        return this.orgRepo.findAll();
    }
    async findById(id) {
        const org = await this.orgRepo.findById(id);
        if (!org)
            throw new common_1.NotFoundException('Organização não encontrada');
        return org;
    }
    async findBySlug(slug) {
        const org = await this.orgRepo.findBySlug(slug);
        if (!org)
            throw new common_1.NotFoundException(`Organização '${slug}' não encontrada`);
        return org;
    }
    async create(dto, actorId, actorAccountId) {
        if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(dto.slug))
            throw new common_1.BadRequestException('Slug inválido.');
        const existing = await this.orgRepo.findBySlug(dto.slug);
        if (existing) {
            throw new common_1.ConflictException(`Slug '${dto.slug}' já está em uso`);
        }
        return db_1.AppDataBase.transaction(async (manager) => {
            const repository = manager.getRepository(organization_2.Organization);
            const org = await repository.save(repository.create({ ...dto, status: organization_1.OrganizationStatus.DRAFT, onboarding_step: 1 }));
            const features = manager.getRepository(organizationFeature_1.OrganizationFeature);
            for (const slug of ['core', 'registration_approval', 'custom_fields', 'media_storage', 'sponsors', 'talent_network', 'communication_email']) {
                await features.save(features.create({ organization_id: org.id, feature_slug: slug,
                    enabled: !['sponsors', 'talent_network'].includes(slug),
                    config: slug === 'media_storage' ? { quota_bytes: 1073741824 } : {} }));
            }
            await this.orgHomeService.ensureDefaultHome(org.id, manager);
            const provisioning = dto.settings?.provisioning;
            if (typeof provisioning?.admin_email === 'string' && provisioning.admin_email.trim()) {
                await this.accountEmails.invite(org.id, provisioning.admin_email, true, manager);
            }
            await this.audit(org.id, actorId, actorAccountId, 'organization.created', 'organization', org.id, null, org, manager);
            return org;
        });
    }
    async update(id, dto, actorId, actorAccountId) {
        const before = await this.findById(id);
        if (dto.status === organization_1.OrganizationStatus.SUSPENDED && !dto.suspension_reason?.trim()) {
            throw new common_1.ConflictException('Informe o motivo para suspender a organização.');
        }
        const update = { ...dto };
        if ((dto.status === organization_1.OrganizationStatus.ACTIVE || dto.status === organization_1.OrganizationStatus.TRIAL) &&
            before.status === organization_1.OrganizationStatus.DRAFT) {
            const settings = (dto.settings ?? before.settings);
            const provisioning = settings.provisioning;
            const profile = typeof provisioning === 'object' && provisioning !== null
                ? provisioning
                : {};
            const requiredEmail = (key) => typeof profile[key] === 'string' &&
                /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(profile[key].trim());
            const chiefTypeValid = profile.chief_type === 'person' || profile.chief_type === 'organization';
            const chiefNameValid = typeof profile.chief_name === 'string' && profile.chief_name.trim().length > 0;
            if (!requiredEmail('admin_email') ||
                !requiredEmail('chief_email') ||
                !chiefTypeValid ||
                !chiefNameValid) {
                throw new common_1.ConflictException('Para ativar, informe o email do administrador chefe e os dados do responsável principal.');
            }
            update.onboarding_step = Math.max(dto.onboarding_step ?? before.onboarding_step, 3);
        }
        if (dto.status === organization_1.OrganizationStatus.SUSPENDED) {
            update.suspension_reason = dto.suspension_reason.trim();
            update.suspended_at = new Date();
            update.suspended_by_account_id = actorAccountId ?? null;
        }
        else if (dto.status === organization_1.OrganizationStatus.ACTIVE || dto.status === organization_1.OrganizationStatus.TRIAL) {
            update.suspension_reason = null;
            update.suspended_at = null;
            update.suspended_by_account_id = null;
        }
        const org = await this.orgRepo.update(id, update);
        this.orgHomeService.revalidate(id);
        await this.audit(id, actorId, actorAccountId, dto.status === organization_1.OrganizationStatus.SUSPENDED ? 'organization.suspended' :
            dto.status === organization_1.OrganizationStatus.ACTIVE && before.status === organization_1.OrganizationStatus.SUSPENDED
                ? 'organization.reactivated'
                : 'organization.updated', 'organization', id, before, org);
        return org;
    }
    async remove(id, actorId, actorAccountId) {
        await this.findById(id);
        await this.orgRepo.softDelete(id);
        await this.audit(id, actorId, actorAccountId, 'organization.deleted', 'organization', id, null, null);
    }
    async grantAdmin(organizationId, email, actorId, actorAccountId) {
        return this.issueAdminAccess(organizationId, email, actorId, actorAccountId);
    }
    async issueAdminAccess(organizationId, email, actorId, actorAccountId) {
        const organization = await this.findById(organizationId);
        if (![organization_1.OrganizationStatus.DRAFT, organization_1.OrganizationStatus.ACTIVE, organization_1.OrganizationStatus.TRIAL].includes(organization.status)) {
            throw new common_1.ConflictException('Esta organização não pode receber novos convites.');
        }
        const access = await db_1.AppDataBase.transaction(manager => this.accountEmails.invite(organizationId, email, true, manager));
        await this.audit(organizationId, actorId, actorAccountId, 'organization.admin.access_issued', 'organization', organizationId, null, { email, invitation_id: access.invitation_id });
        return {
            ...access,
            email,
            message: 'Convite enfileirado. O destinatário receberá um link para concluir o acesso.',
        };
    }
    async issueMemberAccess(organizationId, email, actorId, actorAccountId) {
        const access = await db_1.AppDataBase.transaction(manager => this.accountEmails.invite(organizationId, email, false, manager));
        await this.audit(organizationId, actorId, actorAccountId, 'member.access_issued', 'organization', organizationId, null, { email, invitation_id: access.invitation_id });
        return { ...access, email };
    }
    async importMembers(organizationId, emails, actorId, actorAccountId) {
        await this.findById(organizationId);
        if (!Array.isArray(emails) || emails.length === 0 || emails.length > 500) {
            throw new common_1.ConflictException('Envie entre 1 e 500 emails por importação.');
        }
        const results = [];
        const seen = new Set();
        for (const rawEmail of emails) {
            const email = String(rawEmail).trim().toLowerCase();
            if (seen.has(email))
                continue;
            seen.add(email);
            try {
                const invitation = await db_1.AppDataBase.transaction(manager => this.accountEmails.invite(organizationId, email, false, manager));
                results.push({ ...invitation, email });
            }
            catch (error) {
                if (!(error instanceof common_1.HttpException)) {
                    this.logger.error('Falha inesperada no provisionamento de membro durante importação.');
                }
                results.push({
                    email,
                    error: error instanceof common_1.HttpException ? error.message : 'Não foi possível importar este email. Contate a equipe técnica.',
                });
            }
        }
        await this.audit(organizationId, actorId, actorAccountId, 'members.imported', 'organization', organizationId, null, { total: results.length, failed: results.filter((row) => 'error' in row).length });
        return { results };
    }
    // ─── Features ─────────────────────────────────────────────────────────────
    async getFeatures(organizationId) {
        return this.orgRepo.findFeatures(organizationId);
    }
    getFeatureCatalog() {
        return featureCatalog_1.FEATURE_CATALOG;
    }
    async setFeature(organizationId, featureSlug, enabled, config = {}, actorId, actorAccountId) {
        const definition = (0, featureCatalog_1.getFeatureDefinition)(featureSlug);
        if (!definition)
            throw new common_1.ConflictException(`Módulo desconhecido: '${featureSlug}'.`);
        if (!definition.available) {
            throw new common_1.ConflictException(`O módulo '${featureSlug}' ainda não está disponível.`);
        }
        if (definition.required && !enabled) {
            throw new common_1.ConflictException('A funcionalidade base da plataforma não pode ser desativada.');
        }
        const existingFeatures = await this.orgRepo.findFeatures(organizationId);
        const previous = existingFeatures.find((feature) => feature.feature_slug === featureSlug);
        const enabledFeatures = new Set(existingFeatures.filter((feature) => feature.enabled).map((feature) => feature.feature_slug));
        if (enabled) {
            const missing = (definition.requires ?? []).filter((required) => !enabledFeatures.has(required));
            if (missing.length > 0) {
                throw new common_1.ConflictException(`Ative primeiro os módulos necessários: ${missing.join(', ')}.`);
            }
        }
        else {
            const activeDependents = featureCatalog_1.FEATURE_CATALOG.filter((candidate) => candidate.available &&
                candidate.requires?.includes(featureSlug) &&
                enabledFeatures.has(candidate.slug));
            if (activeDependents.length > 0) {
                throw new common_1.ConflictException(`Desative primeiro os módulos dependentes: ${activeDependents.map(({ slug }) => slug).join(', ')}.`);
            }
        }
        const before = previous
            ? { enabled: previous.enabled, config: previous.config }
            : { enabled: false, config: {} };
        const feature = await this.orgRepo.upsertFeature(organizationId, featureSlug, enabled, config);
        this.orgHomeService.revalidate(organizationId);
        await this.audit(organizationId, actorId, actorAccountId, `feature.${enabled ? 'enabled' : 'disabled'}`, 'feature', organizationId, { feature_slug: featureSlug, ...before }, { feature_slug: featureSlug, enabled, config });
        return feature;
    }
    async getAuditHistory(organizationId) {
        await this.findById(organizationId);
        return db_1.AppDataBase.query(`SELECT audit.id, audit.action, audit.entity_type, audit.entity_id,
              audit.before_state, audit.after_state, audit.created_at,
              audit.actor_id, audit.actor_account_id, audit.actor_type,
              account.email AS actor_email, member.name AS actor_name
       FROM audit_logs AS audit
       LEFT JOIN user_accounts AS account ON account.id = audit.actor_account_id
       LEFT JOIN members AS member ON member.id = audit.actor_id
       WHERE audit.organization_id = $1
       ORDER BY audit.created_at DESC
       LIMIT 200`, [organizationId]);
    }
    // ─── Plans ─────────────────────────────────────────────────────────────────
    async getPlans() {
        return this.orgRepo.findAllPlans();
    }
    // ─── Public tenant info (for TenantContext) ────────────────────────────────
    async getTenantInfo(slug) {
        const org = await this.findBySlug(slug);
        const features = await this.orgRepo.findEnabledFeatures(org.id);
        return {
            id: org.id,
            name: org.name,
            slug: org.slug,
            status: org.status,
            theme: org.theme,
            settings: {
                public_home: org.settings.public_home ?? {},
            },
            plan: org.plan
                ? { id: org.plan.id, name: org.plan.name, slug: org.plan.slug }
                : null,
            features: features.map((f) => ({
                slug: f.feature_slug,
                config: f.config,
            })),
        };
    }
    // ─── Private ──────────────────────────────────────────────────────────────
    async audit(orgId, actorId, actorAccountId, action, entityType, entityId, before, after, manager = db_1.AppDataBase.manager) {
        const repo = manager.getRepository(auditLog_1.AuditLog);
        const actorTypes = await manager.query(`SELECT CASE
         WHEN EXISTS (
           SELECT 1 FROM user_account_roles
           WHERE account_id = $1 AND role_name = 'EQUIPE_TECNICA'
         ) THEN 'SUPER_ADMIN'
         WHEN EXISTS (
           SELECT 1
           FROM member_roles AS member_role
           JOIN roles AS role ON role.id = member_role.role_id
           WHERE member_role.member_id = $2 AND role.name = 'organization.admin'
         ) THEN 'ORGANIZATION_ADMIN'
         ELSE 'MEMBER'
       END AS actor_type`, [actorAccountId ?? null, actorId]);
        const isSuperAdmin = actorTypes[0]?.actor_type === 'SUPER_ADMIN';
        const log = repo.create({
            organization_id: orgId,
            actor_id: isSuperAdmin ? null : actorId,
            actor_account_id: actorAccountId,
            actor_type: actorTypes[0]?.actor_type ?? 'SYSTEM',
            action,
            entity_type: entityType,
            entity_id: entityId,
            before_state: before,
            after_state: after,
        });
        await repo.save(log);
    }
};
exports.OrganizationService = OrganizationService;
exports.OrganizationService = OrganizationService = OrganizationService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [OrganizationRepository_1.OrganizationRepository,
        OrgHomeService_1.OrgHomeService,
        AccountProvisioningService_1.AccountProvisioningService,
        AccountEmailService_1.AccountEmailService])
], OrganizationService);
