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
exports.ExternalProfile = void 0;
const typeorm_1 = require("typeorm");
const miscellaneous_1 = require("./miscellaneous");
let ExternalProfile = class ExternalProfile {
};
exports.ExternalProfile = ExternalProfile;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)('uuid'),
    __metadata("design:type", String)
], ExternalProfile.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 255 }),
    __metadata("design:type", String)
], ExternalProfile.prototype, "name", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 255, unique: true }),
    __metadata("design:type", String)
], ExternalProfile.prototype, "email", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 255, nullable: true }),
    __metadata("design:type", String)
], ExternalProfile.prototype, "institution", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 255, nullable: true }),
    __metadata("design:type", String)
], ExternalProfile.prototype, "course", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 100, nullable: true }),
    __metadata("design:type", String)
], ExternalProfile.prototype, "city", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 2, nullable: true }),
    __metadata("design:type", String)
], ExternalProfile.prototype, "state", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'uuid' }),
    __metadata("design:type", String)
], ExternalProfile.prototype, "miscellaneous_id", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => miscellaneous_1.Miscellaneous),
    (0, typeorm_1.JoinColumn)({ name: 'miscellaneous_id' }),
    __metadata("design:type", miscellaneous_1.Miscellaneous)
], ExternalProfile.prototype, "miscellaneous", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)({ type: 'timestamptz' }),
    __metadata("design:type", Date)
], ExternalProfile.prototype, "created_at", void 0);
exports.ExternalProfile = ExternalProfile = __decorate([
    (0, typeorm_1.Entity)('external_profiles')
], ExternalProfile);
