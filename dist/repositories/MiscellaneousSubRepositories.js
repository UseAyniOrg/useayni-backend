"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.MiscellaneousApprovalLogRepository = exports.MiscellaneousInviteRepository = exports.MiscellaneousRequestRepository = exports.MiscellaneousWaitlistRepository = exports.MiscellaneousParticipantRepository = exports.MiscellaneousOwnerRepository = void 0;
const common_1 = require("@nestjs/common");
const db_1 = require("../db");
const miscellaneousOwner_1 = require("../models/miscellaneousOwner");
const miscellaneousParticipant_1 = require("../models/miscellaneousParticipant");
const miscellaneousWaitlist_1 = require("../models/miscellaneousWaitlist");
const miscellaneousRequest_1 = require("../models/miscellaneousRequest");
const miscellaneousInvite_1 = require("../models/miscellaneousInvite");
const miscellaneousApprovalLog_1 = require("../models/miscellaneousApprovalLog");
let MiscellaneousOwnerRepository = class MiscellaneousOwnerRepository {
    constructor() {
        this.repo = db_1.AppDataBase.getRepository(miscellaneousOwner_1.MiscellaneousOwner);
    }
    async add(miscellaneousId, memberId, role, isCreator = false) {
        const entity = this.repo.create({ miscellaneous_id: miscellaneousId, member_id: memberId, role, is_creator: isCreator });
        return this.repo.save(entity);
    }
    async remove(miscellaneousId, memberId) {
        await this.repo.delete({ miscellaneous_id: miscellaneousId, member_id: memberId });
    }
    async findByMiscellaneous(miscellaneousId) {
        return this.repo.find({
            where: { miscellaneous_id: miscellaneousId },
            relations: ['member'],
        });
    }
    async findOne(miscellaneousId, memberId) {
        return this.repo.findOne({ where: { miscellaneous_id: miscellaneousId, member_id: memberId } });
    }
    async countOwners(miscellaneousId) {
        return this.repo.count({ where: { miscellaneous_id: miscellaneousId } });
    }
    async isOwner(miscellaneousId, memberId) {
        const count = await this.repo.count({ where: { miscellaneous_id: miscellaneousId, member_id: memberId } });
        return count > 0;
    }
};
exports.MiscellaneousOwnerRepository = MiscellaneousOwnerRepository;
exports.MiscellaneousOwnerRepository = MiscellaneousOwnerRepository = __decorate([
    (0, common_1.Injectable)()
], MiscellaneousOwnerRepository);
let MiscellaneousParticipantRepository = class MiscellaneousParticipantRepository {
    constructor() {
        this.repo = db_1.AppDataBase.getRepository(miscellaneousParticipant_1.MiscellaneousParticipant);
    }
    async add(miscellaneousId, memberId) {
        const entity = this.repo.create({ miscellaneous_id: miscellaneousId, member_id: memberId });
        return this.repo.save(entity);
    }
    async remove(miscellaneousId, memberId) {
        await this.repo.delete({ miscellaneous_id: miscellaneousId, member_id: memberId });
    }
    async findByMiscellaneous(miscellaneousId) {
        return this.repo.find({
            where: { miscellaneous_id: miscellaneousId },
            relations: ['member'],
        });
    }
    async isParticipant(miscellaneousId, memberId) {
        const count = await this.repo.count({ where: { miscellaneous_id: miscellaneousId, member_id: memberId } });
        return count > 0;
    }
    async countParticipants(miscellaneousId) {
        return this.repo.count({ where: { miscellaneous_id: miscellaneousId } });
    }
};
exports.MiscellaneousParticipantRepository = MiscellaneousParticipantRepository;
exports.MiscellaneousParticipantRepository = MiscellaneousParticipantRepository = __decorate([
    (0, common_1.Injectable)()
], MiscellaneousParticipantRepository);
let MiscellaneousWaitlistRepository = class MiscellaneousWaitlistRepository {
    constructor() {
        this.repo = db_1.AppDataBase.getRepository(miscellaneousWaitlist_1.MiscellaneousWaitlist);
    }
    async add(miscellaneousId, memberId) {
        const lastPosition = await this.repo
            .createQueryBuilder('w')
            .select('MAX(w.position)', 'max')
            .where('w.miscellaneous_id = :id AND w.status = :status', { id: miscellaneousId, status: miscellaneousWaitlist_1.WaitlistStatus.WAITING })
            .getRawOne();
        const position = (lastPosition?.max ?? 0) + 1;
        const entity = this.repo.create({ miscellaneous_id: miscellaneousId, member_id: memberId, position });
        return this.repo.save(entity);
    }
    async findByMiscellaneous(miscellaneousId) {
        return this.repo.find({
            where: { miscellaneous_id: miscellaneousId, status: miscellaneousWaitlist_1.WaitlistStatus.WAITING },
            relations: ['member'],
            order: { position: 'ASC' },
        });
    }
    async findByMember(miscellaneousId, memberId) {
        return this.repo.findOne({ where: { miscellaneous_id: miscellaneousId, member_id: memberId } });
    }
    async promote(miscellaneousId, memberId) {
        await this.repo.update({ miscellaneous_id: miscellaneousId, member_id: memberId }, { status: miscellaneousWaitlist_1.WaitlistStatus.PROMOTED });
        await this.recalculatePositions(miscellaneousId);
    }
    async recalculatePositions(miscellaneousId) {
        const waiting = await this.repo.find({
            where: { miscellaneous_id: miscellaneousId, status: miscellaneousWaitlist_1.WaitlistStatus.WAITING },
            order: { position: 'ASC' },
        });
        for (let i = 0; i < waiting.length; i++) {
            await this.repo.update(waiting[i].id, { position: i + 1 });
        }
    }
};
exports.MiscellaneousWaitlistRepository = MiscellaneousWaitlistRepository;
exports.MiscellaneousWaitlistRepository = MiscellaneousWaitlistRepository = __decorate([
    (0, common_1.Injectable)()
], MiscellaneousWaitlistRepository);
let MiscellaneousRequestRepository = class MiscellaneousRequestRepository {
    constructor() {
        this.repo = db_1.AppDataBase.getRepository(miscellaneousRequest_1.MiscellaneousRequest);
    }
    async create(data) {
        const entity = this.repo.create(data);
        return this.repo.save(entity);
    }
    async findById(id) {
        return this.repo.findOne({ where: { id }, relations: ['member', 'miscellaneous'] });
    }
    async findByMiscellaneous(miscellaneousId) {
        return this.repo.find({
            where: { miscellaneous_id: miscellaneousId },
            relations: ['member'],
            order: { created_at: 'DESC' },
        });
    }
    async findActivByMember(miscellaneousId, memberId) {
        return this.repo.findOne({
            where: { miscellaneous_id: miscellaneousId, member_id: memberId, status: miscellaneousRequest_1.RequestStatus.PENDING },
        });
    }
    async update(id, data) {
        await this.repo.update(id, data);
        return this.findById(id);
    }
    async expireOld(before) {
        await this.repo
            .createQueryBuilder()
            .update()
            .set({ status: miscellaneousRequest_1.RequestStatus.EXPIRED })
            .where('status = :status AND expires_at < :before', { status: miscellaneousRequest_1.RequestStatus.PENDING, before })
            .execute();
    }
};
exports.MiscellaneousRequestRepository = MiscellaneousRequestRepository;
exports.MiscellaneousRequestRepository = MiscellaneousRequestRepository = __decorate([
    (0, common_1.Injectable)()
], MiscellaneousRequestRepository);
let MiscellaneousInviteRepository = class MiscellaneousInviteRepository {
    constructor() {
        this.repo = db_1.AppDataBase.getRepository(miscellaneousInvite_1.MiscellaneousInvite);
    }
    async create(data) {
        const entity = this.repo.create(data);
        return this.repo.save(entity);
    }
    async findById(id) {
        return this.repo.findOne({ where: { id }, relations: ['invitedUser', 'invitedBy', 'miscellaneous'] });
    }
    async findPendingByMiscellaneous(miscellaneousId) {
        return this.repo.find({
            where: { miscellaneous_id: miscellaneousId, status: miscellaneousInvite_1.InviteStatus.PENDING },
            relations: ['invitedUser'],
            order: { created_at: 'DESC' },
        });
    }
    async findPendingForUser(memberId) {
        return this.repo.find({
            where: { invited_user_id: memberId, status: miscellaneousInvite_1.InviteStatus.PENDING },
            relations: ['miscellaneous', 'invitedBy'],
            order: { created_at: 'DESC' },
        });
    }
    async hasPendingInvite(miscellaneousId, memberId) {
        const count = await this.repo.count({
            where: { miscellaneous_id: miscellaneousId, invited_user_id: memberId, status: miscellaneousInvite_1.InviteStatus.PENDING },
        });
        return count > 0;
    }
    async update(id, data) {
        await this.repo.update(id, data);
        return this.findById(id);
    }
    async expireOld(before) {
        await this.repo
            .createQueryBuilder()
            .update()
            .set({ status: miscellaneousInvite_1.InviteStatus.EXPIRED })
            .where('status = :status AND expires_at < :before', { status: miscellaneousInvite_1.InviteStatus.PENDING, before })
            .execute();
    }
};
exports.MiscellaneousInviteRepository = MiscellaneousInviteRepository;
exports.MiscellaneousInviteRepository = MiscellaneousInviteRepository = __decorate([
    (0, common_1.Injectable)()
], MiscellaneousInviteRepository);
let MiscellaneousApprovalLogRepository = class MiscellaneousApprovalLogRepository {
    constructor() {
        this.repo = db_1.AppDataBase.getRepository(miscellaneousApprovalLog_1.MiscellaneousApprovalLog);
    }
    async create(miscellaneousId, actorUserId, action, comment) {
        const entity = this.repo.create({ miscellaneous_id: miscellaneousId, actor_user_id: actorUserId, action, comment });
        return this.repo.save(entity);
    }
    async findByMiscellaneous(miscellaneousId) {
        return this.repo.find({
            where: { miscellaneous_id: miscellaneousId },
            relations: ['actor'],
            order: { created_at: 'ASC' },
        });
    }
};
exports.MiscellaneousApprovalLogRepository = MiscellaneousApprovalLogRepository;
exports.MiscellaneousApprovalLogRepository = MiscellaneousApprovalLogRepository = __decorate([
    (0, common_1.Injectable)()
], MiscellaneousApprovalLogRepository);
