"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.MediaStorageModule = void 0;
const common_1 = require("@nestjs/common");
const MediaAssetController_1 = require("../controllers/MediaAssetController");
const MediaAssetService_1 = require("../services/MediaAssetService");
const authorization_guard_1 = require("../middlewares/authorization.guard");
const requireFeature_decorator_1 = require("../middlewares/requireFeature.decorator");
let MediaStorageModule = class MediaStorageModule {
};
exports.MediaStorageModule = MediaStorageModule;
exports.MediaStorageModule = MediaStorageModule = __decorate([
    (0, common_1.Module)({
        controllers: [MediaAssetController_1.MediaAssetController, MediaAssetController_1.PublicMediaController],
        providers: [MediaAssetService_1.MediaAssetService, authorization_guard_1.AuthorizationGuard, requireFeature_decorator_1.FeatureFlagGuard],
        exports: [MediaAssetService_1.MediaAssetService],
    })
], MediaStorageModule);
