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
exports.OrgUnit = exports.OrgUnitStatus = void 0;
const typeorm_1 = require("typeorm");
const organization_1 = require("./organization");
const orgUnitType_1 = require("./orgUnitType");
var OrgUnitStatus;
(function (OrgUnitStatus) {
    OrgUnitStatus["PENDING"] = "PENDING";
    OrgUnitStatus["ACTIVE"] = "ACTIVE";
    OrgUnitStatus["INACTIVE"] = "INACTIVE";
    OrgUnitStatus["PENDING_DELETION"] = "PENDING_DELETION";
})(OrgUnitStatus || (exports.OrgUnitStatus = OrgUnitStatus = {}));
let OrgUnit = class OrgUnit {
};
exports.OrgUnit = OrgUnit;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)('uuid'),
    __metadata("design:type", String)
], OrgUnit.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'uuid' }),
    __metadata("design:type", String)
], OrgUnit.prototype, "organization_id", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => organization_1.Organization),
    (0, typeorm_1.JoinColumn)({ name: 'organization_id' }),
    __metadata("design:type", organization_1.Organization)
], OrgUnit.prototype, "organization", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'uuid', nullable: true }),
    __metadata("design:type", Object)
], OrgUnit.prototype, "parent_id", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => OrgUnit, (u) => u.children, { nullable: true }),
    (0, typeorm_1.JoinColumn)({ name: 'parent_id' }),
    __metadata("design:type", OrgUnit)
], OrgUnit.prototype, "parent", void 0);
__decorate([
    (0, typeorm_1.OneToMany)(() => OrgUnit, (u) => u.parent),
    __metadata("design:type", Array)
], OrgUnit.prototype, "children", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'uuid' }),
    __metadata("design:type", String)
], OrgUnit.prototype, "type_id", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => orgUnitType_1.OrgUnitType),
    (0, typeorm_1.JoinColumn)({ name: 'type_id' }),
    __metadata("design:type", orgUnitType_1.OrgUnitType)
], OrgUnit.prototype, "type", void 0);
__decorate([
    (0, typeorm_1.Column)({ length: 255 }),
    __metadata("design:type", String)
], OrgUnit.prototype, "name", void 0);
__decorate([
    (0, typeorm_1.Column)({ length: 255 }),
    __metadata("design:type", String)
], OrgUnit.prototype, "slug", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'jsonb', default: {} }),
    __metadata("design:type", Object)
], OrgUnit.prototype, "metadata", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 20, default: OrgUnitStatus.ACTIVE }),
    __metadata("design:type", String)
], OrgUnit.prototype, "status", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)({ type: 'timestamptz' }),
    __metadata("design:type", Date)
], OrgUnit.prototype, "created_at", void 0);
__decorate([
    (0, typeorm_1.UpdateDateColumn)({ type: 'timestamptz' }),
    __metadata("design:type", Date)
], OrgUnit.prototype, "updated_at", void 0);
__decorate([
    (0, typeorm_1.DeleteDateColumn)({ type: 'timestamptz' }),
    __metadata("design:type", Date)
], OrgUnit.prototype, "deleted_at", void 0);
exports.OrgUnit = OrgUnit = __decorate([
    (0, typeorm_1.Entity)('org_units')
], OrgUnit);
