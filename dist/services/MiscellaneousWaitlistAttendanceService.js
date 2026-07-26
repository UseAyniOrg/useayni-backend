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
const ATTENDANCE_SUPPORTED_TYPES = [
    miscellaneous_1.MiscellaneousType.EVENT,
    miscellaneous_1.MiscellaneousType.MEETING,
    miscellaneous_1.MiscellaneousType.ACTIVITY,
];
let MiscellaneousWaitlistService = class MiscellaneousWaitlistService {
    constructor(waitlistRepo, participantRepo, ownerRepo, miscRepo) {
        this.waitlistRepo = waitlistRepo;
        this.participantRepo = participantRepo;
        this.ownerRepo = ownerRepo;
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
    async getWaitlist(miscId, requesterId) {
        await this.ensureOwner(miscId, requesterId);
        return this.waitlistRepo.findByMiscellaneous(miscId);
    }
    async promote(miscId, targetUserId, requesterId) {
        await this.ensureOwner(miscId, requesterId);
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
    async ensureOwner(miscId, userId) {
        const isOwner = await this.ownerRepo.isOwner(miscId, userId);
        if (!isOwner)
            throw new common_1.ForbiddenException('Apenas donos podem realizar esta ação');
    }
};
exports.MiscellaneousWaitlistService = MiscellaneousWaitlistService;
exports.MiscellaneousWaitlistService = MiscellaneousWaitlistService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [MiscellaneousSubRepositories_1.MiscellaneousWaitlistRepository,
        MiscellaneousSubRepositories_1.MiscellaneousParticipantRepository,
        MiscellaneousSubRepositories_1.MiscellaneousOwnerRepository,
        MiscellaneousRepository_1.MiscellaneousRepository])
], MiscellaneousWaitlistService);
let AttendanceService = class AttendanceService {
    constructor(attendanceRepo, miscRepo, ownerRepo) {
        this.attendanceRepo = attendanceRepo;
        this.miscRepo = miscRepo;
        this.ownerRepo = ownerRepo;
    }
    async createSession(miscId, userId, dto) {
        const misc = await this.miscRepo.findById(miscId);
        if (!misc)
            throw new common_1.NotFoundException('Miscelânea não encontrada');
        if (!ATTENDANCE_SUPPORTED_TYPES.includes(misc.type)) {
            throw new common_1.BadRequestException(`Tipo "${misc.type}" não suporta sessões de presença`);
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
    async listSessions(miscId) {
        return this.attendanceRepo.findSessionsByMiscellaneous(miscId);
    }
    async getOrCreateToken(sessionId, userId) {
        const session = await this.attendanceRepo.findSessionById(sessionId);
        if (!session)
            throw new common_1.NotFoundException('Sessão não encontrada');
        if (session.ends_at < new Date())
            throw new common_1.BadRequestException('Sessão encerrada');
        const token = crypto_1.default.randomBytes(32).toString('hex');
        return this.attendanceRepo.createToken(sessionId, userId, token, session.ends_at);
    }
    async checkInByQr(sessionId, token) {
        const tokenRecord = await this.attendanceRepo.findTokenByValue(token);
        if (!tokenRecord)
            throw new common_1.BadRequestException('Token inválido');
        if (tokenRecord.used)
            throw new common_1.BadRequestException('Token já utilizado');
        if (tokenRecord.expires_at < new Date())
            throw new common_1.BadRequestException('Token expirado');
        if (tokenRecord.session_id !== sessionId)
            throw new common_1.BadRequestException('Token não pertence a esta sessão');
        const alreadyCheckedIn = await this.attendanceRepo.recordExists(sessionId, tokenRecord.member_id);
        if (alreadyCheckedIn)
            throw new common_1.BadRequestException('Presença já registrada para este usuário');
        await this.attendanceRepo.markTokenUsed(tokenRecord.id);
        await this.attendanceRepo.createOrUpdateRecord(sessionId, tokenRecord.member_id, true, new Date());
        return { member: tokenRecord.member, checked_in_at: new Date() };
    }
    async manualCheckIn(sessionId, targetUserId, requesterId, dto) {
        const session = await this.attendanceRepo.findSessionById(sessionId);
        if (!session)
            throw new common_1.NotFoundException('Sessão não encontrada');
        await this.ensureOwner(session.miscellaneous_id, requesterId);
        return this.attendanceRepo.createOrUpdateRecord(sessionId, targetUserId, dto.present);
    }
    async getRecords(sessionId) {
        return this.attendanceRepo.findRecordsBySession(sessionId);
    }
    async ensureOwner(miscId, userId) {
        const isOwner = await this.ownerRepo.isOwner(miscId, userId);
        if (!isOwner)
            throw new common_1.ForbiddenException('Apenas donos podem realizar esta ação');
    }
};
exports.AttendanceService = AttendanceService;
exports.AttendanceService = AttendanceService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [AttendanceFormRepositories_1.AttendanceRepository,
        MiscellaneousRepository_1.MiscellaneousRepository,
        MiscellaneousSubRepositories_1.MiscellaneousOwnerRepository])
], AttendanceService);
