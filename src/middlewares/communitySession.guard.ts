import { CanActivate, ExecutionContext, ForbiddenException, Injectable, UnauthorizedException } from '@nestjs/common';
import { Request } from 'express';
import { decodeToken } from '../helpers/tokenHelper';
import { AppDataBase } from '../db';
import { Token } from '../models/token';

@Injectable()
export class CommunitySessionGuard implements CanActivate {
  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<Request>();
    const authorization = request.headers.authorization;
    if (!authorization) return true;
    const [scheme, token] = authorization.split(' ');
    if (scheme !== 'Bearer' || !token) throw new UnauthorizedException('Faça login novamente.');
    let user;
    try { user = decodeToken(token); }
    catch { throw new UnauthorizedException('Sua sessão expirou. Faça login novamente.'); }
    const saved = await AppDataBase.getRepository(Token).findOneBy({ token, type: 'access' });
    if (!saved || saved.expiresAt < new Date()) throw new UnauthorizedException('Sessão encerrada. Faça login novamente.');
    if (!user.account_id || !['member', 'organization'].includes(user.access_context ?? '') || user.support_session_id) {
      throw new ForbiddenException('Use seu acesso pessoal para participar do evento, não a sessão de plataforma ou suporte.');
    }
    if (user.password_change_required) throw new ForbiddenException('Defina sua senha pessoal antes de se inscrever.');
    request.user = user;
    return true;
  }
}
