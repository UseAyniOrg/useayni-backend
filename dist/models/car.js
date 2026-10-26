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
exports.Car = void 0;
const typeorm_1 = require("typeorm");
const city_1 = require("./city");
const member_1 = require("./member");
const cae_1 = require("./cae");
let Car = class Car {
};
exports.Car = Car;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)("uuid"),
    __metadata("design:type", String)
], Car.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)({ length: 255 }),
    __metadata("design:type", String)
], Car.prototype, "name", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "text", nullable: true }),
    __metadata("design:type", String)
], Car.prototype, "description", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)(),
    __metadata("design:type", Date)
], Car.prototype, "created_at", void 0);
__decorate([
    (0, typeorm_1.DeleteDateColumn)({ type: "timestamptz" }),
    __metadata("design:type", Date)
], Car.prototype, "deleted_at", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "uuid", nullable: true }),
    __metadata("design:type", String)
], Car.prototype, "cae_id", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => cae_1.Cae, (cae) => cae.cars),
    (0, typeorm_1.JoinColumn)({ name: "cae_id" }),
    __metadata("design:type", cae_1.Cae)
], Car.prototype, "cae", void 0);
__decorate([
    (0, typeorm_1.ManyToMany)(() => city_1.City, (city) => city.cars),
    (0, typeorm_1.JoinTable)({
        name: "car_cities",
        joinColumn: { name: "car_id", referencedColumnName: "id" },
        inverseJoinColumn: { name: "city_id", referencedColumnName: "id" },
    }),
    __metadata("design:type", Array)
], Car.prototype, "cities", void 0);
__decorate([
    (0, typeorm_1.ManyToMany)(() => member_1.Member, (member) => member.managedCars),
    (0, typeorm_1.JoinTable)({
        name: "car_managers",
        joinColumn: { name: "car_id", referencedColumnName: "id" },
        inverseJoinColumn: { name: "member_id", referencedColumnName: "id" },
    }),
    __metadata("design:type", Array)
], Car.prototype, "managers", void 0);
exports.Car = Car = __decorate([
    (0, typeorm_1.Entity)("cars")
], Car);
