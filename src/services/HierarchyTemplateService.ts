import { BadRequestException, ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { z } from 'zod';
import { AppDataBase } from '../db';
import { HIERARCHY_TEMPLATES } from '../config/hierarchyTemplates';
import { OrgUnitType } from '../models/orgUnitType';
import { OrgUnit } from '../models/orgUnit';
import { InvestitureType, Position } from '../models/position';
import { AuditLog } from '../models/auditLog';

const slug = z.string().min(1).max(50).regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/);
const name = z.string().trim().min(1).max(100);
export const hierarchyTemplateSchema = z.object({
  version: z.literal(1),
  slug,
  name,
  description: z.string().trim().min(1).max(4000),
  organization_profile: z.string().trim().min(1).max(2000),
  types: z.array(z.object({ slug, name }).strict()).min(1).max(100),
  units: z.array(z.object({
    slug, name, type_slug: slug, parent_slug: slug.optional(),
  }).strict()).min(1).max(500),
  positions: z.array(z.object({
    name,
    type_slug: slug,
    investiture_type: z.enum(InvestitureType),
    mandate_duration_days: z.number().int().min(1).max(36500).optional(),
    allows_deputy: z.boolean().optional(),
  }).strict()).max(500),
}).strict().superRefine((template, ctx) => {
  const types = new Set(template.types.map((type) => type.slug));
  const units = new Map(template.units.map((unit) => [unit.slug, unit]));
  const positions = new Set(template.positions.map((position) => `${position.type_slug}:${position.name}`));
  const fail = (message: string) => ctx.addIssue({ code: 'custom', message });
  if (types.size !== template.types.length || units.size !== template.units.length ||
      positions.size !== template.positions.length) fail('Existem tipos, unidades ou cargos duplicados.');
  for (const unit of template.units) {
    if (!types.has(unit.type_slug)) fail(`Tipo desconhecido na unidade ${unit.slug}.`);
    const visited = new Set<string>([unit.slug]);
    let parent = unit.parent_slug;
    while (parent) {
      if (!units.has(parent)) { fail(`Unidade superior desconhecida: ${parent}.`); break; }
      if (visited.has(parent)) { fail(`Ciclo na hierarquia da unidade ${unit.slug}.`); break; }
      visited.add(parent);
      parent = units.get(parent)?.parent_slug;
    }
  }
  for (const position of template.positions) {
    if (!types.has(position.type_slug)) fail(`Tipo desconhecido no cargo ${position.name}.`);
  }
});

@Injectable()
export class HierarchyTemplateService {
  list() {
    return HIERARCHY_TEMPLATES;
  }

  async import(organizationId: string, input: unknown, actorAccountId: string) {
    const parsed = hierarchyTemplateSchema.safeParse(input);
    if (!parsed.success) {
      throw new BadRequestException(parsed.error.issues.map((issue) => `${issue.path.join('.')}: ${issue.message}`).join('; '));
    }
    const template = parsed.data;
    return AppDataBase.transaction(async (manager) => {
      const organization = await manager.query(
        `SELECT id FROM organizations WHERE id = $1 AND deleted_at IS NULL FOR UPDATE`, [organizationId],
      );
      if (!organization.length) throw new NotFoundException('Organização não encontrada.');
      const existingTypes = await manager.getRepository(OrgUnitType).findBy({ organization_id: organizationId });
      if (existingTypes.some((type) => template.types.some((entry) => entry.slug === type.slug))) {
        throw new ConflictException('Já existe um tipo com o mesmo slug. Edite os slugs do arquivo; nenhum dado foi importado.');
      }
      const existingUnits = await manager.getRepository(OrgUnit).find({
        where: { organization_id: organizationId }, withDeleted: true,
      });
      if (existingUnits.some((unit) => template.units.some((entry) => entry.slug === unit.slug))) {
        throw new ConflictException('Já existe uma unidade com o mesmo slug. Edite os slugs do arquivo; nenhum dado foi importado.');
      }
      const types = new Map<string, string>();
      for (const type of template.types) {
        const saved = await manager.getRepository(OrgUnitType).save(
          manager.getRepository(OrgUnitType).create({ ...type, organization_id: organizationId }),
        );
        types.set(type.slug, saved.id);
      }
      const units = new Map<string, string>();
      const pending = [...template.units];
      while (pending.length) {
        const index = pending.findIndex((unit) => !unit.parent_slug || units.has(unit.parent_slug));
        if (index < 0) throw new BadRequestException('A hierarquia contém um ciclo ou referência inválida.');
        const [unit] = pending.splice(index, 1);
        const saved = await manager.getRepository(OrgUnit).save(manager.getRepository(OrgUnit).create({
          organization_id: organizationId, slug: unit.slug, name: unit.name,
          type_id: types.get(unit.type_slug)!,
          parent_id: unit.parent_slug ? units.get(unit.parent_slug) : undefined,
        }));
        units.set(unit.slug, saved.id);
      }
      for (const position of template.positions) {
        await manager.getRepository(Position).save(manager.getRepository(Position).create({
          organization_id: organizationId, org_unit_type_id: types.get(position.type_slug)!,
          name: position.name, investiture_type: position.investiture_type,
          mandate_duration_days: position.mandate_duration_days, allows_deputy: position.allows_deputy ?? false,
        }));
      }
      const result = { types: types.size, units: units.size, positions: template.positions.length };
      await manager.getRepository(AuditLog).save(manager.getRepository(AuditLog).create({
        organization_id: organizationId, actor_id: null, actor_account_id: actorAccountId,
        actor_type: 'SUPER_ADMIN', action: 'hierarchy.imported', entity_type: 'organization',
        entity_id: organizationId, after_state: { template_slug: template.slug, ...result },
      }));
      return result;
    });
  }
}
