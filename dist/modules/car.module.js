"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CarModule = void 0;
const common_1 = require("@nestjs/common");
const CarController_1 = require("../controllers/CarController");
const CarService_1 = require("../services/CarService");
const CarRepository_1 = require("../repositories/CarRepository");
const MemberRepository_1 = require("../repositories/MemberRepository");
let CarModule = class CarModule {
};
exports.CarModule = CarModule;
exports.CarModule = CarModule = __decorate([
    (0, common_1.Module)({
        controllers: [CarController_1.CarController],
        providers: [CarService_1.CarService, CarRepository_1.CarRepository, MemberRepository_1.MemberRepository],
        exports: [CarService_1.CarService, CarRepository_1.CarRepository],
    })
], CarModule);
