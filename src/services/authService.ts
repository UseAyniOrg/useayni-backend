import { BadRequestException, ConflictException, ForbiddenException, Injectable, NotFoundException, UnauthorizedException } from "@nestjs/common";
import * as jwt from "jsonwebtoken";
import { randomUUID } from "crypto";
import bcrypt from "bcryptjs";
import { authConfig } from "../config/auth";
import { Member, MemberRegistrationStatus } from "../models/member";
import { MemberRepository } from "../repositories/MemberRepository";
import { TokenRepository } from "../repositories/TokenRepository";
import { JWTPayload, MemberPosition, OrganizationMembership } from "../helpers/tokenHelper";
import { AppDataBase } from "../db";

const PENDING_REGISTRATION_MESSAGE =
  "Otimo ter voce conosco, peco apenas mais um pouco de paciencia, seu cadastro esta em analise, sera notificado assim que esse processo for concluido.";

@Injectable()
export class AuthService {
  constructor(
  private readonly memberRepository: MemberRepository,
  private readonly tokenRepository: TokenRepository,
) {}

  private assertMemberCanAccessSystem(member: Member) {
  if (member.registration_status === MemberRegistrationStatus.PENDING) {
    throw new ForbiddenException(PENDING_REGISTRATION_MESSAGE);
  }

  if (member.registration_status === MemberRegistrationStatus.REJECTED) {
    throw new ForbiddenException(
      member.registration_rejection_reason
        ? `Seu cadastro foi rejeitado. Motivo: ${member.registration_rejection_reason}`
        : "Seu cadastro foi rejeitado.",
    );
  }

  if (member.registration_status !== MemberRegistrationStatus.APPROVED) {
    throw new ForbiddenException("Seu cadastro ainda não foi aprovado.");
  }
}

  async login(email: string, password: string, rememberMe?: boolean, tenantSlug?: string,
    accessContext: 'platform' | 'organization' | 'member' = 'member') {
    if (!['platform', 'organization', 'member'].includes(accessContext)) {
      throw new BadRequestException('Contexto de acesso inválido.');
    }
    if (accessContext === 'platform' && tenantSlug) {
      throw new ForbiddenException('O SuperAdmin só pode entrar pelo endereço da plataforma.');
    }
    if (accessContext === 'organization' && !tenantSlug) {
      throw new ForbiddenException('Entre no endereço da organização para acessar sua administração.');
    }
    const accounts = await AppDataBase.query(
      `SELECT id, email, password, password_change_required FROM user_accounts WHERE lower(email) = lower($1) LIMIT 1`,
      [email.trim()],
    );
    const account = accounts[0] as { id: string; email: string; password: string; password_change_required: boolean } | undefined;
    if (!account || !(await bcrypt.compare(password, account.password))) {
      throw new UnauthorizedException("Credenciais invalidas");
    }

    const memberships = await this.getAccountMemberships(account.id);
    const accountRoles = (await AppDataBase.query(
      `SELECT role_name FROM user_account_roles WHERE account_id = $1`,
      [account.id],
    ) as { role_name: string }[]).map((role) => role.role_name);
    if (accessContext === 'platform') {
      if (!accountRoles.includes('EQUIPE_TECNICA')) throw new ForbiddenException('Esta conta não tem acesso ao SuperAdmin.');
      const accessToken = await this.generateGlobalAccessToken(account.id, account.email);
      const refreshToken = rememberMe
        ? await this.generateGlobalRefreshToken(account.id)
        : undefined;
      return {
        member: {
          id: account.id,
          name: account.email,
          email_personal: account.email,
          account_id: account.id,
          isActive: true,
          roles: accountRoles,
          positions: [],
        },
        memberships,
        accessToken,
        refreshToken,
      };
    }
    const availableMemberships = memberships.filter((membership) =>
      ['ACTIVE', 'TRIAL'].includes(membership.organization_status ?? 'ACTIVE'),
    );
    const selectedMembership = tenantSlug
      ? memberships.find((membership) => membership.tenant_slug === tenantSlug)
      : availableMemberships.find((membership) => membership.status === MemberRegistrationStatus.APPROVED) ??
        availableMemberships[0];

    if (!selectedMembership) {
      if (accessContext === 'member' && tenantSlug) {
        const [external] = await AppDataBase.query(`SELECT account_id FROM external_account_profiles WHERE account_id = $1`, [account.id]);
        if (external) return this.generateCommunitySession(account.id, tenantSlug, Boolean(rememberMe));
      }
      throw new ForbiddenException("Esta conta ainda não possui vínculo com uma organização.");
    }
    if (!['ACTIVE', 'TRIAL'].includes(selectedMembership.organization_status ?? 'ACTIVE')) {
      throw new ForbiddenException('O acesso a esta organização está suspenso ou indisponível.');
    }

    const member = await this.memberRepository.findById(selectedMembership.member_id);
    if (!member) throw new UnauthorizedException("Vínculo de organização inválido.");
    this.assertMemberCanAccessSystem(member);

    const accessToken = await this.generateAccessToken(member.id, undefined, accessContext);
    const refreshToken = rememberMe ? await this.generateRefreshToken(member, accessContext) : undefined;
    const memberWithRoles = await this.memberRepository.findByIdWithRolesAndPermissions(member.id);

    return {
      member: {
        ...member,
        roles: this.contextRoles(memberWithRoles?.roles?.map((role) => role.name) ?? [], accessContext),
      },
      memberships,
      accessToken,
      refreshToken,
    };
  }

