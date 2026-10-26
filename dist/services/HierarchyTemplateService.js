"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.HierarchyTemplateService = exports.hierarchyTemplateSchema = void 0;
const common_1 = require("@nestjs/common");
const zod_1 = require("zod");
const db_1 = require("../db");
const hierarchyTemplates_1 = require("../config/hierarchyTemplates");
const orgUnitType_1 = require("../models/orgUnitType");
const orgUnit_1 = require("../models/orgUnit");
const position_1 = require("../models/position");
const auditLog_1 = require("../models/auditLog");
const slug = zod_1.z.string().min(1).max(50).regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/);
const name = zod_1.z.string().trim().min(1).max(100);
exports.hierarchyTemplateSchema = zod_1.z.object({
    version: zod_1.z.literal(1),
    slug,
    name,
    description: zod_1.z.string().trim().min(1).max(4000),
    organization_profile: zod_1.z.string().trim().min(1).max(2000),
    types: zod_1.z.array(zod_1.z.object({ slug, name }).strict()).min(1).max(100),
    units: zod_1.z.array(zod_1.z.object({
        slug, name, type_slug: slug, parent_slug: slug.optional(),
    }).strict()).min(1).max(500),
    positions: zod_1.z.array(zod_1.z.object({
        name,
        type_slug: slug,
        investiture_type: zod_1.z.enum(position_1.InvestitureType),
        mandate_duration_days: zod_1.z.number().int().min(1).max(36500).optional(),
        allows_deputy: zod_1.z.boolean().optional(),
    }).strict()).max(500),
}).strict().superRefine((template, ctx) => {
    const types = new Set(template.types.map((type) => type.slug));
    const units = new Map(template.units.map((unit) => [unit.slug, unit]));
    const positions = new Set(template.positions.map((position) => `${position.type_slug}:${position.name}`));
    const fail = (message) => ctx.addIssue({ code: 'custom', message });
    if (types.size !== template.types.length || units.size !== template.units.length ||
        positions.size !== template.positions.length)
        fail('Existem tipos, unidades ou cargos duplicados.');
    for (const unit of template.units) {
        if (!types.has(unit.type_slug))
            fail(`Tipo desconhecido na unidade ${unit.slug}.`);
        const visited = new Set([unit.slug]);
        let parent = unit.parent_slug;
        while (parent) {
            if (!units.has(parent)) {
                fail(`Unidade superior desconhecida: ${parent}.`);
                break;
            }
            if (visited.has(parent)) {
                fail(`Ciclo na hierarquia da unidade ${unit.slug}.`);
                break;
            }
            visited.add(parent);
            parent = units.get(parent)?.parent_slug;
        }
    }
    for (const position of template.positions) {
        if (!types.has(position.type_slug))
            fail(`Tipo desconhecido no cargo ${position.name}.`);
    }
});
let HierarchyTemplateService = class HierarchyTemplateService {
    list() {
        return hierarchyTemplates_1.HIERARCHY_TEMPLATES;
    }
    async import(organizationId, input, actorAccountId) {
        const parsed = exports.hierarchyTemplateSchema.safeParse(input);
        if (!parsed.success) {
            throw new common_1.BadRequestException(parsed.error.issues.map((issue) => `${issue.path.join('.')}: ${issue.message}`).join('; '));
        }
        const template = parsed.data;
        return db_1.AppDataBase.transaction(async (manager) => {
            const organization = await manager.query(`SELECT id FROM organizations WHERE id = $1 AND deleted_at IS NULL FOR UPDATE`, [organizationId]);
            if (!organization.length)
                throw new common_1.NotFoundException('Organização não encontrada.');
            const existingTypes = await manager.getRepository(orgUnitType_1.OrgUnitType).findBy({ organization_id: organizationId });
            if (existingTypes.some((type) => template.types.some((entry) => entry.slug === type.slug))) {
                throw new common_1.ConflictException('Já existe um tipo com o mesmo slug. Edite os slugs do arquivo; nenhum dado foi importado.');
            }
            const existingUnits = await manager.getRepository(orgUnit_1.OrgUnit).find({
                where: { organization_id: organizationId }, withDeleted: true,
            });
            if (existingUnits.some((unit) => template.units.some((entry) => entry.slug === unit.slug))) {
                throw new common_1.ConflictException('Já existe uma unidade com o mesmo slug. Edite os slugs do arquivo; nenhum dado foi importado.');
            }
            const types = new Map();
            for (const type of template.types) {
                const saved = await manager.getRepository(orgUnitType_1.OrgUnitType).save(manager.getRepository(orgUnitType_1.OrgUnitType).create({ ...type, organization_id: organizationId }));
                types.set(type.slug, saved.id);
            }
            const units = new Map();
            const pending = [...template.units];
            while (pending.length) {
                const index = pending.findIndex((unit) => !unit.parent_slug || units.has(unit.parent_slug));
                if (index < 0)
                    throw new common_1.BadRequestException('A hierarquia contém um ciclo ou referência inválida.');
                const [unit] = pending.splice(index, 1);
                const saved = await manager.getRepository(orgUnit_1.OrgUnit).save(manager.getRepository(orgUnit_1.OrgUnit).create({
                    organization_id: organizationId, slug: unit.slug, name: unit.name,
                    type_id: types.get(unit.type_slug),
                    parent_id: unit.parent_slug ? units.get(unit.parent_slug) : undefined,
                }));
                units.set(unit.slug, saved.id);
            }
            for (const position of template.positions) {
                await manager.getRepository(position_1.Position).save(manager.getRepository(position_1.Position).create({
                    organization_id: organizationId, org_unit_type_id: types.get(position.type_slug),
                    name: position.name, investiture_type: position.investiture_type,
                    mandate_duration_days: position.mandate_duration_days, allows_deputy: position.allows_deputy ?? false,
                }));
            }
            const result = { types: types.size, units: units.size, positions: template.positions.length };
            await manager.getRepository(auditLog_1.AuditLog).save(manager.getRepository(auditLog_1.AuditLog).create({
                organization_id: organizationId, actor_id: null, actor_account_id: actorAccountId,
                actor_type: 'SUPER_ADMIN', action: 'hierarchy.imported', entity_type: 'organization',
                entity_id: organizationId, after_state: { template_slug: template.slug, ...result },
            }));
            return result;
        });
    }
};
exports.HierarchyTemplateService = HierarchyTemplateService;
exports.HierarchyTemplateService = HierarchyTemplateService = __decorate([
    (0, common_1.Injectable)()
], HierarchyTemplateService);
