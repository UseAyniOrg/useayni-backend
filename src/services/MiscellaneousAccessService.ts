import { Injectable, BadRequestException, ForbiddenException, NotFoundException } from '@nestjs/common';
import { MiscellaneousRequestRepository, MiscellaneousInviteRepository, MiscellaneousParticipantRepository, MiscellaneousOwnerRepository } from '../repositories/MiscellaneousSubRepositories';
import { MiscellaneousRepository } from '../repositories/MiscellaneousRepository';
import { CreateRequestDto, ReviewRequestDto, CreateInviteDto, RejectInviteDto } from '../dto/miscellaneous/actions.dto';
import { RequestStatus } from '../models/miscellaneousRequest';
import { InviteStatus } from '../models/miscellaneousInvite';
import { MiscellaneousVisibility } from '../models/miscellaneous';

const REQUEST_EXPIRY_DAYS = 30;
const INVITE_EXPIRY_DAYS = 7;

@Injectable()
export class MiscellaneousAccessService {
  constructor(
    private readonly miscRepo: MiscellaneousRepository,
    private readonly requestRepo: MiscellaneousRequestRepository,
    private readonly inviteRepo: MiscellaneousInviteRepository,
    private readonly participantRepo: MiscellaneousParticipantRepository,
    private readonly ownerRepo: MiscellaneousOwnerRepository,
  ) {}

  // Requests
  async createRequest(miscId: string, userId: string, dto: CreateRequestDto) {
    const misc = await this.miscRepo.findById(miscId);
    if (!misc) throw new NotFoundException('Miscelânea não encontrada');
    if (misc.visibility !== MiscellaneousVisibility.PRIVATE) {
      throw new BadRequestException('Solicitações são apenas para miscelâneas privadas');
    }

    const active = await this.requestRepo.findActivByMember(miscId, userId);
    if (active) throw new BadRequestException('Você já possui uma solicitação ativa para esta miscelânea');

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

  async listRequests(miscId: string, requesterId: string) {
    await this.ensureOwner(miscId, requesterId);
    return this.requestRepo.findByMiscellaneous(miscId);
  }

  async reviewRequest(miscId: string, requestId: string, reviewerId: string, dto: ReviewRequestDto) {
    await this.ensureOwner(miscId, reviewerId);
    const request = await this.requestRepo.findById(requestId);
    if (!request) throw new NotFoundException('Solicitação não encontrada');
    if (request.miscellaneous_id !== miscId) throw new BadRequestException('Solicitação não pertence a esta miscelânea');
    if (request.status !== RequestStatus.PENDING) throw new BadRequestException('Solicitação não está pendente');

    await this.requestRepo.update(requestId, {
      status: dto.status === 'approved' ? RequestStatus.APPROVED : RequestStatus.REJECTED,
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
  async createInvite(miscId: string, inviterId: string, dto: CreateInviteDto) {
    await this.ensureOwner(miscId, inviterId);

    const already = await this.inviteRepo.hasPendingInvite(miscId, dto.invited_user_id);
    if (already) throw new BadRequestException('Já existe um convite pendente para este usuário');

    const isAlreadyMember = await this.participantRepo.isParticipant(miscId, dto.invited_user_id);
    if (isAlreadyMember) throw new BadRequestException('Usuário já é membro desta miscelânea');

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

  async acceptInvite(miscId: string, inviteId: string, userId: string) {
    const invite = await this.inviteRepo.findById(inviteId);
    if (!invite) throw new NotFoundException('Convite não encontrado');
    if (invite.invited_user_id !== userId) throw new ForbiddenException('Este convite não é para você');
    if (invite.status !== InviteStatus.PENDING) throw new BadRequestException('Convite não está pendente');
    if (invite.expires_at < new Date()) throw new BadRequestException('Convite expirado');

    await this.inviteRepo.update(inviteId, { status: InviteStatus.ACCEPTED, responded_at: new Date() });
    await this.participantRepo.add(miscId, userId);
  }

  async rejectInvite(miscId: string, inviteId: string, userId: string, dto: RejectInviteDto) {
    const invite = await this.inviteRepo.findById(inviteId);
    if (!invite) throw new NotFoundException('Convite não encontrado');
    if (invite.invited_user_id !== userId) throw new ForbiddenException('Este convite não é para você');
    if (invite.status !== InviteStatus.PENDING) throw new BadRequestException('Convite não está pendente');

    await this.inviteRepo.update(inviteId, {
      status: InviteStatus.REJECTED,
      rejection_reason: dto.rejection_reason,
      responded_at: new Date(),
    });
  }

  async cancelInvite(miscId: string, inviteId: string, requesterId: string) {
    await this.ensureOwner(miscId, requesterId);
    const invite = await this.inviteRepo.findById(inviteId);
    if (!invite) throw new NotFoundException('Convite não encontrado');
    if (invite.status !== InviteStatus.PENDING) throw new BadRequestException('Convite não pode ser cancelado');
    await this.inviteRepo.update(inviteId, { status: InviteStatus.CANCELLED });
  }

  async listPendingInvites(miscId: string, requesterId: string) {
    await this.ensureOwner(miscId, requesterId);
    return this.inviteRepo.findPendingByMiscellaneous(miscId);
  }

  async listMyInvites(userId: string) {
    return this.inviteRepo.findPendingForUser(userId);
  }

  private async ensureOwner(miscId: string, userId: string) {
    const isOwner = await this.ownerRepo.isOwner(miscId, userId);
    if (!isOwner) throw new ForbiddenException('Apenas donos podem realizar esta ação');
  }
}
