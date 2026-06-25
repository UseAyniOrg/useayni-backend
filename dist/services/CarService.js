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
exports.CarService = void 0;
const common_1 = require("@nestjs/common");
const CarRepository_1 = require("../repositories/CarRepository");
const MemberRepository_1 = require("../repositories/MemberRepository");
const db_1 = require("../db");
const member_1 = require("../models/member");
let CarService = class CarService {
    constructor(carRepository, memberRepository) {
        this.carRepository = carRepository;
        this.memberRepository = memberRepository;
    }
    async getMembersByCar(carId) {
        const car = await this.carRepository.findById(carId);
        if (!car)
            throw new Error("CAR não encontrada");
        const cityIds = car.cities.map(city => city.id);
        const members = await db_1.AppDataBase.getRepository(member_1.Member)
            .createQueryBuilder("member")
            .leftJoinAndSelect("member.city", "city")
            .leftJoinAndSelect("member.memberCourses", "memberCourses")
            .leftJoinAndSelect("memberCourses.courseUniversity", "courseUniversity")
            .leftJoinAndSelect("courseUniversity.course", "course")
            .leftJoinAndSelect("courseUniversity.university", "university")
            .where("member.city_id IN (:...cityIds)", { cityIds })
            .getMany();
        return members;
    }
    async getCarsForMember(memberId) {
        const member = await this.memberRepository.findById(memberId);
        if (!member)
            throw new Error("Membro não encontrado");
        const cars = await db_1.AppDataBase.getRepository(member_1.Member)
            .createQueryBuilder("member")
            .leftJoin("member.city", "city")
            .leftJoin("car_cities", "cc", "cc.city_id = city.id")
            .leftJoin("cars", "car", "car.id = cc.car_id")
            .where("member.id = :memberId", { memberId })
            .select(["car.*"])
            .getRawMany();
        return cars;
    }
    async assignManagerToCar(carId, memberId) {
        return this.carRepository.addManager(carId, memberId);
    }
    async removeManagerFromCar(carId, memberId) {
        return this.carRepository.removeManager(carId, memberId);
    }
    async assignCitiesToCar(carId, cityIds) {
        return this.carRepository.addCities(carId, cityIds);
    }
    async removeCitiesFromCar(carId, cityIds) {
        return this.carRepository.removeCities(carId, cityIds);
    }
    async create(data) {
        return this.carRepository.create(data);
    }
    async findAll() {
        return this.carRepository.findAll();
    }
    async findById(id) {
        return this.carRepository.findById(id);
    }
};
exports.CarService = CarService;
exports.CarService = CarService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [CarRepository_1.CarRepository,
        MemberRepository_1.MemberRepository])
], CarService);
