"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ExternalProfileTypesService = exports.DEFAULT_EXTERNAL_PROFILE_TYPES = exports.externalProfileTypesSchema = void 0;
const common_1 = require("@nestjs/common");
const zod_1 = require("zod");
const db_1 = require("../db");
const fieldSchema = zod_1.z.object({
    key: zod_1.z.string().regex(/^[a-z][a-z0-9_]{0,63}$/),
    label: zod_1.z.string().trim().min(1).max(150),
    type: zod_1.z.enum(['text', 'email', 'number', 'date', 'select', 'checkbox']),
    required: zod_1.z.boolean(),
    options: zod_1.z.array(zod_1.z.string().trim().min(1).max(200)).max(50).optional(),
}).strict().refine(field => field.type !== 'select' || Boolean(field.options?.length), 'Defina as opções da lista.');
exports.externalProfileTypesSchema = zod_1.z.array(zod_1.z.object({
    key: zod_1.z.string().regex(/^[a-z][a-z0-9_-]{0,63}$/),
    name: zod_1.z.string().trim().min(1).max(120),
    description: zod_1.z.string().trim().max(1000),
    fields: zod_1.z.array(fieldSchema).max(40),
}).strict()).min(1).max(20).superRefine((profiles, ctx) => {
    const keys = new Set();
    const sharedFields = new Map();
    for (const profile of profiles) {
        if (keys.has(profile.key))
            ctx.addIssue({ code: 'custom', message: 'Chave de perfil repetida.' });
        keys.add(profile.key);
        const fields = new Set();
        for (const field of profile.fields) {
            if (fields.has(field.key))
                ctx.addIssue({ code: 'custom', message: 'Chave de campo repetida no perfil.' });
            fields.add(field.key);
            const signature = JSON.stringify([field.label, field.type, field.options ?? []]);
            if (sharedFields.has(field.key) && sharedFields.get(field.key) !== signature) {
                ctx.addIssue({ code: 'custom', message: 'Campos com a mesma chave devem ter o mesmo significado e formato.' });
            }
            sharedFields.set(field.key, signature);
        }
    }
});
exports.DEFAULT_EXTERNAL_PROFILE_TYPES = [
    { key: 'visitor', name: 'Básico', description: 'Cadastro básico: nome e email, com telefone e CPF opcionais. Disponível para membros e comunidade.', fields: [] },
];
let ExternalProfileTypesService = class ExternalProfileTypesService {
    async list(organizationId) {
        const [organization] = await db_1.AppDataBase.query(`SELECT settings->'external_profile_types' AS profiles FROM organizations WHERE id = $1 AND deleted_at IS NULL`, [organizationId]);
        if (!organization)
            throw new common_1.NotFoundException('Organização não encontrada.');
        if (organization.profiles == null)
            return exports.DEFAULT_EXTERNAL_PROFILE_TYPES;
        const parsed = exports.externalProfileTypesSchema.safeParse(organization.profiles);
        if (!parsed.success)
            throw new common_1.BadRequestException('A configuração dos tipos de cadastro é inválida. Contate a organização.');
        return parsed.data;
    }
    async save(organizationId, input, accountId) {
        const result = exports.externalProfileTypesSchema.safeParse(input);
        if (!result.success)
            throw new common_1.BadRequestException(result.error.issues.map(issue => issue.message).join(' '));
        await db_1.AppDataBase.transaction(async (manager) => {
            const updated = await manager.query(`UPDATE organizations SET settings = jsonb_set(COALESCE(settings, '{}'::jsonb), '{external_profile_types}', $2::jsonb),
         updated_at = now() WHERE id = $1 AND deleted_at IS NULL RETURNING id`, [organizationId, JSON.stringify(result.data)]);
            if (!updated.length)
                throw new common_1.NotFoundException('Organização não encontrada.');
            await manager.query(`INSERT INTO audit_logs (organization_id, actor_account_id, action, entity_type, entity_id, after_state)
         VALUES ($1, $2, 'external_profile_types.updated', 'organization', $1, $3::jsonb)`, [organizationId, accountId ?? null, JSON.stringify(result.data)]);
        });
        return result.data;
    }
    validateValues(profile, input) {
        const values = {};
        const fields = {};
        for (const field of profile.fields) {
            let validator;
            switch (field.type) {
                case 'number':
                    validator = zod_1.z.number().finite();
                    break;
                case 'checkbox':
                    validator = field.required ? zod_1.z.literal(true) : zod_1.z.boolean();
                    break;
                case 'email':
                    validator = zod_1.z.email().max(255);
                    break;
                case 'date':
                    validator = zod_1.z.iso.date();
                    break;
                case 'select':
                    validator = zod_1.z.string().refine(value => field.options.includes(value));
                    break;
                default: validator = zod_1.z.string().trim().min(1).max(2000);
            }
            fields[field.key] = field.required ? validator : validator.optional();
        }
        const parsed = zod_1.z.object(fields).strict().safeParse(input);
        if (!parsed.success)
            throw new common_1.BadRequestException('Preencha os dados do perfil nesta organização com os formatos solicitados.');
        Object.assign(values, parsed.data);
        return values;
    }
    async resolve(organizationId, key, input) {
        const definitions = await this.list(organizationId);
        const definition = key ? definitions.find(item => item.key === key) : definitions.length === 1 ? definitions[0] : undefined;
        if (!definition)
            throw new common_1.BadRequestException('Selecione um tipo de cadastro oferecido por esta organização.');
        return { definition, values: this.validateValues(definition, input ?? {}) };
    }
    async saveAccountProfile(manager, accountId, organizationId, name, phone, definition, values, cpf) {
        const reusable = Object.fromEntries(definition.fields.filter(field => values[field.key] !== undefined)
            .map(field => [field.key, { label: field.label, type: field.type, options: field.options ?? [], value: values[field.key] }]));
        const snapshot = { key: definition.key, name: definition.name, fields: definition.fields,
            data: values, consent_at: new Date().toISOString(), consent_version: 'registration-profile-v1' };
        await manager.query(`INSERT INTO external_account_profiles (account_id, display_name, profile_type, phone, academic_data, additional_attributes)
       VALUES ($1, $2, 'basic', $3, '{}'::jsonb, $4::jsonb)
       ON CONFLICT (account_id) DO UPDATE SET display_name = EXCLUDED.display_name,
       phone = COALESCE(EXCLUDED.phone, external_account_profiles.phone),
       additional_attributes = external_account_profiles.additional_attributes ||
       (EXCLUDED.additional_attributes - 'external_fields' - 'organization_profiles') || jsonb_build_object(
         'external_fields', COALESCE(external_account_profiles.additional_attributes->'external_fields', '{}'::jsonb) || EXCLUDED.additional_attributes->'external_fields',
         'organization_profiles', COALESCE(external_account_profiles.additional_attributes->'organization_profiles', '{}'::jsonb) || EXCLUDED.additional_attributes->'organization_profiles'),
       updated_at = now()`, [accountId, name, phone, JSON.stringify({ ...(cpf ? { base_cpf: cpf } : {}), external_fields: reusable, organization_profiles: { [organizationId]: snapshot } })]);
    }
};
exports.ExternalProfileTypesService = ExternalProfileTypesService;
exports.ExternalProfileTypesService = ExternalProfileTypesService = __decorate([
    (0, common_1.Injectable)()
], ExternalProfileTypesService);
