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
exports.OrgHomeAdminController = exports.PublicHomeMediaController = exports.PublicOrgHomeController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const class_validator_1 = require("class-validator");
const authorization_guard_1 = require("../middlewares/authorization.guard");
const OrgHomeService_1 = require("../services/OrgHomeService");
const MediaAssetService_1 = require("../services/MediaAssetService");
let PublicOrgHomeController = class PublicOrgHomeController {
    constructor(homeService) {
        this.homeService = homeService;
    }
    getPublishedHome(slug) {
        return this.homeService.getPublicHome(slug);
    }
};
exports.PublicOrgHomeController = PublicOrgHomeController;
__decorate([
    (0, common_1.Get)(':slug'),
    (0, common_1.Header)('Cache-Control', 'public, max-age=0, must-revalidate'),
    (0, swagger_1.ApiOperation)({ summary: 'Get published public home content by tenant slug' }),
    __param(0, (0, common_1.Param)('slug')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], PublicOrgHomeController.prototype, "getPublishedHome", null);
exports.PublicOrgHomeController = PublicOrgHomeController = __decorate([
    (0, common_1.Controller)('public/org-home'),
    (0, swagger_1.ApiTags)('Public organization home'),
    __metadata("design:paramtypes", [OrgHomeService_1.OrgHomeService])
], PublicOrgHomeController);
let PublicHomeMediaController = class PublicHomeMediaController {
    constructor(homeService) {
        this.homeService = homeService;
    }
    async getPublicAsset(id, response) {
        const asset = await this.homeService.getPublicAsset(id);
        response.set({
            'Cache-Control': 'public, max-age=31536000, immutable',
            'Content-Type': asset.mime_type,
            'Content-Length': String(asset.size_bytes),
            'X-Content-Type-Options': 'nosniff',
            'Content-Disposition': 'inline',
        });
        response.send(Buffer.from(asset.body));
    }
};
exports.PublicHomeMediaController = PublicHomeMediaController;
__decorate([
    (0, common_1.Get)(':id'),
    (0, swagger_1.ApiOperation)({ summary: 'Serve public immutable media assets without exposing R2 credentials' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Res)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], PublicHomeMediaController.prototype, "getPublicAsset", null);
exports.PublicHomeMediaController = PublicHomeMediaController = __decorate([
    (0, common_1.Controller)('m'),
    (0, swagger_1.ApiTags)('Public media'),
    __metadata("design:paramtypes", [OrgHomeService_1.OrgHomeService])
], PublicHomeMediaController);
let OrgHomeAdminController = class OrgHomeAdminController {
    constructor(homeService, mediaService) {
        this.homeService = homeService;
        this.mediaService = mediaService;
    }
    async getCurrent(request) {
        const organizationId = this.resolveOrganizationId(request);
        return this.homeService.getEditorConfig(organizationId);
    }
    async getSelected(organizationId, request) {
        const resolvedId = this.resolveOrganizationId(request, organizationId);
        return this.homeService.getEditorConfig(resolvedId);
    }
    async saveCurrent(body, request) {
        const organizationId = this.resolveOrganizationId(request);
        return this.homeService.saveDraft(organizationId, this.actorId(request), body);
    }
    async saveSelected(organizationId, body, request) {
        const resolvedId = this.resolveOrganizationId(request, organizationId);
        return this.homeService.saveDraft(resolvedId, this.actorId(request), body);
    }
    async publishCurrent(request) {
        const organizationId = this.resolveOrganizationId(request);
        return this.homeService.publish(organizationId, this.actorId(request));
    }
    async publishSelected(organizationId, request) {
        const resolvedId = this.resolveOrganizationId(request, organizationId);
        return this.homeService.publish(resolvedId, this.actorId(request));
    }
    async createSelectedHomeUpload(organizationId, body, request) {
        const resolvedId = this.resolveOrganizationId(request, organizationId);
        const isPlatformAdmin = request.user.roles.includes('EQUIPE_TECNICA') && !request.user.support_session_id;
        return this.mediaService.createUpload(resolvedId, isPlatformAdmin ? undefined : request.user.id, body, request.user.account_id);
    }
    async uploadSelectedHomeContent(organizationId, assetId, request) {
        const resolvedId = this.resolveOrganizationId(request, organizationId);
        return this.mediaService.uploadContent(resolvedId, assetId, request.body, request.headers['content-type'] ?? '', this.actorId(request), request.user.account_id);
    }
    async confirmSelectedHomeUpload(organizationId, assetId, request) {
        const resolvedId = this.resolveOrganizationId(request, organizationId);
        return this.mediaService.confirmUpload(resolvedId, assetId);
    }
    resolveOrganizationId(request, selectedId) {
        const user = request.user;
        const isSuperAdmin = user.roles.includes('EQUIPE_TECNICA');
        if (isSuperAdmin && user.support_session_id) {
            const supportOrganizationId = request.tenant?.organization_id;
            if (!supportOrganizationId || (selectedId && selectedId !== supportOrganizationId)) {
                throw new common_1.ForbiddenException('A sessão de suporte está limitada à organização selecionada.');
            }
            return supportOrganizationId;
        }
        if (isSuperAdmin) {
            if (!selectedId || !(0, class_validator_1.isUUID)(selectedId)) {
                throw new common_1.BadRequestException('O Super Admin deve selecionar uma organização válida.');
            }
            return selectedId;
        }
        const organizationId = request.tenant?.organization_id;
        const canEdit = user.roles.some((role) => ['organization.admin', 'organization.manage'].includes(role));
        if (!canEdit ||
            !organizationId ||
            user.organization_id !== organizationId ||
            (selectedId !== undefined && selectedId !== organizationId)) {
            throw new common_1.ForbiddenException('Você não pode editar a home desta organização.');
        }
        return organizationId;
    }
    actorId(request) {
        return request.user.account_id ?? request.user.id;
    }
};
exports.OrgHomeAdminController = OrgHomeAdminController;
__decorate([
    (0, common_1.Get)('admin'),
    (0, swagger_1.ApiOperation)({ summary: 'Load the current organization home editor configuration' }),
    __param(0, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], OrgHomeAdminController.prototype, "getCurrent", null);
__decorate([
    (0, common_1.Get)('admin/organizations/:organizationId'),
    (0, swagger_1.ApiOperation)({ summary: 'Load an organization home as platform super admin' }),
    __param(0, (0, common_1.Param)('organizationId')),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], OrgHomeAdminController.prototype, "getSelected", null);
__decorate([
    (0, common_1.Put)('admin'),
    (0, swagger_1.ApiOperation)({ summary: 'Save the current organization home as a draft' }),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], OrgHomeAdminController.prototype, "saveCurrent", null);
__decorate([
    (0, common_1.Put)('admin/organizations/:organizationId'),
    (0, swagger_1.ApiOperation)({ summary: 'Save an organization home as platform super admin' }),
    __param(0, (0, common_1.Param)('organizationId')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, Object]),
    __metadata("design:returntype", Promise)
], OrgHomeAdminController.prototype, "saveSelected", null);
__decorate([
    (0, common_1.Post)('admin/publish'),
    (0, swagger_1.ApiOperation)({ summary: 'Publish the current organization home and revalidate its cache' }),
    __param(0, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], OrgHomeAdminController.prototype, "publishCurrent", null);
__decorate([
    (0, common_1.Post)('admin/organizations/:organizationId/publish'),
    (0, swagger_1.ApiOperation)({ summary: 'Publish an organization home as platform super admin' }),
    __param(0, (0, common_1.Param)('organizationId')),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], OrgHomeAdminController.prototype, "publishSelected", null);
__decorate([
    (0, common_1.Post)('admin/organizations/:organizationId/media/uploads'),
    (0, swagger_1.ApiOperation)({ summary: 'Create a public home asset upload for a selected organization' }),
    __param(0, (0, common_1.Param)('organizationId')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, Object]),
    __metadata("design:returntype", Promise)
], OrgHomeAdminController.prototype, "createSelectedHomeUpload", null);
__decorate([
    (0, common_1.Put)('admin/organizations/:organizationId/media/:assetId/content'),
    (0, swagger_1.ApiOperation)({ summary: 'Upload selected organization media through the API' }),
    __param(0, (0, common_1.Param)('organizationId')),
    __param(1, (0, common_1.Param)('assetId')),
    __param(2, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, Object]),
    __metadata("design:returntype", Promise)
], OrgHomeAdminController.prototype, "uploadSelectedHomeContent", null);
__decorate([
    (0, common_1.Post)('admin/organizations/:organizationId/media/:assetId/confirm'),
    (0, swagger_1.ApiOperation)({ summary: 'Confirm a public home asset upload for a selected organization' }),
    __param(0, (0, common_1.Param)('organizationId')),
    __param(1, (0, common_1.Param)('assetId')),
    __param(2, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, Object]),
    __metadata("design:returntype", Promise)
], OrgHomeAdminController.prototype, "confirmSelectedHomeUpload", null);
exports.OrgHomeAdminController = OrgHomeAdminController = __decorate([
    (0, common_1.Controller)('org-home'),
    (0, common_1.UseGuards)(authorization_guard_1.AuthorizationGuard),
    (0, swagger_1.ApiTags)('Organization home editor'),
    (0, swagger_1.ApiBearerAuth)(),
    __metadata("design:paramtypes", [OrgHomeService_1.OrgHomeService,
        MediaAssetService_1.MediaAssetService])
], OrgHomeAdminController);
