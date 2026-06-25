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
let AuthorizationGuard = class AuthorizationGuard {
    constructor(reflector) {
        this.reflector = reflector;
    }
    getUserFromRequest(request) {
        if (request.user)
            return request.user;
        const authHeader = request.headers?.authorization;
        if (!authHeader) {
            throw new common_1.UnauthorizedException('Token nao fornecido');
        }
        const parts = authHeader.split(' ');
        if (parts.length !== 2 || parts[0] !== 'Bearer') {
            throw new common_1.UnauthorizedException('Formato de token invalido');
        }
        try {
            const user = (0, tokenHelper_1.decodeToken)(parts[1]);
            request.user = user;
            return user;
        }
        catch {
            throw new common_1.UnauthorizedException('Token invalido ou expirado');
        }
    }
    canActivate(context) {
        const request = context.switchToHttp().getRequest();
        const user = this.getUserFromRequest(request);
        if (!user) {
            throw new common_1.ForbiddenException('Usuário não autenticado');
        }
        // EQUIPE_TECNICA tem acesso total (bypass de todas as validações)
        if (user.roles.includes('EQUIPE_TECNICA')) {
            return true;
        }
        // Verificar se requer roles específicas
        const requiredRoles = this.reflector.getAllAndOverride(permissionMiddleware_1.ROLES_KEY, [
            context.getHandler(),
            context.getClass(),
        ]);
        if (requiredRoles) {
            const hasRole = requiredRoles.some((role) => user.roles.includes(role));
            if (!hasRole) {
                throw new common_1.ForbiddenException(`Acesso negado: requer uma das roles: ${requiredRoles.join(', ')}`);
            }
        }
        // Verificar se requer status ativo
        const requireActive = this.reflector.getAllAndOverride(requireActive_decorator_1.REQUIRE_ACTIVE_KEY, [
            context.getHandler(),
            context.getClass(),
        ]);
        if (requireActive && !user.isActive) {
            throw new common_1.ForbiddenException('Acesso negado: matrícula inativa');
        }
        // Verificar se requer posição específica
        const positionRequirement = this.reflector.getAllAndOverride(requirePosition_decorator_1.REQUIRE_POSITION_KEY, [context.getHandler(), context.getClass()]);
        if (positionRequirement) {
            const hasPosition = user.positions.some((pos) => {
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
