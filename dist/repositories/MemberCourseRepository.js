"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.MemberCourseRepository = void 0;
const common_1 = require("@nestjs/common");
const db_1 = require("../db");
const memberCourse_1 = require("../models/memberCourse");
let MemberCourseRepository = class MemberCourseRepository {
    constructor() {
        this.repository = db_1.AppDataBase.getRepository(memberCourse_1.MemberCourse);
    }
    async findByMemberId(memberId) {
        return this.repository.find({
            where: { member_id: memberId },
            relations: [
                'courseUniversity',
                'courseUniversity.course',
                'courseUniversity.university',
                'courseUniversity.city',
            ],
        });
    }
    async findByMemberAndCourseUniversity(memberId, courseUniversityId) {
        return this.repository.findOne({
            where: { member_id: memberId, course_university_id: courseUniversityId },
            relations: ['courseUniversity', 'courseUniversity.course', 'courseUniversity.university'],
        });
    }
    async findActiveByCourseUniversity(courseUniversityId) {
        return this.repository.find({
            where: {
                course_university_id: courseUniversityId,
                status: 'active',
            },
            relations: ['member'],
        });
    }
    async create(data) {
        const memberCourse = this.repository.create(data);
        return this.repository.save(memberCourse);
    }
    async update(id, data) {
        await this.repository.update(id, data);
        return this.repository.findOne({
            where: { id },
            relations: ['courseUniversity', 'courseUniversity.course', 'courseUniversity.university'],
        });
    }
    async findById(id) {
        return this.repository.findOne({
            where: { id },
            relations: [
                'courseUniversity',
                'courseUniversity.course',
                'courseUniversity.university',
                'member',
            ],
        });
    }
};
exports.MemberCourseRepository = MemberCourseRepository;
exports.MemberCourseRepository = MemberCourseRepository = __decorate([
    (0, common_1.Injectable)()
], MemberCourseRepository);
