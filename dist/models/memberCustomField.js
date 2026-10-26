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
exports.MemberCustomFieldValue = exports.MemberCustomFieldDefinition = void 0;
const typeorm_1 = require("typeorm");
const organization_1 = require("./organization");
const member_1 = require("./member");
let MemberCustomFieldDefinition = class MemberCustomFieldDefinition {
};
exports.MemberCustomFieldDefinition = MemberCustomFieldDefinition;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)('uuid'),
    __metadata("design:type", String)
], MemberCustomFieldDefinition.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'uuid' }),
    __metadata("design:type", String)
], MemberCustomFieldDefinition.prototype, "organization_id", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => organization_1.Organization),
    (0, typeorm_1.JoinColumn)({ name: 'organization_id' }),
    __metadata("design:type", organization_1.Organization)
], MemberCustomFieldDefinition.prototype, "organization", void 0);
__decorate([
    (0, typeorm_1.Column)({ length: 100 }),
    __metadata("design:type", String)
], MemberCustomFieldDefinition.prototype, "field_key", void 0);
__decorate([
    (0, typeorm_1.Column)({ length: 255 }),
    __metadata("design:type", String)
], MemberCustomFieldDefinition.prototype, "label", void 0);
__decorate([
    (0, typeorm_1.Column)({ length: 30, default: 'text' }),
    __metadata("design:type", String)
], MemberCustomFieldDefinition.prototype, "field_type", void 0);
__decorate([
    (0, typeorm_1.Column)({ default: false }),
    __metadata("design:type", Boolean)
], MemberCustomFieldDefinition.prototype, "required", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'jsonb', nullable: true }),
    __metadata("design:type", Object)
], MemberCustomFieldDefinition.prototype, "options", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'int', default: 0 }),
    __metadata("design:type", Number)
], MemberCustomFieldDefinition.prototype, "position", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)({ type: 'timestamptz' }),
    __metadata("design:type", Date)
], MemberCustomFieldDefinition.prototype, "created_at", void 0);
exports.MemberCustomFieldDefinition = MemberCustomFieldDefinition = __decorate([
    (0, typeorm_1.Entity)('member_custom_field_definitions')
], MemberCustomFieldDefinition);
let MemberCustomFieldValue = class MemberCustomFieldValue {
};
exports.MemberCustomFieldValue = MemberCustomFieldValue;
__decorate([
    (0, typeorm_1.PrimaryColumn)({ type: 'uuid' }),
    __metadata("design:type", String)
], MemberCustomFieldValue.prototype, "member_id", void 0);
__decorate([
    (0, typeorm_1.PrimaryColumn)({ length: 100 }),
    __metadata("design:type", String)
], MemberCustomFieldValue.prototype, "field_key", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => member_1.Member),
    (0, typeorm_1.JoinColumn)({ name: 'member_id' }),
    __metadata("design:type", member_1.Member)
], MemberCustomFieldValue.prototype, "member", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'text', nullable: true }),
    __metadata("design:type", String)
], MemberCustomFieldValue.prototype, "value", void 0);
exports.MemberCustomFieldValue = MemberCustomFieldValue = __decorate([
    (0, typeorm_1.Entity)('member_custom_field_values')
], MemberCustomFieldValue);
