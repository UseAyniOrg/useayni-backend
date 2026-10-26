"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CourseUniversityRepository = void 0;
const common_1 = require("@nestjs/common");
const db_1 = require("../db");
const courseUniversity_1 = require("../models/courseUniversity");
let CourseUniversityRepository = class CourseUniversityRepository {
    constructor() {
        this.repository = db_1.AppDataBase.getRepository(courseUniversity_1.CourseUniversity);
    }
    async findAll() {
        return this.repository.find({
            relations: ["course", "university", "city"]
        });
    }
    async findById(id) {
        return this.repository.findOne({
            where: { id },
            relations: ["course", "university", "city"]
        });
    }
    async findByCourseAndUniversity(courseId, universityId) {
        return this.repository.find({
            where: { course_id: courseId, university_id: universityId },
            relations: ["course", "university", "city"]
        });
    }
    async findByCourseUniversityCity(courseId, universityId, cityId) {
        return this.repository.findOne({
            where: {
                course_id: courseId,
                university_id: universityId,
                city_id: cityId
            },
            relations: ["course", "university", "city"]
        });
    }
    async findOrCreate(data) {
        const existing = await this.findByCourseUniversityCity(data.course_id, data.university_id, data.city_id);
        if (existing)
            return existing;
        return this.create(data);
    }
    async create(data) {
        const courseUniversity = this.repository.create(data);
        return this.repository.save(courseUniversity);
    }
    async update(id, data) {
        await this.repository.update(id, data);
        return this.findById(id);
    }
};
exports.CourseUniversityRepository = CourseUniversityRepository;
exports.CourseUniversityRepository = CourseUniversityRepository = __decorate([
    (0, common_1.Injectable)()
], CourseUniversityRepository);
