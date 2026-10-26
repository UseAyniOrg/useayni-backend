"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.OrgUnitRepository = void 0;
const common_1 = require("@nestjs/common");
const db_1 = require("../db");
const orgUnit_1 = require("../models/orgUnit");
const orgUnitType_1 = require("../models/orgUnitType");
const position_1 = require("../models/position");
const mandate_1 = require("../models/mandate");
let OrgUnitRepository = class OrgUnitRepository {
    get unitRepo() { return db_1.AppDataBase.getRepository(orgUnit_1.OrgUnit); }
    get typeRepo() { return db_1.AppDataBase.getRepository(orgUnitType_1.OrgUnitType); }
    get positionRepo() { return db_1.AppDataBase.getRepository(position_1.Position); }
    get mandateRepo() { return db_1.AppDataBase.getRepository(mandate_1.Mandate); }
    // ─── Types ─────────────────────────────────────────────────────────────────
    findAllTypes(organization_id) {
        return this.typeRepo.find({
            where: { organization_id },
            order: { name: 'ASC' },
        });
    }
    findTypeById(id, organization_id) {
        return this.typeRepo.findOneBy({ id, organization_id });
    }
    createType(data) {
        return this.typeRepo.save(this.typeRepo.create({
            id: data.id,
            organization_id: data.organization_id,
            slug: data.slug,
            name: data.name,
            metadata_schema: data.metadata_schema,
        }));
    }
    updateType(id, data) {
        return this.typeRepo.findOneBy({ id }).then((type) => {
            if (!type)
                return null;
            Object.assign(type, {
                slug: data.slug,
                name: data.name,
                metadata_schema: data.metadata_schema,
            });
            return this.typeRepo.save(type);
        });
    }
    deleteType(id) {
        return this.typeRepo.delete(id);
    }
    // ─── Units ─────────────────────────────────────────────────────────────────
    findAll(organization_id) {
        return this.unitRepo.find({
            where: { organization_id },
            relations: ['type', 'parent'],
            order: { name: 'ASC' },
        });
    }
    findById(id, organization_id) {
        return this.unitRepo.findOne({
            where: { id, organization_id },
            relations: ['type', 'parent', 'children', 'children.type'],
        });
    }
    findBySlug(organization_id, slug) {
        return this.unitRepo.findOne({ where: { organization_id, slug } });
    }
    findRoots(organization_id) {
        return this.unitRepo.find({
            where: { organization_id, parent_id: undefined },
            relations: ['type'],
        });
    }
    async findTree(organization_id) {
        // Load all units and build in-memory tree
        const all = await this.unitRepo.find({
            where: { organization_id },
            relations: ['type'],
            order: { name: 'ASC' },
        });
        const map = new Map();
        all.forEach((u) => map.set(u.id, { ...u, children: [] }));
        const roots = [];
        map.forEach((unit) => {
            if (unit.parent_id && map.has(unit.parent_id)) {
                map.get(unit.parent_id).children.push(unit);
            }
            else {
                roots.push(unit);
            }
        });
        return roots;
    }
    createUnit(data) {
        return this.unitRepo.save(this.unitRepo.create({
            id: data.id,
            organization_id: data.organization_id,
            parent_id: data.parent_id,
            type_id: data.type_id,
            name: data.name,
            slug: data.slug,
            metadata: data.metadata,
            status: data.status,
        }));
    }
    async updateUnit(id, organization_id, data) {
        const unit = await this.unitRepo.findOneBy({ id, organization_id });
        if (!unit)
            return null;
        Object.assign(unit, {
            parent_id: data.parent_id,
            type_id: data.type_id,
            name: data.name,
            slug: data.slug,
            metadata: data.metadata,
            status: data.status,
        });
        await this.unitRepo.save(unit);
        return this.findById(id, organization_id);
    }
    softDeleteUnit(id) {
        return this.unitRepo.softDelete(id);
    }
    // ─── Positions ─────────────────────────────────────────────────────────────
    findAllPositions(organization_id) {
        return this.positionRepo.find({
            where: { organization_id },
            relations: ['org_unit_type', 'roles'],
            order: { name: 'ASC' },
        });
    }
    findPositionById(id, organization_id) {
        return this.positionRepo.findOne({
            where: { id, organization_id },
            relations: ['org_unit_type', 'roles'],
        });
    }
    createPosition(data) {
        return this.positionRepo.save(this.positionRepo.create({
            id: data.id,
            organization_id: data.organization_id,
            org_unit_type_id: data.org_unit_type_id,
            name: data.name,
            investiture_type: data.investiture_type,
            mandate_duration_days: data.mandate_duration_days,
            allows_deputy: data.allows_deputy,
            roles: data.roles,
        }));
    }
    async updatePosition(id, organization_id, data) {
        const position = await this.positionRepo.findOneBy({ id, organization_id });
        if (!position)
            return null;
        Object.assign(position, {
            org_unit_type_id: data.org_unit_type_id,
            name: data.name,
            investiture_type: data.investiture_type,
            mandate_duration_days: data.mandate_duration_days,
            allows_deputy: data.allows_deputy,
        });
        await this.positionRepo.save(position);
        return this.findPositionById(id, organization_id);
    }
    softDeletePosition(id) {
        return this.positionRepo.softDelete(id);
    }
    // ─── Mandates ──────────────────────────────────────────────────────────────
    findMandates(organization_id) {
        return this.mandateRepo.find({
            where: { organization_id },
            relations: ['position', 'org_unit', 'member'],
            order: { start_date: 'DESC' },
        });
    }
    findActiveMandatesByMember(member_id, organization_id) {
        return this.mandateRepo.find({
            where: { member_id, organization_id, status: mandate_1.MandateStatus.ACTIVE },
            relations: ['position', 'org_unit', 'org_unit.type'],
        });
    }
    findMandatesByUnit(org_unit_id, organization_id) {
        return this.mandateRepo.find({
            where: { org_unit_id, organization_id },
            relations: ['position', 'member'],
            order: { start_date: 'DESC' },
        });
    }
    findMandateById(id, organization_id) {
        return this.mandateRepo.findOne({
            where: { id, organization_id },
            relations: ['position', 'org_unit', 'member'],
        });
    }
    createMandate(data) {
        return this.mandateRepo.save(this.mandateRepo.create(data));
    }
    async closeMandate(id, organization_id, status = mandate_1.MandateStatus.CLOSED) {
        await this.mandateRepo.update({ id, organization_id }, {
            status,
            end_date: new Date(),
        });
        return this.findMandateById(id, organization_id);
    }
};
exports.OrgUnitRepository = OrgUnitRepository;
exports.OrgUnitRepository = OrgUnitRepository = __decorate([
    (0, common_1.Injectable)()
], OrgUnitRepository);
