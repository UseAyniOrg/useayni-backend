import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { REQUIRE_ACTIVE_KEY } from './requireActive.decorator';
import { REQUIRE_POSITION_KEY, PositionRequirement } from './requirePosition.decorator';
import { ROLES_KEY } from './permissionMiddleware';
import { decodeToken, JWTPayload } from '../helpers/tokenHelper';
import { AppDataBase } from '../db';
import { Token } from '../models/token';

@Injectable()
export class AuthorizationGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  private extractToken(request: any): { token: string; user: JWTPayload } {
    if (request.user && request._tokenRaw) {
      return { token: request._tokenRaw, user: request.user };
    }

    const authHeader = request.headers?.authorization;
    if (!authHeader) throw new UnauthorizedException('Token nao fornecido');

    const parts = authHeader.split(' ');
    if (parts.length !== 2 || parts[0] !== 'Bearer') {
      throw new UnauthorizedException('Formato de token invalido');
    }

    try {
      const user = decodeToken(parts[1]);
      request.user = user;
      request._tokenRaw = parts[1];
      return { token: parts[1], user };
    } catch {
      throw new UnauthorizedException('Token invalido ou expirado');
    }
  }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const { token, user } = this.extractToken(request);

    if (!user) throw new ForbiddenException('Usuário não autenticado');

    // Valida se o token ainda existe no banco (invalida após troca de role ou logout)
    const tokenRecord = await AppDataBase.getRepository(Token).findOne({
      where: { token, type: 'access' },
    });

    if (!tokenRecord) {
      throw new UnauthorizedException('Sessão encerrada. Faça login novamente.');
    }

    // EQUIPE_TECNICA tem acesso total
    if (user.roles.includes('EQUIPE_TECNICA')) return true;

    const requiredRoles = this.reflector.getAllAndOverride<string[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (requiredRoles) {
      const hasRole = requiredRoles.some(role => user.roles.includes(role));
      if (!hasRole) {
        throw new ForbiddenException(`Acesso negado: requer uma das roles: ${requiredRoles.join(', ')}`);
      }
    }

    const requireActive = this.reflector.getAllAndOverride<boolean>(REQUIRE_ACTIVE_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (requireActive && !user.isActive) {
      throw new ForbiddenException('Acesso negado: matrícula inativa');
    }

    const positionRequirement = this.reflector.getAllAndOverride<PositionRequirement>(
      REQUIRE_POSITION_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (positionRequirement) {
      const hasPosition = user.positions.some(pos => {
        if (pos.type !== positionRequirement.type) return false;
        if (positionRequirement.contextId && pos.id !== positionRequirement.contextId) return false;
        return true;
      });

      if (!hasPosition) {
        throw new ForbiddenException(`Acesso negado: posição ${positionRequirement.type} não encontrada`);
      }
    }

    return true;
  }
}
