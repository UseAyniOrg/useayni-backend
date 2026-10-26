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
exports.OrgUnitService = void 0;
const common_1 = require("@nestjs/common");
const OrgUnitRepository_1 = require("../repositories/OrgUnitRepository");
const mandate_1 = require("../models/mandate");
const auditLog_1 = require("../models/auditLog");
const member_1 = require("../models/member");
const db_1 = require("../db");
const orgUnit_1 = require("../models/orgUnit");
const position_1 = require("../models/position");
let OrgUnitService = class OrgUnitService {
    constructor(repo) {
        this.repo = repo;
    }
    // ─── Types ─────────────────────────────────────────────────────────────────
    async listTypes(organizationId) {
        return this.repo.findAllTypes(organizationId);
    }
    async createType(dto, actorId) {
        const type = await this.repo.createType(dto);
        await this.audit(dto.organization_id, actorId, 'org_unit_type.created', 'org_unit_type', type.id, null, type);
        return type;
    }
    async updateType(id, organizationId, data, actorId) {
        const type = await this.repo.findTypeById(id, organizationId);
        if (!type)
            throw new common_1.NotFoundException('Tipo de unidade não encontrado');
        await this.repo.updateType(id, data);
        await this.audit(type.organization_id, actorId, 'org_unit_type.updated', 'org_unit_type', id, type, data);
        return this.repo.findTypeById(id, organizationId);
    }
    async deleteType(id, organizationId, actorId) {
        const type = await this.repo.findTypeById(id, organizationId);
        if (!type)
            throw new common_1.NotFoundException('Tipo de unidade não encontrado');
        await this.repo.deleteType(id);
        await this.audit(type.organization_id, actorId, 'org_unit_type.deleted', 'org_unit_type', id, type, null);
    }
    // ─── Units ─────────────────────────────────────────────────────────────────
    async getTree(organizationId) {
        return this.repo.findTree(organizationId);
    }
    async listAll(organizationId) {
        return this.repo.findAll(organizationId);
    }
    async findById(id, organizationId) {
        const unit = await this.repo.findById(id, organizationId);
        if (!unit)
            throw new common_1.NotFoundException('Unidade organizacional não encontrada');
        return unit;
    }
    async create(dto, actorId) {
        const slug = dto.slug ?? dto.name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
        const existing = await this.repo.findBySlug(dto.organization_id, slug);
        if (existing)
            throw new common_1.ConflictException(`Slug '${slug}' já está em uso nesta organização`);
        if (!(await this.repo.findTypeById(dto.type_id, dto.organization_id))) {
            throw new common_1.BadRequestException('Tipo de unidade não encontrado nesta organização');
        }
        if (dto.parent_id && !(await this.repo.findById(dto.parent_id, dto.organization_id))) {
            throw new common_1.BadRequestException('Unidade superior não encontrada nesta organização');
        }
        const unit = await this.repo.createUnit({ ...dto, slug });
        await this.audit(dto.organization_id, actorId, 'org_unit.created', 'org_unit', unit.id, null, unit);
        return unit;
    }
    async update(id, organizationId, dto, actorId) {
        const unit = await this.findById(id, organizationId);
        if (dto.name !== undefined && (!dto.name.trim() || dto.name.length > 255)) {
            throw new common_1.BadRequestException('Informe um nome válido para a unidade.');
        }
        if (dto.status !== undefined && !Object.values(orgUnit_1.OrgUnitStatus).some((status) => status === dto.status)) {
            throw new common_1.BadRequestException('Status de unidade inválido.');
        }
        const updated = await db_1.AppDataBase.transaction(async (manager) => {
            await manager.query(`SELECT id FROM organizations WHERE id = $1 FOR UPDATE`, [organizationId]);
            const repository = manager.getRepository(orgUnit_1.OrgUnit);
            const visited = new Set([id]);
            let parentId = dto.parent_id;
            while (parentId) {
                if (visited.has(parentId))
                    throw new common_1.BadRequestException('A unidade superior não pode criar um ciclo na hierarquia.');
                visited.add(parentId);
                const parent = await repository.findOneBy({ id: parentId, organization_id: organizationId });
                if (!parent)
                    throw new common_1.BadRequestException('Unidade superior não encontrada nesta organização.');
                parentId = parent.parent_id;
            }
            const current = await repository.findOneBy({ id, organization_id: organizationId });
            if (!current)
                throw new common_1.NotFoundException('Unidade organizacional não encontrada.');
            if (dto.name !== undefined)
                current.name = dto.name.trim();
            if (dto.parent_id !== undefined)
                current.parent_id = dto.parent_id;
            if (dto.metadata !== undefined)
                current.metadata = dto.metadata;
            if (dto.status !== undefined)
                current.status = dto.status;
            return repository.save(current);
        });
        await this.audit(unit.organization_id, actorId, 'org_unit.updated', 'org_unit', id, unit, dto);
        return updated;
    }
    async remove(id, organizationId, actorId) {
        const unit = await this.findById(id, organizationId);
        await this.repo.softDeleteUnit(id);
        await this.audit(unit.organization_id, actorId, 'org_unit.deleted', 'org_unit', id, unit, null);
    }
    // ─── Positions ─────────────────────────────────────────────────────────────
    async listPositions(organizationId) {
        return this.repo.findAllPositions(organizationId);
    }
    async findPositionById(id, organizationId) {
        const pos = await this.repo.findPositionById(id, organizationId);
        if (!pos)
            throw new common_1.NotFoundException('Cargo não encontrado');
        return pos;
    }
    async createPosition(dto, actorId) {
        this.validatePosition(dto);
        if (!(await this.repo.findTypeById(dto.org_unit_type_id, dto.organization_id))) {
            throw new common_1.BadRequestException('Tipo de unidade não encontrado nesta organização');
        }
        const position = await this.repo.createPosition(dto);
        await this.audit(dto.organization_id, actorId, 'position.created', 'position', position.id, null, position);
        return position;
    }
    async updatePosition(id, organizationId, dto, actorId) {
        this.validatePosition(dto);
        const before = await this.findPositionById(id, organizationId);
        if (dto.org_unit_type_id &&
            !(await this.repo.findTypeById(dto.org_unit_type_id, organizationId))) {
            throw new common_1.BadRequestException('Tipo de unidade não encontrado nesta organização');
        }
        const updated = await this.repo.updatePosition(id, organizationId, dto);
        await this.audit(before.organization_id, actorId, 'position.updated', 'position', id, before, dto);
        return updated;
    }
    async removePosition(id, organizationId, actorId) {
        const pos = await this.findPositionById(id, organizationId);
        await this.repo.softDeletePosition(id);
        await this.audit(pos.organization_id, actorId, 'position.deleted', 'position', id, pos, null);
    }
    // ─── Mandates ──────────────────────────────────────────────────────────────
    async listMandates(organizationId) {
        return this.repo.findMandates(organizationId);
    }
    async listMandatesByUnit(unitId, organizationId) {
        await this.findById(unitId, organizationId);
        return this.repo.findMandatesByUnit(unitId, organizationId);
    }
    async getActiveMandatesForMember(memberId, organizationId) {
        return this.repo.findActiveMandatesByMember(memberId, organizationId);
    }
    async createMandate(dto, actorId) {
        if (!Number.isFinite(dto.start_date.getTime()) ||
            (dto.end_date && (!Number.isFinite(dto.end_date.getTime()) || dto.end_date < dto.start_date))) {
            throw new common_1.BadRequestException('Informe datas válidas; o fim não pode ser anterior ao início.');
        }
        const [position, unit, member] = await Promise.all([
            this.repo.findPositionById(dto.position_id, dto.organization_id),
            this.repo.findById(dto.org_unit_id, dto.organization_id),
            db_1.AppDataBase.getRepository(member_1.Member).findOneBy({
                id: dto.member_id,
                organization_id: dto.organization_id,
            }),
        ]);
        if (!position || !unit) {
            throw new common_1.BadRequestException('Cargo ou unidade não encontrado nesta organização');
        }
        if (!member)
            throw new common_1.BadRequestException('Membro não encontrado nesta organização');
        if (position.org_unit_type_id !== unit.type_id) {
            throw new common_1.BadRequestException('O cargo deve pertencer ao tipo da unidade selecionada.');
        }
        let endDate = dto.end_date;
        if (!endDate && position.mandate_duration_days) {
            endDate = new Date(dto.start_date);
            endDate.setUTCDate(endDate.getUTCDate() + position.mandate_duration_days);
        }
        const mandate = await this.repo.createMandate({ ...dto, end_date: endDate });
        await this.audit(dto.organization_id, actorId, 'mandate.created', 'mandate', mandate.id, null, mandate);
        return mandate;
    }
    async closeMandate(id, organizationId, actorId, revoked = false) {
        const mandate = await this.repo.findMandateById(id, organizationId);
        if (!mandate)
            throw new common_1.NotFoundException('Mandato não encontrado');
        if (mandate.status !== mandate_1.MandateStatus.ACTIVE) {
            throw new common_1.BadRequestException('Mandato já está encerrado');
        }
        const status = revoked ? mandate_1.MandateStatus.REVOKED : mandate_1.MandateStatus.CLOSED;
        const updated = await this.repo.closeMandate(id, organizationId, status);
        await this.audit(mandate.organization_id, actorId, 'mandate.closed', 'mandate', id, mandate, { status });
        return updated;
    }
    // ─── Private ──────────────────────────────────────────────────────────────
    validatePosition(dto) {
        if (dto.name !== undefined && (!dto.name.trim() || dto.name.length > 100)) {
            throw new common_1.BadRequestException('Informe um nome válido para o cargo.');
        }
        if (dto.investiture_type !== undefined &&
            !Object.values(position_1.InvestitureType).some((type) => type === dto.investiture_type)) {
            throw new common_1.BadRequestException('Forma de investidura inválida.');
        }
        if (dto.mandate_duration_days !== undefined &&
            (!Number.isInteger(dto.mandate_duration_days) || dto.mandate_duration_days < 1 || dto.mandate_duration_days > 36500)) {
            throw new common_1.BadRequestException('A duração do mandato deve ser um número inteiro entre 1 e 36500 dias.');
        }
    }
    async audit(orgId, actorId, action, entityType, entityId, before, after) {
        const repo = db_1.AppDataBase.getRepository(auditLog_1.AuditLog);
        const actor = await db_1.AppDataBase.getRepository(member_1.Member).findOne({
            where: { id: actorId },
            select: { id: true, account_id: true },
        });
        await repo.save(repo.create({
            organization_id: orgId,
            actor_id: actor?.id ?? null,
            actor_account_id: actor?.account_id ?? actorId,
            actor_type: actor ? 'ORGANIZATION_ADMIN' : 'SUPER_ADMIN',
            action,
            entity_type: entityType,
            entity_id: entityId,
            before_state: before,
            after_state: after,
        }));
    }
};
exports.OrgUnitService = OrgUnitService;
exports.OrgUnitService = OrgUnitService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [OrgUnitRepository_1.OrgUnitRepository])
], OrgUnitService);
