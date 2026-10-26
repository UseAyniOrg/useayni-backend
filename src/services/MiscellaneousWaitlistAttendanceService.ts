import { Injectable, BadRequestException, NotFoundException, ForbiddenException } from '@nestjs/common';
import crypto from 'crypto';
import { MiscellaneousWaitlistRepository, MiscellaneousParticipantRepository } from '../repositories/MiscellaneousSubRepositories';
import { AttendanceRepository } from '../repositories/AttendanceFormRepositories';
import { MiscellaneousRepository } from '../repositories/MiscellaneousRepository';
import { CreateAttendanceSessionDto, ManualCheckInDto } from '../dto/miscellaneous/actions.dto';
import { MiscellaneousType } from '../models/miscellaneous';
import { MiscellaneousService, MiscellaneousManagementContext } from './MiscellaneousService';
import { AppDataBase } from '../db';

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
    private readonly miscService: MiscellaneousService,
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

  async getWaitlist(miscId: string, requesterId: string, context?: MiscellaneousManagementContext) {
    await this.miscService.ensureOwner(miscId, requesterId, context);
    return this.waitlistRepo.findByMiscellaneous(miscId);
  }

  async promote(miscId: string, targetUserId: string, requesterId: string, context?: MiscellaneousManagementContext) {
    await this.miscService.ensureOwner(miscId, requesterId, context);
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

}

@Injectable()
export class AttendanceService {
  constructor(
    private readonly attendanceRepo: AttendanceRepository,
    private readonly miscRepo: MiscellaneousRepository,
    private readonly miscService: MiscellaneousService,
    private readonly participantRepo: MiscellaneousParticipantRepository,
  ) {}

