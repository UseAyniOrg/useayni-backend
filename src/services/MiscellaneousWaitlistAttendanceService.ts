import { Injectable, BadRequestException, ForbiddenException, NotFoundException } from '@nestjs/common';
import crypto from 'crypto';
import { MiscellaneousWaitlistRepository, MiscellaneousParticipantRepository, MiscellaneousOwnerRepository } from '../repositories/MiscellaneousSubRepositories';
import { AttendanceRepository } from '../repositories/AttendanceFormRepositories';
import { MiscellaneousRepository } from '../repositories/MiscellaneousRepository';
import { CreateAttendanceSessionDto, ManualCheckInDto } from '../dto/miscellaneous/actions.dto';
import { MiscellaneousType } from '../models/miscellaneous';

const ATTENDANCE_SUPPORTED_TYPES = [
  MiscellaneousType.EVENT,
  MiscellaneousType.MEETING,
  MiscellaneousType.ACTIVITY,
];

@Injectable()
export class MiscellaneousWaitlistService {
  constructor(
    private readonly waitlistRepo: MiscellaneousWaitlistRepository,
    private readonly participantRepo: MiscellaneousParticipantRepository,
    private readonly ownerRepo: MiscellaneousOwnerRepository,
    private readonly miscRepo: MiscellaneousRepository,
  ) {}

  async joinWaitlist(miscId: string, userId: string) {
    const misc = await this.miscRepo.findById(miscId);
    if (!misc) throw new NotFoundException('Miscelânea não encontrada');
    if (!misc.waitlist_enabled) throw new BadRequestException('Lista de espera não está habilitada');

    const already = await this.waitlistRepo.findByMember(miscId, userId);
    if (already) throw new BadRequestException('Você já está na lista de espera');

    return this.waitlistRepo.add(miscId, userId);
  }

  async getWaitlist(miscId: string, requesterId: string) {
    await this.ensureOwner(miscId, requesterId);
    return this.waitlistRepo.findByMiscellaneous(miscId);
  }

  async promote(miscId: string, targetUserId: string, requesterId: string) {
    await this.ensureOwner(miscId, requesterId);
    const misc = await this.miscRepo.findById(miscId);
    if (!misc) throw new NotFoundException('Miscelânea não encontrada');

    // Check capacity
    if (misc.max_members) {
      const count = await this.participantRepo.countParticipants(miscId);
      if (count >= misc.max_members) throw new BadRequestException('Capacidade máxima atingida');
    }

    await this.waitlistRepo.promote(miscId, targetUserId);
    await this.participantRepo.add(miscId, targetUserId);
  }

  private async ensureOwner(miscId: string, userId: string) {
    const isOwner = await this.ownerRepo.isOwner(miscId, userId);
    if (!isOwner) throw new ForbiddenException('Apenas donos podem realizar esta ação');
  }
}

@Injectable()
export class AttendanceService {
  constructor(
    private readonly attendanceRepo: AttendanceRepository,
    private readonly miscRepo: MiscellaneousRepository,
    private readonly ownerRepo: MiscellaneousOwnerRepository,
  ) {}

  async createSession(miscId: string, userId: string, dto: CreateAttendanceSessionDto) {
    const misc = await this.miscRepo.findById(miscId);
    if (!misc) throw new NotFoundException('Miscelânea não encontrada');
    if (!ATTENDANCE_SUPPORTED_TYPES.includes(misc.type as MiscellaneousType)) {
      throw new BadRequestException(`Tipo "${misc.type}" não suporta sessões de presença`);
    }
    await this.ensureOwner(miscId, userId);

    return this.attendanceRepo.createSession({
      miscellaneous_id: miscId,
      title: dto.title,
      mode: dto.mode,
      starts_at: new Date(dto.starts_at),
      ends_at: new Date(dto.ends_at),
      created_by: userId,
    });
  }

  async listSessions(miscId: string) {
    return this.attendanceRepo.findSessionsByMiscellaneous(miscId);
  }

  async getOrCreateToken(sessionId: string, userId: string) {
    const session = await this.attendanceRepo.findSessionById(sessionId);
    if (!session) throw new NotFoundException('Sessão não encontrada');
    if (session.ends_at < new Date()) throw new BadRequestException('Sessão encerrada');

    const token = crypto.randomBytes(32).toString('hex');
    return this.attendanceRepo.createToken(sessionId, userId, token, session.ends_at);
  }

  async checkInByQr(sessionId: string, token: string) {
    const tokenRecord = await this.attendanceRepo.findTokenByValue(token);
    if (!tokenRecord) throw new BadRequestException('Token inválido');
    if (tokenRecord.used) throw new BadRequestException('Token já utilizado');
    if (tokenRecord.expires_at < new Date()) throw new BadRequestException('Token expirado');
    if (tokenRecord.session_id !== sessionId) throw new BadRequestException('Token não pertence a esta sessão');

    const alreadyCheckedIn = await this.attendanceRepo.recordExists(sessionId, tokenRecord.member_id);
    if (alreadyCheckedIn) throw new BadRequestException('Presença já registrada para este usuário');

    await this.attendanceRepo.markTokenUsed(tokenRecord.id);
    await this.attendanceRepo.createOrUpdateRecord(sessionId, tokenRecord.member_id, true, new Date());

    return { member: tokenRecord.member, checked_in_at: new Date() };
  }

  async manualCheckIn(sessionId: string, targetUserId: string, requesterId: string, dto: ManualCheckInDto) {
    const session = await this.attendanceRepo.findSessionById(sessionId);
    if (!session) throw new NotFoundException('Sessão não encontrada');
    await this.ensureOwner(session.miscellaneous_id, requesterId);
    return this.attendanceRepo.createOrUpdateRecord(sessionId, targetUserId, dto.present);
  }

  async getRecords(sessionId: string) {
    return this.attendanceRepo.findRecordsBySession(sessionId);
  }

  private async ensureOwner(miscId: string, userId: string) {
    const isOwner = await this.ownerRepo.isOwner(miscId, userId);
    if (!isOwner) throw new ForbiddenException('Apenas donos podem realizar esta ação');
  }
}
