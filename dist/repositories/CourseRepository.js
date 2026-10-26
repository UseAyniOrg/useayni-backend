"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CourseRepository = void 0;
const common_1 = require("@nestjs/common");
const db_1 = require("../db");
const course_1 = require("../models/course");
let CourseRepository = class CourseRepository {
    constructor() {
        this.repository = db_1.AppDataBase.getRepository(course_1.Course);
    }
    async findAll() {
        return this.repository.find({ relations: ["courseUniversities", "courseUniversities.university"] });
    }
    async findById(id) {
        return this.repository.findOne({
            where: { id },
            relations: ["courseUniversities", "courseUniversities.university"]
        });
    }
    async findByUniversity(universityId, cityId) {
        const query = this.repository
            .createQueryBuilder("course")
            .leftJoinAndSelect("course.courseUniversities", "cu")
            .leftJoinAndSelect("cu.university", "university")
            .where("cu.university_id = :universityId", { universityId });
        if (cityId) {
            query.andWhere("cu.city_id = :cityId", { cityId });
        }
        return query.orderBy("course.name", "ASC").getMany();
    }
    async findByNormalizedName(name) {
        return this.repository
            .createQueryBuilder("course")
            .where("LOWER(course.name) = LOWER(:name)", { name })
            .getOne();
    }
    async findOrCreateByName(name) {
        const existing = await this.findByNormalizedName(name);
        if (existing)
            return existing;
        return this.create({ name });
    }
    async create(data) {
        const course = this.repository.create(data);
        return this.repository.save(course);
    }
    async update(id, data) {
        await this.repository.update(id, data);
        return this.findById(id);
    }
};
exports.CourseRepository = CourseRepository;
exports.CourseRepository = CourseRepository = __decorate([
    (0, common_1.Injectable)()
], CourseRepository);
