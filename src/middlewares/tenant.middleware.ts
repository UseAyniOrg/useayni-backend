import {
  Injectable,
  NestMiddleware,
  BadRequestException,
} from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { AppDataBase } from '../db';
import { Organization } from '../models/organization';
import { OrganizationFeature } from '../models/organizationFeature';

/** Resolves the current tenant from X-Org-Slug header or ?org= query param.
 *  Attaches `req.tenant` with id, slug, status, theme, and enabled feature flags.
 *  If no header is provided the middleware is a no-op (public routes still work).
 */
@Injectable()
export class TenantMiddleware implements NestMiddleware {
  async use(req: Request, _res: Response, next: NextFunction): Promise<void> {
    const hostMatch =
      req.hostname.match(/^([^.]+)\.useayni\.com$/) ??
      req.hostname.match(/^([^.]+)\.localhost$/);
    const hostSlug = hostMatch && !['www', 'api', 'admin'].includes(hostMatch[1])
      ? hostMatch[1]
      : undefined;
    const slug =
      (req.headers['x-org-slug'] as string | undefined) ||
      (req.query['org'] as string | undefined) ||
      hostSlug;

    const path = req.path;
    const isGlobalAuthRoute = [
      '/auth/login',
      '/auth/logout',
      '/auth/refresh-token',
      '/auth/verify-access-token',
      '/auth/validate-access-token',
      '/auth/change-temporary-password',
    ].includes(path);
    const isPlatformRoute =
      path === '/organizations' ||
      path.startsWith('/organizations/') ||
      path.startsWith('/org-home/admin/organizations/');

    if (isPlatformRoute) return next();

    if (!slug) {
      return next();
    }

    const orgRepo = AppDataBase.getRepository(Organization);
    const org = await orgRepo.findOne({
      where: { slug },
      relations: ['plan'],
    });

    if (!org || org.deleted_at) {
      if (isGlobalAuthRoute) {
        req.tenantSlugHint = slug;
        return next();
      }
      throw new BadRequestException(`Organização '${slug}' não encontrada`);
    }

    const featureRepo = AppDataBase.getRepository(OrganizationFeature);
    const features = await featureRepo.find({
      where: { organization_id: org.id, enabled: true },
    });

    req.tenant = {
      organization_id: org.id,
      slug: org.slug,
      name: org.name,
      status: org.status,
      theme: org.theme as Record<string, string>,
      features: features.map((f) => f.feature_slug),
    };

    next();
  }
}
