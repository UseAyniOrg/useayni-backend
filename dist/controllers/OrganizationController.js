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
exports.OrganizationController = exports.TenantPublicController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const db_1 = require("../db");
const memberCustomField_1 = require("../models/memberCustomField");
const authorization_guard_1 = require("../middlewares/authorization.guard");
const permissionMiddleware_1 = require("../middlewares/permissionMiddleware");
const OrganizationService_1 = require("../services/OrganizationService");
const authService_1 = require("../services/authService");
const HierarchyTemplateService_1 = require("../services/HierarchyTemplateService");
const organization_dto_1 = require("../dto/organization/organization.dto");
/** Public endpoint — returns tenant info for the frontend TenantProvider */
let TenantPublicController = class TenantPublicController {
    constructor(orgService) {
        this.orgService = orgService;
    }
    getTenantInfo(slug) {
        return this.orgService.getTenantInfo(slug);
    }
};
exports.TenantPublicController = TenantPublicController;
__decorate([
    (0, common_1.Get)(':slug'),
    (0, swagger_1.ApiOperation)({ summary: 'Get public tenant info by slug' }),
    __param(0, (0, common_1.Param)('slug')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], TenantPublicController.prototype, "getTenantInfo", null);
exports.TenantPublicController = TenantPublicController = __decorate([
    (0, common_1.Controller)('public/tenant'),
    (0, swagger_1.ApiTags)('Tenant (public)'),
    __metadata("design:paramtypes", [OrganizationService_1.OrganizationService])
], TenantPublicController);
/** Super-admin only — full org management */
let OrganizationController = class OrganizationController {
    constructor(orgService, authService, hierarchyTemplates) {
        this.orgService = orgService;
        this.authService = authService;
        this.hierarchyTemplates = hierarchyTemplates;
    }
    findAll() {
        return this.orgService.findAll();
    }
    getPlans() {
        return this.orgService.getPlans();
    }
    getFeatureCatalog() {
        return this.orgService.getFeatureCatalog();
    }
    getHierarchyTemplates() {
        return this.hierarchyTemplates.list();
    }
    importHierarchy(id, body, req) {
        return this.hierarchyTemplates.import(id, body, req.user.account_id ?? req.user.id);
    }
    findOne(id) {
        return this.orgService.findById(id);
    }
    create(dto, req) {
        return this.orgService.create(dto, req.user.id, req.user.account_id);
    }
    update(id, dto, req) {
        return this.orgService.update(id, dto, req.user.id, req.user.account_id);
    }
    remove(id, req) {
        return this.orgService.remove(id, req.user.id, req.user.account_id);
    }
    // ─── Feature flags ────────────────────────────────────────────────────────
    getFeatures(id) {
        return this.orgService.getFeatures(id);
    }
    listRegistrationFields(organizationId) {
        return db_1.AppDataBase.getRepository(memberCustomField_1.MemberCustomFieldDefinition).find({
            where: { organization_id: organizationId },
            order: { position: 'ASC' },
        });
    }
    async createRegistrationField(organizationId, body) {
        this.validateRegistrationField(body);
        const repo = db_1.AppDataBase.getRepository(memberCustomField_1.MemberCustomFieldDefinition);
        if (await repo.findOneBy({ organization_id: organizationId, field_key: body.field_key })) {
            throw new common_1.BadRequestException('Já existe um campo com esta chave.');
        }
        return repo.save(repo.create({ ...body, organization_id: organizationId }));
    }
    async updateRegistrationField(organizationId, fieldKey, body) {
        if (body.label !== undefined && !body.label.trim())
            throw new common_1.BadRequestException('Informe o nome do campo.');
        if (body.field_type !== undefined && !this.isRegistrationFieldType(body.field_type)) {
            throw new common_1.BadRequestException('Tipo de campo inválido.');
        }
        const repo = db_1.AppDataBase.getRepository(memberCustomField_1.MemberCustomFieldDefinition);
        const field = await repo.findOneBy({ organization_id: organizationId, field_key: fieldKey });
        if (!field)
            throw new common_1.NotFoundException('Campo de cadastro não encontrado.');
        Object.assign(field, body);
        return repo.save(field);
    }
    async deleteRegistrationField(organizationId, fieldKey) {
        await db_1.AppDataBase.getRepository(memberCustomField_1.MemberCustomFieldDefinition).delete({
            organization_id: organizationId,
            field_key: fieldKey,
        });
    }
    isRegistrationFieldType(value) {
        return ['text', 'number', 'date', 'select', 'checkbox', 'file'].includes(value);
    }
    validateRegistrationField(body) {
        if (!/^[a-z][a-z0-9_]{1,99}$/.test(body.field_key) || !body.label.trim()) {
            throw new common_1.BadRequestException('Informe uma chave válida e o nome do campo.');
        }
        if (!this.isRegistrationFieldType(body.field_type)) {
            throw new common_1.BadRequestException('Tipo de campo inválido.');
        }
        if (body.options && (!Array.isArray(body.options) || body.options.some((option) => typeof option !== 'string'))) {
            throw new common_1.BadRequestException('As opções do campo são inválidas.');
        }
    }
    getAuditHistory(id) {
        return this.orgService.getAuditHistory(id);
    }
    setFeature(id, dto, req) {
        return this.orgService.setFeature(id, dto.feature_slug, dto.enabled, dto.config, req.user.id, req.user.account_id);
    }
    grantAdmin(id, body, req) {
        return this.orgService.grantAdmin(id, body.email, req.user.id, req.user.account_id);
    }
    issueAdminAccess(id, body, req) {
        return this.orgService.issueAdminAccess(id, body.email, req.user.id, req.user.account_id);
    }
    importMembers(id, body, req) {
        return this.orgService.importMembers(id, body.emails, req.user.id, req.user.account_id);
    }
    issueMemberAccess(id, body, req) {
        return this.orgService.issueMemberAccess(id, body.email, req.user.id, req.user.account_id);
    }
    startSupportAccess(id, body, req) {
        return this.authService.startSupportAccess(id, req.user.id, req.user.account_id, body.reason);
    }
};
exports.OrganizationController = OrganizationController;
__decorate([
    (0, common_1.Get)(),
    (0, swagger_1.ApiOperation)({ summary: 'List all organizations (super admin)' }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], OrganizationController.prototype, "findAll", null);
__decorate([
    (0, common_1.Get)('plans'),
    (0, swagger_1.ApiOperation)({ summary: 'List available plans' }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], OrganizationController.prototype, "getPlans", null);
__decorate([
    (0, common_1.Get)('feature-catalog'),
    (0, swagger_1.ApiOperation)({ summary: 'List feature flags and implementation availability' }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], OrganizationController.prototype, "getFeatureCatalog", null);
__decorate([
    (0, common_1.Get)('hierarchy-templates'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], OrganizationController.prototype, "getHierarchyTemplates", null);
__decorate([
    (0, common_1.Post)(':id/hierarchy/import'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, Object]),
    __metadata("design:returntype", void 0)
], OrganizationController.prototype, "importHierarchy", null);
__decorate([
    (0, common_1.Get)(':id'),
    (0, swagger_1.ApiOperation)({ summary: 'Get organization by ID' }),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], OrganizationController.prototype, "findOne", null);
__decorate([
    (0, common_1.Post)(),
    (0, common_1.HttpCode)(common_1.HttpStatus.CREATED),
    (0, swagger_1.ApiOperation)({ summary: 'Create organization' }),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [organization_dto_1.CreateOrganizationDto, Object]),
    __metadata("design:returntype", void 0)
], OrganizationController.prototype, "create", null);
__decorate([
    (0, common_1.Patch)(':id'),
    (0, swagger_1.ApiOperation)({ summary: 'Update organization' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, organization_dto_1.UpdateOrganizationDto, Object]),
    __metadata("design:returntype", void 0)
], OrganizationController.prototype, "update", null);
__decorate([
    (0, common_1.Delete)(':id'),
    (0, common_1.HttpCode)(common_1.HttpStatus.NO_CONTENT),
    (0, swagger_1.ApiOperation)({ summary: 'Soft-delete organization' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], OrganizationController.prototype, "remove", null);
__decorate([
    (0, common_1.Get)(':id/features'),
    (0, swagger_1.ApiOperation)({ summary: 'List all features for an organization' }),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], OrganizationController.prototype, "getFeatures", null);
__decorate([
    (0, common_1.Get)(':id/registration-fields'),
    (0, swagger_1.ApiOperation)({ summary: 'List registration fields for an organization' }),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], OrganizationController.prototype, "listRegistrationFields", null);
__decorate([
    (0, common_1.Post)(':id/registration-fields'),
    (0, common_1.HttpCode)(common_1.HttpStatus.CREATED),
    (0, swagger_1.ApiOperation)({ summary: 'Create an organization registration field' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], OrganizationController.prototype, "createRegistrationField", null);
__decorate([
    (0, common_1.Patch)(':id/registration-fields/:fieldKey'),
    (0, swagger_1.ApiOperation)({ summary: 'Update an organization registration field' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Param)('fieldKey')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, Object]),
    __metadata("design:returntype", Promise)
], OrganizationController.prototype, "updateRegistrationField", null);
__decorate([
    (0, common_1.Delete)(':id/registration-fields/:fieldKey'),
    (0, common_1.HttpCode)(common_1.HttpStatus.NO_CONTENT),
    (0, swagger_1.ApiOperation)({ summary: 'Delete an organization registration field' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Param)('fieldKey')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], OrganizationController.prototype, "deleteRegistrationField", null);
__decorate([
    (0, common_1.Get)(':id/audit'),
    (0, swagger_1.ApiOperation)({ summary: 'List recent organization changes' }),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], OrganizationController.prototype, "getAuditHistory", null);
__decorate([
    (0, common_1.Patch)(':id/features'),
    (0, swagger_1.ApiOperation)({ summary: 'Enable or disable a feature flag' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, organization_dto_1.UpsertFeatureDto, Object]),
    __metadata("design:returntype", void 0)
], OrganizationController.prototype, "setFeature", null);
__decorate([
    (0, common_1.Post)(':id/admins'),
    (0, common_1.HttpCode)(common_1.HttpStatus.CREATED),
    (0, swagger_1.ApiOperation)({ summary: 'Grant organization administrator to an approved member' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, Object]),
    __metadata("design:returntype", void 0)
], OrganizationController.prototype, "grantAdmin", null);
__decorate([
    (0, common_1.Post)(':id/admin-access'),
    (0, common_1.HttpCode)(common_1.HttpStatus.CREATED),
    (0, swagger_1.ApiOperation)({ summary: 'Provision an organization admin with a one-time password when needed' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, Object]),
    __metadata("design:returntype", void 0)
], OrganizationController.prototype, "issueAdminAccess", null);
__decorate([
    (0, common_1.Post)(':id/members/import'),
    (0, common_1.HttpCode)(common_1.HttpStatus.CREATED),
    (0, swagger_1.ApiOperation)({ summary: 'Import organization members by email; new accounts receive a one-time password' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, Object]),
    __metadata("design:returntype", void 0)
], OrganizationController.prototype, "importMembers", null);
__decorate([
    (0, common_1.Post)(':id/member-access'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, Object]),
    __metadata("design:returntype", void 0)
], OrganizationController.prototype, "issueMemberAccess", null);
__decorate([
    (0, common_1.Post)(':id/support-access'),
    (0, common_1.HttpCode)(common_1.HttpStatus.CREATED),
    (0, swagger_1.ApiOperation)({ summary: 'Start an audited, temporary support session for an organization' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, Object]),
    __metadata("design:returntype", void 0)
], OrganizationController.prototype, "startSupportAccess", null);
exports.OrganizationController = OrganizationController = __decorate([
    (0, common_1.Controller)('organizations'),
    (0, swagger_1.ApiTags)('Organizations'),
    (0, common_1.UseGuards)(authorization_guard_1.AuthorizationGuard),
    (0, permissionMiddleware_1.Roles)('EQUIPE_TECNICA'),
    (0, swagger_1.ApiBearerAuth)(),
    __metadata("design:paramtypes", [OrganizationService_1.OrganizationService,
        authService_1.AuthService,
        HierarchyTemplateService_1.HierarchyTemplateService])
], OrganizationController);
