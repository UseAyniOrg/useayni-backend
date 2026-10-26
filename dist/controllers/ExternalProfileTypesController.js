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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PlatformExternalProfileTypesController = exports.ExternalProfileTypesController = void 0;
const common_1 = require("@nestjs/common");
const authorization_guard_1 = require("../middlewares/authorization.guard");
const permissionMiddleware_1 = require("../middlewares/permissionMiddleware");
const ExternalProfileTypesService_1 = require("../services/ExternalProfileTypesService");
let ExternalProfileTypesController = class ExternalProfileTypesController {
    constructor(service) {
        this.service = service;
    }
    list(req) { return this.service.list(req.tenant.organization_id); }
    save(body, req) {
        return this.service.save(req.tenant.organization_id, body, req.user?.account_id);
    }
};
exports.ExternalProfileTypesController = ExternalProfileTypesController;
__decorate([
    (0, common_1.Get)(),
    __param(0, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], ExternalProfileTypesController.prototype, "list", null);
__decorate([
    (0, common_1.Put)(),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", void 0)
], ExternalProfileTypesController.prototype, "save", null);
exports.ExternalProfileTypesController = ExternalProfileTypesController = __decorate([
    (0, common_1.Controller)('org/external-profile-types'),
    (0, common_1.UseGuards)(authorization_guard_1.AuthorizationGuard),
    (0, permissionMiddleware_1.Roles)('organization.admin', 'organization.manage'),
    __metadata("design:paramtypes", [ExternalProfileTypesService_1.ExternalProfileTypesService])
], ExternalProfileTypesController);
let PlatformExternalProfileTypesController = class PlatformExternalProfileTypesController {
    constructor(service) {
        this.service = service;
    }
    list(id) { return this.service.list(id); }
    save(id, body, req) {
        return this.service.save(id, body, req.user?.account_id);
    }
};
exports.PlatformExternalProfileTypesController = PlatformExternalProfileTypesController;
__decorate([
    (0, common_1.Get)(),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], PlatformExternalProfileTypesController.prototype, "list", null);
__decorate([
    (0, common_1.Put)(),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, Object]),
    __metadata("design:returntype", void 0)
], PlatformExternalProfileTypesController.prototype, "save", null);
exports.PlatformExternalProfileTypesController = PlatformExternalProfileTypesController = __decorate([
    (0, common_1.Controller)('organizations/:id/external-profile-types'),
    (0, common_1.UseGuards)(authorization_guard_1.AuthorizationGuard),
    (0, permissionMiddleware_1.Roles)('EQUIPE_TECNICA'),
    __metadata("design:paramtypes", [ExternalProfileTypesService_1.ExternalProfileTypesService])
], PlatformExternalProfileTypesController);
