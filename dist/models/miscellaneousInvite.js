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
exports.MiscellaneousInvite = exports.InviteStatus = void 0;
const typeorm_1 = require("typeorm");
const miscellaneous_1 = require("./miscellaneous");
const member_1 = require("./member");
var InviteStatus;
(function (InviteStatus) {
    InviteStatus["PENDING"] = "pending";
    InviteStatus["ACCEPTED"] = "accepted";
    InviteStatus["REJECTED"] = "rejected";
    InviteStatus["CANCELLED"] = "cancelled";
    InviteStatus["EXPIRED"] = "expired";
})(InviteStatus || (exports.InviteStatus = InviteStatus = {}));
let MiscellaneousInvite = class MiscellaneousInvite {
};
exports.MiscellaneousInvite = MiscellaneousInvite;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)('uuid'),
    __metadata("design:type", String)
], MiscellaneousInvite.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'uuid' }),
    __metadata("design:type", String)
], MiscellaneousInvite.prototype, "miscellaneous_id", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => miscellaneous_1.Miscellaneous),
    (0, typeorm_1.JoinColumn)({ name: 'miscellaneous_id' }),
    __metadata("design:type", miscellaneous_1.Miscellaneous)
], MiscellaneousInvite.prototype, "miscellaneous", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'uuid' }),
    __metadata("design:type", String)
], MiscellaneousInvite.prototype, "invited_by_user_id", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => member_1.Member),
    (0, typeorm_1.JoinColumn)({ name: 'invited_by_user_id' }),
    __metadata("design:type", member_1.Member)
], MiscellaneousInvite.prototype, "invitedBy", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'uuid' }),
    __metadata("design:type", String)
], MiscellaneousInvite.prototype, "invited_user_id", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => member_1.Member),
    (0, typeorm_1.JoinColumn)({ name: 'invited_user_id' }),
    __metadata("design:type", member_1.Member)
], MiscellaneousInvite.prototype, "invitedUser", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'text', nullable: true }),
    __metadata("design:type", String)
], MiscellaneousInvite.prototype, "message", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 20, default: InviteStatus.PENDING }),
    __metadata("design:type", String)
], MiscellaneousInvite.prototype, "status", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'text', nullable: true }),
    __metadata("design:type", String)
], MiscellaneousInvite.prototype, "rejection_reason", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'timestamptz' }),
    __metadata("design:type", Date)
], MiscellaneousInvite.prototype, "expires_at", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'timestamptz', nullable: true }),
    __metadata("design:type", Date)
], MiscellaneousInvite.prototype, "responded_at", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)({ type: 'timestamptz' }),
    __metadata("design:type", Date)
], MiscellaneousInvite.prototype, "created_at", void 0);
exports.MiscellaneousInvite = MiscellaneousInvite = __decorate([
    (0, typeorm_1.Entity)('miscellaneous_invites')
], MiscellaneousInvite);
