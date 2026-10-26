import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { z } from 'zod';
import { AppDataBase } from '../db';
import { EntityManager } from 'typeorm';

const fieldSchema = z.object({
  key: z.string().regex(/^[a-z][a-z0-9_]{0,63}$/),
  label: z.string().trim().min(1).max(150),
  type: z.enum(['text', 'email', 'number', 'date', 'select', 'checkbox']),
  required: z.boolean(),
  options: z.array(z.string().trim().min(1).max(200)).max(50).optional(),
}).strict().refine(field => field.type !== 'select' || Boolean(field.options?.length), 'Defina as opções da lista.');

export const externalProfileTypesSchema = z.array(z.object({
  key: z.string().regex(/^[a-z][a-z0-9_-]{0,63}$/),
  name: z.string().trim().min(1).max(120),
  description: z.string().trim().max(1000),
  fields: z.array(fieldSchema).max(40),
}).strict()).min(1).max(20).superRefine((profiles, ctx) => {
  const keys = new Set<string>();
  const sharedFields = new Map<string, string>();
  for (const profile of profiles) {
    if (keys.has(profile.key)) ctx.addIssue({ code: 'custom', message: 'Chave de perfil repetida.' });
    keys.add(profile.key);
    const fields = new Set<string>();
    for (const field of profile.fields) {
      if (fields.has(field.key)) ctx.addIssue({ code: 'custom', message: 'Chave de campo repetida no perfil.' });
      fields.add(field.key);
      const signature = JSON.stringify([field.label, field.type, field.options ?? []]);
      if (sharedFields.has(field.key) && sharedFields.get(field.key) !== signature) {
        ctx.addIssue({ code: 'custom', message: 'Campos com a mesma chave devem ter o mesmo significado e formato.' });
      }
      sharedFields.set(field.key, signature);
    }
  }
});

export type ExternalProfileType = z.infer<typeof externalProfileTypesSchema>[number];
export const DEFAULT_EXTERNAL_PROFILE_TYPES: ExternalProfileType[] = [
  { key: 'visitor', name: 'Básico', description: 'Cadastro básico: nome e email, com telefone e CPF opcionais. Disponível para membros e comunidade.', fields: [] },
];

@Injectable()
export class ExternalProfileTypesService {
  async list(organizationId: string): Promise<ExternalProfileType[]> {
    const [organization] = await AppDataBase.query(
      `SELECT settings->'external_profile_types' AS profiles FROM organizations WHERE id = $1 AND deleted_at IS NULL`, [organizationId],
    ) as { profiles: unknown }[];
    if (!organization) throw new NotFoundException('Organização não encontrada.');
    if (organization.profiles == null) return DEFAULT_EXTERNAL_PROFILE_TYPES;
    const parsed = externalProfileTypesSchema.safeParse(organization.profiles);
    if (!parsed.success) throw new BadRequestException('A configuração dos tipos de cadastro é inválida. Contate a organização.');
    return parsed.data;
  }

  async save(organizationId: string, input: unknown, accountId?: string) {
    const result = externalProfileTypesSchema.safeParse(input);
    if (!result.success) throw new BadRequestException(result.error.issues.map(issue => issue.message).join(' '));
    await AppDataBase.transaction(async manager => {
      const updated = await manager.query(
        `UPDATE organizations SET settings = jsonb_set(COALESCE(settings, '{}'::jsonb), '{external_profile_types}', $2::jsonb),
         updated_at = now() WHERE id = $1 AND deleted_at IS NULL RETURNING id`, [organizationId, JSON.stringify(result.data)],
      ) as { id: string }[];
      if (!updated.length) throw new NotFoundException('Organização não encontrada.');
      await manager.query(
        `INSERT INTO audit_logs (organization_id, actor_account_id, action, entity_type, entity_id, after_state)
         VALUES ($1, $2, 'external_profile_types.updated', 'organization', $1, $3::jsonb)`,
        [organizationId, accountId ?? null, JSON.stringify(result.data)],
      );
    });
    return result.data;
  }

  validateValues(profile: ExternalProfileType, input: unknown): Record<string, unknown> {
    const values: Record<string, unknown> = {};
    const fields: Record<string, z.ZodType> = {};
    for (const field of profile.fields) {
      let validator: z.ZodType;
      switch (field.type) {
        case 'number': validator = z.number().finite(); break;
        case 'checkbox': validator = field.required ? z.literal(true) : z.boolean(); break;
        case 'email': validator = z.email().max(255); break;
        case 'date': validator = z.iso.date(); break;
        case 'select': validator = z.string().refine(value => field.options!.includes(value)); break;
        default: validator = z.string().trim().min(1).max(2000);
      }
      fields[field.key] = field.required ? validator : validator.optional();
    }
    const parsed = z.object(fields).strict().safeParse(input);
    if (!parsed.success) throw new BadRequestException('Preencha os dados do perfil nesta organização com os formatos solicitados.');
    Object.assign(values, parsed.data);
    return values;
  }

  async resolve(organizationId: string, key: string | undefined, input: unknown) {
    const definitions = await this.list(organizationId);
    const definition = key ? definitions.find(item => item.key === key) : definitions.length === 1 ? definitions[0] : undefined;
    if (!definition) throw new BadRequestException('Selecione um tipo de cadastro oferecido por esta organização.');
    return { definition, values: this.validateValues(definition, input ?? {}) };
  }

  async saveAccountProfile(manager: EntityManager, accountId: string, organizationId: string,
    name: string, phone: string | null, definition: ExternalProfileType, values: Record<string, unknown>, cpf?: string | null) {
    const reusable = Object.fromEntries(definition.fields.filter(field => values[field.key] !== undefined)
      .map(field => [field.key, { label: field.label, type: field.type, options: field.options ?? [], value: values[field.key] }]));
    const snapshot = { key: definition.key, name: definition.name, fields: definition.fields,
      data: values, consent_at: new Date().toISOString(), consent_version: 'registration-profile-v1' };
    await manager.query(
      `INSERT INTO external_account_profiles (account_id, display_name, profile_type, phone, academic_data, additional_attributes)
       VALUES ($1, $2, 'basic', $3, '{}'::jsonb, $4::jsonb)
       ON CONFLICT (account_id) DO UPDATE SET display_name = EXCLUDED.display_name,
       phone = COALESCE(EXCLUDED.phone, external_account_profiles.phone),
       additional_attributes = external_account_profiles.additional_attributes ||
       (EXCLUDED.additional_attributes - 'external_fields' - 'organization_profiles') || jsonb_build_object(
         'external_fields', COALESCE(external_account_profiles.additional_attributes->'external_fields', '{}'::jsonb) || EXCLUDED.additional_attributes->'external_fields',
         'organization_profiles', COALESCE(external_account_profiles.additional_attributes->'organization_profiles', '{}'::jsonb) || EXCLUDED.additional_attributes->'organization_profiles'),
       updated_at = now()`,
      [accountId, name, phone, JSON.stringify({ ...(cpf ? { base_cpf: cpf } : {}), external_fields: reusable, organization_profiles: { [organizationId]: snapshot } })],
    );
  }
}
