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
exports.Mandate = exports.MandateStatus = void 0;
const typeorm_1 = require("typeorm");
const organization_1 = require("./organization");
const position_1 = require("./position");
const orgUnit_1 = require("./orgUnit");
const member_1 = require("./member");
var MandateStatus;
(function (MandateStatus) {
    MandateStatus["ACTIVE"] = "ACTIVE";
    MandateStatus["CLOSED"] = "CLOSED";
    MandateStatus["REVOKED"] = "REVOKED";
})(MandateStatus || (exports.MandateStatus = MandateStatus = {}));
let Mandate = class Mandate {
};
exports.Mandate = Mandate;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)('uuid'),
    __metadata("design:type", String)
], Mandate.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'uuid' }),
    __metadata("design:type", String)
], Mandate.prototype, "organization_id", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => organization_1.Organization),
    (0, typeorm_1.JoinColumn)({ name: 'organization_id' }),
    __metadata("design:type", organization_1.Organization)
], Mandate.prototype, "organization", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'uuid' }),
    __metadata("design:type", String)
], Mandate.prototype, "position_id", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => position_1.Position),
    (0, typeorm_1.JoinColumn)({ name: 'position_id' }),
    __metadata("design:type", position_1.Position)
], Mandate.prototype, "position", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'uuid' }),
    __metadata("design:type", String)
], Mandate.prototype, "org_unit_id", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => orgUnit_1.OrgUnit),
    (0, typeorm_1.JoinColumn)({ name: 'org_unit_id' }),
    __metadata("design:type", orgUnit_1.OrgUnit)
], Mandate.prototype, "org_unit", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'uuid' }),
    __metadata("design:type", String)
], Mandate.prototype, "member_id", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => member_1.Member),
    (0, typeorm_1.JoinColumn)({ name: 'member_id' }),
    __metadata("design:type", member_1.Member)
], Mandate.prototype, "member", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'date' }),
    __metadata("design:type", Date)
], Mandate.prototype, "start_date", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'date', nullable: true }),
    __metadata("design:type", Date)
], Mandate.prototype, "end_date", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 20, default: MandateStatus.ACTIVE }),
    __metadata("design:type", String)
], Mandate.prototype, "status", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)({ type: 'timestamptz' }),
    __metadata("design:type", Date)
], Mandate.prototype, "created_at", void 0);
__decorate([
    (0, typeorm_1.UpdateDateColumn)({ type: 'timestamptz' }),
    __metadata("design:type", Date)
], Mandate.prototype, "updated_at", void 0);
exports.Mandate = Mandate = __decorate([
    (0, typeorm_1.Entity)('mandates')
], Mandate);
