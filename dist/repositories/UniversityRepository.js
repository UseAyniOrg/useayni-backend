"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.UniversityRepository = void 0;
const common_1 = require("@nestjs/common");
const db_1 = require("../db");
const university_1 = require("../models/university");
let UniversityRepository = class UniversityRepository {
    constructor() {
        this.repository = db_1.AppDataBase.getRepository(university_1.University);
    }
    async findAll(filters) {
        const query = this.repository
            .createQueryBuilder("university")
            .leftJoinAndSelect("university.city", "city")
            .leftJoinAndSelect("city.state", "state")
            .leftJoinAndSelect("university.courseUniversities", "courseUniversities")
            .leftJoinAndSelect("courseUniversities.city", "courseUniversityCity")
            .leftJoinAndSelect("courseUniversityCity.state", "courseUniversityState")
            .leftJoinAndSelect("courseUniversities.course", "course");
        if (filters?.cityId) {
            query.andWhere("(university.city_id = :cityId OR courseUniversities.city_id = :cityId)", { cityId: filters.cityId });
        }
        if (filters?.stateId) {
            query.andWhere("(city.state_id = :stateId OR courseUniversityCity.state_id = :stateId)", { stateId: filters.stateId });
        }
        if (filters?.stateUf) {
            query.andWhere("(UPPER(state.uf) = :stateUf OR UPPER(courseUniversityState.uf) = :stateUf)", { stateUf: filters.stateUf.toUpperCase() });
        }
        if (filters?.q) {
            query.andWhere("(university.name ILIKE :q OR university.acronym ILIKE :q)", { q: `%${filters.q}%` });
        }
        return query.distinct(true).orderBy("university.name", "ASC").getMany();
    }
    async findById(id) {
        return this.repository.findOne({
            where: { id },
            relations: ["city", "city.state", "courseUniversities", "courseUniversities.course"],
        });
    }
    async findByEmecCode(emecCode) {
        return this.repository.findOne({
            where: { emec_code: emecCode },
            relations: ["city", "city.state"],
        });
    }
    async findByNormalizedName(name, cityId) {
        const query = this.repository
            .createQueryBuilder("university")
            .leftJoinAndSelect("university.city", "city")
            .leftJoinAndSelect("city.state", "state")
            .where("LOWER(university.name) = LOWER(:name)", { name });
        if (cityId) {
            query.andWhere("university.city_id = :cityId", { cityId });
        }
        return query.getOne();
    }
    async findOrCreateByNormalizedName(data) {
        if (data.emec_code) {
            const byCode = await this.findByEmecCode(data.emec_code);
            if (byCode)
                return byCode;
        }
        const existing = await this.findByNormalizedName(data.name, data.city_id || undefined);
        if (existing)
            return existing;
        return this.create({
            name: data.name,
            acronym: data.acronym || null,
            emec_code: data.emec_code || null,
            city_id: data.city_id || null,
            source: data.source || 'USER_SIGNUP',
        });
    }
    async create(data) {
        const university = this.repository.create(data);
        return this.repository.save(university);
    }
    async update(id, data) {
        await this.repository.update(id, data);
        return this.findById(id);
    }
};
exports.UniversityRepository = UniversityRepository;
exports.UniversityRepository = UniversityRepository = __decorate([
    (0, common_1.Injectable)()
], UniversityRepository);
