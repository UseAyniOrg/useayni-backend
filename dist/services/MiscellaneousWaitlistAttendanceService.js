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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AttendanceService = exports.MiscellaneousWaitlistService = void 0;
const common_1 = require("@nestjs/common");
const crypto_1 = __importDefault(require("crypto"));
const MiscellaneousSubRepositories_1 = require("../repositories/MiscellaneousSubRepositories");
const AttendanceFormRepositories_1 = require("../repositories/AttendanceFormRepositories");
const MiscellaneousRepository_1 = require("../repositories/MiscellaneousRepository");
const miscellaneous_1 = require("../models/miscellaneous");
const MiscellaneousService_1 = require("./MiscellaneousService");
const db_1 = require("../db");
const ATTENDANCE_SUPPORTED_TYPES = [
    miscellaneous_1.MiscellaneousType.EVENT,
    miscellaneous_1.MiscellaneousType.MEETING,
    miscellaneous_1.MiscellaneousType.ACTIVITY,
];
let MiscellaneousWaitlistService = class MiscellaneousWaitlistService {
    constructor(waitlistRepo, participantRepo, miscService, miscRepo) {
        this.waitlistRepo = waitlistRepo;
        this.participantRepo = participantRepo;
        this.miscService = miscService;
        this.miscRepo = miscRepo;
    }
    async joinWaitlist(miscId, userId) {
        const misc = await this.miscRepo.findById(miscId);
        if (!misc)
            throw new common_1.NotFoundException('Miscelânea não encontrada');
        if (!misc.waitlist_enabled)
            throw new common_1.BadRequestException('Lista de espera não está habilitada');
        const already = await this.waitlistRepo.findByMember(miscId, userId);
        if (already)
            throw new common_1.BadRequestException('Você já está na lista de espera');
        return this.waitlistRepo.add(miscId, userId);
    }
    async getWaitlist(miscId, requesterId, context) {
        await this.miscService.ensureOwner(miscId, requesterId, context);
        return this.waitlistRepo.findByMiscellaneous(miscId);
    }
    async promote(miscId, targetUserId, requesterId, context) {
        await this.miscService.ensureOwner(miscId, requesterId, context);
        const misc = await this.miscRepo.findById(miscId);
        if (!misc)
            throw new common_1.NotFoundException('Miscelânea não encontrada');
        // Check capacity
        if (misc.max_members) {
            const count = await this.participantRepo.countParticipants(miscId);
            if (count >= misc.max_members)
                throw new common_1.BadRequestException('Capacidade máxima atingida');
        }
        await this.waitlistRepo.promote(miscId, targetUserId);
        await this.participantRepo.add(miscId, targetUserId);
    }
};
exports.MiscellaneousWaitlistService = MiscellaneousWaitlistService;
exports.MiscellaneousWaitlistService = MiscellaneousWaitlistService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [MiscellaneousSubRepositories_1.MiscellaneousWaitlistRepository,
        MiscellaneousSubRepositories_1.MiscellaneousParticipantRepository,
        MiscellaneousService_1.MiscellaneousService,
        MiscellaneousRepository_1.MiscellaneousRepository])
], MiscellaneousWaitlistService);
let AttendanceService = class AttendanceService {
    constructor(attendanceRepo, miscRepo, miscService, participantRepo) {
        this.attendanceRepo = attendanceRepo;
        this.miscRepo = miscRepo;
        this.miscService = miscService;
        this.participantRepo = participantRepo;
    }
    async createSession(miscId, userId, dto, context) {
        const misc = await this.miscRepo.findById(miscId);
        if (!misc)
            throw new common_1.NotFoundException('Miscelânea não encontrada');
        if (!ATTENDANCE_SUPPORTED_TYPES.includes(misc.type)) {
            throw new common_1.BadRequestException(`Tipo "${misc.type}" não suporta sessões de presença`);
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
    async listSessions(miscId) {
        return this.attendanceRepo.findSessionsByMiscellaneous(miscId);
    }
    async deleteSession(sessionId, requesterId, context) {
        const session = await this.attendanceRepo.findSessionById(sessionId);
        if (!session)
            throw new common_1.NotFoundException('Sessão não encontrada');
        await this.miscService.ensureOwner(session.miscellaneous_id, requesterId, context);
        const result = await this.attendanceRepo.deleteSession(sessionId);
        if (!result.affected)
            throw new common_1.NotFoundException('Sessão não encontrada');
    }
    async getParticipantToken(miscId, sessionId, memberId) {
        const session = await this.attendanceRepo.findSessionById(sessionId);
        if (!session || session.miscellaneous_id !== miscId)
            throw new common_1.NotFoundException('Sessão não encontrada neste evento.');
        if (session.mode !== 'qr_code')
            throw new common_1.BadRequestException('A presença nesta sessão é registrada manualmente pela equipe.');
        if (new Date(session.starts_at) > new Date())
            throw new common_1.BadRequestException('A sessão de presença ainda não começou.');
        return this.getOrCreateToken(sessionId, memberId);
    }
    async getOrCreateToken(sessionId, userId) {
        const session = await this.attendanceRepo.findSessionById(sessionId);
        if (!session)
            throw new common_1.NotFoundException('Sessão não encontrada');
        if (!(await this.participantRepo.isParticipant(session.miscellaneous_id, userId)))
            throw new common_1.ForbiddenException('Você não está inscrito neste evento.');
        if (session.mode !== 'qr_code')
            throw new common_1.BadRequestException('A presença nesta sessão é registrada manualmente pela equipe.');
        if (session.starts_at > new Date())
            throw new common_1.BadRequestException('A sessão de presença ainda não começou.');
        if (session.ends_at < new Date())
            throw new common_1.BadRequestException('Sessão encerrada');
        const alreadyCheckedIn = await this.attendanceRepo.recordExists(sessionId, userId);
        if (alreadyCheckedIn)
            return { token: null, checked_in: true };
        const token = crypto_1.default.randomBytes(32).toString('hex');
        const record = await this.attendanceRepo.createToken(sessionId, userId, token, session.ends_at);
        return { token: record.token, checked_in: false };
    }
    async checkInByQr(sessionId, token, requesterId, context) {
        const session = await this.attendanceRepo.findSessionById(sessionId);
        if (!session)
            throw new common_1.NotFoundException('Sessão não encontrada');
        await this.miscService.ensureOwner(session.miscellaneous_id, requesterId, context);
        if (session.mode !== 'qr_code')
            throw new common_1.BadRequestException('Esta sessão não utiliza QR Code.');
        if (session.starts_at > new Date() || session.ends_at < new Date())
            throw new common_1.BadRequestException('A sessão de presença não está aberta.');
        return db_1.AppDataBase.transaction(async (manager) => {
            const [record] = await manager.query(`SELECT token.id, token.session_id, token.member_id, token.used, token.expires_at,
                member.name
         FROM attendance_tokens token JOIN members member ON member.id = token.member_id
         WHERE token.token = $1 FOR UPDATE OF token`, [token]);
            if (!record)
                throw new common_1.BadRequestException('Token inválido');
            if (record.used)
                throw new common_1.BadRequestException('Token já utilizado');
            if (record.expires_at < new Date())
                throw new common_1.BadRequestException('Token expirado');
            if (record.session_id !== sessionId)
                throw new common_1.BadRequestException('Token não pertence a esta sessão');
            if (!(await this.participantRepo.isParticipant(session.miscellaneous_id, record.member_id)))
                throw new common_1.BadRequestException('A pessoa não está mais inscrita neste evento.');
            const checkedIn = await manager.query(`SELECT id FROM attendance_records WHERE session_id = $1 AND member_id = $2 AND present = true`, [sessionId, record.member_id]);
            if (checkedIn.length)
                throw new common_1.BadRequestException('Presença já registrada para este usuário');
            const checkedInAt = new Date();
            await manager.query(`UPDATE attendance_tokens SET used = true WHERE id = $1`, [record.id]);
            await manager.query(`INSERT INTO attendance_records (session_id, member_id, present, checked_in_at)
         VALUES ($1, $2, true, $3) ON CONFLICT (session_id, member_id)
         DO UPDATE SET present = true, checked_in_at = EXCLUDED.checked_in_at`, [sessionId, record.member_id, checkedInAt]);
            return { member: { id: record.member_id, name: record.name }, checked_in_at: checkedInAt };
        });
    }
    async manualCheckIn(sessionId, targetUserId, requesterId, dto, context) {
        const session = await this.attendanceRepo.findSessionById(sessionId);
        if (!session)
            throw new common_1.NotFoundException('Sessão não encontrada');
        await this.miscService.ensureOwner(session.miscellaneous_id, requesterId, context);
        return this.attendanceRepo.createOrUpdateRecord(sessionId, targetUserId, dto.present);
    }
    async getRecords(sessionId) {
        const session = await this.attendanceRepo.findSessionById(sessionId);
        if (!session)
            throw new common_1.NotFoundException('Sessão não encontrada');
        const records = await this.attendanceRepo.findRecordsBySession(sessionId);
        const participants = await this.participantRepo.findByMiscellaneous(session.miscellaneous_id);
        const recordMap = new Map(records.map((r) => [r.member_id, r]));
        return participants.map((p) => {
            const existing = recordMap.get(p.member_id);
            return existing ?? { id: null, session_id: sessionId, member_id: p.member_id, present: false, checked_in_at: null, member: p.member };
        });
    }
};
exports.AttendanceService = AttendanceService;
exports.AttendanceService = AttendanceService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [AttendanceFormRepositories_1.AttendanceRepository,
        MiscellaneousRepository_1.MiscellaneousRepository,
        MiscellaneousService_1.MiscellaneousService,
        MiscellaneousSubRepositories_1.MiscellaneousParticipantRepository])
], AttendanceService);