  async switchOrganization(
    accountId: string | undefined,
    tenantSlug: string,
    rememberMe?: boolean,
  ) {
    if (!accountId) throw new UnauthorizedException("A sessão não possui uma identidade global.");

    const rows = await AppDataBase.query(
      `SELECT member.id
       FROM members AS member
       JOIN organizations AS organization ON organization.id = member.organization_id
       WHERE member.account_id = $1
         AND organization.slug = $2
         AND organization.deleted_at IS NULL
         AND organization.status IN ('ACTIVE', 'TRIAL')
         AND member.registration_status = $3
       LIMIT 1`,
      [accountId, tenantSlug, MemberRegistrationStatus.APPROVED],
    );
    if (rows.length === 0) {
      throw new ForbiddenException("Você não possui um vínculo aprovado com essa organização.");
    }

    const member = await this.memberRepository.findById(rows[0].id);
    if (!member) throw new UnauthorizedException("Vínculo de organização inválido.");
    const accessToken = await this.generateAccessToken(member.id);
    const refreshToken = rememberMe ? await this.generateRefreshToken(member) : undefined;
    return {
      accessToken,
      ...(refreshToken ? { refreshToken } : {}),
      memberships: await this.getAccountMemberships(accountId),
    };
  }


  async getProfile(userId: string, organizationId: string) {
    const member = await this.memberRepository.findById(userId, organizationId);
    if (!member) throw new Error("Usuario nao encontrado");
    return member;
  }

