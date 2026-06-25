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
exports.MiscellaneousAccessService = void 0;
const common_1 = require("@nestjs/common");
const MiscellaneousSubRepositories_1 = require("../repositories/MiscellaneousSubRepositories");
const MiscellaneousRepository_1 = require("../repositories/MiscellaneousRepository");
const miscellaneousRequest_1 = require("../models/miscellaneousRequest");
const miscellaneousInvite_1 = require("../models/miscellaneousInvite");
const miscellaneous_1 = require("../models/miscellaneous");
const REQUEST_EXPIRY_DAYS = 30;
const INVITE_EXPIRY_DAYS = 7;
let MiscellaneousAccessService = class MiscellaneousAccessService {
    constructor(miscRepo, requestRepo, inviteRepo, participantRepo, ownerRepo) {
        this.miscRepo = miscRepo;
        this.requestRepo = requestRepo;
        this.inviteRepo = inviteRepo;
        this.participantRepo = participantRepo;
        this.ownerRepo = ownerRepo;
    }
    // Requests
    async createRequest(miscId, userId, dto) {
        const misc = await this.miscRepo.findById(miscId);
        if (!misc)
            throw new common_1.NotFoundException('Miscelânea não encontrada');
        if (misc.visibility !== miscellaneous_1.MiscellaneousVisibility.PRIVATE) {
            throw new common_1.BadRequestException('Solicitações são apenas para miscelâneas privadas');
        }
        const active = await this.requestRepo.findActivByMember(miscId, userId);
        if (active)
            throw new common_1.BadRequestException('Você já possui uma solicitação ativa para esta miscelânea');
        const expiresAt = new Date();
        expiresAt.setDate(expiresAt.getDate() + REQUEST_EXPIRY_DAYS);
        return this.requestRepo.create({
            miscellaneous_id: miscId,
            member_id: userId,
            title: dto.title,
            message: dto.message,
            expires_at: expiresAt,
        });
    }
    async listRequests(miscId, requesterId) {
        await this.ensureOwner(miscId, requesterId);
        return this.requestRepo.findByMiscellaneous(miscId);
    }
    async reviewRequest(miscId, requestId, reviewerId, dto) {
        await this.ensureOwner(miscId, reviewerId);
        const request = await this.requestRepo.findById(requestId);
        if (!request)
            throw new common_1.NotFoundException('Solicitação não encontrada');
        if (request.miscellaneous_id !== miscId)
            throw new common_1.BadRequestException('Solicitação não pertence a esta miscelânea');
        if (request.status !== miscellaneousRequest_1.RequestStatus.PENDING)
            throw new common_1.BadRequestException('Solicitação não está pendente');
        await this.requestRepo.update(requestId, {
            status: dto.status === 'approved' ? miscellaneousRequest_1.RequestStatus.APPROVED : miscellaneousRequest_1.RequestStatus.REJECTED,
            reviewed_by: reviewerId,
            reviewed_at: new Date(),
            response_message: dto.response_message,
        });
        if (dto.status === 'approved') {
            await this.participantRepo.add(miscId, request.member_id);
        }
        return this.requestRepo.findById(requestId);
    }
    // Invites
    async createInvite(miscId, inviterId, dto) {
        await this.ensureOwner(miscId, inviterId);
        const already = await this.inviteRepo.hasPendingInvite(miscId, dto.invited_user_id);
        if (already)
            throw new common_1.BadRequestException('Já existe um convite pendente para este usuário');
        const isAlreadyMember = await this.participantRepo.isParticipant(miscId, dto.invited_user_id);
        if (isAlreadyMember)
            throw new common_1.BadRequestException('Usuário já é membro desta miscelânea');
        const expiresAt = new Date();
        expiresAt.setDate(expiresAt.getDate() + INVITE_EXPIRY_DAYS);
        return this.inviteRepo.create({
            miscellaneous_id: miscId,
            invited_by_user_id: inviterId,
            invited_user_id: dto.invited_user_id,
            message: dto.message,
            expires_at: expiresAt,
        });
    }
    async acceptInvite(miscId, inviteId, userId) {
        const invite = await this.inviteRepo.findById(inviteId);
        if (!invite)
            throw new common_1.NotFoundException('Convite não encontrado');
        if (invite.invited_user_id !== userId)
            throw new common_1.ForbiddenException('Este convite não é para você');
        if (invite.status !== miscellaneousInvite_1.InviteStatus.PENDING)
            throw new common_1.BadRequestException('Convite não está pendente');
        if (invite.expires_at < new Date())
            throw new common_1.BadRequestException('Convite expirado');
        await this.inviteRepo.update(inviteId, { status: miscellaneousInvite_1.InviteStatus.ACCEPTED, responded_at: new Date() });
        await this.participantRepo.add(miscId, userId);
    }
    async rejectInvite(miscId, inviteId, userId, dto) {
        const invite = await this.inviteRepo.findById(inviteId);
        if (!invite)
            throw new common_1.NotFoundException('Convite não encontrado');
        if (invite.invited_user_id !== userId)
            throw new common_1.ForbiddenException('Este convite não é para você');
        if (invite.status !== miscellaneousInvite_1.InviteStatus.PENDING)
            throw new common_1.BadRequestException('Convite não está pendente');
        await this.inviteRepo.update(inviteId, {
            status: miscellaneousInvite_1.InviteStatus.REJECTED,
            rejection_reason: dto.rejection_reason,
            responded_at: new Date(),
        });
    }
    async cancelInvite(miscId, inviteId, requesterId) {
        await this.ensureOwner(miscId, requesterId);
        const invite = await this.inviteRepo.findById(inviteId);
        if (!invite)
            throw new common_1.NotFoundException('Convite não encontrado');
        if (invite.status !== miscellaneousInvite_1.InviteStatus.PENDING)
            throw new common_1.BadRequestException('Convite não pode ser cancelado');
        await this.inviteRepo.update(inviteId, { status: miscellaneousInvite_1.InviteStatus.CANCELLED });
    }
    async listPendingInvites(miscId, requesterId) {
        await this.ensureOwner(miscId, requesterId);
        return this.inviteRepo.findPendingByMiscellaneous(miscId);
    }
    async listMyInvites(userId) {
        return this.inviteRepo.findPendingForUser(userId);
    }
    async ensureOwner(miscId, userId) {
        const isOwner = await this.ownerRepo.isOwner(miscId, userId);
        if (!isOwner)
            throw new common_1.ForbiddenException('Apenas donos podem realizar esta ação');
    }
};
exports.MiscellaneousAccessService = MiscellaneousAccessService;
exports.MiscellaneousAccessService = MiscellaneousAccessService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [MiscellaneousRepository_1.MiscellaneousRepository,
        MiscellaneousSubRepositories_1.MiscellaneousRequestRepository,
        MiscellaneousSubRepositories_1.MiscellaneousInviteRepository,
        MiscellaneousSubRepositories_1.MiscellaneousParticipantRepository,
        MiscellaneousSubRepositories_1.MiscellaneousOwnerRepository])
], MiscellaneousAccessService);
