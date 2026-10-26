"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthService = void 0;
const common_1 = require("@nestjs/common");
const jwt = __importStar(require("jsonwebtoken"));
const crypto_1 = require("crypto");
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const auth_1 = require("../config/auth");
const member_1 = require("../models/member");
const MemberRepository_1 = require("../repositories/MemberRepository");
const TokenRepository_1 = require("../repositories/TokenRepository");
const db_1 = require("../db");
const PENDING_REGISTRATION_MESSAGE = "Otimo ter voce conosco, peco apenas mais um pouco de paciencia, seu cadastro esta em analise, sera notificado assim que esse processo for concluido.";
let AuthService = class AuthService {
    constructor(memberRepository, tokenRepository) {
        this.memberRepository = memberRepository;
        this.tokenRepository = tokenRepository;
    }
    assertMemberCanAccessSystem(member) {
        if (member.registration_status === member_1.MemberRegistrationStatus.PENDING) {
            throw new common_1.ForbiddenException(PENDING_REGISTRATION_MESSAGE);
        }
        if (member.registration_status === member_1.MemberRegistrationStatus.REJECTED) {
            throw new common_1.ForbiddenException(member.registration_rejection_reason
                ? `Seu cadastro foi rejeitado. Motivo: ${member.registration_rejection_reason}`
                : "Seu cadastro foi rejeitado.");
        }
        if (member.registration_status !== member_1.MemberRegistrationStatus.APPROVED) {
            throw new common_1.ForbiddenException("Seu cadastro ainda não foi aprovado.");
        }
    }
    async login(email, password, rememberMe, tenantSlug, accessContext = 'member') {
        if (!['platform', 'organization', 'member'].includes(accessContext)) {
            throw new common_1.BadRequestException('Contexto de acesso inválido.');
        }
        if (accessContext === 'platform' && tenantSlug) {
            throw new common_1.ForbiddenException('O SuperAdmin só pode entrar pelo endereço da plataforma.');
        }
        if (accessContext === 'organization' && !tenantSlug) {
            throw new common_1.ForbiddenException('Entre no endereço da organização para acessar sua administração.');
        }
        const accounts = await db_1.AppDataBase.query(`SELECT id, email, password, password_change_required FROM user_accounts WHERE lower(email) = lower($1) LIMIT 1`, [email.trim()]);
        const account = accounts[0];
        if (!account || !(await bcryptjs_1.default.compare(password, account.password))) {
            throw new common_1.UnauthorizedException("Credenciais invalidas");
        }
        const memberships = await this.getAccountMemberships(account.id);
        const accountRoles = (await db_1.AppDataBase.query(`SELECT role_name FROM user_account_roles WHERE account_id = $1`, [account.id])).map((role) => role.role_name);
        if (accessContext === 'platform') {
            if (!accountRoles.includes('EQUIPE_TECNICA'))
                throw new common_1.ForbiddenException('Esta conta não tem acesso ao SuperAdmin.');
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
        const availableMemberships = memberships.filter((membership) => ['ACTIVE', 'TRIAL'].includes(membership.organization_status ?? 'ACTIVE'));
        const selectedMembership = tenantSlug
            ? memberships.find((membership) => membership.tenant_slug === tenantSlug)
            : availableMemberships.find((membership) => membership.status === member_1.MemberRegistrationStatus.APPROVED) ??
                availableMemberships[0];
        if (!selectedMembership) {
            if (accessContext === 'member' && tenantSlug) {
                const [external] = await db_1.AppDataBase.query(`SELECT account_id FROM external_account_profiles WHERE account_id = $1`, [account.id]);
                if (external)
                    return this.generateCommunitySession(account.id, tenantSlug, Boolean(rememberMe));
            }
            throw new common_1.ForbiddenException("Esta conta ainda não possui vínculo com uma organização.");
        }
        if (!['ACTIVE', 'TRIAL'].includes(selectedMembership.organization_status ?? 'ACTIVE')) {
            throw new common_1.ForbiddenException('O acesso a esta organização está suspenso ou indisponível.');
        }
        const member = await this.memberRepository.findById(selectedMembership.member_id);
        if (!member)
            throw new common_1.UnauthorizedException("Vínculo de organização inválido.");
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
    async switchOrganization(accountId, tenantSlug, rememberMe) {
        if (!accountId)
            throw new common_1.UnauthorizedException("A sessão não possui uma identidade global.");
        const rows = await db_1.AppDataBase.query(`SELECT member.id
       FROM members AS member
       JOIN organizations AS organization ON organization.id = member.organization_id
       WHERE member.account_id = $1
         AND organization.slug = $2
         AND organization.deleted_at IS NULL
         AND organization.status IN ('ACTIVE', 'TRIAL')
         AND member.registration_status = $3
       LIMIT 1`, [accountId, tenantSlug, member_1.MemberRegistrationStatus.APPROVED]);
        if (rows.length === 0) {
            throw new common_1.ForbiddenException("Você não possui um vínculo aprovado com essa organização.");
        }
        const member = await this.memberRepository.findById(rows[0].id);
        if (!member)
            throw new common_1.UnauthorizedException("Vínculo de organização inválido.");
        const accessToken = await this.generateAccessToken(member.id);
        const refreshToken = rememberMe ? await this.generateRefreshToken(member) : undefined;
        return {
            accessToken,
            ...(refreshToken ? { refreshToken } : {}),
            memberships: await this.getAccountMemberships(accountId),
        };
    }
    async getProfile(userId, organizationId) {
        const member = await this.memberRepository.findById(userId, organizationId);
        if (!member)
            throw new Error("Usuario nao encontrado");
        return member;
    }
    async startSupportAccess(organizationId, actorMemberId, actorAccountId, reason) {
        const normalizedReason = reason?.trim();
        if (!normalizedReason || normalizedReason.length < 10 || normalizedReason.length > 1000) {
            throw new common_1.BadRequestException('Informe um motivo de suporte entre 10 e 1000 caracteres.');
        }
        if (!actorAccountId) {
            throw new common_1.UnauthorizedException('A sessão não possui uma conta global.');
        }
        const [actorAccount] = await db_1.AppDataBase.query(`SELECT id, email FROM user_accounts WHERE id = $1`, [actorAccountId]);
        if (!actorAccount || actorAccountId !== actorMemberId) {
            throw new common_1.UnauthorizedException('A identidade do operador não é válida.');
        }
        const role = await db_1.AppDataBase.query(`SELECT 1 FROM user_account_roles
       WHERE account_id = $1 AND role_name = 'EQUIPE_TECNICA'`, [actorAccountId]);
        if (role.length === 0) {
            throw new common_1.ForbiddenException('Somente a equipe técnica pode iniciar uma sessão de suporte.');
        }
        const organizations = await db_1.AppDataBase.query(`SELECT id, slug FROM organizations
       WHERE id = $1 AND deleted_at IS NULL`, [organizationId]);
        const organization = organizations[0];
        if (!organization)
            throw new common_1.NotFoundException('Organização não encontrada.');
        let [supportMember] = await db_1.AppDataBase.query(`SELECT id FROM members WHERE organization_id = $1 AND account_id = $2 LIMIT 1`, [organizationId, actorAccountId]);
        if (!supportMember) {
            [supportMember] = await db_1.AppDataBase.query(`SELECT id FROM members WHERE organization_id IS NULL AND account_id = $1 LIMIT 1`, [actorAccountId]);
        }
        if (!supportMember) {
            const supportPassword = await bcryptjs_1.default.hash((0, crypto_1.randomUUID)(), 10);
            [supportMember] = await db_1.AppDataBase.query(`INSERT INTO members
           (name, email_personal, password, account_id, organization_id,
            registration_status, status, profile_visibility)
         VALUES ('Vínculo técnico de suporte', $1, $2, $3, NULL, 'rejected', 'ACTIVE', 'PRIVATE')
         RETURNING id`, [actorAccount.email, supportPassword, actorAccountId]);
        }
        const sessionId = (0, crypto_1.randomUUID)();
        const sessions = await db_1.AppDataBase.query(`INSERT INTO platform_support_sessions
         (id, organization_id, actor_account_id, actor_member_id, reason, expires_at)
       VALUES ($1, $2, $3, $4, $5, now() + interval '45 minutes')
       RETURNING expires_at`, [sessionId, organizationId, actorAccountId, supportMember.id, normalizedReason]);
        const accessToken = await this.generateGlobalAccessToken(actorAccountId, actorAccount.email, {
            organization_id: organization.id,
            tenant_slug: organization.slug,
            support_session_id: sessionId,
            actor_account_id: actorAccountId,
            actor_member_id: supportMember.id,
        });
        await db_1.AppDataBase.query(`INSERT INTO audit_logs
         (organization_id, actor_id, actor_account_id, actor_type, support_session_id,
          action, entity_type, entity_id, after_state)
       VALUES ($1, $2, $3, 'SUPER_ADMIN', $4, 'support.session.started', 'organization', $1, $5::jsonb)`, [
            organizationId,
            null,
            actorAccountId,
            sessionId,
            JSON.stringify({ reason: normalizedReason, expires_at: sessions[0].expires_at }),
        ]);
        return {
            accessToken,
            support_session_id: sessionId,
            tenant_slug: organization.slug,
            expires_at: sessions[0].expires_at,
        };
    }
    async endSupportAccess(supportSessionId, actorMemberId, actorAccountId) {
        if (!supportSessionId || !actorAccountId) {
            throw new common_1.BadRequestException('A sessão atual não é uma sessão de suporte.');
        }
        const [supportSession] = await db_1.AppDataBase.query(`SELECT organization_id
       FROM platform_support_sessions
       WHERE id = $1 AND actor_account_id = $2`, [supportSessionId, actorAccountId]);
        if (!supportSession)
            throw new common_1.NotFoundException('Sessão de suporte não encontrada.');
        const updated = await db_1.AppDataBase.query(`UPDATE platform_support_sessions
       SET revoked_at = COALESCE(revoked_at, now()),
           revoked_by_account_id = $2
       WHERE id = $1 AND actor_account_id = $2
       RETURNING organization_id`, [supportSessionId, actorAccountId]);
        if (updated.length === 0)
            throw new common_1.NotFoundException('Sessão de suporte não encontrada.');
        await db_1.AppDataBase.query(`INSERT INTO audit_logs
         (organization_id, actor_id, actor_account_id, actor_type, support_session_id,
          action, entity_type, entity_id, after_state)
       VALUES ($1, $2, $3, 'SUPER_ADMIN', $4, 'support.session.ended', 'organization', $1, '{}'::jsonb)`, [supportSession.organization_id, null, actorAccountId, supportSessionId]);
        return { ended: true };
    }
    async refreshToken(refreshToken) {
        if (!auth_1.authConfig.jwt.refreshSecret)
            throw new Error("JWT refresh secret is not defined");
        const tokenData = await this.tokenRepository.findByToken(refreshToken);
        if (!tokenData || tokenData.type !== 'refresh' || tokenData.expiresAt < new Date()) {
            throw new Error("Refresh token invalido ou expirado");
        }
        const secret = auth_1.authConfig.jwt.refreshSecret;
        const decoded = jwt.verify(refreshToken, secret);
        if (!decoded.access_context)
            throw new common_1.UnauthorizedException('Faça login novamente para selecionar o contexto de acesso.');
        if (decoded.community_tenant && decoded.account_id && decoded.access_context === 'member') {
            const session = await this.generateCommunitySession(decoded.account_id, decoded.community_tenant, true);
            await this.tokenRepository.deleteByToken(refreshToken);
            return { accessToken: session.accessToken, refreshToken: session.refreshToken };
        }
        if (decoded.account_id) {
            if (decoded.access_context !== 'platform')
                throw new common_1.UnauthorizedException('Contexto de sessão inválido.');
            const [account] = await db_1.AppDataBase.query(`SELECT id, email FROM user_accounts WHERE id = $1`, [decoded.account_id]);
            const roles = await db_1.AppDataBase.query(`SELECT role_name FROM user_account_roles WHERE account_id = $1`, [decoded.account_id]);
            if (!account || !roles.some((role) => role.role_name === 'EQUIPE_TECNICA')) {
                throw new Error('Conta administrativa não encontrada');
            }
            const accessToken = await this.generateGlobalAccessToken(account.id, account.email);
            const newRefreshToken = await this.generateGlobalRefreshToken(account.id);
            await this.tokenRepository.deleteByToken(refreshToken);
            return { accessToken, refreshToken: newRefreshToken };
        }
        if (!decoded.id)
            throw new Error('Refresh token invalido');
        const member = await this.memberRepository.findById(decoded.id);
        if (!member)
            throw new Error("Usuario nao encontrado");
        this.assertMemberCanAccessSystem(member);
        const accessContext = decoded.access_context === 'organization' ? 'organization' : 'member';
        const accessToken = await this.generateAccessToken(member.id, undefined, accessContext);
        const newRefreshToken = await this.generateRefreshToken(member, accessContext);
        await this.tokenRepository.deleteByToken(refreshToken);
        return { accessToken, refreshToken: newRefreshToken };
    }
    async validateAccessToken(accessToken) {
        const tokenData = await this.tokenRepository.findByToken(accessToken);
        if (!tokenData || tokenData.expiresAt < new Date()) {
            throw new Error("Token invalido ou expirado");
        }
        return { valid: true };
    }
    async generateAccessToken(memberId, supportContext, accessContext = 'member') {
        if (!auth_1.authConfig.jwt.secret)
            throw new Error("JWT secret is not defined");
        const memberData = await this.memberRepository.findByIdWithPositions(memberId);
        if (!memberData)
            throw new Error("Membro nao encontrado");
        const roles = this.contextRoles(memberData.roles?.map((role) => role.name) ?? [], accessContext);
        if (accessContext === 'organization' && !roles.some((role) => ['organization.admin', 'organization.manage'].includes(role))) {
            throw new common_1.ForbiddenException('Esta conta não é administradora desta organização.');
        }
        const isActive = memberData.memberCourses?.some((mc) => mc.status === "active") ||
            memberData.status === "ACTIVE";
        const positions = [];
        if (memberData.positions.semesterHeads) {
            memberData.positions.semesterHeads.forEach((sh) => {
                positions.push({
                    type: "REPRESENTANTE",
                    id: sh.program_semester_id,
                    name: `${sh.semester_number} Semestre - ${sh.course_name}`,
                });
            });
        }
        if (memberData.positions.courseManagers) {
            memberData.positions.courseManagers.forEach((cm) => {
                positions.push({
                    type: "DIRIGENTE",
                    id: cm.course_university_id,
                    name: `${cm.course_name} - ${cm.university_name} - ${cm.city_name}`,
                });
            });
        }
        if (memberData.positions.carManagers) {
            memberData.positions.carManagers.forEach((cm) => {
                positions.push({
                    type: "CAR",
                    id: cm.car_id,
                    name: cm.car_name,
                });
            });
        }
        if (memberData.positions.caeManagers) {
            memberData.positions.caeManagers.forEach((cm) => {
                positions.push({
                    type: "CAE",
                    id: cm.cae_id,
                    name: `${cm.cae_name} - ${cm.state_name}`,
                });
            });
        }
        const accountId = supportContext?.actor_account_id ?? memberData.account_id;
        const [accountSecurity] = accountId
            ? await db_1.AppDataBase.query(`SELECT password_change_required FROM user_accounts WHERE id = $1`, [accountId])
            : [];
        const memberships = accountId
            ? await this.getAccountMemberships(accountId)
            : [];
        const organizationId = supportContext?.organization_id ?? memberData.organization_id;
        const payload = {
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
        const token = jwt.sign(payload, auth_1.authConfig.jwt.secret, {
            expiresIn: auth_1.authConfig.jwt.expiresIn,
            jwtid: (0, crypto_1.randomUUID)(),
        });
        const decoded = jwt.decode(token);
        await this.tokenRepository.save({
            token,
            memberId: memberData.id,
            type: "access",
            expiresAt: new Date(decoded.exp * 1000),
        });
        return token;
    }
    contextRoles(roles, context) {
        const tenantRoles = roles.filter((role) => role !== 'EQUIPE_TECNICA');
        return context === 'organization' ? tenantRoles : tenantRoles.filter((role) => !role.startsWith('organization.') && !role.endsWith('.manage') && !role.endsWith('.approve'));
    }
    async generateRefreshToken(member, accessContext = 'member') {
        if (!auth_1.authConfig.jwt.refreshSecret)
            throw new Error("JWT refresh secret is not defined");
        const token = jwt.sign({
            id: member.id,
            access_context: accessContext,
            session_id: (0, crypto_1.randomUUID)(),
        }, auth_1.authConfig.jwt.refreshSecret, { expiresIn: auth_1.authConfig.jwt.refreshExpiresIn });
        const decoded = jwt.decode(token);
        await this.tokenRepository.save({
            token,
            memberId: member.id,
            type: "refresh",
            expiresAt: new Date(decoded.exp * 1000),
        });
        return token;
    }
    async logout(accessToken, refreshToken) {
        const tokenData = await this.tokenRepository.findByToken(accessToken);
        if (!tokenData || tokenData.type !== 'access')
            throw new common_1.UnauthorizedException("Token não encontrado");
        if (refreshToken) {
            const access = jwt.decode(accessToken);
            const refresh = jwt.verify(refreshToken, auth_1.authConfig.jwt.refreshSecret);
            const sameIdentity = access.access_context === 'platform'
                ? refresh.account_id === access.account_id
                : access.community_only ? refresh.account_id === access.account_id && refresh.community_tenant === access.tenant_slug
                    : refresh.id === access.id && !refresh.account_id;
            if (!sameIdentity || refresh.access_context !== access.access_context) {
                throw new common_1.ForbiddenException('O refresh token não pertence a esta sessão.');
            }
            await this.tokenRepository.deleteByToken(refreshToken);
        }
        await this.tokenRepository.deleteByToken(accessToken);
    }
    async generateCommunitySession(accountId, tenantSlug, remember) {
        if (!auth_1.authConfig.jwt.secret || (remember && !auth_1.authConfig.jwt.refreshSecret)) {
            throw new Error('JWT secret is not defined');
        }
        const [row] = await db_1.AppDataBase.query(`SELECT account.email, account.password_change_required, profile.display_name, organization.id AS organization_id
       FROM user_accounts account JOIN external_account_profiles profile ON profile.account_id = account.id
       CROSS JOIN organizations organization
       WHERE account.id = $1 AND organization.slug = $2 AND organization.status IN ('ACTIVE', 'TRIAL')
         AND organization.deleted_at IS NULL`, [accountId, tenantSlug]);
        if (!row || row.password_change_required)
            throw new common_1.ForbiddenException('Esta conta não está disponível para participação externa.');
        const payload = {
            id: accountId, account_id: accountId, email: row.email, name: row.display_name,
            roles: ['EXTERNO'], positions: [], isActive: true, access_context: 'member',
            community_only: true, organization_id: row.organization_id, tenant_slug: tenantSlug,
        };
        const accessToken = jwt.sign(payload, auth_1.authConfig.jwt.secret, { expiresIn: auth_1.authConfig.jwt.expiresIn, jwtid: (0, crypto_1.randomUUID)() });
        const accessExpiry = jwt.decode(accessToken);
        await this.tokenRepository.save({ token: accessToken, account_id: accountId, type: 'access', expiresAt: new Date(accessExpiry.exp * 1000) });
        let refreshToken;
        if (remember) {
            refreshToken = jwt.sign({ account_id: accountId, access_context: 'member', community_tenant: tenantSlug }, auth_1.authConfig.jwt.refreshSecret, { expiresIn: auth_1.authConfig.jwt.refreshExpiresIn, jwtid: (0, crypto_1.randomUUID)() });
            const expiry = jwt.decode(refreshToken);
            await this.tokenRepository.save({ token: refreshToken, account_id: accountId, type: 'refresh', expiresAt: new Date(expiry.exp * 1000) });
        }
        return { accessToken, refreshToken, member: { id: accountId, roles: ['EXTERNO'] }, memberships: await this.getAccountMemberships(accountId) };
    }
    async changeTemporaryPassword(accountId, newPassword, memberId, fullName) {
        if (!accountId)
            throw new common_1.UnauthorizedException('A sessão não possui conta global.');
        if (typeof newPassword !== 'string' || newPassword.length < 8 || Buffer.byteLength(newPassword, 'utf8') > 72) {
            throw new common_1.BadRequestException('A nova senha precisa ter pelo menos 8 caracteres e no máximo 72 bytes em UTF-8.');
        }
        if (typeof fullName !== 'string' || fullName.trim().length < 2 || fullName.trim().length > 255) {
            throw new common_1.BadRequestException('Informe seu nome completo (entre 2 e 255 caracteres).');
        }
        const passwordHash = await bcryptjs_1.default.hash(newPassword, 12);
        await db_1.AppDataBase.transaction(async (manager) => {
            const [account] = await manager.query(`SELECT password FROM user_accounts WHERE id = $1 AND password_change_required = true FOR UPDATE`, [accountId]);
            if (!account)
                throw new common_1.BadRequestException('Esta conta não está aguardando troca de senha.');
            if (await bcryptjs_1.default.compare(newPassword, account.password)) {
                throw new common_1.BadRequestException('A senha pessoal deve ser diferente da temporária.');
            }
            await manager.query(`UPDATE user_accounts SET password = $2, password_change_required = false, updated_at = now() WHERE id = $1`, [accountId, passwordHash]);
            await manager.query(`UPDATE members SET password = $2 WHERE account_id = $1`, [accountId, passwordHash]);
            await manager.query(`UPDATE members SET name = $3 WHERE id = $1 AND account_id = $2`, [memberId, accountId, fullName.trim()]);
            await manager.query(`DELETE FROM token WHERE account_id = $1 OR "memberId" IN (SELECT id FROM members WHERE account_id = $1)`, [accountId]);
        });
        return { changed: true };
    }
    async generateGlobalAccessToken(accountId, email, supportContext) {
        if (!auth_1.authConfig.jwt.secret)
            throw new Error('JWT secret is not defined');
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
        }, auth_1.authConfig.jwt.secret, { expiresIn: auth_1.authConfig.jwt.expiresIn, jwtid: (0, crypto_1.randomUUID)() });
        const decoded = jwt.decode(token);
        await this.tokenRepository.save({
            token,
            memberId: supportContext?.actor_member_id ?? null,
            account_id: accountId,
            type: 'access',
            expiresAt: new Date(decoded.exp * 1000),
        });
        return token;
    }
    async generateGlobalRefreshToken(accountId) {
        if (!auth_1.authConfig.jwt.refreshSecret)
            throw new Error('JWT refresh secret is not defined');
        const token = jwt.sign({ id: accountId, account_id: accountId, access_context: 'platform', session_id: (0, crypto_1.randomUUID)() }, auth_1.authConfig.jwt.refreshSecret, { expiresIn: auth_1.authConfig.jwt.refreshExpiresIn });
        const decoded = jwt.decode(token);
        await this.tokenRepository.save({
            token,
            memberId: null,
            account_id: accountId,
            type: 'refresh',
            expiresAt: new Date(decoded.exp * 1000),
        });
        return token;
    }
    async verifyAccessToken(token) {
        if (!auth_1.authConfig.jwt.secret)
            throw new Error("JWT secret is not defined");
        try {
            return jwt.verify(token, auth_1.authConfig.jwt.secret);
        }
        catch (error) {
            throw new Error("Token invalido ou expirado");
        }
    }
    async isTokenRevoked(token) {
        const savedToken = await this.tokenRepository.findByToken(token);
        return !savedToken;
    }
    // ─── Private helpers ──────────────────────────────────────────────────────
    async resolveTenantSlug(organizationId) {
        const result = await db_1.AppDataBase.query(`SELECT slug FROM organizations WHERE id = $1 AND deleted_at IS NULL LIMIT 1`, [organizationId]);
        return result[0]?.slug;
    }
    async getAccountMemberships(accountId) {
        return db_1.AppDataBase.query(`SELECT member.id AS member_id,
              organization.id AS organization_id,
              organization.name AS organization_name,
              organization.slug AS tenant_slug,
              member.registration_status AS status,
              organization.status AS organization_status
       FROM members AS member
       JOIN organizations AS organization ON organization.id = member.organization_id
       WHERE member.account_id = $1
         AND organization.deleted_at IS NULL
       ORDER BY organization.name ASC`, [accountId]);
    }
};
exports.AuthService = AuthService;
exports.AuthService = AuthService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [MemberRepository_1.MemberRepository,
        TokenRepository_1.TokenRepository])
], AuthService);