  async createSession(miscId: string, userId: string, dto: CreateAttendanceSessionDto, context?: MiscellaneousManagementContext) {
    const misc = await this.miscRepo.findById(miscId);
    if (!misc) throw new NotFoundException('Miscelânea não encontrada');
    if (!ATTENDANCE_SUPPORTED_TYPES.includes(misc.type as MiscellaneousType)) {
      throw new BadRequestException(`Tipo "${misc.type}" não suporta sessões de presença`);
    }
    await this.miscService.ensureOwner(miscId, userId, context);

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

  async deleteSession(sessionId: string, requesterId: string, context?: MiscellaneousManagementContext) {
    const session = await this.attendanceRepo.findSessionById(sessionId);
    if (!session) throw new NotFoundException('Sessão não encontrada');
    await this.miscService.ensureOwner(session.miscellaneous_id, requesterId, context);
    const result = await this.attendanceRepo.deleteSession(sessionId);
    if (!result.affected) throw new NotFoundException('Sessão não encontrada');
  }

  async getParticipantToken(miscId: string, sessionId: string, memberId: string) {
    const session = await this.attendanceRepo.findSessionById(sessionId);
    if (!session || session.miscellaneous_id !== miscId) throw new NotFoundException('Sessão não encontrada neste evento.');
    if (session.mode !== 'qr_code') throw new BadRequestException('A presença nesta sessão é registrada manualmente pela equipe.');
    if (new Date(session.starts_at) > new Date()) throw new BadRequestException('A sessão de presença ainda não começou.');
    return this.getOrCreateToken(sessionId, memberId);
  }

  async getOrCreateToken(sessionId: string, userId: string) {
    const session = await this.attendanceRepo.findSessionById(sessionId);
    if (!session) throw new NotFoundException('Sessão não encontrada');
    if (!(await this.participantRepo.isParticipant(session.miscellaneous_id, userId))) throw new ForbiddenException('Você não está inscrito neste evento.');
    if (session.mode !== 'qr_code') throw new BadRequestException('A presença nesta sessão é registrada manualmente pela equipe.');
    if (session.starts_at > new Date()) throw new BadRequestException('A sessão de presença ainda não começou.');
    if (session.ends_at < new Date()) throw new BadRequestException('Sessão encerrada');

    const alreadyCheckedIn = await this.attendanceRepo.recordExists(sessionId, userId);
    if (alreadyCheckedIn) return { token: null, checked_in: true };

    const token = crypto.randomBytes(32).toString('hex');
    const record = await this.attendanceRepo.createToken(sessionId, userId, token, session.ends_at);
    return { token: record!.token, checked_in: false };
  }

  async checkInByQr(sessionId: string, token: string, requesterId: string, context?: MiscellaneousManagementContext) {
    const session = await this.attendanceRepo.findSessionById(sessionId);
    if (!session) throw new NotFoundException('Sessão não encontrada');
    await this.miscService.ensureOwner(session.miscellaneous_id, requesterId, context);
    if (session.mode !== 'qr_code') throw new BadRequestException('Esta sessão não utiliza QR Code.');
    if (session.starts_at > new Date() || session.ends_at < new Date()) throw new BadRequestException('A sessão de presença não está aberta.');

    return AppDataBase.transaction(async manager => {
      const [record] = await manager.query(
        `SELECT token.id, token.session_id, token.member_id, token.used, token.expires_at,
                member.name
         FROM attendance_tokens token JOIN members member ON member.id = token.member_id
         WHERE token.token = $1 FOR UPDATE OF token`, [token],
      ) as { id: string; session_id: string; member_id: string; used: boolean; expires_at: Date; name: string }[];
      if (!record) throw new BadRequestException('Token inválido');
      if (record.used) throw new BadRequestException('Token já utilizado');
      if (record.expires_at < new Date()) throw new BadRequestException('Token expirado');
      if (record.session_id !== sessionId) throw new BadRequestException('Token não pertence a esta sessão');
      if (!(await this.participantRepo.isParticipant(session.miscellaneous_id, record.member_id))) throw new BadRequestException('A pessoa não está mais inscrita neste evento.');
      const checkedIn = await manager.query(
        `SELECT id FROM attendance_records WHERE session_id = $1 AND member_id = $2 AND present = true`,
        [sessionId, record.member_id],
      );
      if (checkedIn.length) throw new BadRequestException('Presença já registrada para este usuário');
      const checkedInAt = new Date();
      await manager.query(`UPDATE attendance_tokens SET used = true WHERE id = $1`, [record.id]);
      await manager.query(
        `INSERT INTO attendance_records (session_id, member_id, present, checked_in_at)
         VALUES ($1, $2, true, $3) ON CONFLICT (session_id, member_id)
         DO UPDATE SET present = true, checked_in_at = EXCLUDED.checked_in_at`,
        [sessionId, record.member_id, checkedInAt],
      );
      return { member: { id: record.member_id, name: record.name }, checked_in_at: checkedInAt };
    });
  }

  async manualCheckIn(sessionId: string, targetUserId: string, requesterId: string, dto: ManualCheckInDto, context?: MiscellaneousManagementContext) {
    const session = await this.attendanceRepo.findSessionById(sessionId);
    if (!session) throw new NotFoundException('Sessão não encontrada');
    await this.miscService.ensureOwner(session.miscellaneous_id, requesterId, context);
    return this.attendanceRepo.createOrUpdateRecord(sessionId, targetUserId, dto.present);
  }

  async getRecords(sessionId: string) {
    const session = await this.attendanceRepo.findSessionById(sessionId);
    if (!session) throw new NotFoundException('Sessão não encontrada');

    const records = await this.attendanceRepo.findRecordsBySession(sessionId);
    const participants = await this.participantRepo.findByMiscellaneous(session.miscellaneous_id);
    const recordMap = new Map(records.map((r) => [r.member_id, r]));

    return participants.map((p) => {
      const existing = recordMap.get(p.member_id);
      return existing ?? { id: null, session_id: sessionId, member_id: p.member_id, present: false, checked_in_at: null, member: p.member };
    });
  }

}
