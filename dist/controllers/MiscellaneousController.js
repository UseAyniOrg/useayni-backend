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
exports.MyInvitesController = exports.ApprovalController = exports.MiscellaneousController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const authorization_guard_1 = require("../middlewares/authorization.guard");
const MiscellaneousService_1 = require("../services/MiscellaneousService");
const MiscellaneousAccessService_1 = require("../services/MiscellaneousAccessService");
const MiscellaneousWaitlistAttendanceService_1 = require("../services/MiscellaneousWaitlistAttendanceService");
const miscellaneous_dto_1 = require("../dto/miscellaneous/miscellaneous.dto");
const actions_dto_1 = require("../dto/miscellaneous/actions.dto");
let MiscellaneousController = class MiscellaneousController {
    constructor(miscService, accessService, waitlistService) {
        this.miscService = miscService;
        this.accessService = accessService;
        this.waitlistService = waitlistService;
    }
    // ─── CRUD ─────────────────────────────────────────────────────────────────
    async create(dto, req) {
        const user = req.user;
        return this.miscService.create(dto, user.id, user.roles);
    }
    async findAll(filters, req) {
        return this.miscService.findAll(filters, req.user.id);
    }
    async findOne(id) {
        return this.miscService.findById(id);
    }
    async update(id, dto, req) {
        return this.miscService.update(id, dto, req.user.id);
    }
    async archive(id, req) {
        await this.miscService.archive(id, req.user.id);
        return { message: 'Miscelânea arquivada com sucesso' };
    }
    async remove(id, req) {
        await this.miscService.remove(id, req.user.id);
    }
    // ─── HIERARCHY ────────────────────────────────────────────────────────────
    async getChildren(id) {
        return this.miscService.getChildren(id);
    }
    // ─── PEOPLE ───────────────────────────────────────────────────────────────
    async getPeople(id) {
        return this.miscService.getPeople(id);
    }
    async searchMembers(id, query, req) {
        return this.miscService.searchMembers(id, req.user.id, query);
    }
    async addOwner(id, body, req) {
        const targetMemberId = await this.miscService.resolveMemberTarget(body.member_id, body.member_query);
        return this.miscService.addOwner(id, targetMemberId, req.user.id);
    }
    async removeOwner(id, userId, req) {
        await this.miscService.removeOwner(id, userId, req.user.id);
    }
    async addMember(id, body, req) {
        const targetMemberId = await this.miscService.resolveMemberTarget(body.member_id, body.member_query);
        return this.miscService.addMember(id, targetMemberId, req.user.id);
    }
    async removeMember(id, userId, req) {
        await this.miscService.removeMember(id, userId, req.user.id);
    }
    // ─── APPROVAL ─────────────────────────────────────────────────────────────
    async approve(id, dto, req) {
        await this.miscService.approve(id, req.user.id, dto);
        return { message: 'Miscelânea aprovada com sucesso' };
    }
    async reject(id, dto, req) {
        await this.miscService.reject(id, req.user.id, dto);
        return { message: 'Miscelânea rejeitada' };
    }
    async requestReview(id, dto, req) {
        await this.miscService.requestReview(id, req.user.id, dto);
        return { message: 'Solicitação de revisão registrada' };
    }
    async approvalHistory(id) {
        return this.miscService.getApprovalHistory(id);
    }
    // ─── REQUESTS ─────────────────────────────────────────────────────────────
    async createRequest(id, dto, req) {
        return this.accessService.createRequest(id, req.user.id, dto);
    }
    async listRequests(id, req) {
        return this.accessService.listRequests(id, req.user.id);
    }
    async reviewRequest(id, requestId, dto, req) {
        return this.accessService.reviewRequest(id, requestId, req.user.id, dto);
    }
    // ─── INVITES ──────────────────────────────────────────────────────────────
    async createInvite(id, dto, req) {
        return this.accessService.createInvite(id, req.user.id, dto);
    }
    async listInvites(id, req) {
        return this.accessService.listPendingInvites(id, req.user.id);
    }
    async acceptInvite(id, inviteId, req) {
        await this.accessService.acceptInvite(id, inviteId, req.user.id);
        return { message: 'Convite aceito' };
    }
    async rejectInvite(id, inviteId, dto, req) {
        await this.accessService.rejectInvite(id, inviteId, req.user.id, dto);
        return { message: 'Convite recusado' };
    }
    async cancelInvite(id, inviteId, req) {
        await this.accessService.cancelInvite(id, inviteId, req.user.id);
    }
    // ─── WAITLIST ─────────────────────────────────────────────────────────────
    async joinWaitlist(id, req) {
        return this.waitlistService.joinWaitlist(id, req.user.id);
    }
    async getWaitlist(id, req) {
        return this.waitlistService.getWaitlist(id, req.user.id);
    }
    async promote(id, userId, req) {
        await this.waitlistService.promote(id, userId, req.user.id);
        return { message: 'Usuário promovido da lista de espera' };
    }
    async closeRegistrations(id, req) {
        await this.miscService.ensureOwner(id, req.user.id);
        await this.miscService.closeRegistrations(id);
        return { message: 'Inscrições encerradas' };
    }
    // ─── PUBLIC ACCESS ────────────────────────────────────────────────────────
    async enablePublicAccess(id, req) {
        const slug = await this.miscService.enablePublicAccess(id, req.user.id);
        return { slug, url: `/p/${slug}` };
    }
    async disablePublicAccess(id, req) {
        await this.miscService.disablePublicAccess(id, req.user.id);
        return { message: 'Acesso público desativado' };
    }
};
exports.MiscellaneousController = MiscellaneousController;
__decorate([
    (0, common_1.Post)(),
    (0, common_1.HttpCode)(common_1.HttpStatus.CREATED),
    (0, swagger_1.ApiOperation)({ summary: 'Create miscellaneous' }),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [miscellaneous_dto_1.CreateMiscellaneousDto, Object]),
    __metadata("design:returntype", Promise)
], MiscellaneousController.prototype, "create", null);
__decorate([
    (0, common_1.Get)(),
    (0, swagger_1.ApiOperation)({ summary: 'List miscellaneous with filters' }),
    __param(0, (0, common_1.Query)()),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [miscellaneous_dto_1.MiscellaneousFiltersDto, Object]),
    __metadata("design:returntype", Promise)
], MiscellaneousController.prototype, "findAll", null);
__decorate([
    (0, common_1.Get)(':id'),
    (0, swagger_1.ApiOperation)({ summary: 'Get miscellaneous by ID' }),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], MiscellaneousController.prototype, "findOne", null);
