import {
  SetMetadata,
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { getFeatureDefinition } from '../config/featureCatalog';

export const FEATURE_FLAG_KEY = 'feature_flag';
export const RequireFeature = (flag: string) =>
  SetMetadata(FEATURE_FLAG_KEY, flag);

@Injectable()
export class FeatureFlagGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const flag = this.reflector.getAllAndOverride<string>(FEATURE_FLAG_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!flag) return true;

    const request = context.switchToHttp().getRequest();
    const tenant = request.tenant;

    if (!tenant) {
      throw new ForbiddenException(
        'Organização não identificada. Forneça o header X-Org-Slug.',
      );
    }

    const supportSession = request.user?.support_session_id &&
      request.user?.roles?.includes('EQUIPE_TECNICA');
    if (supportSession) return true;

    if (tenant.status !== 'ACTIVE' && tenant.status !== 'TRIAL') {
      throw new ForbiddenException('Esta organização não está disponível.');
    }

    if (!tenant.features.includes(flag)) {
      throw new ForbiddenException(
        `Módulo '${flag}' não está habilitado para esta organização.`,
      );
    }
    const definition = getFeatureDefinition(flag);
    const missingDependencies = (definition?.requires ?? []).filter(
      (required) => !tenant.features.includes(required),
    );
    if (missingDependencies.length > 0) {
      throw new ForbiddenException(
        `Módulo '${flag}' requer: ${missingDependencies.join(', ')}.`,
      );
    }

    return true;
  }
}
