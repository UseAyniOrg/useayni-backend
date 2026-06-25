"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CourseManagerRepository = void 0;
const typeorm_1 = require("typeorm");
const db_1 = require("../db");
const courseManager_1 = require("../models/courseManager");
exports.CourseManagerRepository = db_1.AppDataBase.getRepository(courseManager_1.CourseManager).extend({
    async findByMemberId(memberId) {
        return this.find({
            where: {
                member_id: memberId,
                end_date: (0, typeorm_1.IsNull)(),
            },
            relations: [
                'courseUniversity',
                'courseUniversity.course',
                'courseUniversity.university',
                'courseUniversity.city',
            ],
        });
    },
    async findByCourseUniversityId(courseUniversityId) {
        return this.find({
            where: { course_university_id: courseUniversityId },
            relations: ['member'],
        });
    },
    async isManager(memberId, courseUniversityId) {
        const count = await this.count({
            where: {
                member_id: memberId,
                course_university_id: courseUniversityId,
                end_date: (0, typeorm_1.IsNull)(),
            },
        });
        return count > 0;
    },
});
