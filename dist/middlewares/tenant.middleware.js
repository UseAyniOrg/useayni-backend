"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.TenantMiddleware = void 0;
const common_1 = require("@nestjs/common");
const db_1 = require("../db");
const organization_1 = require("../models/organization");
const organizationFeature_1 = require("../models/organizationFeature");
/** Resolves the current tenant from X-Org-Slug header or ?org= query param.
 *  Attaches `req.tenant` with id, slug, status, theme, and enabled feature flags.
 *  If no header is provided the middleware is a no-op (public routes still work).
 */
let TenantMiddleware = class TenantMiddleware {
    async use(req, _res, next) {
        const hostMatch = req.hostname.match(/^([^.]+)\.useayni\.com$/) ??
            req.hostname.match(/^([^.]+)\.localhost$/);
        const hostSlug = hostMatch && !['www', 'api', 'admin'].includes(hostMatch[1])
            ? hostMatch[1]
            : undefined;
        const slug = req.headers['x-org-slug'] ||
            req.query['org'] ||
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
        const isPlatformRoute = path === '/organizations' ||
            path.startsWith('/organizations/') ||
            path.startsWith('/org-home/admin/organizations/');
        if (isPlatformRoute)
            return next();
        if (!slug) {
            return next();
        }
        const orgRepo = db_1.AppDataBase.getRepository(organization_1.Organization);
        const org = await orgRepo.findOne({
            where: { slug },
            relations: ['plan'],
        });
        if (!org || org.deleted_at) {
            if (isGlobalAuthRoute) {
                req.tenantSlugHint = slug;
                return next();
            }
            throw new common_1.BadRequestException(`Organização '${slug}' não encontrada`);
        }
        const featureRepo = db_1.AppDataBase.getRepository(organizationFeature_1.OrganizationFeature);
        const features = await featureRepo.find({
            where: { organization_id: org.id, enabled: true },
        });
        req.tenant = {
            organization_id: org.id,
            slug: org.slug,
            name: org.name,
            status: org.status,
            theme: org.theme,
            features: features.map((f) => f.feature_slug),
        };
        next();
    }
};
exports.TenantMiddleware = TenantMiddleware;
exports.TenantMiddleware = TenantMiddleware = __decorate([
    (0, common_1.Injectable)()
], TenantMiddleware);
