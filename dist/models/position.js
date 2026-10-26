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
exports.Position = exports.InvestitureType = void 0;
const typeorm_1 = require("typeorm");
const organization_1 = require("./organization");
const orgUnitType_1 = require("./orgUnitType");
const role_1 = require("./role");
var InvestitureType;
(function (InvestitureType) {
    InvestitureType["ELECTION"] = "ELECTION";
    InvestitureType["APPOINTMENT"] = "APPOINTMENT";
    InvestitureType["AUTOMATIC"] = "AUTOMATIC";
})(InvestitureType || (exports.InvestitureType = InvestitureType = {}));
let Position = class Position {
};
exports.Position = Position;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)('uuid'),
    __metadata("design:type", String)
], Position.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'uuid' }),
    __metadata("design:type", String)
], Position.prototype, "organization_id", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => organization_1.Organization),
    (0, typeorm_1.JoinColumn)({ name: 'organization_id' }),
    __metadata("design:type", organization_1.Organization)
], Position.prototype, "organization", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'uuid' }),
    __metadata("design:type", String)
], Position.prototype, "org_unit_type_id", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => orgUnitType_1.OrgUnitType),
    (0, typeorm_1.JoinColumn)({ name: 'org_unit_type_id' }),
    __metadata("design:type", orgUnitType_1.OrgUnitType)
], Position.prototype, "org_unit_type", void 0);
__decorate([
    (0, typeorm_1.Column)({ length: 100 }),
    __metadata("design:type", String)
], Position.prototype, "name", void 0);
__decorate([
    (0, typeorm_1.Column)({
        type: 'varchar',
        length: 20,
        default: InvestitureType.ELECTION,
    }),
    __metadata("design:type", String)
], Position.prototype, "investiture_type", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'int', nullable: true }),
    __metadata("design:type", Number)
], Position.prototype, "mandate_duration_days", void 0);
__decorate([
    (0, typeorm_1.Column)({ default: false }),
    __metadata("design:type", Boolean)
], Position.prototype, "allows_deputy", void 0);
__decorate([
    (0, typeorm_1.ManyToMany)(() => role_1.Role),
    (0, typeorm_1.JoinTable)({
        name: 'position_roles',
        joinColumn: { name: 'position_id', referencedColumnName: 'id' },
        inverseJoinColumn: { name: 'role_id', referencedColumnName: 'id' },
    }),
    __metadata("design:type", Array)
], Position.prototype, "roles", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)({ type: 'timestamptz' }),
    __metadata("design:type", Date)
], Position.prototype, "created_at", void 0);
__decorate([
    (0, typeorm_1.UpdateDateColumn)({ type: 'timestamptz' }),
    __metadata("design:type", Date)
], Position.prototype, "updated_at", void 0);
__decorate([
    (0, typeorm_1.DeleteDateColumn)({ type: 'timestamptz' }),
    __metadata("design:type", Date)
], Position.prototype, "deleted_at", void 0);
exports.Position = Position = __decorate([
    (0, typeorm_1.Entity)('positions')
], Position);
