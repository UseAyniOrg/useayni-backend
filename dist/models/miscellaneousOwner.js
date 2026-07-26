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
exports.MiscellaneousOwner = exports.OwnerRole = void 0;
const typeorm_1 = require("typeorm");
const miscellaneous_1 = require("./miscellaneous");
const member_1 = require("./member");
var OwnerRole;
(function (OwnerRole) {
    OwnerRole["OWNER"] = "owner";
    OwnerRole["CO_OWNER"] = "co_owner";
})(OwnerRole || (exports.OwnerRole = OwnerRole = {}));
let MiscellaneousOwner = class MiscellaneousOwner {
};
exports.MiscellaneousOwner = MiscellaneousOwner;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)('uuid'),
    __metadata("design:type", String)
], MiscellaneousOwner.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'uuid' }),
    __metadata("design:type", String)
], MiscellaneousOwner.prototype, "miscellaneous_id", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => miscellaneous_1.Miscellaneous),
    (0, typeorm_1.JoinColumn)({ name: 'miscellaneous_id' }),
    __metadata("design:type", miscellaneous_1.Miscellaneous)
], MiscellaneousOwner.prototype, "miscellaneous", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'uuid' }),
    __metadata("design:type", String)
], MiscellaneousOwner.prototype, "member_id", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => member_1.Member),
    (0, typeorm_1.JoinColumn)({ name: 'member_id' }),
    __metadata("design:type", member_1.Member)
], MiscellaneousOwner.prototype, "member", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 20, default: OwnerRole.OWNER }),
    __metadata("design:type", String)
], MiscellaneousOwner.prototype, "role", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'boolean', default: false }),
    __metadata("design:type", Boolean)
], MiscellaneousOwner.prototype, "is_creator", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)({ type: 'timestamptz' }),
    __metadata("design:type", Date)
], MiscellaneousOwner.prototype, "created_at", void 0);
exports.MiscellaneousOwner = MiscellaneousOwner = __decorate([
    (0, typeorm_1.Entity)('miscellaneous_owners')
], MiscellaneousOwner);
