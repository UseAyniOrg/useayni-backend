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
exports.MediaAsset = exports.MediaAssetVisibility = exports.MediaAssetStatus = void 0;
const typeorm_1 = require("typeorm");
var MediaAssetStatus;
(function (MediaAssetStatus) {
    MediaAssetStatus["PENDING"] = "PENDING";
    MediaAssetStatus["ACTIVE"] = "ACTIVE";
    MediaAssetStatus["PENDING_DELETION"] = "PENDING_DELETION";
})(MediaAssetStatus || (exports.MediaAssetStatus = MediaAssetStatus = {}));
var MediaAssetVisibility;
(function (MediaAssetVisibility) {
    MediaAssetVisibility["PUBLIC"] = "PUBLIC";
    MediaAssetVisibility["PRIVATE"] = "PRIVATE";
})(MediaAssetVisibility || (exports.MediaAssetVisibility = MediaAssetVisibility = {}));
let MediaAsset = class MediaAsset {
};
exports.MediaAsset = MediaAsset;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)('uuid'),
    __metadata("design:type", String)
], MediaAsset.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'uuid' }),
    __metadata("design:type", String)
], MediaAsset.prototype, "organization_id", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'text' }),
    __metadata("design:type", String)
], MediaAsset.prototype, "key", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 100 }),
    __metadata("design:type", String)
], MediaAsset.prototype, "mime_type", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'bigint' }),
    __metadata("design:type", String)
], MediaAsset.prototype, "size_bytes", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 50 }),
    __metadata("design:type", String)
], MediaAsset.prototype, "category", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 10, default: MediaAssetVisibility.PRIVATE }),
    __metadata("design:type", String)
], MediaAsset.prototype, "visibility", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'uuid' }),
    __metadata("design:type", Object)
], MediaAsset.prototype, "uploaded_by", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'uuid', nullable: true }),
    __metadata("design:type", Object)
], MediaAsset.prototype, "uploaded_by_account_id", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 30, default: MediaAssetStatus.PENDING }),
    __metadata("design:type", String)
], MediaAsset.prototype, "status", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)({ type: 'timestamptz' }),
    __metadata("design:type", Date)
], MediaAsset.prototype, "created_at", void 0);
exports.MediaAsset = MediaAsset = __decorate([
    (0, typeorm_1.Entity)('media_assets'),
    (0, typeorm_1.Index)('media_assets_org_status_idx', ['organization_id', 'status']),
    (0, typeorm_1.Index)('media_assets_key_idx', ['key'], { unique: true })
], MediaAsset);
