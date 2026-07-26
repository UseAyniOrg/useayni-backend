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
exports.CourseManagerController = void 0;
const common_1 = require("@nestjs/common");
const CourseManagerService_1 = require("../services/CourseManagerService");
const permissionMiddleware_1 = require("../middlewares/permissionMiddleware");
const requirePosition_decorator_1 = require("../middlewares/requirePosition.decorator");
const authorization_guard_1 = require("../middlewares/authorization.guard");
const swagger_1 = require("@nestjs/swagger");
let CourseManagerController = class CourseManagerController {
    constructor(courseManagerService) {
        this.courseManagerService = courseManagerService;
    }
    async findAll() {
        return this.courseManagerService.findAll();
    }
    async findById(id) {
        return this.courseManagerService.findById(id);
    }
    async findByMember(memberId) {
        return this.courseManagerService.findByMemberId(memberId);
    }
    async findByCourseUniversity(courseUniversityId) {
        return this.courseManagerService.findByCourseUniversityId(courseUniversityId);
    }
    async create(data) {
        const startDate = data.start_date ? new Date(data.start_date) : undefined;
        return this.courseManagerService.create({
            course_university_id: data.course_university_id,
            member_id: data.member_id,
            start_date: startDate,
        });
    }
    async endManagement(id, req) {
        const user = req.user;
        const manager = await this.courseManagerService.findById(id);
        if (!manager) {
            throw new Error('Dirigente não encontrado');
        }
        // Validar se é o próprio dirigente ou equipe técnica
        const isOwnManager = manager.member_id === user.id;
        const isTechTeam = user.roles.includes('EQUIPE_TECNICA');
        if (!isOwnManager && !isTechTeam) {
            throw new Error('Acesso negado: você não pode encerrar este vínculo');
        }
        await this.courseManagerService.endManagement(id);
        return { message: 'Vínculo de dirigente encerrado com sucesso' };
    }
    async delete(id) {
        await this.courseManagerService.delete(id);
        return { message: 'Dirigente removido com sucesso' };
    }
};
exports.CourseManagerController = CourseManagerController;
__decorate([
    (0, common_1.Get)(),
    (0, swagger_1.ApiOperation)({ summary: 'Get all course managers' }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], CourseManagerController.prototype, "findAll", null);
__decorate([
    (0, common_1.Get)(':id'),
    (0, swagger_1.ApiOperation)({ summary: 'Get course manager by ID' }),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], CourseManagerController.prototype, "findById", null);
__decorate([
    (0, common_1.Get)('member/:memberId'),
    (0, swagger_1.ApiOperation)({ summary: 'Get course managers by member ID' }),
    __param(0, (0, common_1.Param)('memberId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], CourseManagerController.prototype, "findByMember", null);
__decorate([
    (0, common_1.Get)('course-university/:courseUniversityId'),
    (0, swagger_1.ApiOperation)({ summary: 'Get course managers by course university ID' }),
    __param(0, (0, common_1.Param)('courseUniversityId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], CourseManagerController.prototype, "findByCourseUniversity", null);
__decorate([
    (0, common_1.Post)(),
    (0, permissionMiddleware_1.Roles)('EQUIPE_TECNICA'),
    (0, swagger_1.ApiOperation)({ summary: 'Add course manager (EQUIPE_TECNICA only)' }),
    (0, swagger_1.ApiResponse)({ status: 201, description: 'Course manager added successfully' }),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], CourseManagerController.prototype, "create", null);
__decorate([
    (0, common_1.Put)(':id/end'),
    (0, requirePosition_decorator_1.RequirePosition)('DIRIGENTE'),
    (0, swagger_1.ApiOperation)({ summary: 'End course management' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], CourseManagerController.prototype, "endManagement", null);
__decorate([
    (0, common_1.Delete)(':id'),
    (0, permissionMiddleware_1.Roles)('EQUIPE_TECNICA'),
    (0, swagger_1.ApiOperation)({ summary: 'Delete course manager (EQUIPE_TECNICA only)' }),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], CourseManagerController.prototype, "delete", null);
exports.CourseManagerController = CourseManagerController = __decorate([
    (0, common_1.Controller)('course-managers'),
    (0, swagger_1.ApiTags)('Course Managers (Dirigentes)'),
    (0, common_1.UseGuards)(authorization_guard_1.AuthorizationGuard),
    __metadata("design:paramtypes", [CourseManagerService_1.CourseManagerService])
], CourseManagerController);
