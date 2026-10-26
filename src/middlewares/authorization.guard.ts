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
    if (!user.access_context) throw new UnauthorizedException('Sessão encerrada. Faça login novamente para selecionar o contexto de acesso.');
    const path = String(request.originalUrl ?? request.url ?? '').split('?')[0];
    if (user.community_only && !path.startsWith('/external-profile/') &&
        !['/auth/logout', '/auth/switch-organization'].includes(path)) {
      throw new ForbiddenException('Conclua uma inscrição nesta organização para criar seu vínculo de comunidade.');
    }
    if (
      user.support_session_id &&
      (path === '/organizations' ||
        path.startsWith('/organizations/') ||
        path === '/auth/switch-organization')
    ) {
      throw new ForbiddenException(
        'A sessão de suporte não pode acessar operações de administração da plataforma.',
      );
    }

    const isPlatformAdmin = ['platform', 'support'].includes(user.access_context) && user.roles.includes('EQUIPE_TECNICA');
    const isSharedAuthRoute = [
      '/auth/logout',
      '/auth/change-temporary-password',
      '/auth/switch-organization',
    ].includes(path);
    const isHomeEditor = path.startsWith('/org-home/admin');
    const isPlatformControlRoute =
      path === '/email/usage' ||
      path === '/organizations' ||
      path.startsWith('/organizations/') ||
      path.startsWith('/org-home/admin/organizations/') ||
      path === '/auth/switch-organization' ||
      path === '/auth/end-support-access';
    if (user.access_context === 'platform' && request.tenant) {
      throw new ForbiddenException('A sessão do SuperAdmin só pode ser usada na plataforma. Entre no admin da organização ou inicie suporte.');
    }
    if (isPlatformAdmin && !request.tenant && !isPlatformControlRoute && !isSharedAuthRoute) {
      throw new ForbiddenException('Selecione uma organização ou inicie uma sessão de suporte.');
    }
    if (user.support_session_id && !request.tenant) {
      throw new ForbiddenException('A sessão de suporte está limitada à organização selecionada.');
    }
    if (
      !isPlatformAdmin &&
      !isSharedAuthRoute && (!request.tenant || user.organization_id !== request.tenant.organization_id)
    ) {
      throw new ForbiddenException('A sessão não pertence à organização solicitada.');
    }

    // Valida se o token ainda existe no banco (invalida após troca de role ou logout)
    const tokenRecord = await AppDataBase.getRepository(Token).findOne({
      where: { token, type: 'access' },
    });

    if (!tokenRecord) {
      throw new UnauthorizedException('Sessão encerrada. Faça login novamente.');
    }

    if (
      user.password_change_required &&
      path !== '/auth/change-temporary-password' &&
      path !== '/auth/logout'
    ) {
      throw new ForbiddenException('Defina uma nova senha para continuar.');
    }

    if (isPlatformAdmin && request.tenant && !isHomeEditor) {
      if (!user.support_session_id || !user.account_id) {
        throw new ForbiddenException(
          'Inicie uma sessão de suporte para acessar uma organização como Super Admin.',
        );
      }
      const sessions = await AppDataBase.query(
        `SELECT id
         FROM platform_support_sessions
         WHERE id = $1
           AND actor_account_id = $2
           AND organization_id = $3
           AND revoked_at IS NULL
           AND ($4::boolean OR expires_at > now())
         LIMIT 1`,
        [
          user.support_session_id,
          user.account_id,
          request.tenant.organization_id,
          path === '/auth/end-support-access',
        ],
      );
      if (sessions.length === 0) {
        throw new ForbiddenException('A sessão de suporte expirou ou foi encerrada.');
      }
    }

    if (
      request.tenant &&
      !isPlatformAdmin &&
      !['ACTIVE', 'TRIAL'].includes(request.tenant.status)
    ) {
      throw new ForbiddenException(
        request.tenant.status === 'SUSPENDED'
          ? 'O acesso a esta organização está suspenso.'
          : 'Esta organização ainda não está disponível.',
      );
    }

    // EQUIPE_TECNICA tem acesso total
    if (isPlatformAdmin) return true;

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
