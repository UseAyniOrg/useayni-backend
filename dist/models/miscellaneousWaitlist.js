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
exports.MiscellaneousWaitlist = exports.WaitlistStatus = void 0;
const typeorm_1 = require("typeorm");
const miscellaneous_1 = require("./miscellaneous");
const member_1 = require("./member");
var WaitlistStatus;
(function (WaitlistStatus) {
    WaitlistStatus["WAITING"] = "waiting";
    WaitlistStatus["PROMOTED"] = "promoted";
    WaitlistStatus["REMOVED"] = "removed";
})(WaitlistStatus || (exports.WaitlistStatus = WaitlistStatus = {}));
let MiscellaneousWaitlist = class MiscellaneousWaitlist {
};
exports.MiscellaneousWaitlist = MiscellaneousWaitlist;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)('uuid'),
    __metadata("design:type", String)
], MiscellaneousWaitlist.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'uuid' }),
    __metadata("design:type", String)
], MiscellaneousWaitlist.prototype, "miscellaneous_id", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => miscellaneous_1.Miscellaneous),
    (0, typeorm_1.JoinColumn)({ name: 'miscellaneous_id' }),
    __metadata("design:type", miscellaneous_1.Miscellaneous)
], MiscellaneousWaitlist.prototype, "miscellaneous", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'uuid' }),
    __metadata("design:type", String)
], MiscellaneousWaitlist.prototype, "member_id", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => member_1.Member),
    (0, typeorm_1.JoinColumn)({ name: 'member_id' }),
    __metadata("design:type", member_1.Member)
], MiscellaneousWaitlist.prototype, "member", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'int' }),
    __metadata("design:type", Number)
], MiscellaneousWaitlist.prototype, "position", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 20, default: WaitlistStatus.WAITING }),
    __metadata("design:type", String)
], MiscellaneousWaitlist.prototype, "status", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)({ type: 'timestamptz' }),
    __metadata("design:type", Date)
], MiscellaneousWaitlist.prototype, "created_at", void 0);
exports.MiscellaneousWaitlist = MiscellaneousWaitlist = __decorate([
    (0, typeorm_1.Entity)('miscellaneous_waitlist')
], MiscellaneousWaitlist);
