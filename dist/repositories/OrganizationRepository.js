"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.OrganizationRepository = void 0;
const common_1 = require("@nestjs/common");
const db_1 = require("../db");
const organization_1 = require("../models/organization");
const organizationFeature_1 = require("../models/organizationFeature");
const plan_1 = require("../models/plan");
let OrganizationRepository = class OrganizationRepository {
    get repo() {
        return db_1.AppDataBase.getRepository(organization_1.Organization);
    }
    get featureRepo() {
        return db_1.AppDataBase.getRepository(organizationFeature_1.OrganizationFeature);
    }
    get planRepo() {
        return db_1.AppDataBase.getRepository(plan_1.Plan);
    }
    findAll() {
        return this.repo.find({
            where: { deleted_at: undefined },
            relations: ['plan'],
            order: { name: 'ASC' },
        });
    }
    findById(id) {
        return this.repo.findOne({ where: { id }, relations: ['plan'] });
    }
    findBySlug(slug) {
        return this.repo.findOne({ where: { slug }, relations: ['plan'] });
    }
    async create(data) {
        const org = this.repo.create(data);
        return this.repo.save(org);
    }
    async update(id, data) {
        const organization = await this.repo.findOneBy({ id });
        if (!organization)
            return null;
        Object.assign(organization, data);
        return this.repo.save(organization);
    }
    async softDelete(id) {
        await this.repo.softDelete(id);
    }
    // ─── Features ─────────────────────────────────────────────────────────────
    findFeatures(organization_id) {
        return this.featureRepo.find({ where: { organization_id } });
    }
    findEnabledFeatures(organization_id) {
        return this.featureRepo.find({ where: { organization_id, enabled: true } });
    }
    async upsertFeature(organization_id, feature_slug, enabled, config = {}) {
        const feature = await this.featureRepo.findOneBy({ organization_id, feature_slug }) ??
            this.featureRepo.create({
                organization_id,
                feature_slug,
            });
        feature.enabled = enabled;
        feature.config = config;
        return this.featureRepo.save(feature);
    }
    // ─── Plans ─────────────────────────────────────────────────────────────────
    findAllPlans() {
        return this.planRepo.find({ where: { is_active: true }, order: { price_brl: 'ASC' } });
    }
};
exports.OrganizationRepository = OrganizationRepository;
exports.OrganizationRepository = OrganizationRepository = __decorate([
    (0, common_1.Injectable)()
], OrganizationRepository);
