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
exports.CourseManagerService = void 0;
const common_1 = require("@nestjs/common");
const CourseManagerRepository_1 = require("../repositories/CourseManagerRepository");
let CourseManagerService = class CourseManagerService {
    constructor() { }
    async findAll() {
        return CourseManagerRepository_1.CourseManagerRepository.find({
            relations: ['courseUniversity', 'courseUniversity.course', 'courseUniversity.university', 'courseUniversity.city', 'member'],
        });
    }
    async findById(id) {
        return CourseManagerRepository_1.CourseManagerRepository.findOne({
            where: { id },
            relations: ['courseUniversity', 'courseUniversity.course', 'courseUniversity.university', 'courseUniversity.city', 'member'],
        });
    }
    async findByMemberId(memberId) {
        return CourseManagerRepository_1.CourseManagerRepository.findByMemberId(memberId);
    }
    async findByCourseUniversityId(courseUniversityId) {
        return CourseManagerRepository_1.CourseManagerRepository.findByCourseUniversityId(courseUniversityId);
    }
    async create(data) {
        const manager = CourseManagerRepository_1.CourseManagerRepository.create(data);
        return CourseManagerRepository_1.CourseManagerRepository.save(manager);
    }
    async endManagement(id) {
        const manager = await CourseManagerRepository_1.CourseManagerRepository.findOne({ where: { id } });
        if (!manager)
            throw new Error('Dirigente não encontrado');
        manager.end_date = new Date();
        return CourseManagerRepository_1.CourseManagerRepository.save(manager);
    }
    async delete(id) {
        await CourseManagerRepository_1.CourseManagerRepository.softDelete(id);
    }
    async isManager(memberId, courseUniversityId) {
        return CourseManagerRepository_1.CourseManagerRepository.isManager(memberId, courseUniversityId);
    }
};
exports.CourseManagerService = CourseManagerService;
exports.CourseManagerService = CourseManagerService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [])
], CourseManagerService);
