"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.FeatureFlagGuard = exports.RequireFeature = exports.FEATURE_FLAG_KEY = void 0;
const common_1 = require("@nestjs/common");
const core_1 = require("@nestjs/core");
const featureCatalog_1 = require("../config/featureCatalog");
exports.FEATURE_FLAG_KEY = 'feature_flag';
const RequireFeature = (flag) => (0, common_1.SetMetadata)(exports.FEATURE_FLAG_KEY, flag);
exports.RequireFeature = RequireFeature;
let FeatureFlagGuard = class FeatureFlagGuard {
    constructor(reflector) {
        this.reflector = reflector;
    }
    canActivate(context) {
        const flag = this.reflector.getAllAndOverride(exports.FEATURE_FLAG_KEY, [
            context.getHandler(),
            context.getClass(),
        ]);
        if (!flag)
            return true;
        const request = context.switchToHttp().getRequest();
        const tenant = request.tenant;
        if (!tenant) {
            throw new common_1.ForbiddenException('Organização não identificada. Forneça o header X-Org-Slug.');
        }
        const supportSession = request.user?.support_session_id &&
            request.user?.roles?.includes('EQUIPE_TECNICA');
        if (supportSession)
            return true;
        if (tenant.status !== 'ACTIVE' && tenant.status !== 'TRIAL') {
            throw new common_1.ForbiddenException('Esta organização não está disponível.');
        }
        if (!tenant.features.includes(flag)) {
            throw new common_1.ForbiddenException(`Módulo '${flag}' não está habilitado para esta organização.`);
        }
        const definition = (0, featureCatalog_1.getFeatureDefinition)(flag);
        const missingDependencies = (definition?.requires ?? []).filter((required) => !tenant.features.includes(required));
        if (missingDependencies.length > 0) {
            throw new common_1.ForbiddenException(`Módulo '${flag}' requer: ${missingDependencies.join(', ')}.`);
        }
        return true;
    }
};
exports.FeatureFlagGuard = FeatureFlagGuard;
exports.FeatureFlagGuard = FeatureFlagGuard = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [core_1.Reflector])
], FeatureFlagGuard);
