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
exports.CaeManager = void 0;
const typeorm_1 = require("typeorm");
const cae_1 = require("./cae");
const member_1 = require("./member");
let CaeManager = class CaeManager {
};
exports.CaeManager = CaeManager;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)("uuid"),
    __metadata("design:type", String)
], CaeManager.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "uuid" }),
    __metadata("design:type", String)
], CaeManager.prototype, "cae_id", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => cae_1.Cae, (cae) => cae.managers),
    (0, typeorm_1.JoinColumn)({ name: "cae_id" }),
    __metadata("design:type", cae_1.Cae)
], CaeManager.prototype, "cae", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "uuid" }),
    __metadata("design:type", String)
], CaeManager.prototype, "member_id", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => member_1.Member),
    (0, typeorm_1.JoinColumn)({ name: "member_id" }),
    __metadata("design:type", member_1.Member)
], CaeManager.prototype, "member", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "date", nullable: true }),
    __metadata("design:type", Date)
], CaeManager.prototype, "start_date", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "date", nullable: true }),
    __metadata("design:type", Date)
], CaeManager.prototype, "end_date", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)({ type: "timestamptz" }),
    __metadata("design:type", Date)
], CaeManager.prototype, "created_at", void 0);
__decorate([
    (0, typeorm_1.UpdateDateColumn)({ type: "timestamptz" }),
    __metadata("design:type", Date)
], CaeManager.prototype, "updated_at", void 0);
__decorate([
    (0, typeorm_1.DeleteDateColumn)({ type: "timestamptz" }),
    __metadata("design:type", Date)
], CaeManager.prototype, "deleted_at", void 0);
exports.CaeManager = CaeManager = __decorate([
    (0, typeorm_1.Entity)("cae_managers")
], CaeManager);
