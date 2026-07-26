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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CourseController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const CourseRepository_1 = require("../repositories/CourseRepository");
const course_dto_1 = require("../dto/academic/course.dto");
const course_university_dto_1 = require("../dto/academic/course-university.dto");
const db_1 = require("../db");
const authorization_guard_1 = require("../middlewares/authorization.guard");
let CourseController = class CourseController {
    constructor(courseRepository) {
        this.courseRepository = courseRepository;
    }
    async findAll(universityId, cityId) {
        if (universityId) {
            return this.courseRepository.findByUniversity(universityId, cityId);
        }
        return this.courseRepository.findAll();
    }
    async findById(id) {
        return this.courseRepository.findById(id);
    }
    async create(data) {
        return this.courseRepository.create(data);
    }
    async linkUniversity(data) {
        const result = await db_1.AppDataBase.query(`INSERT INTO course_universities (course_id, university_id, city_id) 
       VALUES ($1, $2, $3) 
       ON CONFLICT (course_id, university_id, city_id) DO UPDATE SET updated_at = now() 
       RETURNING *`, [data.courseId, data.universityId, data.cityId]);
        return result[0];
    }
    async createSemester(data) {
        const result = await db_1.AppDataBase.query(`INSERT INTO program_semesters (course_id, semester_number) 
       VALUES ($1, $2) 
       ON CONFLICT (course_id, semester_number) DO UPDATE SET updated_at = now() 
       RETURNING *`, [data.courseId, data.semester_number]);
        return result[0];
    }
    async createAcademicTerm(data) {
        const result = await db_1.AppDataBase.query(`INSERT INTO academic_terms (year, term, starts_at, ends_at) 
       VALUES ($1, $2, $3, $4) 
       ON CONFLICT (year, term) DO UPDATE SET updated_at = now() 
       RETURNING *`, [data.year, data.term, data.starts_at || null, data.ends_at || null]);
        return result[0];
    }
    async createSemesterOffering(data) {
        const result = await db_1.AppDataBase.query(`INSERT INTO semester_offerings (course_university_id, program_semester_id, academic_term_id, status) 
       VALUES ($1, $2, $3, $4) 
       ON CONFLICT (course_university_id, program_semester_id, academic_term_id) DO UPDATE SET updated_at = now() 
       RETURNING *`, [data.course_university_id, data.program_semester_id, data.academic_term_id, data.status || 'planned']);
        return result[0];
    }
    async createEnrollment(data) {
        const result = await db_1.AppDataBase.query(`INSERT INTO enrollments (member_id, semester_offering_id, status) 
       VALUES ($1, $2, $3) 
       ON CONFLICT (member_id, semester_offering_id) DO UPDATE SET updated_at = now() 
       RETURNING *`, [data.member_id, data.semester_offering_id, data.status || 'active']);
        return result[0];
    }
};
exports.CourseController = CourseController;
__decorate([
    (0, common_1.Get)(),
    (0, swagger_1.ApiOperation)({ summary: 'List all courses' }),
    (0, swagger_1.ApiQuery)({ name: 'universityId', required: false, description: 'Filter by university ID' }),
    (0, swagger_1.ApiQuery)({ name: 'cityId', required: false, description: 'Filter by city ID' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'List of courses' }),
    __param(0, (0, common_1.Query)('universityId')),
    __param(1, (0, common_1.Query)('cityId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], CourseController.prototype, "findAll", null);
__decorate([
    (0, common_1.Get)(':id'),
    (0, swagger_1.ApiOperation)({ summary: 'Get course by ID' }),
    (0, swagger_1.ApiParam)({ name: 'id', type: String, description: 'Course ID' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Course found' }),
    (0, swagger_1.ApiResponse)({ status: 404, description: 'Course not found' }),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], CourseController.prototype, "findById", null);
__decorate([
    (0, common_1.Post)(),
    (0, common_1.UseGuards)(authorization_guard_1.AuthorizationGuard),
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiOperation)({ summary: 'Create course' }),
    (0, swagger_1.ApiBody)({ type: course_dto_1.CreateCourseDto }),
    (0, swagger_1.ApiResponse)({ status: 201, description: 'Course created' }),
    (0, swagger_1.ApiResponse)({ status: 400, description: 'Invalid data' }),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [course_dto_1.CreateCourseDto]),
    __metadata("design:returntype", Promise)
], CourseController.prototype, "create", null);
__decorate([
    (0, common_1.Post)('link-university'),
    (0, common_1.UseGuards)(authorization_guard_1.AuthorizationGuard),
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiOperation)({ summary: 'Link course to university and city' }),
    (0, swagger_1.ApiBody)({ type: course_university_dto_1.LinkCourseUniversityDto }),
    (0, swagger_1.ApiResponse)({ status: 201, description: 'Course linked successfully' }),
    (0, swagger_1.ApiResponse)({ status: 400, description: 'Invalid data' }),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [course_university_dto_1.LinkCourseUniversityDto]),
    __metadata("design:returntype", Promise)
], CourseController.prototype, "linkUniversity", null);
__decorate([
    (0, common_1.Post)('semesters'),
    (0, common_1.UseGuards)(authorization_guard_1.AuthorizationGuard),
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiOperation)({ summary: 'Create program semester' }),
    (0, swagger_1.ApiBody)({ type: course_university_dto_1.CreateProgramSemesterDto }),
    (0, swagger_1.ApiResponse)({ status: 201, description: 'Semester created' }),
    (0, swagger_1.ApiResponse)({ status: 400, description: 'Invalid data' }),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [course_university_dto_1.CreateProgramSemesterDto]),
    __metadata("design:returntype", Promise)
], CourseController.prototype, "createSemester", null);
__decorate([
    (0, common_1.Post)('academic-terms'),
    (0, common_1.UseGuards)(authorization_guard_1.AuthorizationGuard),
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiOperation)({ summary: 'Create academic term' }),
    (0, swagger_1.ApiBody)({ type: course_university_dto_1.CreateAcademicTermDto }),
    (0, swagger_1.ApiResponse)({ status: 201, description: 'Academic term created' }),
    (0, swagger_1.ApiResponse)({ status: 400, description: 'Invalid data' }),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [course_university_dto_1.CreateAcademicTermDto]),
    __metadata("design:returntype", Promise)
], CourseController.prototype, "createAcademicTerm", null);
__decorate([
    (0, common_1.Post)('semester-offerings'),
    (0, common_1.UseGuards)(authorization_guard_1.AuthorizationGuard),
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiOperation)({ summary: 'Create semester offering' }),
    (0, swagger_1.ApiBody)({ type: course_university_dto_1.CreateSemesterOfferingDto }),
    (0, swagger_1.ApiResponse)({ status: 201, description: 'Semester offering created' }),
    (0, swagger_1.ApiResponse)({ status: 400, description: 'Invalid data' }),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [course_university_dto_1.CreateSemesterOfferingDto]),
    __metadata("design:returntype", Promise)
], CourseController.prototype, "createSemesterOffering", null);
__decorate([
    (0, common_1.Post)('enrollments'),
    (0, common_1.UseGuards)(authorization_guard_1.AuthorizationGuard),
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiOperation)({ summary: 'Enroll member in semester' }),
    (0, swagger_1.ApiBody)({ type: course_university_dto_1.CreateEnrollmentDto }),
    (0, swagger_1.ApiResponse)({ status: 201, description: 'Enrollment created' }),
    (0, swagger_1.ApiResponse)({ status: 400, description: 'Invalid data' }),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [course_university_dto_1.CreateEnrollmentDto]),
    __metadata("design:returntype", Promise)
], CourseController.prototype, "createEnrollment", null);
exports.CourseController = CourseController = __decorate([
    (0, common_1.Controller)('courses'),
    (0, swagger_1.ApiTags)('Courses'),
    __metadata("design:paramtypes", [CourseRepository_1.CourseRepository])
], CourseController);
