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
exports.PublicMediaController = exports.MediaAssetController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const MediaAssetService_1 = require("../services/MediaAssetService");
const authorization_guard_1 = require("../middlewares/authorization.guard");
const requireFeature_decorator_1 = require("../middlewares/requireFeature.decorator");
const permissionMiddleware_1 = require("../middlewares/permissionMiddleware");
let MediaAssetController = class MediaAssetController {
    constructor(mediaService) {
        this.mediaService = mediaService;
    }
    createUpload(body, request) {
        return this.mediaService.createUpload(request.tenant.organization_id, request.user.id, body, request.user.account_id);
    }
    uploadContent(id, request) {
        return this.mediaService.uploadContent(request.tenant.organization_id, id, request.body, request.headers['content-type'] ?? '', request.user.id, request.user.account_id);
    }
    confirmUpload(id, request) {
        return this.mediaService.confirmUpload(request.tenant.organization_id, id);
    }
    getPrivateReadUrl(id, request) {
        return this.mediaService.getPrivateReadUrl(request.tenant.organization_id, id);
    }
    async remove(id, request) {
        await this.mediaService.remove(request.tenant.organization_id, id);
    }
};
exports.MediaAssetController = MediaAssetController;
__decorate([
    (0, common_1.Post)('uploads'),
    (0, common_1.HttpCode)(common_1.HttpStatus.CREATED),
    (0, swagger_1.ApiOperation)({ summary: 'Reserve an authenticated media upload' }),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", void 0)
], MediaAssetController.prototype, "createUpload", null);
__decorate([
    (0, common_1.Put)('uploads/:id/content'),
    (0, swagger_1.ApiOperation)({ summary: 'Upload media content through the authenticated API' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], MediaAssetController.prototype, "uploadContent", null);
__decorate([
    (0, common_1.Post)(':id/confirm'),
    (0, permissionMiddleware_1.Roles)('organization.admin', 'organization.manage'),
    (0, swagger_1.ApiOperation)({ summary: 'Verify uploaded object and activate its media asset' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], MediaAssetController.prototype, "confirmUpload", null);
__decorate([
    (0, common_1.Get)(':id/url'),
    (0, swagger_1.ApiOperation)({ summary: 'Create a short-lived private read URL' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], MediaAssetController.prototype, "getPrivateReadUrl", null);
__decorate([
    (0, common_1.Delete)(':id'),
    (0, common_1.HttpCode)(common_1.HttpStatus.NO_CONTENT),
    (0, permissionMiddleware_1.Roles)('organization.admin'),
    (0, swagger_1.ApiOperation)({ summary: 'Remove a media asset from this organization' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], MediaAssetController.prototype, "remove", null);
exports.MediaAssetController = MediaAssetController = __decorate([
    (0, common_1.Controller)('media'),
    (0, swagger_1.ApiTags)('Media storage'),
    (0, common_1.UseGuards)(authorization_guard_1.AuthorizationGuard, requireFeature_decorator_1.FeatureFlagGuard),
    (0, requireFeature_decorator_1.RequireFeature)('media_storage'),
    (0, swagger_1.ApiBearerAuth)(),
    __metadata("design:paramtypes", [MediaAssetService_1.MediaAssetService])
], MediaAssetController);
let PublicMediaController = class PublicMediaController {
    constructor(mediaService) {
        this.mediaService = mediaService;
    }
    getPublicReadUrl(id, request) {
        if (!request.tenant) {
            throw new common_1.ForbiddenException('Organização não identificada.');
        }
        return this.mediaService.getPublicReadUrl(request.tenant.organization_id, id);
    }
};
exports.PublicMediaController = PublicMediaController;
__decorate([
    (0, common_1.Get)(':id/url'),
    (0, swagger_1.ApiOperation)({ summary: 'Create a short-lived URL for media referenced by public content' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], PublicMediaController.prototype, "getPublicReadUrl", null);
exports.PublicMediaController = PublicMediaController = __decorate([
    (0, common_1.Controller)('public/media'),
    (0, swagger_1.ApiTags)('Public media'),
    (0, common_1.UseGuards)(requireFeature_decorator_1.FeatureFlagGuard),
    (0, requireFeature_decorator_1.RequireFeature)('media_storage'),
    __metadata("design:paramtypes", [MediaAssetService_1.MediaAssetService])
], PublicMediaController);