  async startSupportAccess(
    organizationId: string,
    actorMemberId: string,
    actorAccountId: string | undefined,
    reason: string,
  ) {
    const normalizedReason = reason?.trim();
    if (!normalizedReason || normalizedReason.length < 10 || normalizedReason.length > 1000) {
      throw new BadRequestException('Informe um motivo de suporte entre 10 e 1000 caracteres.');
    }
    if (!actorAccountId) {
      throw new UnauthorizedException('A sessão não possui uma conta global.');
    }

    const [actorAccount] = await AppDataBase.query(
      `SELECT id, email FROM user_accounts WHERE id = $1`,
      [actorAccountId],
    ) as { id: string; email: string }[];
    if (!actorAccount || actorAccountId !== actorMemberId) {
      throw new UnauthorizedException('A identidade do operador não é válida.');
    }
    const role = await AppDataBase.query(
      `SELECT 1 FROM user_account_roles
       WHERE account_id = $1 AND role_name = 'EQUIPE_TECNICA'`,
      [actorAccountId],
    );
    if (role.length === 0) {
      throw new ForbiddenException('Somente a equipe técnica pode iniciar uma sessão de suporte.');
    }

    const organizations = await AppDataBase.query(
      `SELECT id, slug FROM organizations
       WHERE id = $1 AND deleted_at IS NULL`,
      [organizationId],
    ) as { id: string; slug: string }[];
    const organization = organizations[0];
    if (!organization) throw new NotFoundException('Organização não encontrada.');

    let [supportMember] = await AppDataBase.query(
      `SELECT id FROM members WHERE organization_id = $1 AND account_id = $2 LIMIT 1`,
      [organizationId, actorAccountId],
    ) as { id: string }[];
    if (!supportMember) {
      [supportMember] = await AppDataBase.query(
        `SELECT id FROM members WHERE organization_id IS NULL AND account_id = $1 LIMIT 1`,
        [actorAccountId],
      ) as { id: string }[];
    }
    if (!supportMember) {
      const supportPassword = await bcrypt.hash(randomUUID(), 10);
      [supportMember] = await AppDataBase.query(
        `INSERT INTO members
           (name, email_personal, password, account_id, organization_id,
            registration_status, status, profile_visibility)
         VALUES ('Vínculo técnico de suporte', $1, $2, $3, NULL, 'rejected', 'ACTIVE', 'PRIVATE')
         RETURNING id`,
        [actorAccount.email, supportPassword, actorAccountId],
      ) as { id: string }[];
    }

    const sessionId = randomUUID();
    const sessions = await AppDataBase.query(
      `INSERT INTO platform_support_sessions
         (id, organization_id, actor_account_id, actor_member_id, reason, expires_at)
       VALUES ($1, $2, $3, $4, $5, now() + interval '45 minutes')
       RETURNING expires_at`,
      [sessionId, organizationId, actorAccountId, supportMember.id, normalizedReason],
    ) as { expires_at: Date }[];
    const accessToken = await this.generateGlobalAccessToken(actorAccountId, actorAccount.email, {
      organization_id: organization.id,
      tenant_slug: organization.slug,
      support_session_id: sessionId,
      actor_account_id: actorAccountId,
      actor_member_id: supportMember.id,
    });

    await AppDataBase.query(
      `INSERT INTO audit_logs
         (organization_id, actor_id, actor_account_id, actor_type, support_session_id,
          action, entity_type, entity_id, after_state)
       VALUES ($1, $2, $3, 'SUPER_ADMIN', $4, 'support.session.started', 'organization', $1, $5::jsonb)`,
      [
        organizationId,
        null,
        actorAccountId,
        sessionId,
        JSON.stringify({ reason: normalizedReason, expires_at: sessions[0].expires_at }),
      ],
    );

    return {
      accessToken,
      support_session_id: sessionId,
      tenant_slug: organization.slug,
      expires_at: sessions[0].expires_at,
    };
  }

  async endSupportAccess(
    supportSessionId: string | undefined,
    actorMemberId: string,
    actorAccountId: string | undefined,
  ) {
    if (!supportSessionId || !actorAccountId) {
      throw new BadRequestException('A sessão atual não é uma sessão de suporte.');
    }
    const [supportSession] = await AppDataBase.query(
      `SELECT organization_id
       FROM platform_support_sessions
       WHERE id = $1 AND actor_account_id = $2`,
      [supportSessionId, actorAccountId],
    ) as { organization_id: string }[];
    if (!supportSession) throw new NotFoundException('Sessão de suporte não encontrada.');
    const updated = await AppDataBase.query(
      `UPDATE platform_support_sessions
       SET revoked_at = COALESCE(revoked_at, now()),
           revoked_by_account_id = $2
       WHERE id = $1 AND actor_account_id = $2
       RETURNING organization_id`,
      [supportSessionId, actorAccountId],
    ) as { organization_id: string }[];
    if (updated.length === 0) throw new NotFoundException('Sessão de suporte não encontrada.');

    await AppDataBase.query(
      `INSERT INTO audit_logs
         (organization_id, actor_id, actor_account_id, actor_type, support_session_id,
          action, entity_type, entity_id, after_state)
       VALUES ($1, $2, $3, 'SUPER_ADMIN', $4, 'support.session.ended', 'organization', $1, '{}'::jsonb)`,
      [supportSession.organization_id, null, actorAccountId, supportSessionId],
    );
    return { ended: true };
  }

