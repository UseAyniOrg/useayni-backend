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
exports.City = void 0;
const typeorm_1 = require("typeorm");
const state_1 = require("./state");
const member_1 = require("./member");
const car_1 = require("./car");
const courseUniversity_1 = require("./courseUniversity");
const university_1 = require("./university");
let City = class City {
};
exports.City = City;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)("uuid"),
    __metadata("design:type", String)
], City.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)({ length: 100 }),
    __metadata("design:type", String)
], City.prototype, "name", void 0);
__decorate([
    (0, typeorm_1.Column)({ length: 10, nullable: true }),
    __metadata("design:type", String)
], City.prototype, "ibge_code", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "uuid" }),
    __metadata("design:type", String)
], City.prototype, "state_id", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => state_1.State, (state) => state.cities),
    (0, typeorm_1.JoinColumn)({ name: "state_id" }),
    __metadata("design:type", state_1.State)
], City.prototype, "state", void 0);
__decorate([
    (0, typeorm_1.OneToMany)(() => member_1.Member, (member) => member.city),
    __metadata("design:type", Array)
], City.prototype, "members", void 0);
__decorate([
    (0, typeorm_1.ManyToMany)(() => car_1.Car, (car) => car.cities),
    __metadata("design:type", Array)
], City.prototype, "cars", void 0);
__decorate([
    (0, typeorm_1.OneToMany)(() => courseUniversity_1.CourseUniversity, (cu) => cu.city),
    __metadata("design:type", Array)
], City.prototype, "courseUniversities", void 0);
__decorate([
    (0, typeorm_1.OneToMany)(() => university_1.University, (university) => university.city),
    __metadata("design:type", Array)
], City.prototype, "universities", void 0);
exports.City = City = __decorate([
    (0, typeorm_1.Entity)("cities")
], City);
