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
exports.AuthorizationGuard = void 0;
const common_1 = require("@nestjs/common");
const core_1 = require("@nestjs/core");
const requireActive_decorator_1 = require("./requireActive.decorator");
const requirePosition_decorator_1 = require("./requirePosition.decorator");
const permissionMiddleware_1 = require("./permissionMiddleware");
const tokenHelper_1 = require("../helpers/tokenHelper");
const db_1 = require("../db");
const token_1 = require("../models/token");
let AuthorizationGuard = class AuthorizationGuard {
    constructor(reflector) {
        this.reflector = reflector;
    }
    extractToken(request) {
        if (request.user && request._tokenRaw) {
            return { token: request._tokenRaw, user: request.user };
        }
        const authHeader = request.headers?.authorization;
        if (!authHeader)
            throw new common_1.UnauthorizedException('Token nao fornecido');
        const parts = authHeader.split(' ');
        if (parts.length !== 2 || parts[0] !== 'Bearer') {
            throw new common_1.UnauthorizedException('Formato de token invalido');
        }
        try {
            const user = (0, tokenHelper_1.decodeToken)(parts[1]);
            request.user = user;
            request._tokenRaw = parts[1];
            return { token: parts[1], user };
        }
        catch {
            throw new common_1.UnauthorizedException('Token invalido ou expirado');
        }
    }
    async canActivate(context) {
        const request = context.switchToHttp().getRequest();
        const { token, user } = this.extractToken(request);
        if (!user)
            throw new common_1.ForbiddenException('Usuário não autenticado');
        if (!user.access_context)
            throw new common_1.UnauthorizedException('Sessão encerrada. Faça login novamente para selecionar o contexto de acesso.');
        const path = String(request.originalUrl ?? request.url ?? '').split('?')[0];
        if (user.community_only && !path.startsWith('/external-profile/') &&
            !['/auth/logout', '/auth/switch-organization'].includes(path)) {
            throw new common_1.ForbiddenException('Conclua uma inscrição nesta organização para criar seu vínculo de comunidade.');
        }
        if (user.support_session_id &&
            (path === '/organizations' ||
                path.startsWith('/organizations/') ||
                path === '/auth/switch-organization')) {
            throw new common_1.ForbiddenException('A sessão de suporte não pode acessar operações de administração da plataforma.');
        }
        const isPlatformAdmin = ['platform', 'support'].includes(user.access_context) && user.roles.includes('EQUIPE_TECNICA');
        const isSharedAuthRoute = [
            '/auth/logout',
            '/auth/change-temporary-password',
            '/auth/switch-organization',
        ].includes(path);
        const isHomeEditor = path.startsWith('/org-home/admin');
        const isPlatformControlRoute = path === '/email/usage' ||
            path === '/organizations' ||
            path.startsWith('/organizations/') ||
            path.startsWith('/org-home/admin/organizations/') ||
            path === '/auth/switch-organization' ||
            path === '/auth/end-support-access';
        if (user.access_context === 'platform' && request.tenant) {
            throw new common_1.ForbiddenException('A sessão do SuperAdmin só pode ser usada na plataforma. Entre no admin da organização ou inicie suporte.');
        }
        if (isPlatformAdmin && !request.tenant && !isPlatformControlRoute && !isSharedAuthRoute) {
            throw new common_1.ForbiddenException('Selecione uma organização ou inicie uma sessão de suporte.');
        }
        if (user.support_session_id && !request.tenant) {
            throw new common_1.ForbiddenException('A sessão de suporte está limitada à organização selecionada.');
        }
        if (!isPlatformAdmin &&
            !isSharedAuthRoute && (!request.tenant || user.organization_id !== request.tenant.organization_id)) {
            throw new common_1.ForbiddenException('A sessão não pertence à organização solicitada.');
        }
        // Valida se o token ainda existe no banco (invalida após troca de role ou logout)
        const tokenRecord = await db_1.AppDataBase.getRepository(token_1.Token).findOne({
            where: { token, type: 'access' },
        });
        if (!tokenRecord) {
            throw new common_1.UnauthorizedException('Sessão encerrada. Faça login novamente.');
        }
        if (user.password_change_required &&
            path !== '/auth/change-temporary-password' &&
            path !== '/auth/logout') {
            throw new common_1.ForbiddenException('Defina uma nova senha para continuar.');
        }
        if (isPlatformAdmin && request.tenant && !isHomeEditor) {
            if (!user.support_session_id || !user.account_id) {
                throw new common_1.ForbiddenException('Inicie uma sessão de suporte para acessar uma organização como Super Admin.');
            }
            const sessions = await db_1.AppDataBase.query(`SELECT id
         FROM platform_support_sessions
         WHERE id = $1
           AND actor_account_id = $2
           AND organization_id = $3
           AND revoked_at IS NULL
           AND ($4::boolean OR expires_at > now())
         LIMIT 1`, [
                user.support_session_id,
                user.account_id,
                request.tenant.organization_id,
                path === '/auth/end-support-access',
            ]);
            if (sessions.length === 0) {
                throw new common_1.ForbiddenException('A sessão de suporte expirou ou foi encerrada.');
            }
        }
        if (request.tenant &&
            !isPlatformAdmin &&
            !['ACTIVE', 'TRIAL'].includes(request.tenant.status)) {
            throw new common_1.ForbiddenException(request.tenant.status === 'SUSPENDED'
                ? 'O acesso a esta organização está suspenso.'
                : 'Esta organização ainda não está disponível.');
        }
        // EQUIPE_TECNICA tem acesso total
        if (isPlatformAdmin)
            return true;
        const requiredRoles = this.reflector.getAllAndOverride(permissionMiddleware_1.ROLES_KEY, [
            context.getHandler(),
            context.getClass(),
        ]);
        if (requiredRoles) {
            const hasRole = requiredRoles.some(role => user.roles.includes(role));
            if (!hasRole) {
                throw new common_1.ForbiddenException(`Acesso negado: requer uma das roles: ${requiredRoles.join(', ')}`);
            }
        }
        const requireActive = this.reflector.getAllAndOverride(requireActive_decorator_1.REQUIRE_ACTIVE_KEY, [
            context.getHandler(),
            context.getClass(),
        ]);
        if (requireActive && !user.isActive) {
            throw new common_1.ForbiddenException('Acesso negado: matrícula inativa');
        }
        const positionRequirement = this.reflector.getAllAndOverride(requirePosition_decorator_1.REQUIRE_POSITION_KEY, [context.getHandler(), context.getClass()]);
        if (positionRequirement) {
            const hasPosition = user.positions.some(pos => {
                if (pos.type !== positionRequirement.type)
                    return false;
                if (positionRequirement.contextId && pos.id !== positionRequirement.contextId)
                    return false;
                return true;
            });
            if (!hasPosition) {
                throw new common_1.ForbiddenException(`Acesso negado: posição ${positionRequirement.type} não encontrada`);
            }
        }
        return true;
    }
};
exports.AuthorizationGuard = AuthorizationGuard;
exports.AuthorizationGuard = AuthorizationGuard = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [core_1.Reflector])
], AuthorizationGuard);