  async refreshToken(refreshToken: string) {
    if (!authConfig.jwt.refreshSecret) throw new Error("JWT refresh secret is not defined");

    const tokenData = await this.tokenRepository.findByToken(refreshToken);
    if (!tokenData || tokenData.type !== 'refresh' || tokenData.expiresAt < new Date()) {
      throw new Error("Refresh token invalido ou expirado");
    }

    const secret = authConfig.jwt.refreshSecret;
    const decoded = jwt.verify(refreshToken, secret) as { id?: string; account_id?: string; access_context?: 'platform' | 'organization' | 'member'; community_tenant?: string };
    if (!decoded.access_context) throw new UnauthorizedException('Faça login novamente para selecionar o contexto de acesso.');
    if (decoded.community_tenant && decoded.account_id && decoded.access_context === 'member') {
      const session = await this.generateCommunitySession(decoded.account_id, decoded.community_tenant, true);
      await this.tokenRepository.deleteByToken(refreshToken);
      return { accessToken: session.accessToken, refreshToken: session.refreshToken! };
    }
    if (decoded.account_id) {
      if (decoded.access_context !== 'platform') throw new UnauthorizedException('Contexto de sessão inválido.');
      const [account] = await AppDataBase.query(
        `SELECT id, email FROM user_accounts WHERE id = $1`,
        [decoded.account_id],
      ) as { id: string; email: string }[];
      const roles = await AppDataBase.query(
        `SELECT role_name FROM user_account_roles WHERE account_id = $1`,
        [decoded.account_id],
      ) as { role_name: string }[];
      if (!account || !roles.some((role) => role.role_name === 'EQUIPE_TECNICA')) {
        throw new Error('Conta administrativa não encontrada');
      }
      const accessToken = await this.generateGlobalAccessToken(account.id, account.email);
      const newRefreshToken = await this.generateGlobalRefreshToken(account.id);
      await this.tokenRepository.deleteByToken(refreshToken);
      return { accessToken, refreshToken: newRefreshToken };
    }
    if (!decoded.id) throw new Error('Refresh token invalido');
    const member = await this.memberRepository.findById(decoded.id);
    if (!member) throw new Error("Usuario nao encontrado");

    this.assertMemberCanAccessSystem(member);

    const accessContext = decoded.access_context === 'organization' ? 'organization' : 'member';
    const accessToken = await this.generateAccessToken(member.id, undefined, accessContext);
    const newRefreshToken = await this.generateRefreshToken(member, accessContext);
    await this.tokenRepository.deleteByToken(refreshToken);

    return { accessToken, refreshToken: newRefreshToken };
  }

  async validateAccessToken(accessToken: string) {
    const tokenData = await this.tokenRepository.findByToken(accessToken);
    if (!tokenData || tokenData.expiresAt < new Date()) {
      throw new Error("Token invalido ou expirado");
    }
    return { valid: true };
  }

