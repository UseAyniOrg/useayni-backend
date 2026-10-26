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
exports.EventParticipationController = exports.ExternalProfileController = exports.PublicController = exports.FormController = exports.AttendanceSessionController = exports.AttendanceController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const authorization_guard_1 = require("../middlewares/authorization.guard");
const requireFeature_decorator_1 = require("../middlewares/requireFeature.decorator");
const ExternalEventRegistrationService_1 = require("../services/ExternalEventRegistrationService");
const MiscellaneousWaitlistAttendanceService_1 = require("../services/MiscellaneousWaitlistAttendanceService");
const FormService_1 = require("../services/FormService");
const MiscellaneousRepository_1 = require("../repositories/MiscellaneousRepository");
const actions_dto_1 = require("../dto/miscellaneous/actions.dto");
const form_dto_1 = require("../dto/miscellaneous/form.dto");
const MediaAssetService_1 = require("../services/MediaAssetService");
const communitySession_guard_1 = require("../middlewares/communitySession.guard");
let AttendanceController = class AttendanceController {
    constructor(attendanceService) {
        this.attendanceService = attendanceService;
    }
    async createSession(miscId, dto, req) {
        return this.attendanceService.createSession(miscId, req.user.id, dto, req.user);
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
    (0, common_1.UseGuards)(authorization_guard_1.AuthorizationGuard, requireFeature_decorator_1.FeatureFlagGuard),
    (0, requireFeature_decorator_1.RequireFeature)('miscellaneous_attendance'),
    (0, swagger_1.ApiBearerAuth)(),
    __metadata("design:paramtypes", [MiscellaneousWaitlistAttendanceService_1.AttendanceService])
], AttendanceController);
let AttendanceSessionController = class AttendanceSessionController {
    constructor(attendanceService) {
        this.attendanceService = attendanceService;
    }
    async deleteSession(sessionId, req) {
        await this.attendanceService.deleteSession(sessionId, req.user.id, req.user);
    }
    async getToken(sessionId, req) {
        return this.attendanceService.getOrCreateToken(sessionId, req.user.id);
    }
    async checkIn(sessionId, token, req) {
        return this.attendanceService.checkInByQr(sessionId, token, req.user.id, req.user);
    }
    async manualCheckIn(sessionId, userId, dto, req) {
        return this.attendanceService.manualCheckIn(sessionId, userId, req.user.id, dto, req.user);
    }
    async getRecords(sessionId) {
        return this.attendanceService.getRecords(sessionId);
    }
};
exports.AttendanceSessionController = AttendanceSessionController;
__decorate([
    (0, common_1.Delete)(':sessionId'),
    (0, common_1.HttpCode)(common_1.HttpStatus.NO_CONTENT),
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiOperation)({ summary: 'Permanently delete attendance session and its records (owner only)' }),
    __param(0, (0, common_1.Param)('sessionId', common_1.ParseUUIDPipe)),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], AttendanceSessionController.prototype, "deleteSession", null);
