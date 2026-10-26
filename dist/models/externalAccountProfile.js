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
exports.ExternalAccountProfile = void 0;
const typeorm_1 = require("typeorm");
const globalUserAccount_1 = require("./globalUserAccount");
let ExternalAccountProfile = class ExternalAccountProfile {
};
exports.ExternalAccountProfile = ExternalAccountProfile;
__decorate([
    (0, typeorm_1.PrimaryColumn)({ type: 'uuid' }),
    __metadata("design:type", String)
], ExternalAccountProfile.prototype, "account_id", void 0);
__decorate([
    (0, typeorm_1.OneToOne)(() => globalUserAccount_1.UserAccount),
    (0, typeorm_1.JoinColumn)({ name: 'account_id' }),
    __metadata("design:type", globalUserAccount_1.UserAccount)
], ExternalAccountProfile.prototype, "account", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 255 }),
    __metadata("design:type", String)
], ExternalAccountProfile.prototype, "display_name", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 20, default: 'basic' }),
    __metadata("design:type", String)
], ExternalAccountProfile.prototype, "profile_type", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 20, nullable: true }),
    __metadata("design:type", Object)
], ExternalAccountProfile.prototype, "phone", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'jsonb', default: {} }),
    __metadata("design:type", Object)
], ExternalAccountProfile.prototype, "academic_data", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'jsonb', default: {} }),
    __metadata("design:type", Object)
], ExternalAccountProfile.prototype, "additional_attributes", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)({ type: 'timestamptz' }),
    __metadata("design:type", Date)
], ExternalAccountProfile.prototype, "created_at", void 0);
__decorate([
    (0, typeorm_1.UpdateDateColumn)({ type: 'timestamptz' }),
    __metadata("design:type", Date)
], ExternalAccountProfile.prototype, "updated_at", void 0);
exports.ExternalAccountProfile = ExternalAccountProfile = __decorate([
    (0, typeorm_1.Entity)('external_account_profiles')
], ExternalAccountProfile);
