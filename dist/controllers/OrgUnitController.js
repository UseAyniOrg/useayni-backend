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
exports.MandateController = exports.PositionController = exports.OrgUnitController = exports.OrgUnitTypeController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const authorization_guard_1 = require("../middlewares/authorization.guard");
const requireFeature_decorator_1 = require("../middlewares/requireFeature.decorator");
const permissionMiddleware_1 = require("../middlewares/permissionMiddleware");
const OrgUnitService_1 = require("../services/OrgUnitService");
// ─── OrgUnit Types ─────────────────────────────────────────────────────────────
let OrgUnitTypeController = class OrgUnitTypeController {
    constructor(service) {
        this.service = service;
    }
    list(req) {
        const orgId = req.tenant.organization_id;
        return this.service.listTypes(orgId);
    }
    create(body, req) {
        return this.service.createType({ ...body, organization_id: req.tenant.organization_id }, req.user.id);
    }
    update(id, body, req) {
        return this.service.updateType(id, req.tenant.organization_id, body, req.user.id);
    }
    remove(id, req) {
        return this.service.deleteType(id, req.tenant.organization_id, req.user.id);
    }
};
exports.OrgUnitTypeController = OrgUnitTypeController;
__decorate([
    (0, common_1.Get)(),
    (0, swagger_1.ApiOperation)({ summary: 'List hierarchy types for the current organization' }),
    __param(0, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], OrgUnitTypeController.prototype, "list", null);
__decorate([
    (0, common_1.Post)(),
    (0, common_1.HttpCode)(common_1.HttpStatus.CREATED),
    (0, swagger_1.ApiOperation)({ summary: 'Create a new hierarchy type' }),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", void 0)
], OrgUnitTypeController.prototype, "create", null);
__decorate([
    (0, common_1.Patch)(':id'),
    (0, swagger_1.ApiOperation)({ summary: 'Update hierarchy type' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, Object]),
    __metadata("design:returntype", void 0)
], OrgUnitTypeController.prototype, "update", null);
__decorate([
    (0, common_1.Delete)(':id'),
    (0, common_1.HttpCode)(common_1.HttpStatus.NO_CONTENT),
    (0, swagger_1.ApiOperation)({ summary: 'Delete hierarchy type' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], OrgUnitTypeController.prototype, "remove", null);
exports.OrgUnitTypeController = OrgUnitTypeController = __decorate([
    (0, common_1.Controller)('org/types'),
    (0, swagger_1.ApiTags)('Org Unit Types'),
    (0, common_1.UseGuards)(authorization_guard_1.AuthorizationGuard, requireFeature_decorator_1.FeatureFlagGuard),
    (0, requireFeature_decorator_1.RequireFeature)('hierarchy'),
    (0, permissionMiddleware_1.Roles)('organization.admin', 'organization.manage'),
    (0, swagger_1.ApiBearerAuth)(),
    __metadata("design:paramtypes", [OrgUnitService_1.OrgUnitService])
], OrgUnitTypeController);
// ─── OrgUnits ──────────────────────────────────────────────────────────────────
let OrgUnitController = class OrgUnitController {
    constructor(service) {
        this.service = service;
    }
    getTree(req) {
        return this.service.getTree(req.tenant.organization_id);
    }
    list(req) {
        return this.service.listAll(req.tenant.organization_id);
    }
    findOne(id, req) {
        return this.service.findById(id, req.tenant.organization_id);
    }
    create(body, req) {
        return this.service.create({ ...body, organization_id: req.tenant.organization_id }, req.user.id);
    }
    update(id, body, req) {
        return this.service.update(id, req.tenant.organization_id, body, req.user.id);
    }
    remove(id, req) {
        return this.service.remove(id, req.tenant.organization_id, req.user.id);
    }
    // ─── Mandates within a unit ────────────────────────────────────────────────
    listMandates(id, req) {
        return this.service.listMandatesByUnit(id, req.tenant.organization_id);
    }
};
exports.OrgUnitController = OrgUnitController;
__decorate([
    (0, common_1.Get)('tree'),
    (0, swagger_1.ApiOperation)({ summary: 'Get full hierarchy tree' }),
    __param(0, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], OrgUnitController.prototype, "getTree", null);
__decorate([
    (0, common_1.Get)(),
    (0, swagger_1.ApiOperation)({ summary: 'List all org units (flat)' }),
    __param(0, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], OrgUnitController.prototype, "list", null);
__decorate([
    (0, common_1.Get)(':id'),
    (0, swagger_1.ApiOperation)({ summary: 'Get org unit by ID' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], OrgUnitController.prototype, "findOne", null);
__decorate([
    (0, common_1.Post)(),
    (0, common_1.HttpCode)(common_1.HttpStatus.CREATED),
    (0, swagger_1.ApiOperation)({ summary: 'Create org unit' }),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", void 0)
], OrgUnitController.prototype, "create", null);
__decorate([
    (0, common_1.Patch)(':id'),
    (0, swagger_1.ApiOperation)({ summary: 'Update org unit' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, Object]),
    __metadata("design:returntype", void 0)
], OrgUnitController.prototype, "update", null);
__decorate([
    (0, common_1.Delete)(':id'),
    (0, common_1.HttpCode)(common_1.HttpStatus.NO_CONTENT),
    (0, swagger_1.ApiOperation)({ summary: 'Soft-delete org unit' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], OrgUnitController.prototype, "remove", null);
__decorate([
    (0, common_1.Get)(':id/mandates'),
    (0, swagger_1.ApiOperation)({ summary: 'List mandates for a unit' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], OrgUnitController.prototype, "listMandates", null);
exports.OrgUnitController = OrgUnitController = __decorate([
    (0, common_1.Controller)('org/units'),
    (0, swagger_1.ApiTags)('Org Units'),
    (0, common_1.UseGuards)(authorization_guard_1.AuthorizationGuard, requireFeature_decorator_1.FeatureFlagGuard),
    (0, requireFeature_decorator_1.RequireFeature)('hierarchy'),
    (0, permissionMiddleware_1.Roles)('organization.admin', 'organization.manage'),
    (0, swagger_1.ApiBearerAuth)(),
    __metadata("design:paramtypes", [OrgUnitService_1.OrgUnitService])
], OrgUnitController);
// ─── Positions ─────────────────────────────────────────────────────────────────
let PositionController = class PositionController {
    constructor(service) {
        this.service = service;
    }
    list(req) {
        return this.service.listPositions(req.tenant.organization_id);
    }
    findOne(id, req) {
        return this.service.findPositionById(id, req.tenant.organization_id);
    }
    create(body, req) {
        return this.service.createPosition({ ...body, organization_id: req.tenant.organization_id }, req.user.id);
    }
    update(id, body, req) {
        return this.service.updatePosition(id, req.tenant.organization_id, body, req.user.id);
    }
    remove(id, req) {
        return this.service.removePosition(id, req.tenant.organization_id, req.user.id);
    }
};
exports.PositionController = PositionController;
__decorate([
    (0, common_1.Get)(),
    (0, swagger_1.ApiOperation)({ summary: 'List all positions for the organization' }),
    __param(0, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], PositionController.prototype, "list", null);
__decorate([
    (0, common_1.Get)(':id'),
    (0, swagger_1.ApiOperation)({ summary: 'Get position by ID' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], PositionController.prototype, "findOne", null);
__decorate([
    (0, common_1.Post)(),
    (0, common_1.HttpCode)(common_1.HttpStatus.CREATED),
    (0, swagger_1.ApiOperation)({ summary: 'Create position' }),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", void 0)
], PositionController.prototype, "create", null);
__decorate([
    (0, common_1.Patch)(':id'),
    (0, swagger_1.ApiOperation)({ summary: 'Update position' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, Object]),
    __metadata("design:returntype", void 0)
], PositionController.prototype, "update", null);
__decorate([
    (0, common_1.Delete)(':id'),
    (0, common_1.HttpCode)(common_1.HttpStatus.NO_CONTENT),
    (0, swagger_1.ApiOperation)({ summary: 'Delete position' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], PositionController.prototype, "remove", null);
exports.PositionController = PositionController = __decorate([
    (0, common_1.Controller)('org/positions'),
    (0, swagger_1.ApiTags)('Positions (Cargos)'),
    (0, common_1.UseGuards)(authorization_guard_1.AuthorizationGuard, requireFeature_decorator_1.FeatureFlagGuard),
    (0, requireFeature_decorator_1.RequireFeature)('hierarchy'),
    (0, permissionMiddleware_1.Roles)('organization.admin', 'organization.manage'),
    (0, swagger_1.ApiBearerAuth)(),
    __metadata("design:paramtypes", [OrgUnitService_1.OrgUnitService])
], PositionController);
// ─── Mandates ──────────────────────────────────────────────────────────────────
let MandateController = class MandateController {
    constructor(service) {
        this.service = service;
    }
    list(req) {
        return this.service.listMandates(req.tenant.organization_id);
    }
    create(body, req) {
        return this.service.createMandate({
            ...body,
            organization_id: req.tenant.organization_id,
            start_date: new Date(body.start_date),
            end_date: body.end_date ? new Date(body.end_date) : undefined,
        }, req.user.id);
    }
    close(id, req) {
        return this.service.closeMandate(id, req.tenant.organization_id, req.user.id, false);
    }
    revoke(id, req) {
        return this.service.closeMandate(id, req.tenant.organization_id, req.user.id, true);
    }
    forMember(memberId, req) {
        return this.service.getActiveMandatesForMember(memberId, req.tenant.organization_id);
    }
};
exports.MandateController = MandateController;
__decorate([
    (0, common_1.Get)(),
    (0, swagger_1.ApiOperation)({ summary: 'List all mandates for the organization' }),
    __param(0, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], MandateController.prototype, "list", null);
__decorate([
    (0, common_1.Post)(),
    (0, common_1.HttpCode)(common_1.HttpStatus.CREATED),
    (0, swagger_1.ApiOperation)({ summary: 'Create mandate (assign member to position in a unit)' }),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", void 0)
], MandateController.prototype, "create", null);
__decorate([
    (0, common_1.Patch)(':id/close'),
    (0, swagger_1.ApiOperation)({ summary: 'Close mandate' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], MandateController.prototype, "close", null);
__decorate([
    (0, common_1.Patch)(':id/revoke'),
    (0, swagger_1.ApiOperation)({ summary: 'Revoke mandate' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], MandateController.prototype, "revoke", null);
__decorate([
    (0, common_1.Get)('member/:memberId'),
    (0, swagger_1.ApiOperation)({ summary: 'Get active mandates for a member' }),
    __param(0, (0, common_1.Param)('memberId')),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], MandateController.prototype, "forMember", null);
exports.MandateController = MandateController = __decorate([
    (0, common_1.Controller)('org/mandates'),
    (0, swagger_1.ApiTags)('Mandates'),
    (0, common_1.UseGuards)(authorization_guard_1.AuthorizationGuard, requireFeature_decorator_1.FeatureFlagGuard),
    (0, requireFeature_decorator_1.RequireFeature)('hierarchy'),
    (0, permissionMiddleware_1.Roles)('organization.admin', 'organization.manage'),
    (0, swagger_1.ApiBearerAuth)(),
    __metadata("design:paramtypes", [OrgUnitService_1.OrgUnitService])
], MandateController);
