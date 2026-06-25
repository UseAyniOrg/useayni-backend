"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.MiscellaneousRepository = void 0;
const common_1 = require("@nestjs/common");
const db_1 = require("../db");
const miscellaneous_1 = require("../models/miscellaneous");
let MiscellaneousRepository = class MiscellaneousRepository {
    constructor() {
        this.repo = db_1.AppDataBase.getRepository(miscellaneous_1.Miscellaneous);
    }
    async create(data) {
        const entity = this.repo.create(data);
        return this.repo.save(entity);
    }
    async findById(id) {
        return this.repo.findOne({
            where: { id },
            relations: ['creator', 'parent'],
        });
    }
    async findByIdWithChildren(id) {
        return this.repo.findOne({
            where: { id },
            relations: ['creator', 'parent', 'children'],
        });
    }
    async findBySlug(slug) {
        return this.repo.findOne({ where: { public_slug: slug } });
    }
    async update(id, data) {
        await this.repo.update(id, data);
        return this.findById(id);
    }
    async softDelete(id) {
        await this.repo.softDelete(id);
    }
    async archive(id) {
        await this.repo.update(id, { status: miscellaneous_1.MiscellaneousStatus.ARCHIVED });
    }
    async findWithFilters(filters, userId) {
        const page = filters.page ?? 1;
        const limit = filters.limit ?? 20;
        const offset = (page - 1) * limit;
        let query = this.repo
            .createQueryBuilder('m')
            .leftJoinAndSelect('m.creator', 'creator')
            .leftJoin('miscellaneous_owners', 'mo', 'mo.miscellaneous_id = m.id')
            .leftJoin('miscellaneous_participants', 'mp', 'mp.miscellaneous_id = m.id')
            .where('m.deleted_at IS NULL')
            .andWhere(`(m.participation_type = 'public' OR mo.member_id = :uid OR mp.member_id = :uid OR m.created_by = :uid)`, { uid: userId })
            .groupBy('m.id, creator.id');
        if (filters.type)
            query = query.andWhere('m.type = :type', { type: filters.type });
        if (filters.status)
            query = query.andWhere('m.status = :status', { status: filters.status });
        if (filters.visibility)
            query = query.andWhere('m.visibility = :visibility', { visibility: filters.visibility });
        if (filters.scope)
            query = query.andWhere('m.scope = :scope', { scope: filters.scope });
        if (filters.search) {
            query = query.andWhere('(m.title ILIKE :search OR m.description ILIKE :search)', {
                search: `%${filters.search}%`,
            });
        }
        if (filters.myRole === 'owner') {
            query = query.andWhere('mo.member_id = :uid', { uid: userId });
        }
        else if (filters.myRole === 'participant') {
            query = query.andWhere('mp.member_id = :uid', { uid: userId });
        }
        else if (filters.myRole === 'creator') {
            query = query.andWhere('m.created_by = :uid', { uid: userId });
        }
        const sortMap = {
            title: 'm.title',
            start_date: 'm.start_date',
            created_at: 'm.created_at',
        };
        const orderField = sortMap[filters.sortBy ?? ''] ?? 'm.created_at';
        query = query.orderBy(orderField, 'DESC');
        const [data, total] = await query
            .skip(offset)
            .take(limit)
            .getManyAndCount();
        return { data, total };
    }
    async findChildren(parentId) {
        return this.repo.find({
            where: { parent_id: parentId },
            order: { type: 'ASC', created_at: 'ASC' },
        });
    }
    async findPendingForApproval() {
        return this.repo.find({
            where: { status: miscellaneous_1.MiscellaneousStatus.PENDING_APPROVAL },
            relations: ['creator'],
            order: { created_at: 'ASC' },
        });
    }
    async slugExists(slug) {
        const count = await this.repo.count({ where: { public_slug: slug } });
        return count > 0;
    }
};
exports.MiscellaneousRepository = MiscellaneousRepository;
exports.MiscellaneousRepository = MiscellaneousRepository = __decorate([
    (0, common_1.Injectable)()
], MiscellaneousRepository);
