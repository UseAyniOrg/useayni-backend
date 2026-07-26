"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CityRepository = void 0;
const common_1 = require("@nestjs/common");
const db_1 = require("../db");
const city_1 = require("../models/city");
let CityRepository = class CityRepository {
    constructor() {
        this.repository = db_1.AppDataBase.getRepository(city_1.City);
    }
    async findAll() {
        return this.repository.find({
            relations: ["state"],
            order: { name: "ASC" },
        });
    }
    async findById(id) {
        return this.repository.findOne({ where: { id }, relations: ["state"] });
    }
    async findByState(stateId) {
        return this.repository.find({
            where: { state_id: stateId },
            relations: ["state"],
            order: { name: "ASC" },
        });
    }
    async findByStateUf(uf) {
        return this.repository
            .createQueryBuilder("city")
            .leftJoinAndSelect("city.state", "state")
            .where("UPPER(state.uf) = :uf", { uf: uf.toUpperCase() })
            .orderBy("city.name", "ASC")
            .getMany();
    }
    async findByIbgeCode(ibgeCode) {
        return this.repository.findOne({
            where: { ibge_code: ibgeCode },
            relations: ["state"],
        });
    }
    async findOrCreateFromIbge(data) {
        const existing = await this.findByIbgeCode(data.ibge_code);
        if (existing) {
            await this.repository.update(existing.id, {
                name: data.name,
                state_id: data.state_id,
            });
            return this.findById(existing.id);
        }
        return this.create(data);
    }
    async create(data) {
        const city = this.repository.create(data);
        return this.repository.save(city);
    }
};
exports.CityRepository = CityRepository;
exports.CityRepository = CityRepository = __decorate([
    (0, common_1.Injectable)()
], CityRepository);