  private async generateAccessToken(
    memberId: string,
    supportContext?: {
      organization_id: string;
      tenant_slug: string;
      support_session_id: string;
      actor_account_id: string;
      actor_member_id: string;
    },
    accessContext: 'organization' | 'member' = 'member',
  ): Promise<string> {
    if (!authConfig.jwt.secret) throw new Error("JWT secret is not defined");

    const memberData = await this.memberRepository.findByIdWithPositions(memberId);
    if (!memberData) throw new Error("Membro nao encontrado");

    const roles = this.contextRoles(memberData.roles?.map((role) => role.name) ?? [], accessContext);
    if (accessContext === 'organization' && !roles.some((role) => ['organization.admin', 'organization.manage'].includes(role))) {
      throw new ForbiddenException('Esta conta não é administradora desta organização.');
    }
    const isActive =
      memberData.memberCourses?.some((mc) => mc.status === "active") ||
      memberData.status === "ACTIVE";
    const positions: MemberPosition[] = [];

    if (memberData.positions.semesterHeads) {
      memberData.positions.semesterHeads.forEach((sh: any) => {
        positions.push({
          type: "REPRESENTANTE",
          id: sh.program_semester_id,
          name: `${sh.semester_number} Semestre - ${sh.course_name}`,
        });
      });
    }

    if (memberData.positions.courseManagers) {
      memberData.positions.courseManagers.forEach((cm: any) => {
        positions.push({
          type: "DIRIGENTE",
          id: cm.course_university_id,
          name: `${cm.course_name} - ${cm.university_name} - ${cm.city_name}`,
        });
      });
    }

    if (memberData.positions.carManagers) {
      memberData.positions.carManagers.forEach((cm: any) => {
        positions.push({
          type: "CAR",
          id: cm.car_id,
          name: cm.car_name,
        });
      });
    }

    if (memberData.positions.caeManagers) {
      memberData.positions.caeManagers.forEach((cm: any) => {
        positions.push({
          type: "CAE",
          id: cm.cae_id,
          name: `${cm.cae_name} - ${cm.state_name}`,
        });
      });
    }

    const accountId = supportContext?.actor_account_id ?? memberData.account_id;
    const [accountSecurity] = accountId
      ? await AppDataBase.query(
          `SELECT password_change_required FROM user_accounts WHERE id = $1`,
          [accountId],
        ) as { password_change_required: boolean }[]
      : [];
    const memberships = accountId
      ? await this.getAccountMemberships(accountId)
      : [];
    const organizationId = supportContext?.organization_id ?? memberData.organization_id;
    const payload: JWTPayload = {
      id: memberData.id,
      email: memberData.email_personal,
      name: memberData.name,
      isActive,
      roles,
      access_context: accessContext,
      positions,
      account_id: accountId,
      password_change_required: accountSecurity?.password_change_required ?? false,
      organization_id: organizationId,
      tenant_slug: supportContext?.tenant_slug ??
        (organizationId ? await this.resolveTenantSlug(organizationId) : undefined),
      support_session_id: supportContext?.support_session_id,
      organization_memberships: memberships,
    };

    const token = jwt.sign(payload, authConfig.jwt.secret, {
      expiresIn: authConfig.jwt.expiresIn,
      jwtid: randomUUID(),
    });

    const decoded = jwt.decode(token) as { exp: number };
    await this.tokenRepository.save({
      token,
      memberId: memberData.id,
      type: "access",
      expiresAt: new Date(decoded.exp * 1000),
    });

    return token;
  }

  private contextRoles(roles: string[], context: 'organization' | 'member'): string[] {
    const tenantRoles = roles.filter((role) => role !== 'EQUIPE_TECNICA');
    return context === 'organization' ? tenantRoles : tenantRoles.filter((role) =>
      !role.startsWith('organization.') && !role.endsWith('.manage') && !role.endsWith('.approve'));
  }

  private async generateRefreshToken(member: Member, accessContext: 'organization' | 'member' = 'member'): Promise<string> {
    if (!authConfig.jwt.refreshSecret) throw new Error("JWT refresh secret is not defined");

    const token = jwt.sign(
      {
        id: member.id,
        access_context: accessContext,
        session_id: randomUUID(),
      },
      authConfig.jwt.refreshSecret,
      { expiresIn: authConfig.jwt.refreshExpiresIn },
    );
    const decoded = jwt.decode(token) as { exp: number };
    await this.tokenRepository.save({
      token,
      memberId: member.id,
      type: "refresh",
      expiresAt: new Date(decoded.exp * 1000),
    });
    return token;
  }

