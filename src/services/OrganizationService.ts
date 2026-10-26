import {
  Injectable,
  NotFoundException,
  ConflictException,
  HttpException,
  Logger,
  BadRequestException,
} from '@nestjs/common';
import { OrganizationRepository } from '../repositories/OrganizationRepository';
import { AuditLog } from '../models/auditLog';
import { AppDataBase } from '../db';
import { OrganizationStatus } from '../models/organization';
import { FEATURE_CATALOG, getFeatureDefinition } from '../config/featureCatalog';
import { OrgHomeService } from './OrgHomeService';
import { AccountProvisioningService } from './AccountProvisioningService';
import { AccountEmailService } from './AccountEmailService';
import { EmailService } from './EmailService';
import { EntityManager } from 'typeorm';
import { Organization } from '../models/organization';
import { OrganizationFeature } from '../models/organizationFeature';

interface CreateOrgDto {
  name: string;
  slug: string;
  plan_id?: string;
  theme?: Record<string, unknown>;
  settings?: Record<string, unknown>;
}

interface UpdateOrgDto {
  name?: string;
  plan_id?: string;
  status?: string;
  theme?: Record<string, unknown>;
  settings?: Record<string, unknown>;
}

@Injectable()
export class OrganizationService {
  private readonly logger = new Logger(OrganizationService.name);
  constructor(
    private readonly orgRepo: OrganizationRepository,
    private readonly orgHomeService: OrgHomeService,
    private readonly accountProvisioning: AccountProvisioningService,
    private readonly accountEmails: AccountEmailService = new AccountEmailService(new EmailService(), accountProvisioning),
  ) {}

  async findAll() {
    return this.orgRepo.findAll();
  }

  async findById(id: string) {
    const org = await this.orgRepo.findById(id);
    if (!org) throw new NotFoundException('Organização não encontrada');
    return org;
  }

  async findBySlug(slug: string) {
    const org = await this.orgRepo.findBySlug(slug);
    if (!org) throw new NotFoundException(`Organização '${slug}' não encontrada`);
    return org;
  }

  async create(dto: CreateOrgDto, actorId: string, actorAccountId?: string) {
    if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(dto.slug)) throw new BadRequestException('Slug inválido.');
    const existing = await this.orgRepo.findBySlug(dto.slug);
    if (existing) {
      throw new ConflictException(`Slug '${dto.slug}' já está em uso`);
    }