__decorate([
    (0, common_1.Patch)(':id'),
    (0, swagger_1.ApiOperation)({ summary: 'Update miscellaneous' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, miscellaneous_dto_1.UpdateMiscellaneousDto, Object]),
    __metadata("design:returntype", Promise)
], MiscellaneousController.prototype, "update", null);
__decorate([
    (0, common_1.Patch)(':id/archive'),
    (0, swagger_1.ApiOperation)({ summary: 'Archive miscellaneous' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], MiscellaneousController.prototype, "archive", null);
__decorate([
    (0, common_1.Delete)(':id'),
    (0, common_1.HttpCode)(common_1.HttpStatus.NO_CONTENT),
    (0, swagger_1.ApiOperation)({ summary: 'Soft-delete miscellaneous' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], MiscellaneousController.prototype, "remove", null);
__decorate([
    (0, common_1.Get)(':id/children'),
    (0, swagger_1.ApiOperation)({ summary: 'Get children grouped by type' }),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], MiscellaneousController.prototype, "getChildren", null);
__decorate([
    (0, common_1.Get)(':id/people'),
    (0, swagger_1.ApiOperation)({ summary: 'Get owners and members' }),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], MiscellaneousController.prototype, "getPeople", null);
__decorate([
    (0, common_1.Get)(':id/search-members'),
    (0, swagger_1.ApiOperation)({ summary: 'Search members by name or email' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Query)('query')),
    __param(2, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, Object]),
    __metadata("design:returntype", Promise)
], MiscellaneousController.prototype, "searchMembers", null);
__decorate([
    (0, common_1.Post)(':id/owners'),
    (0, swagger_1.ApiOperation)({ summary: 'Add co-owner' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, Object]),
    __metadata("design:returntype", Promise)
], MiscellaneousController.prototype, "addOwner", null);
__decorate([
    (0, common_1.Delete)(':id/owners/:userId'),
    (0, common_1.HttpCode)(common_1.HttpStatus.NO_CONTENT),
    (0, swagger_1.ApiOperation)({ summary: 'Remove owner' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Param)('userId')),
    __param(2, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, Object]),
    __metadata("design:returntype", Promise)
], MiscellaneousController.prototype, "removeOwner", null);
__decorate([
    (0, common_1.Post)(':id/members'),
    (0, swagger_1.ApiOperation)({ summary: 'Add member' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, Object]),
    __metadata("design:returntype", Promise)
], MiscellaneousController.prototype, "addMember", null);
__decorate([
    (0, common_1.Delete)(':id/members/:userId'),
    (0, common_1.HttpCode)(common_1.HttpStatus.NO_CONTENT),
    (0, swagger_1.ApiOperation)({ summary: 'Remove member' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Param)('userId')),
    __param(2, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, Object]),
    __metadata("design:returntype", Promise)
], MiscellaneousController.prototype, "removeMember", null);
__decorate([
    (0, common_1.Patch)(':id/approve'),
    (0, swagger_1.ApiOperation)({ summary: 'Approve miscellaneous (manager only)' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, actions_dto_1.ApprovalActionDto, Object]),
    __metadata("design:returntype", Promise)
], MiscellaneousController.prototype, "approve", null);
__decorate([
    (0, common_1.Patch)(':id/reject'),
    (0, swagger_1.ApiOperation)({ summary: 'Reject miscellaneous' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, actions_dto_1.ApprovalActionDto, Object]),
    __metadata("design:returntype", Promise)
], MiscellaneousController.prototype, "reject", null);
__decorate([
    (0, common_1.Patch)(':id/request-review'),
    (0, swagger_1.ApiOperation)({ summary: 'Request review for miscellaneous' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, actions_dto_1.ApprovalActionDto, Object]),
    __metadata("design:returntype", Promise)
], MiscellaneousController.prototype, "requestReview", null);
__decorate([
    (0, common_1.Get)(':id/approval-history'),
    (0, swagger_1.ApiOperation)({ summary: 'Get approval history' }),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], MiscellaneousController.prototype, "approvalHistory", null);
__decorate([
    (0, common_1.Post)(':id/requests'),
    (0, common_1.HttpCode)(common_1.HttpStatus.CREATED),
    (0, swagger_1.ApiOperation)({ summary: 'Submit participation request' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, actions_dto_1.CreateRequestDto, Object]),
    __metadata("design:returntype", Promise)
], MiscellaneousController.prototype, "createRequest", null);
__decorate([
    (0, common_1.Get)(':id/requests'),
    (0, swagger_1.ApiOperation)({ summary: 'List participation requests (owner only)' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], MiscellaneousController.prototype, "listRequests", null);
__decorate([
    (0, common_1.Patch)(':id/requests/:requestId'),
    (0, swagger_1.ApiOperation)({ summary: 'Approve or reject request (owner only)' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Param)('requestId')),
    __param(2, (0, common_1.Body)()),
    __param(3, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, actions_dto_1.ReviewRequestDto, Object]),
    __metadata("design:returntype", Promise)
], MiscellaneousController.prototype, "reviewRequest", null);
__decorate([
    (0, common_1.Post)(':id/invites'),
    (0, common_1.HttpCode)(common_1.HttpStatus.CREATED),
    (0, swagger_1.ApiOperation)({ summary: 'Send invite (owner only)' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, actions_dto_1.CreateInviteDto, Object]),
    __metadata("design:returntype", Promise)
], MiscellaneousController.prototype, "createInvite", null);
__decorate([
    (0, common_1.Get)(':id/invites'),
    (0, swagger_1.ApiOperation)({ summary: 'List pending invites (owner only)' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], MiscellaneousController.prototype, "listInvites", null);
__decorate([
    (0, common_1.Patch)(':id/invites/:inviteId/accept'),
    (0, swagger_1.ApiOperation)({ summary: 'Accept invite' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Param)('inviteId')),
    __param(2, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, Object]),
    __metadata("design:returntype", Promise)
], MiscellaneousController.prototype, "acceptInvite", null);
__decorate([
    (0, common_1.Patch)(':id/invites/:inviteId/reject'),
    (0, swagger_1.ApiOperation)({ summary: 'Reject invite' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Param)('inviteId')),
    __param(2, (0, common_1.Body)()),
    __param(3, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, actions_dto_1.RejectInviteDto, Object]),
    __metadata("design:returntype", Promise)
], MiscellaneousController.prototype, "rejectInvite", null);
__decorate([
    (0, common_1.Delete)(':id/invites/:inviteId'),
    (0, common_1.HttpCode)(common_1.HttpStatus.NO_CONTENT),
    (0, swagger_1.ApiOperation)({ summary: 'Cancel invite (owner only)' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Param)('inviteId')),
    __param(2, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, Object]),
    __metadata("design:returntype", Promise)
], MiscellaneousController.prototype, "cancelInvite", null);
__decorate([
    (0, common_1.Post)(':id/waitlist/join'),
    (0, swagger_1.ApiOperation)({ summary: 'Join waitlist' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], MiscellaneousController.prototype, "joinWaitlist", null);
__decorate([
    (0, common_1.Get)(':id/waitlist'),
    (0, swagger_1.ApiOperation)({ summary: 'Get waitlist (owner only)' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], MiscellaneousController.prototype, "getWaitlist", null);
__decorate([
    (0, common_1.Post)(':id/waitlist/promote/:userId'),
    (0, swagger_1.ApiOperation)({ summary: 'Promote user from waitlist (owner only)' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Param)('userId')),
    __param(2, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, Object]),
    __metadata("design:returntype", Promise)
], MiscellaneousController.prototype, "promote", null);
__decorate([
    (0, common_1.Post)(':id/registrations/close'),
    (0, swagger_1.ApiOperation)({ summary: 'Close registrations manually (owner only)' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], MiscellaneousController.prototype, "closeRegistrations", null);
__decorate([
    (0, common_1.Post)(':id/public-access/enable'),
    (0, swagger_1.ApiOperation)({ summary: 'Enable public access (owner only)' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], MiscellaneousController.prototype, "enablePublicAccess", null);
__decorate([
    (0, common_1.Post)(':id/public-access/disable'),
    (0, swagger_1.ApiOperation)({ summary: 'Disable public access (owner only)' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], MiscellaneousController.prototype, "disablePublicAccess", null);
exports.MiscellaneousController = MiscellaneousController = __decorate([
    (0, common_1.Controller)('miscellaneous'),
    (0, swagger_1.ApiTags)('Miscellaneous'),
    (0, common_1.UseGuards)(authorization_guard_1.AuthorizationGuard),
    (0, swagger_1.ApiBearerAuth)(),
    __metadata("design:paramtypes", [MiscellaneousService_1.MiscellaneousService,
        MiscellaneousAccessService_1.MiscellaneousAccessService,
        MiscellaneousWaitlistAttendanceService_1.MiscellaneousWaitlistService])
], MiscellaneousController);
let ApprovalController = class ApprovalController {
    constructor(miscService) {
        this.miscService = miscService;
    }
    async listPending() {
        return this.miscService.getPendingApprovals();
    }
};
exports.ApprovalController = ApprovalController;
__decorate([
    (0, common_1.Get)('pending'),
    (0, swagger_1.ApiOperation)({ summary: 'List all pending approvals (manager)' }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], ApprovalController.prototype, "listPending", null);
exports.ApprovalController = ApprovalController = __decorate([
    (0, common_1.Controller)('approvals'),
    (0, swagger_1.ApiTags)('Approvals'),
    (0, common_1.UseGuards)(authorization_guard_1.AuthorizationGuard),
    (0, swagger_1.ApiBearerAuth)(),
    __metadata("design:paramtypes", [MiscellaneousService_1.MiscellaneousService])
], ApprovalController);
let MyInvitesController = class MyInvitesController {
    constructor(accessService) {
        this.accessService = accessService;
    }
    async myInvites(req) {
        return this.accessService.listMyInvites(req.user.id);
    }
};
exports.MyInvitesController = MyInvitesController;
__decorate([
    (0, common_1.Get)('mine'),
    (0, swagger_1.ApiOperation)({ summary: 'List my pending invites' }),
    __param(0, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], MyInvitesController.prototype, "myInvites", null);
exports.MyInvitesController = MyInvitesController = __decorate([
    (0, common_1.Controller)('invites'),
    (0, swagger_1.ApiTags)('Invites'),
    (0, common_1.UseGuards)(authorization_guard_1.AuthorizationGuard),
    (0, swagger_1.ApiBearerAuth)(),
    __metadata("design:paramtypes", [MiscellaneousAccessService_1.MiscellaneousAccessService])
], MyInvitesController);