  async logout(accessToken: string, refreshToken?: string) {
    const tokenData = await this.tokenRepository.findByToken(accessToken);
    if (!tokenData || tokenData.type !== 'access') throw new UnauthorizedException("Token não encontrado");
    if (refreshToken) {
      const access = jwt.decode(accessToken) as JWTPayload;
      const refresh = jwt.verify(refreshToken, authConfig.jwt.refreshSecret!) as { id?: string; account_id?: string; access_context?: string; community_tenant?: string };
      const sameIdentity = access.access_context === 'platform'
        ? refresh.account_id === access.account_id
        : access.community_only ? refresh.account_id === access.account_id && refresh.community_tenant === access.tenant_slug
        : refresh.id === access.id && !refresh.account_id;
      if (!sameIdentity || refresh.access_context !== access.access_context) {
        throw new ForbiddenException('O refresh token não pertence a esta sessão.');
      }
      await this.tokenRepository.deleteByToken(refreshToken);
    }
    await this.tokenRepository.deleteByToken(accessToken);
  }

  private async generateCommunitySession(accountId: string, tenantSlug: string, remember: boolean) {
    if (!authConfig.jwt.secret || (remember && !authConfig.jwt.refreshSecret)) {
      throw new Error('JWT secret is not defined');
    }
    const [row] = await AppDataBase.query(
      `SELECT account.email, account.password_change_required, profile.display_name, organization.id AS organization_id
       FROM user_accounts account JOIN external_account_profiles profile ON profile.account_id = account.id
       CROSS JOIN organizations organization
       WHERE account.id = $1 AND organization.slug = $2 AND organization.status IN ('ACTIVE', 'TRIAL')
         AND organization.deleted_at IS NULL`, [accountId, tenantSlug],
    ) as { email: string; password_change_required: boolean; display_name: string; organization_id: string }[];
    if (!row || row.password_change_required) throw new ForbiddenException('Esta conta não está disponível para participação externa.');
    const payload: JWTPayload = {
      id: accountId, account_id: accountId, email: row.email, name: row.display_name,
      roles: ['EXTERNO'], positions: [], isActive: true, access_context: 'member',
      community_only: true, organization_id: row.organization_id, tenant_slug: tenantSlug,
    };
    const accessToken = jwt.sign(payload, authConfig.jwt.secret!, { expiresIn: authConfig.jwt.expiresIn, jwtid: randomUUID() });
    const accessExpiry = jwt.decode(accessToken) as { exp: number };
    await this.tokenRepository.save({ token: accessToken, account_id: accountId, type: 'access', expiresAt: new Date(accessExpiry.exp * 1000) });
    let refreshToken: string | undefined;
    if (remember) {
      refreshToken = jwt.sign({ account_id: accountId, access_context: 'member', community_tenant: tenantSlug },
        authConfig.jwt.refreshSecret!, { expiresIn: authConfig.jwt.refreshExpiresIn, jwtid: randomUUID() });
      const expiry = jwt.decode(refreshToken) as { exp: number };
      await this.tokenRepository.save({ token: refreshToken, account_id: accountId, type: 'refresh', expiresAt: new Date(expiry.exp * 1000) });
    }
    return { accessToken, refreshToken, member: { id: accountId, roles: ['EXTERNO'] }, memberships: await this.getAccountMemberships(accountId) };
  }

  async changeTemporaryPassword(accountId: string | undefined, newPassword: string, memberId?: string, fullName?: string) {
    if (!accountId) throw new UnauthorizedException('A sessão não possui conta global.');
    if (typeof newPassword !== 'string' || newPassword.length < 8 || Buffer.byteLength(newPassword, 'utf8') > 72) {
      throw new BadRequestException('A nova senha precisa ter pelo menos 8 caracteres e no máximo 72 bytes em UTF-8.');
    }
    if (typeof fullName !== 'string' || fullName.trim().length < 2 || fullName.trim().length > 255) {
      throw new BadRequestException('Informe seu nome completo (entre 2 e 255 caracteres).');
    }
    const passwordHash = await bcrypt.hash(newPassword, 12);
    await AppDataBase.transaction(async (manager) => {
      const [account] = await manager.query(
        `SELECT password FROM user_accounts WHERE id = $1 AND password_change_required = true FOR UPDATE`,
        [accountId],
      ) as { password: string }[];
      if (!account) throw new BadRequestException('Esta conta não está aguardando troca de senha.');
      if (await bcrypt.compare(newPassword, account.password)) {
        throw new BadRequestException('A senha pessoal deve ser diferente da temporária.');
      }
      await manager.query(
        `UPDATE user_accounts SET password = $2, password_change_required = false, updated_at = now() WHERE id = $1`,
        [accountId, passwordHash],
      );
      await manager.query(`UPDATE members SET password = $2 WHERE account_id = $1`, [accountId, passwordHash]);
      await manager.query(`UPDATE members SET name = $3 WHERE id = $1 AND account_id = $2`, [memberId, accountId, fullName.trim()]);
      await manager.query(
        `DELETE FROM token WHERE account_id = $1 OR "memberId" IN (SELECT id FROM members WHERE account_id = $1)`,
        [accountId],
      );
    });
    return { changed: true };
  }

