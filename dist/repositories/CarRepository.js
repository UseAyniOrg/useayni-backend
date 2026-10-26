"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CarRepository = void 0;
const common_1 = require("@nestjs/common");
const db_1 = require("../db");
const car_1 = require("../models/car");
let CarRepository = class CarRepository {
    constructor() {
        this.repository = db_1.AppDataBase.getRepository(car_1.Car);
    }
    async findAll() {
        return this.repository.find({ relations: ["cities", "cities.state", "managers"] });
    }
    async findById(id) {
        return this.repository.findOne({
            where: { id },
            relations: ["cities", "cities.state", "managers"]
        });
    }
    async create(data) {
        const car = this.repository.create(data);
        return this.repository.save(car);
    }
    async update(id, data) {
        await this.repository.update(id, data);
        return this.findById(id);
    }
    async addManager(carId, memberId) {
        const car = await this.findById(carId);
        if (!car)
            throw new Error("CAR não encontrada");
        await db_1.AppDataBase.query(`INSERT INTO car_managers (car_id, member_id) VALUES ($1, $2) ON CONFLICT DO NOTHING`, [carId, memberId]);
        return this.findById(carId);
    }
    async removeManager(carId, memberId) {
        await db_1.AppDataBase.query(`DELETE FROM car_managers WHERE car_id = $1 AND member_id = $2`, [carId, memberId]);
    }
    async addCities(carId, cityIds) {
        const values = cityIds.map(cityId => `('${carId}', '${cityId}')`).join(',');
        await db_1.AppDataBase.query(`INSERT INTO car_cities (car_id, city_id) VALUES ${values} ON CONFLICT DO NOTHING`);
        return this.findById(carId);
    }
    async removeCities(carId, cityIds) {
        await db_1.AppDataBase.query(`DELETE FROM car_cities WHERE car_id = $1 AND city_id = ANY($2)`, [carId, cityIds]);
    }
};
exports.CarRepository = CarRepository;
exports.CarRepository = CarRepository = __decorate([
    (0, common_1.Injectable)()
], CarRepository);