    return AppDataBase.transaction(async manager => {
      const repository = manager.getRepository(Organization);
      const org = await repository.save(repository.create({ ...dto, status: OrganizationStatus.DRAFT, onboarding_step: 1 }));
      const features = manager.getRepository(OrganizationFeature);
      for (const slug of ['core', 'registration_approval', 'custom_fields', 'media_storage', 'sponsors', 'talent_network', 'communication_email']) {
        await features.save(features.create({ organization_id: org.id, feature_slug: slug,
          enabled: !['sponsors', 'talent_network'].includes(slug),
          config: slug === 'media_storage' ? { quota_bytes: 1073741824 } : {} }));
      }
      await this.orgHomeService.ensureDefaultHome(org.id, manager);
      const provisioning = dto.settings?.provisioning as { admin_email?: unknown } | undefined;
      if (typeof provisioning?.admin_email === 'string' && provisioning.admin_email.trim()) {
        await this.accountEmails.invite(org.id, provisioning.admin_email, true, manager);
      }
      await this.audit(org.id, actorId, actorAccountId, 'organization.created', 'organization', org.id, null, org, manager);
      return org;
    });
  }

  async update(id: string, dto: UpdateOrgDto & { suspension_reason?: string; onboarding_step?: number }, actorId: string, actorAccountId?: string) {
    const before = await this.findById(id);
    if (dto.status === OrganizationStatus.SUSPENDED && !dto.suspension_reason?.trim()) {
      throw new ConflictException('Informe o motivo para suspender a organização.');
    }

    const update = { ...dto } as Record<string, unknown>;
    if (
      (dto.status === OrganizationStatus.ACTIVE || dto.status === OrganizationStatus.TRIAL) &&
      before.status === OrganizationStatus.DRAFT
    ) {
      const settings = (dto.settings ?? before.settings) as Record<string, unknown>;
      const provisioning = settings.provisioning;
      const profile = typeof provisioning === 'object' && provisioning !== null
        ? provisioning as Record<string, unknown>
        : {};
      const requiredEmail = (key: string) =>
        typeof profile[key] === 'string' &&
        /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test((profile[key] as string).trim());
      const chiefTypeValid = profile.chief_type === 'person' || profile.chief_type === 'organization';
      const chiefNameValid = typeof profile.chief_name === 'string' && profile.chief_name.trim().length > 0;
      if (
        !requiredEmail('admin_email') ||
        !requiredEmail('chief_email') ||
        !chiefTypeValid ||
        !chiefNameValid
      ) {
        throw new ConflictException(
          'Para ativar, informe o email do administrador chefe e os dados do responsável principal.',
        );
      }
      update.onboarding_step = Math.max(dto.onboarding_step ?? before.onboarding_step, 3);
    }

    if (dto.status === OrganizationStatus.SUSPENDED) {
      update.suspension_reason = dto.suspension_reason!.trim();
      update.suspended_at = new Date();
      update.suspended_by_account_id = actorAccountId ?? null;
    } else if (dto.status === OrganizationStatus.ACTIVE || dto.status === OrganizationStatus.TRIAL) {
      update.suspension_reason = null;
      update.suspended_at = null;
      update.suspended_by_account_id = null;
    }

    const org = await this.orgRepo.update(id, update);
    this.orgHomeService.revalidate(id);
    await this.audit(
      id,
      actorId,
      actorAccountId,
      dto.status === OrganizationStatus.SUSPENDED ? 'organization.suspended' :
        dto.status === OrganizationStatus.ACTIVE && before.status === OrganizationStatus.SUSPENDED
          ? 'organization.reactivated'
          : 'organization.updated',
      'organization',
      id,
      before,
      org,
    );
    return org;
  }

  async remove(id: string, actorId: string, actorAccountId?: string) {
    await this.findById(id);
    await this.orgRepo.softDelete(id);
    await this.audit(id, actorId, actorAccountId, 'organization.deleted', 'organization', id, null, null);
  }

  async grantAdmin(organizationId: string, email: string, actorId: string, actorAccountId?: string) {
    return this.issueAdminAccess(organizationId, email, actorId, actorAccountId);
  }

  async issueAdminAccess(organizationId: string, email: string, actorId: string, actorAccountId?: string) {
    const organization = await this.findById(organizationId);
    if (![OrganizationStatus.DRAFT, OrganizationStatus.ACTIVE, OrganizationStatus.TRIAL].includes(organization.status)) {
      throw new ConflictException('Esta organização não pode receber novos convites.');
    }
    const access = await AppDataBase.transaction(manager => this.accountEmails.invite(organizationId, email, true, manager));
    await this.audit(
      organizationId,
      actorId,
      actorAccountId,
      'organization.admin.access_issued',
      'organization',
      organizationId,
      null,
      { email, invitation_id: access.invitation_id },
    );
    return {
      ...access,
      email,
      message: 'Convite enfileirado. O destinatário receberá um link para concluir o acesso.',
    };
  }

  async issueMemberAccess(organizationId: string, email: string, actorId: string, actorAccountId?: string) {
    const access = await AppDataBase.transaction(manager => this.accountEmails.invite(organizationId, email, false, manager));
    await this.audit(organizationId, actorId, actorAccountId, 'member.access_issued', 'organization',
      organizationId, null, { email, invitation_id: access.invitation_id });
    return { ...access, email };
  }

  async importMembers(organizationId: string, emails: string[], actorId: string, actorAccountId?: string) {
    await this.findById(organizationId);
    if (!Array.isArray(emails) || emails.length === 0 || emails.length > 500) {
      throw new ConflictException('Envie entre 1 e 500 emails por importação.');
    }
    const results = [];
    const seen = new Set<string>();
    for (const rawEmail of emails) {
      const email = String(rawEmail).trim().toLowerCase();
      if (seen.has(email)) continue;
      seen.add(email);
      try {
        const invitation = await AppDataBase.transaction(manager => this.accountEmails.invite(organizationId, email, false, manager));
        results.push({ ...invitation, email });
      } catch (error) {
        if (!(error instanceof HttpException)) {
          this.logger.error('Falha inesperada no provisionamento de membro durante importação.');
        }
        results.push({
          email,
          error: error instanceof HttpException ? error.message : 'Não foi possível importar este email. Contate a equipe técnica.',
        });
      }
    }
    await this.audit(organizationId, actorId, actorAccountId, 'members.imported', 'organization',
      organizationId, null, { total: results.length, failed: results.filter((row) => 'error' in row).length });
    return { results };
  }

  // ─── Features ─────────────────────────────────────────────────────────────

  async getFeatures(organizationId: string) {
    return this.orgRepo.findFeatures(organizationId);
  }

  getFeatureCatalog() {
    return FEATURE_CATALOG;
  }

  async setFeature(
    organizationId: string,
    featureSlug: string,
    enabled: boolean,
    config: Record<string, unknown> = {},
    actorId: string,
    actorAccountId?: string,
  ) {
    const definition = getFeatureDefinition(featureSlug);
    if (!definition) throw new ConflictException(`Módulo desconhecido: '${featureSlug}'.`);
    if (!definition.available) {
      throw new ConflictException(`O módulo '${featureSlug}' ainda não está disponível.`);
    }
    if (definition.required && !enabled) {
      throw new ConflictException('A funcionalidade base da plataforma não pode ser desativada.');
    }

    const existingFeatures = await this.orgRepo.findFeatures(organizationId);
    const previous = existingFeatures.find((feature) => feature.feature_slug === featureSlug);
    const enabledFeatures = new Set(
      existingFeatures.filter((feature) => feature.enabled).map((feature) => feature.feature_slug),
    );
    if (enabled) {
      const missing = (definition.requires ?? []).filter((required) => !enabledFeatures.has(required));
      if (missing.length > 0) {
        throw new ConflictException(
          `Ative primeiro os módulos necessários: ${missing.join(', ')}.`,
        );
      }
    } else {
      const activeDependents = FEATURE_CATALOG.filter((candidate) =>
        candidate.available &&
        candidate.requires?.includes(featureSlug) &&
        enabledFeatures.has(candidate.slug),
      );
      if (activeDependents.length > 0) {
        throw new ConflictException(
          `Desative primeiro os módulos dependentes: ${activeDependents.map(({ slug }) => slug).join(', ')}.`,
        );
      }
    }
    const before = previous
      ? { enabled: previous.enabled, config: previous.config }
      : { enabled: false, config: {} };
    const feature = await this.orgRepo.upsertFeature(organizationId, featureSlug, enabled, config);
    this.orgHomeService.revalidate(organizationId);
    await this.audit(
      organizationId,
      actorId,
      actorAccountId,
      `feature.${enabled ? 'enabled' : 'disabled'}`,
      'feature',
      organizationId,
      { feature_slug: featureSlug, ...before },
      { feature_slug: featureSlug, enabled, config },
    );
    return feature;
  }

  async getAuditHistory(organizationId: string) {
    await this.findById(organizationId);
    return AppDataBase.query(
      `SELECT audit.id, audit.action, audit.entity_type, audit.entity_id,
              audit.before_state, audit.after_state, audit.created_at,
              audit.actor_id, audit.actor_account_id, audit.actor_type,
              account.email AS actor_email, member.name AS actor_name
       FROM audit_logs AS audit
       LEFT JOIN user_accounts AS account ON account.id = audit.actor_account_id
       LEFT JOIN members AS member ON member.id = audit.actor_id
       WHERE audit.organization_id = $1
       ORDER BY audit.created_at DESC
       LIMIT 200`,
      [organizationId],
    );
  }

  // ─── Plans ─────────────────────────────────────────────────────────────────

  async getPlans() {
    return this.orgRepo.findAllPlans();
  }

  // ─── Public tenant info (for TenantContext) ────────────────────────────────

  async getTenantInfo(slug: string) {
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

  private async audit(
    orgId: string,
    actorId: string,
    actorAccountId: string | undefined,
    action: string,
    entityType: string,
    entityId: string,
    before: unknown,
    after: unknown,
    manager: EntityManager = AppDataBase.manager,
  ) {
    const repo = manager.getRepository(AuditLog);
    const actorTypes = await manager.query(
      `SELECT CASE
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
       END AS actor_type`,
      [actorAccountId ?? null, actorId],
    ) as { actor_type: string }[];
    const isSuperAdmin = actorTypes[0]?.actor_type === 'SUPER_ADMIN';
    const log = repo.create({
      organization_id: orgId,
      actor_id: isSuperAdmin ? null : actorId,
      actor_account_id: actorAccountId,
      actor_type: actorTypes[0]?.actor_type ?? 'SYSTEM',
      action,
      entity_type: entityType,
      entity_id: entityId,
      before_state: before as any,
      after_state: after as any,
    });
    await repo.save(log);
  }
}
