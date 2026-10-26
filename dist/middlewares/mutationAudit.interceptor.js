"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.MutationAuditInterceptor = void 0;
const common_1 = require("@nestjs/common");
const rxjs_1 = require("rxjs");
const db_1 = require("../db");
const auditLog_1 = require("../models/auditLog");
const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const MUTATION_METHODS = new Set(['POST', 'PUT', 'PATCH', 'DELETE']);
let MutationAuditInterceptor = class MutationAuditInterceptor {
    intercept(context, next) {
        const request = context.switchToHttp().getRequest();
        const response = context.switchToHttp().getResponse();
        const route = request.route?.path;
        const baseUrl = request.baseUrl ?? '';
        const routePath = `${baseUrl}${route ?? ''}`.replace(/^\//, '');
        if (!MUTATION_METHODS.has(request.method) ||
            routePath === 'auth' ||
            routePath.startsWith('auth/') ||
            routePath === 'organizations' ||
            routePath.startsWith('organizations/')) {
            return next.handle();
        }
        return next.handle().pipe((0, rxjs_1.mergeMap)(async (result) => {
            if (response.statusCode < 200 || response.statusCode >= 300)
                return result;
            const organizationId = request.tenant?.organization_id ??
                request.params?.organizationId ??
                request.params?.orgId;
            if (!organizationId || !UUID_PATTERN.test(organizationId))
                return result;
            const resultRecord = typeof result === 'object' && result !== null
                ? result
                : {};
            const candidateIds = [
                request.params?.memberId,
                request.params?.miscId,
                request.params?.id,
                resultRecord.id,
                resultRecord.member_id,
                organizationId,
            ];
            const entityId = candidateIds.find((candidate) => typeof candidate === 'string' && UUID_PATTERN.test(candidate));
            if (!entityId)
                return result;
            const repository = db_1.AppDataBase.getRepository(auditLog_1.AuditLog);
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
        }));
    }
};
exports.MutationAuditInterceptor = MutationAuditInterceptor;
exports.MutationAuditInterceptor = MutationAuditInterceptor = __decorate([
    (0, common_1.Injectable)()
], MutationAuditInterceptor);
