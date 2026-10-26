import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { mergeMap, Observable } from 'rxjs';
import { AppDataBase } from '../db';
import { AuditLog } from '../models/auditLog';
import { JWTPayload } from '../helpers/tokenHelper';

type AuditedRequest = Request & {
  user?: JWTPayload;
  tenant?: { organization_id: string };
  route?: { path?: string };
};

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const MUTATION_METHODS = new Set(['POST', 'PUT', 'PATCH', 'DELETE']);

@Injectable()
export class MutationAuditInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const request = context.switchToHttp().getRequest<AuditedRequest>();
    const response = context.switchToHttp().getResponse<Response>();
    const route = request.route?.path;
    const baseUrl = request.baseUrl ?? '';
    const routePath = `${baseUrl}${route ?? ''}`.replace(/^\//, '');

    if (
      !MUTATION_METHODS.has(request.method) ||
      routePath === 'auth' ||
      routePath.startsWith('auth/') ||
      routePath === 'organizations' ||
      routePath.startsWith('organizations/')
    ) {
      return next.handle();
    }

    return next.handle().pipe(
      mergeMap(async (result: unknown) => {
        if (response.statusCode < 200 || response.statusCode >= 300) return result;

        const organizationId =
          request.tenant?.organization_id ??
          request.params?.organizationId ??
          request.params?.orgId;
        if (!organizationId || !UUID_PATTERN.test(organizationId)) return result;

        const resultRecord =
          typeof result === 'object' && result !== null
            ? result as Record<string, unknown>
            : {};
        const candidateIds = [
          request.params?.memberId,
          request.params?.miscId,
          request.params?.id,
          resultRecord.id,
          resultRecord.member_id,
          organizationId,
        ];
        const entityId = candidateIds.find(
          (candidate): candidate is string =>
            typeof candidate === 'string' && UUID_PATTERN.test(candidate),
        );
        if (!entityId) return result;

        const repository = AppDataBase.getRepository(AuditLog);
        const isSuperAdmin = request.user?.roles.includes('EQUIPE_TECNICA') ?? false;
        await repository.save(repository.create({
          organization_id: organizationId,
          actor_id: isSuperAdmin ? null : request.user?.id,
          actor_account_id: request.user?.account_id,
          support_session_id: request.user?.support_session_id,
          actor_type: request.user?.roles.includes('EQUIPE_TECNICA')
            ? 'SUPER_ADMIN'
            : request.user?.roles.includes('organization.admin')
              ? 'ORGANIZATION_ADMIN'
              : request.user
                ? 'MEMBER'
                : 'SYSTEM',
          action: 'api.mutation',
          entity_type: 'api',
          entity_id: entityId,
          after_state: {
            method: request.method,
            route: `${baseUrl}${route ?? ''}`.slice(0, 500),
            status_code: response.statusCode,
          },
          ip_address: request.ip,
        }));
        return result;
      }),
    );
  }
}
