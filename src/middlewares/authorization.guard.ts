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

@Injectable()
export class AuthorizationGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  private getUserFromRequest(request: any): JWTPayload {
    if (request.user) return request.user;

    const authHeader = request.headers?.authorization;
    if (!authHeader) {
      throw new UnauthorizedException('Token nao fornecido');
    }

    const parts = authHeader.split(' ');
    if (parts.length !== 2 || parts[0] !== 'Bearer') {
      throw new UnauthorizedException('Formato de token invalido');
    }

    try {
      const user = decodeToken(parts[1]);
      request.user = user;
      return user;
    } catch {
      throw new UnauthorizedException('Token invalido ou expirado');
    }
  }

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const user = this.getUserFromRequest(request);

    if (!user) {
      throw new ForbiddenException('Usuário não autenticado');
    }

    // EQUIPE_TECNICA tem acesso total (bypass de todas as validações)
    if (user.roles.includes('EQUIPE_TECNICA')) {
      return true;
    }

    // Verificar se requer roles específicas
    const requiredRoles = this.reflector.getAllAndOverride<string[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (requiredRoles) {
      const hasRole = requiredRoles.some((role) => user.roles.includes(role));
      if (!hasRole) {
        throw new ForbiddenException(
          `Acesso negado: requer uma das roles: ${requiredRoles.join(', ')}`,
        );
      }
    }

    // Verificar se requer status ativo
    const requireActive = this.reflector.getAllAndOverride<boolean>(REQUIRE_ACTIVE_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (requireActive && !user.isActive) {
      throw new ForbiddenException('Acesso negado: matrícula inativa');
    }

    // Verificar se requer posição específica
    const positionRequirement = this.reflector.getAllAndOverride<PositionRequirement>(
      REQUIRE_POSITION_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (positionRequirement) {
      const hasPosition = user.positions.some((pos) => {
        if (pos.type !== positionRequirement.type) return false;
        if (positionRequirement.contextId && pos.id !== positionRequirement.contextId) return false;
        return true;
      });

      if (!hasPosition) {
        throw new ForbiddenException(
          `Acesso negado: posição ${positionRequirement.type} não encontrada`,
        );
      }
    }

    return true;
  }
}
