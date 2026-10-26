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
exports.ExternalEventRegistration = void 0;
const typeorm_1 = require("typeorm");
const organization_1 = require("./organization");
const miscellaneous_1 = require("./miscellaneous");
const globalUserAccount_1 = require("./globalUserAccount");
const member_1 = require("./member");
let ExternalEventRegistration = class ExternalEventRegistration {
};
exports.ExternalEventRegistration = ExternalEventRegistration;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)('uuid'),
    __metadata("design:type", String)
], ExternalEventRegistration.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'uuid' }),
    __metadata("design:type", String)
], ExternalEventRegistration.prototype, "organization_id", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => organization_1.Organization),
    (0, typeorm_1.JoinColumn)({ name: 'organization_id' }),
    __metadata("design:type", organization_1.Organization)
], ExternalEventRegistration.prototype, "organization", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'uuid' }),
    __metadata("design:type", String)
], ExternalEventRegistration.prototype, "miscellaneous_id", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => miscellaneous_1.Miscellaneous),
    (0, typeorm_1.JoinColumn)({ name: 'miscellaneous_id' }),
    __metadata("design:type", miscellaneous_1.Miscellaneous)
], ExternalEventRegistration.prototype, "miscellaneous", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'uuid' }),
    __metadata("design:type", String)
], ExternalEventRegistration.prototype, "account_id", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => globalUserAccount_1.UserAccount),
    (0, typeorm_1.JoinColumn)({ name: 'account_id' }),
    __metadata("design:type", globalUserAccount_1.UserAccount)
], ExternalEventRegistration.prototype, "account", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'uuid' }),
    __metadata("design:type", String)
], ExternalEventRegistration.prototype, "member_id", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => member_1.Member),
    (0, typeorm_1.JoinColumn)({ name: 'member_id' }),
    __metadata("design:type", member_1.Member)
], ExternalEventRegistration.prototype, "member", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 20 }),
    __metadata("design:type", String)
], ExternalEventRegistration.prototype, "profile_type", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'jsonb', default: {} }),
    __metadata("design:type", Object)
], ExternalEventRegistration.prototype, "shared_profile", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'jsonb', default: {} }),
    __metadata("design:type", Object)
], ExternalEventRegistration.prototype, "registration_data", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'timestamptz' }),
    __metadata("design:type", Date)
], ExternalEventRegistration.prototype, "profile_consent_at", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 50 }),
    __metadata("design:type", String)
], ExternalEventRegistration.prototype, "profile_consent_version", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)({ type: 'timestamptz' }),
    __metadata("design:type", Date)
], ExternalEventRegistration.prototype, "created_at", void 0);
exports.ExternalEventRegistration = ExternalEventRegistration = __decorate([
    (0, typeorm_1.Entity)('external_event_registrations')
], ExternalEventRegistration);