__decorate([
    (0, common_1.Get)(':sessionId/token'),
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
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiOperation)({ summary: 'Check-in via QR token (owner only)' }),
    __param(0, (0, common_1.Param)('sessionId')),
    __param(1, (0, common_1.Body)('token')),
    __param(2, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, Object]),
    __metadata("design:returntype", Promise)
], AttendanceSessionController.prototype, "checkIn", null);
__decorate([
    (0, common_1.Patch)(':sessionId/records/:userId'),
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
    (0, common_1.UseGuards)(authorization_guard_1.AuthorizationGuard, requireFeature_decorator_1.FeatureFlagGuard),
    (0, requireFeature_decorator_1.RequireFeature)('miscellaneous_attendance'),
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
    (0, common_1.UseGuards)(authorization_guard_1.AuthorizationGuard, requireFeature_decorator_1.FeatureFlagGuard),
    (0, requireFeature_decorator_1.RequireFeature)('miscellaneous_forms'),
    __metadata("design:paramtypes", [FormService_1.FormService])
], FormController);
let PublicController = class PublicController {
    constructor(miscRepo, formService, externalRegistrationService, mediaService, attendanceService) {
        this.miscRepo = miscRepo;
        this.formService = formService;
        this.externalRegistrationService = externalRegistrationService;
        this.mediaService = mediaService;
        this.attendanceService = attendanceService;
    }
    async publicEvent(slug, request) {
        const misc = await this.miscRepo.findBySlug(slug);
        if (!misc || !misc.public_access_enabled) {
            throw new common_1.NotFoundException('Evento n\u00e3o encontrado');
        }
        const media = await this.mediaService.publicMiscellaneousMedia(request.tenant.organization_id, misc.id);
        return { ...misc, media };
    }
    async publicForm(slug, request) {
        const form = await this.formService.getFormBySlug(slug);
        const media = form.miscellaneous_id
            ? await this.mediaService.publicMiscellaneousMedia(request.tenant.organization_id, form.miscellaneous_id)
            : null;
        return { ...form, media };
    }
    async eventRegistrationInfo(slug, request) {
        const event = await this.externalRegistrationService.getPublicEvent(slug, request.tenant.organization_id);
        const mediaEnabled = request.tenant.features.includes('media_storage');
        const media = mediaEnabled ? await this.mediaService.publicMiscellaneousMedia(request.tenant.organization_id, event.id) : null;
        return { ...event, media, media_enabled: mediaEnabled };
    }
    async myRegistration(slug, request) {
        return this.externalRegistrationService.registrationStatus(slug, request.tenant.organization_id, request.user?.account_id);
    }
    async registerForEvent(slug, body, request) {
        return this.externalRegistrationService.register(slug, body, request.tenant.organization_id, request.user?.account_id);
    }
    async participantAttendance(slug, request) {
        const participant = await this.externalRegistrationService.requireEventParticipant(slug, request.tenant.organization_id, request.user?.account_id);
        if (!request.tenant.features.includes('miscellaneous_attendance'))
            return [];
        return this.attendanceService.listSessions(participant.eventId);
    }
    async participantAttendanceToken(slug, sessionId, request) {
        const participant = await this.externalRegistrationService.requireEventParticipant(slug, request.tenant.organization_id, request.user?.account_id);
        return this.attendanceService.getParticipantToken(participant.eventId, sessionId, participant.memberId);
    }
};
exports.PublicController = PublicController;
__decorate([
    (0, common_1.Get)('eventos/:slug'),
    (0, swagger_1.ApiOperation)({ summary: 'Public event page (no auth)' }),
    __param(0, (0, common_1.Param)('slug')),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], PublicController.prototype, "publicEvent", null);
__decorate([
    (0, common_1.Get)('formularios/:slug'),
    (0, swagger_1.ApiOperation)({ summary: 'Public form page (no auth)' }),
    __param(0, (0, common_1.Param)('slug')),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], PublicController.prototype, "publicForm", null);
__decorate([
    (0, common_1.Get)('events/:slug/registration'),
    (0, common_1.UseGuards)(requireFeature_decorator_1.FeatureFlagGuard),
    (0, requireFeature_decorator_1.RequireFeature)('miscellaneous_public'),
    (0, swagger_1.ApiOperation)({ summary: 'Get public event and external registration requirements' }),
    __param(0, (0, common_1.Param)('slug')),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], PublicController.prototype, "eventRegistrationInfo", null);
__decorate([
    (0, common_1.Get)('events/:slug/my-registration'),
    (0, common_1.UseGuards)(communitySession_guard_1.CommunitySessionGuard),
    __param(0, (0, common_1.Param)('slug')),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], PublicController.prototype, "myRegistration", null);
__decorate([
    (0, common_1.Post)('events/:slug/register'),
    (0, common_1.HttpCode)(common_1.HttpStatus.CREATED),
    (0, common_1.UseGuards)(requireFeature_decorator_1.FeatureFlagGuard, communitySession_guard_1.CommunitySessionGuard),
    (0, requireFeature_decorator_1.RequireFeature)('miscellaneous_public'),
    (0, swagger_1.ApiOperation)({ summary: 'Create a global external account and register for a public event' }),
    __param(0, (0, common_1.Param)('slug')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, Object]),
    __metadata("design:returntype", Promise)
], PublicController.prototype, "registerForEvent", null);
__decorate([
    (0, common_1.Get)('events/:slug/attendance'),
    (0, common_1.UseGuards)(communitySession_guard_1.CommunitySessionGuard),
    __param(0, (0, common_1.Param)('slug')),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], PublicController.prototype, "participantAttendance", null);
