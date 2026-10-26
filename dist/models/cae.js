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
exports.Cae = void 0;
const typeorm_1 = require("typeorm");
const state_1 = require("./state");
const caeManager_1 = require("./caeManager");
const car_1 = require("./car");
let Cae = class Cae {
};
exports.Cae = Cae;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)("uuid"),
    __metadata("design:type", String)
], Cae.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "varchar", length: 255 }),
    __metadata("design:type", String)
], Cae.prototype, "name", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "uuid" }),
    __metadata("design:type", String)
], Cae.prototype, "state_id", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => state_1.State),
    (0, typeorm_1.JoinColumn)({ name: "state_id" }),
    __metadata("design:type", state_1.State)
], Cae.prototype, "state", void 0);
__decorate([
    (0, typeorm_1.OneToMany)(() => caeManager_1.CaeManager, (manager) => manager.cae),
    __metadata("design:type", Array)
], Cae.prototype, "managers", void 0);
__decorate([
    (0, typeorm_1.OneToMany)(() => car_1.Car, (car) => car.cae),
    __metadata("design:type", Array)
], Cae.prototype, "cars", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)({ type: "timestamptz" }),
    __metadata("design:type", Date)
], Cae.prototype, "created_at", void 0);
__decorate([
    (0, typeorm_1.UpdateDateColumn)({ type: "timestamptz" }),
    __metadata("design:type", Date)
], Cae.prototype, "updated_at", void 0);
__decorate([
    (0, typeorm_1.DeleteDateColumn)({ type: "timestamptz" }),
    __metadata("design:type", Date)
], Cae.prototype, "deleted_at", void 0);
exports.Cae = Cae = __decorate([
    (0, typeorm_1.Entity)("caes")
], Cae);