  private async generateGlobalAccessToken(
    accountId: string,
    email: string,
    supportContext?: {
      organization_id: string;
      tenant_slug: string;
      support_session_id: string;
      actor_account_id: string;
      actor_member_id: string;
    },
  ): Promise<string> {
    if (!authConfig.jwt.secret) throw new Error('JWT secret is not defined');
    const token = jwt.sign({
      id: supportContext?.actor_member_id ?? accountId,
      email,
      name: email,
      isActive: true,
      roles: ['EQUIPE_TECNICA'],
      access_context: supportContext ? 'support' : 'platform',
      positions: [],
      account_id: accountId,
      organization_id: supportContext?.organization_id,
      tenant_slug: supportContext?.tenant_slug,
      support_session_id: supportContext?.support_session_id,
      organization_memberships: [],
    } satisfies JWTPayload, authConfig.jwt.secret, { expiresIn: authConfig.jwt.expiresIn, jwtid: randomUUID() });
    const decoded = jwt.decode(token) as { exp: number };
    await this.tokenRepository.save({
      token,
      memberId: supportContext?.actor_member_id ?? null,
      account_id: accountId,
      type: 'access',
      expiresAt: new Date(decoded.exp * 1000),
    });
    return token;
  }

  private async generateGlobalRefreshToken(accountId: string): Promise<string> {
    if (!authConfig.jwt.refreshSecret) throw new Error('JWT refresh secret is not defined');
    const token = jwt.sign(
      { id: accountId, account_id: accountId, access_context: 'platform', session_id: randomUUID() },
      authConfig.jwt.refreshSecret,
      { expiresIn: authConfig.jwt.refreshExpiresIn },
    );
    const decoded = jwt.decode(token) as { exp: number };
    await this.tokenRepository.save({
      token,
      memberId: null,
      account_id: accountId,
      type: 'refresh',
      expiresAt: new Date(decoded.exp * 1000),
    });
    return token;
  }

  async verifyAccessToken(token: string): Promise<JWTPayload> {
    if (!authConfig.jwt.secret) throw new Error("JWT secret is not defined");

    try {
      return jwt.verify(token, authConfig.jwt.secret) as JWTPayload;
    } catch (error) {
      throw new Error("Token invalido ou expirado");
    }
  }

  async isTokenRevoked(token: string): Promise<boolean> {
    const savedToken = await this.tokenRepository.findByToken(token);
    return !savedToken;
  }

  // ─── Private helpers ──────────────────────────────────────────────────────

  private async resolveTenantSlug(organizationId: string): Promise<string | undefined> {
    const result = await AppDataBase.query(
      `SELECT slug FROM organizations WHERE id = $1 AND deleted_at IS NULL LIMIT 1`,
      [organizationId],
    );
    return result[0]?.slug;
  }

  private async getAccountMemberships(accountId: string): Promise<OrganizationMembership[]> {
    return AppDataBase.query(
      `SELECT member.id AS member_id,
              organization.id AS organization_id,
              organization.name AS organization_name,
              organization.slug AS tenant_slug,
              member.registration_status AS status,
              organization.status AS organization_status
       FROM members AS member
       JOIN organizations AS organization ON organization.id = member.organization_id
       WHERE member.account_id = $1
         AND organization.deleted_at IS NULL
       ORDER BY organization.name ASC`,
      [accountId],
    );
  }
}
