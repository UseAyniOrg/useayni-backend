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
exports.PublicController = exports.FormController = exports.AttendanceSessionController = exports.AttendanceController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const authorization_guard_1 = require("../middlewares/authorization.guard");
const MiscellaneousWaitlistAttendanceService_1 = require("../services/MiscellaneousWaitlistAttendanceService");
const FormService_1 = require("../services/FormService");
const MiscellaneousRepository_1 = require("../repositories/MiscellaneousRepository");
const actions_dto_1 = require("../dto/miscellaneous/actions.dto");
const form_dto_1 = require("../dto/miscellaneous/form.dto");
let AttendanceController = class AttendanceController {
    constructor(attendanceService) {
        this.attendanceService = attendanceService;
    }
    async createSession(miscId, dto, req) {
        return this.attendanceService.createSession(miscId, req.user.id, dto);
    }
    async listSessions(miscId) {
        return this.attendanceService.listSessions(miscId);
    }
};
exports.AttendanceController = AttendanceController;
__decorate([
    (0, common_1.Post)(),
    (0, common_1.HttpCode)(common_1.HttpStatus.CREATED),
    (0, swagger_1.ApiOperation)({ summary: 'Create attendance session' }),
    __param(0, (0, common_1.Param)('miscId')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, actions_dto_1.CreateAttendanceSessionDto, Object]),
    __metadata("design:returntype", Promise)
], AttendanceController.prototype, "createSession", null);
__decorate([
    (0, common_1.Get)(),
    (0, swagger_1.ApiOperation)({ summary: 'List attendance sessions' }),
    __param(0, (0, common_1.Param)('miscId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], AttendanceController.prototype, "listSessions", null);
exports.AttendanceController = AttendanceController = __decorate([
    (0, common_1.Controller)('miscellaneous/:miscId/attendance-sessions'),
    (0, swagger_1.ApiTags)('Attendance'),
    (0, common_1.UseGuards)(authorization_guard_1.AuthorizationGuard),
    (0, swagger_1.ApiBearerAuth)(),
    __metadata("design:paramtypes", [MiscellaneousWaitlistAttendanceService_1.AttendanceService])
], AttendanceController);
let AttendanceSessionController = class AttendanceSessionController {
    constructor(attendanceService) {
        this.attendanceService = attendanceService;
    }
    async getToken(sessionId, req) {
        return this.attendanceService.getOrCreateToken(sessionId, req.user.id);
    }
    async checkIn(sessionId, token) {
        return this.attendanceService.checkInByQr(sessionId, token);
    }
    async manualCheckIn(sessionId, userId, dto, req) {
        return this.attendanceService.manualCheckIn(sessionId, userId, req.user.id, dto);
    }
    async getRecords(sessionId) {
        return this.attendanceService.getRecords(sessionId);
    }
};
exports.AttendanceSessionController = AttendanceSessionController;
__decorate([
    (0, common_1.Get)(':sessionId/token'),
    (0, common_1.UseGuards)(authorization_guard_1.AuthorizationGuard),
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiOperation)({ summary: 'Get QR token for current user' }),
    __param(0, (0, common_1.Param)('sessionId')),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], AttendanceSessionController.prototype, "getToken", null);
__decorate([
    (0, common_1.Post)(':sessionId/check-in'),
    (0, swagger_1.ApiOperation)({ summary: 'Check-in via QR token' }),
    __param(0, (0, common_1.Param)('sessionId')),
    __param(1, (0, common_1.Body)('token')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], AttendanceSessionController.prototype, "checkIn", null);
__decorate([
    (0, common_1.Patch)(':sessionId/records/:userId'),
    (0, common_1.UseGuards)(authorization_guard_1.AuthorizationGuard),
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiOperation)({ summary: 'Manual check-in (owner only)' }),
    __param(0, (0, common_1.Param)('sessionId')),
    __param(1, (0, common_1.Param)('userId')),
    __param(2, (0, common_1.Body)()),
    __param(3, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, actions_dto_1.ManualCheckInDto, Object]),
    __metadata("design:returntype", Promise)
], AttendanceSessionController.prototype, "manualCheckIn", null);
__decorate([
    (0, common_1.Get)(':sessionId/records'),
    (0, common_1.UseGuards)(authorization_guard_1.AuthorizationGuard),
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiOperation)({ summary: 'List attendance records' }),
    __param(0, (0, common_1.Param)('sessionId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], AttendanceSessionController.prototype, "getRecords", null);
exports.AttendanceSessionController = AttendanceSessionController = __decorate([
    (0, common_1.Controller)('attendance-sessions'),
    (0, swagger_1.ApiTags)('Attendance'),
    __metadata("design:paramtypes", [MiscellaneousWaitlistAttendanceService_1.AttendanceService])
], AttendanceSessionController);
let FormController = class FormController {
    constructor(formService) {
        this.formService = formService;
    }
    async createForm(dto, req) {
        return this.formService.createForm(dto, req.user.id);
    }
    async getForm(id) {
        return this.formService.getForm(id);
    }
    async addQuestion(id, dto, req) {
        return this.formService.addQuestion(id, dto, req.user.id);
    }
    async reorderQuestions(id, dto, req) {
        await this.formService.reorderQuestions(id, dto, req.user.id);
        return { message: 'Perguntas reordenadas' };
    }
    async submitResponse(id, dto, req) {
        const userId = req.user?.id ?? null;
        return this.formService.submitResponse(id, dto, userId);
    }
    async getResults(id, req) {
        return this.formService.getResults(id, req.user.id);
    }
};
exports.FormController = FormController;
__decorate([
    (0, common_1.Post)(),
    (0, common_1.HttpCode)(common_1.HttpStatus.CREATED),
    (0, common_1.UseGuards)(authorization_guard_1.AuthorizationGuard),
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiOperation)({ summary: 'Create form' }),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [form_dto_1.CreateFormDto, Object]),
    __metadata("design:returntype", Promise)
], FormController.prototype, "createForm", null);
__decorate([
    (0, common_1.Get)(':id'),
    (0, common_1.UseGuards)(authorization_guard_1.AuthorizationGuard),
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiOperation)({ summary: 'Get form by ID' }),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], FormController.prototype, "getForm", null);
__decorate([
    (0, common_1.Post)(':id/questions'),
    (0, common_1.HttpCode)(common_1.HttpStatus.CREATED),
    (0, common_1.UseGuards)(authorization_guard_1.AuthorizationGuard),
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiOperation)({ summary: 'Add question to form' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, form_dto_1.CreateFormQuestionDto, Object]),
    __metadata("design:returntype", Promise)
], FormController.prototype, "addQuestion", null);
__decorate([
    (0, common_1.Patch)(':id/questions/reorder'),
    (0, common_1.UseGuards)(authorization_guard_1.AuthorizationGuard),
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiOperation)({ summary: 'Reorder questions' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, form_dto_1.ReorderQuestionsDto, Object]),
    __metadata("design:returntype", Promise)
], FormController.prototype, "reorderQuestions", null);
__decorate([
    (0, common_1.Post)(':id/responses'),
    (0, common_1.HttpCode)(common_1.HttpStatus.CREATED),
    (0, swagger_1.ApiOperation)({ summary: 'Submit form response (public or authenticated)' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, form_dto_1.SubmitFormResponseDto, Object]),
    __metadata("design:returntype", Promise)
], FormController.prototype, "submitResponse", null);
__decorate([
    (0, common_1.Get)(':id/results'),
    (0, common_1.UseGuards)(authorization_guard_1.AuthorizationGuard),
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiOperation)({ summary: 'Get form results' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], FormController.prototype, "getResults", null);
exports.FormController = FormController = __decorate([
    (0, common_1.Controller)('forms'),
    (0, swagger_1.ApiTags)('Forms'),
    __metadata("design:paramtypes", [FormService_1.FormService])
], FormController);
let PublicController = class PublicController {
    constructor(miscRepo, formService) {
        this.miscRepo = miscRepo;
        this.formService = formService;
    }
    async publicEvent(slug) {
        const misc = await this.miscRepo.findBySlug(slug);
        if (!misc || !misc.public_access_enabled) {
            throw new common_1.NotFoundException('Evento n\u00e3o encontrado');
        }
        return misc;
    }
    async publicForm(slug) {
        return this.formService.getFormBySlug(slug);
    }
};
exports.PublicController = PublicController;
__decorate([
    (0, common_1.Get)('eventos/:slug'),
    (0, swagger_1.ApiOperation)({ summary: 'Public event page (no auth)' }),
    __param(0, (0, common_1.Param)('slug')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], PublicController.prototype, "publicEvent", null);
__decorate([
    (0, common_1.Get)('formularios/:slug'),
    (0, swagger_1.ApiOperation)({ summary: 'Public form page (no auth)' }),
    __param(0, (0, common_1.Param)('slug')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], PublicController.prototype, "publicForm", null);
exports.PublicController = PublicController = __decorate([
    (0, common_1.Controller)('public'),
    (0, swagger_1.ApiTags)('Public'),
    __metadata("design:paramtypes", [MiscellaneousRepository_1.MiscellaneousRepository,
        FormService_1.FormService])
], PublicController);