__decorate([
    (0, common_1.Get)('events/:slug/attendance/:sessionId/token'),
    (0, common_1.UseGuards)(communitySession_guard_1.CommunitySessionGuard, requireFeature_decorator_1.FeatureFlagGuard),
    (0, requireFeature_decorator_1.RequireFeature)('miscellaneous_attendance'),
    __param(0, (0, common_1.Param)('slug')),
    __param(1, (0, common_1.Param)('sessionId', common_1.ParseUUIDPipe)),
    __param(2, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, Object]),
    __metadata("design:returntype", Promise)
], PublicController.prototype, "participantAttendanceToken", null);
exports.PublicController = PublicController = __decorate([
    (0, common_1.Controller)('public'),
    (0, swagger_1.ApiTags)('Public'),
    (0, common_1.UseGuards)(requireFeature_decorator_1.FeatureFlagGuard),
    (0, requireFeature_decorator_1.RequireFeature)('miscellaneous_public'),
    __metadata("design:paramtypes", [MiscellaneousRepository_1.MiscellaneousRepository,
        FormService_1.FormService,
        ExternalEventRegistrationService_1.ExternalEventRegistrationService,
        MediaAssetService_1.MediaAssetService,
        MiscellaneousWaitlistAttendanceService_1.AttendanceService])
], PublicController);
let ExternalProfileController = class ExternalProfileController {
    constructor(externalRegistrationService) {
        this.externalRegistrationService = externalRegistrationService;
    }
    getMyProfile(request) {
        return this.externalRegistrationService.getMyProfile(request.user?.account_id);
    }
    getMyRegistrations(request) {
        return this.externalRegistrationService.getMyRegistrations(request.user?.account_id, request.tenant.organization_id);
    }
    updateMyProfile(request, body) {
        return this.externalRegistrationService.updateMyProfile(request.user?.account_id, body);
    }
};
exports.ExternalProfileController = ExternalProfileController;
__decorate([
    (0, common_1.Get)('me'),
    (0, swagger_1.ApiOperation)({ summary: 'Get the authenticated account external profile' }),
    __param(0, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], ExternalProfileController.prototype, "getMyProfile", null);
__decorate([
    (0, common_1.Get)('registrations'),
    __param(0, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], ExternalProfileController.prototype, "getMyRegistrations", null);
__decorate([
    (0, common_1.Patch)('me'),
    (0, swagger_1.ApiOperation)({ summary: 'Update the authenticated account external profile' }),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", void 0)
], ExternalProfileController.prototype, "updateMyProfile", null);
exports.ExternalProfileController = ExternalProfileController = __decorate([
    (0, common_1.Controller)('external-profile'),
    (0, swagger_1.ApiTags)('External profiles'),
    (0, common_1.UseGuards)(authorization_guard_1.AuthorizationGuard),
    (0, swagger_1.ApiBearerAuth)(),
    __metadata("design:paramtypes", [ExternalEventRegistrationService_1.ExternalEventRegistrationService])
], ExternalProfileController);
let EventParticipationController = class EventParticipationController {
    constructor(registrations) {
        this.registrations = registrations;
    }
    getAnswers(id, req) {
        return this.registrations.getParticipantAnswers(id, req.tenant.organization_id, req.user?.account_id);
    }
    updateAnswers(id, req, input) {
        return this.registrations.updateParticipantAnswers(id, req.tenant.organization_id, req.user?.account_id, input);
    }
};
exports.EventParticipationController = EventParticipationController;
__decorate([
    (0, common_1.Get)(':id/answers'),
    __param(0, (0, common_1.Param)('id', common_1.ParseUUIDPipe)),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], EventParticipationController.prototype, "getAnswers", null);
__decorate([
    (0, common_1.Patch)(':id/answers'),
    __param(0, (0, common_1.Param)('id', common_1.ParseUUIDPipe)),
    __param(1, (0, common_1.Req)()),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, Object]),
    __metadata("design:returntype", void 0)
], EventParticipationController.prototype, "updateAnswers", null);
exports.EventParticipationController = EventParticipationController = __decorate([
    (0, common_1.Controller)('event-participation'),
    (0, common_1.UseGuards)(communitySession_guard_1.CommunitySessionGuard),
    __metadata("design:paramtypes", [ExternalEventRegistrationService_1.ExternalEventRegistrationService])
], EventParticipationController);
