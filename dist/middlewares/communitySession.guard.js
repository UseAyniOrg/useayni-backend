"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CommunitySessionGuard = void 0;
const common_1 = require("@nestjs/common");
const tokenHelper_1 = require("../helpers/tokenHelper");
const db_1 = require("../db");
const token_1 = require("../models/token");
let CommunitySessionGuard = class CommunitySessionGuard {
    async canActivate(context) {
        const request = context.switchToHttp().getRequest();
        const authorization = request.headers.authorization;
        if (!authorization)
            return true;
        const [scheme, token] = authorization.split(' ');
        if (scheme !== 'Bearer' || !token)
            throw new common_1.UnauthorizedException('Faça login novamente.');
        let user;
        try {
            user = (0, tokenHelper_1.decodeToken)(token);
        }
        catch {
            throw new common_1.UnauthorizedException('Sua sessão expirou. Faça login novamente.');
        }
        const saved = await db_1.AppDataBase.getRepository(token_1.Token).findOneBy({ token, type: 'access' });
        if (!saved || saved.expiresAt < new Date())
            throw new common_1.UnauthorizedException('Sessão encerrada. Faça login novamente.');
        if (!user.account_id || !['member', 'organization'].includes(user.access_context ?? '') || user.support_session_id) {
            throw new common_1.ForbiddenException('Use seu acesso pessoal para participar do evento, não a sessão de plataforma ou suporte.');
        }
        if (user.password_change_required)
            throw new common_1.ForbiddenException('Defina sua senha pessoal antes de se inscrever.');
        request.user = user;
        return true;
    }
};
exports.CommunitySessionGuard = CommunitySessionGuard;
exports.CommunitySessionGuard = CommunitySessionGuard = __decorate([
    (0, common_1.Injectable)()
], CommunitySessionGuard);
