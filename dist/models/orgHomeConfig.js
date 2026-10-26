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
exports.OrgHomeConfig = exports.OrgHomeStatus = void 0;
const typeorm_1 = require("typeorm");
var OrgHomeStatus;
(function (OrgHomeStatus) {
    OrgHomeStatus["DRAFT"] = "DRAFT";
    OrgHomeStatus["PUBLISHED"] = "PUBLISHED";
})(OrgHomeStatus || (exports.OrgHomeStatus = OrgHomeStatus = {}));
let OrgHomeConfig = class OrgHomeConfig {
};
exports.OrgHomeConfig = OrgHomeConfig;
__decorate([
    (0, typeorm_1.PrimaryColumn)({ type: 'uuid' }),
    __metadata("design:type", String)
], OrgHomeConfig.prototype, "organization_id", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 20, default: OrgHomeStatus.DRAFT }),
    __metadata("design:type", String)
], OrgHomeConfig.prototype, "status", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'jsonb', default: {} }),
    __metadata("design:type", Object)
], OrgHomeConfig.prototype, "theme", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'jsonb', default: {} }),
    __metadata("design:type", Object)
], OrgHomeConfig.prototype, "seo", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'jsonb', default: {} }),
    __metadata("design:type", Object)
], OrgHomeConfig.prototype, "social_links", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'jsonb', default: {} }),
    __metadata("design:type", Object)
], OrgHomeConfig.prototype, "contact", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'timestamptz', nullable: true }),
    __metadata("design:type", Object)
], OrgHomeConfig.prototype, "published_at", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'uuid', nullable: true }),
    __metadata("design:type", Object)
], OrgHomeConfig.prototype, "updated_by", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)({ type: 'timestamptz' }),
    __metadata("design:type", Date)
], OrgHomeConfig.prototype, "created_at", void 0);
__decorate([
    (0, typeorm_1.UpdateDateColumn)({ type: 'timestamptz' }),
    __metadata("design:type", Date)
], OrgHomeConfig.prototype, "updated_at", void 0);
exports.OrgHomeConfig = OrgHomeConfig = __decorate([
    (0, typeorm_1.Entity)('organization_home_configs'),
    (0, typeorm_1.Index)('organization_home_configs_status_idx', ['status'])
], OrgHomeConfig);
