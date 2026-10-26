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
exports.ExternalEventRegistrationService = void 0;
const common_1 = require("@nestjs/common");
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const crypto_1 = require("crypto");
const db_1 = require("../db");
const miscellaneous_1 = require("../models/miscellaneous");
const ExternalProfileTypesService_1 = require("./ExternalProfileTypesService");
const cpf_1 = require("../helpers/cpf");
const DomainEmailService_1 = require("./DomainEmailService");
const EmailService_1 = require("./EmailService");
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const FIELD_TYPES = new Set(['text', 'email', 'number', 'date', 'select', 'checkbox']);
let ExternalEventRegistrationService = class ExternalEventRegistrationService {
    constructor(domainEmails = new DomainEmailService_1.DomainEmailService(new EmailService_1.EmailService())) {
        this.domainEmails = domainEmails;
        this.profileTypes = new ExternalProfileTypesService_1.ExternalProfileTypesService();
    }
    async getPublicEvent(slug, organizationId) {
        const event = await this.findPublicEvent(slug);
        if (organizationId && event.organization_id !== organizationId)
            throw new common_1.NotFoundException('Evento não encontrado.');
        this.assertOrganizationAvailable(event);
        if (event.status !== 'active')
            throw new common_1.NotFoundException('Evento não encontrado.');
        const [{ count }] = await db_1.AppDataBase.query(`SELECT count(*)::int AS count FROM miscellaneous_participants WHERE miscellaneous_id = $1`, [event.id]);
        const limits = [event.max_participants, event.max_members].filter((limit) => limit != null);
        const capacity = limits.length ? Math.min(...limits) : null;
        const now = new Date();
        const registrationState = event.registration_start_date && new Date(event.registration_start_date) > now
            ? 'not_open' : event.registration_end_date && new Date(event.registration_end_date) < now
            ? 'closed' : capacity !== null && count >= capacity ? 'full' : 'open';
        return {
            id: event.id,
            organization_id: event.organization_id,
            organization_name: event.organization_name,
            title: event.title,
            description: event.description,
            start_date: event.start_date,
            end_date: event.end_date,
            registration_start_date: event.registration_start_date,
            registration_end_date: event.registration_end_date,
            registration_fields: this.validateSchema(event.external_registration_schema ?? []),
            external_profile_types: await this.profileTypes.list(event.organization_id),
            max_participants: capacity,
            remaining_places: capacity === null ? null : Math.max(0, capacity - count),
            registration_state: registrationState,
            location: [event.location_street, event.location_number, event.location_neighborhood, event.location_city, event.location_state].filter(Boolean).join(', '),
        };
    }
    async registrationStatus(slug, organizationId, accountId) {
        const event = await this.getPublicEvent(slug, organizationId);
        if (!accountId)
            return { authenticated: false, registered: false, membership: null };
        const [membership] = await db_1.AppDataBase.query(`SELECT member.id, member.name, member.phone, member.cpf, member.registration_status,
         EXISTS (SELECT 1 FROM member_roles mr JOIN roles r ON r.id = mr.role_id WHERE mr.member_id = member.id AND r.name = 'EXTERNO') AS external,
         EXISTS (SELECT 1 FROM miscellaneous_participants p WHERE p.member_id = member.id AND p.miscellaneous_id = $2) AS registered
       FROM members member WHERE member.account_id = $1 AND member.organization_id = $3`, [accountId, event.id, organizationId]);
        const profile = await this.getMyProfile(accountId);
        const organizationProfiles = profile?.additional_attributes?.organization_profiles;
        const savedProfile = typeof organizationProfiles === 'object' && organizationProfiles !== null
            ? organizationProfiles[organizationId] : undefined;
        const types = await this.profileTypes.list(organizationId);
        const storedFields = profile?.additional_attributes?.external_fields;
        const reusable = typeof storedFields === 'object' && storedFields !== null && !Array.isArray(storedFields)
            ? storedFields : {};
        const reusableValues = {};
        for (const type of types) {
            for (const field of type.fields) {
                const candidate = reusable[field.key];
                if (typeof candidate === 'object' && candidate !== null &&
                    'label' in candidate && candidate.label === field.label && 'type' in candidate && candidate.type === field.type &&
                    'options' in candidate && JSON.stringify(candidate.options) === JSON.stringify(field.options ?? []) && 'value' in candidate) {
                    reusableValues[field.key] = candidate.value;
                }
            }
        }
        return { authenticated: true, registered: membership?.registered ?? false,
            membership: membership ? membership.external ? 'external' : 'internal' : null,
            registration_status: membership?.registration_status, name: profile?.display_name ?? membership?.name,
            phone: profile?.phone ?? membership?.phone, profile_type: profile?.profile_type,
            cpf: membership?.cpf ?? profile?.additional_attributes?.base_cpf,
            academic_data: profile?.academic_data, profile_data: reusableValues,
            organization_profile_key: typeof savedProfile === 'object' && savedProfile !== null && 'key' in savedProfile ? savedProfile.key : undefined };
    }
    async register(slug, input, organizationId, authenticatedAccountId) {
        input = { ...input, profile_type: input.profile_type ?? 'basic' };
        if (input.cpf !== undefined && (typeof input.cpf !== 'string' || (input.cpf !== '' && !(0, cpf_1.isValidCpf)(input.cpf)))) {
            throw new common_1.BadRequestException('Informe um CPF válido.');
        }
        const cpf = input.cpf?.replace(/\D/g, '') || null;
        if (authenticatedAccountId) {
            const [account] = await db_1.AppDataBase.query(`SELECT email FROM user_accounts WHERE id = $1`, [authenticatedAccountId]);
            if (!account)
                throw new common_1.ForbiddenException('Conta não encontrada. Faça login novamente.');
            input = { ...input, email: account.email };
        }
        if (input.accepted_privacy !== true) {
            throw new common_1.BadRequestException('É necessário aceitar o aviso de privacidade para continuar.');
        }
        if (typeof input.name !== 'string' || typeof input.email !== 'string') {
            throw new common_1.BadRequestException('Informe nome e email válidos.');
        }
        const name = input.name?.trim();
        const email = input.email?.trim().toLowerCase();
        if (!name || name.length > 255)
            throw new common_1.BadRequestException('Informe um nome válido.');
        if (!email || email.length > 255 || !EMAIL_PATTERN.test(email)) {
            throw new common_1.BadRequestException('Informe um email válido.');
        }
        if (!authenticatedAccountId && (typeof input.password !== 'string' || input.password.length < 8 || Buffer.byteLength(input.password, 'utf8') > 72)) {
            throw new common_1.BadRequestException('A senha deve ter pelo menos 8 caracteres e no máximo 72 bytes.');
        }
        if (input.profile_type !== 'basic' && input.profile_type !== 'academic') {
            throw new common_1.BadRequestException('Selecione um perfil básico ou acadêmico.');
        }
        if (input.phone !== undefined && typeof input.phone !== 'string') {
            throw new common_1.BadRequestException('Informe um telefone válido.');
        }
        const phone = input.phone?.trim();
        if (phone && phone.length > 20)
            throw new common_1.BadRequestException('O telefone deve ter até 20 caracteres.');
        if (input.additional_attributes !== undefined &&
            (typeof input.additional_attributes !== 'object' ||
                input.additional_attributes === null ||
                Array.isArray(input.additional_attributes) ||
                JSON.stringify(input.additional_attributes).length > 20000)) {
            throw new common_1.BadRequestException('Atributos adicionais inválidos ou muito grandes.');
        }
        const eventId = await db_1.AppDataBase.transaction(async (manager) => {
            const eventRows = await manager.query(`SELECT event.id, event.organization_id, event.status, event.type,
                event.registration_start_date, event.registration_end_date,
                event.max_members, event.max_participants, event.external_registration_schema,
                organization.status AS organization_status
         FROM miscellaneous AS event
         JOIN organizations AS organization ON organization.id = event.organization_id
         WHERE event.public_slug = $1
           AND event.public_access_enabled = true
           AND event.deleted_at IS NULL
         FOR UPDATE OF event`, [slug]);
            const event = eventRows[0];
            if (!event || event.status !== 'active' || event.type !== miscellaneous_1.MiscellaneousType.EVENT) {
                throw new common_1.NotFoundException('Evento não encontrado.');
            }
            if (organizationId && event.organization_id !== organizationId)
                throw new common_1.NotFoundException('Evento não encontrado.');
            this.assertOrganizationAvailable(event);
            const now = new Date();
            if (event.registration_start_date && new Date(event.registration_start_date) > now) {
                throw new common_1.BadRequestException('As inscrições ainda não começaram.');
            }
            if (event.registration_end_date && new Date(event.registration_end_date) < now) {
                throw new common_1.BadRequestException('As inscrições para este evento foram encerradas.');
            }
            const schema = this.validateSchema(event.external_registration_schema ?? []);
            const registrationData = this.validateRegistrationData(schema, input.registration_data ?? {});
            const academicData = this.validateAcademicData(input.profile_type ?? 'basic', input.academic_data);
            await manager.query(`SELECT pg_advisory_xact_lock(hashtextextended($1, 0))`, [email]);
            const existingAccounts = await manager.query(`SELECT id, password, password_change_required FROM user_accounts
         WHERE lower(email) = lower($1)
         FOR UPDATE`, [email]);
            let accountId;
            if (existingAccounts.length > 0) {
                if (existingAccounts[0].password_change_required) {
                    throw new common_1.ForbiddenException('Entre na plataforma e defina sua senha pessoal antes de se inscrever.');
                }
                if (!authenticatedAccountId && !(await bcryptjs_1.default.compare(input.password, existingAccounts[0].password))) {
                    throw new common_1.ConflictException('Este email já possui uma conta UseAyni. Entre com a senha atual para se inscrever.');
                }
                accountId = existingAccounts[0].id;
                if (authenticatedAccountId && accountId !== authenticatedAccountId)
                    throw new common_1.ForbiddenException('A conta não corresponde à sessão.');
            }
            else {
                if (authenticatedAccountId)
                    throw new common_1.ForbiddenException('Conta não encontrada.');
                const passwordHash = await bcryptjs_1.default.hash(input.password, 12);
                const insertedAccounts = await manager.query(`INSERT INTO user_accounts (email, password)
           VALUES ($1, $2)
           RETURNING id`, [email, passwordHash]);
                accountId = insertedAccounts[0].id;
            }
            const existingRegistration = await manager.query(`SELECT 1 FROM external_event_registrations
         WHERE miscellaneous_id = $1 AND account_id = $2`, [event.id, accountId]);
            if (existingRegistration.length > 0)
                return event.id;
            const existingMembers = await manager.query(`SELECT id, registration_status, cpf
         FROM members
         WHERE account_id = $1 AND organization_id = $2
         LIMIT 1`, [accountId, event.organization_id]);
            if (cpf) {
                if (existingMembers[0]?.cpf && existingMembers[0].cpf !== cpf) {
                    throw new common_1.ConflictException('O CPF informado difere do cadastro existente. Solicite a correção à organização.');
                }
                const duplicateCpf = await manager.query(`SELECT id FROM members WHERE organization_id = $1 AND cpf = $2 AND account_id IS DISTINCT FROM $3`, [event.organization_id, cpf, accountId]);
                if (duplicateCpf.length)
                    throw new common_1.ConflictException('Este CPF já está vinculado a outra conta nesta organização.');
            }
            let memberId;
            if (existingMembers.length > 0) {
                if (existingMembers[0].registration_status !== 'approved') {
                    throw new common_1.ForbiddenException('Seu vínculo com esta organização ainda não foi aprovado.');
                }
                memberId = existingMembers[0].id;
                if (cpf && !existingMembers[0].cpf)
                    await manager.query(`UPDATE members SET cpf = $2 WHERE id = $1`, [memberId, cpf]);
            }
            else {
                const accountRows = await manager.query(`SELECT password FROM user_accounts WHERE id = $1`, [accountId]);
                const memberRows = await manager.query(`INSERT INTO members
             (name, email_personal, password, account_id, organization_id,
              registration_status, status, phone, slug, cpf)
           VALUES ($1, $2, $3, $4, $5, 'approved', 'ACTIVE', $6, $7, $8)
           RETURNING id`, [name, email, accountRows[0].password, accountId, event.organization_id, phone ?? null, `comunidade-${(0, crypto_1.randomUUID)()}`, cpf]);
                memberId = memberRows[0].id;
                await manager.query(`INSERT INTO member_roles (member_id, role_id)
           SELECT $1, role.id FROM roles AS role WHERE role.name = 'EXTERNO'
           ON CONFLICT (member_id, role_id) DO NOTHING`, [memberId]);
            }
            const [memberType] = await manager.query(`SELECT EXISTS (SELECT 1 FROM member_roles mr JOIN roles r ON r.id = mr.role_id
         WHERE mr.member_id = $1 AND r.name = 'EXTERNO') AS external`, [memberId]);
            let profileData = {};
            let profileDefinition;
            const reusableFields = {};
            if (memberType.external) {
                const resolved = await this.profileTypes.resolve(event.organization_id, input.organization_profile_key, input.profile_data);
                profileDefinition = resolved.definition;
                profileData = resolved.values;
                for (const field of profileDefinition.fields) {
                    if (profileData[field.key] !== undefined)
                        reusableFields[field.key] = {
                            label: field.label, type: field.type, options: field.options ?? [], value: profileData[field.key],
                        };
                }
            }
            if (memberType.external && input.profile_type === 'academic')
                await manager.query(`INSERT INTO external_account_profiles
           (account_id, display_name, profile_type, phone, academic_data, additional_attributes)
         VALUES ($1, $2, $3, $4, $5::jsonb, $6::jsonb)
         ON CONFLICT (account_id) DO UPDATE
         SET display_name = EXCLUDED.display_name,
             profile_type = CASE
               WHEN EXCLUDED.profile_type = 'academic' THEN 'academic'
               ELSE external_account_profiles.profile_type
             END,
             phone = COALESCE(EXCLUDED.phone, external_account_profiles.phone),
             academic_data = CASE
               WHEN EXCLUDED.profile_type = 'academic' THEN EXCLUDED.academic_data
               ELSE external_account_profiles.academic_data
             END,
             additional_attributes = jsonb_set(
               external_account_profiles.additional_attributes, '{external_fields}',
               COALESCE(external_account_profiles.additional_attributes->'external_fields', '{}'::jsonb) ||
               EXCLUDED.additional_attributes->'external_fields'),
             updated_at = now()`, [
                    accountId,
                    name,
                    input.profile_type,
                    phone ?? null,
                    JSON.stringify(academicData),
                    JSON.stringify({ external_fields: reusableFields }),
                ]);
            if (profileDefinition) {
                await this.profileTypes.saveAccountProfile(manager, accountId, event.organization_id, name, phone ?? null, profileDefinition, profileData, cpf);
            }
            const counts = await manager.query(`SELECT count(*)::int AS count
         FROM miscellaneous_participants
         WHERE miscellaneous_id = $1`, [event.id]);
            const limit = [event.max_members, event.max_participants]
                .filter((value) => value !== null)
                .reduce((minimum, value) => Math.min(minimum, value), Number.POSITIVE_INFINITY);
            const alreadyParticipant = await manager.query(`SELECT 1 FROM miscellaneous_participants WHERE miscellaneous_id = $1 AND member_id = $2`, [event.id, memberId]);
            if (!alreadyParticipant.length && counts[0].count >= limit) {
                throw new common_1.ConflictException('As vagas deste evento foram preenchidas.');
            }
            await manager.query(`INSERT INTO miscellaneous_participants (miscellaneous_id, member_id)
         VALUES ($1, $2)
         ON CONFLICT (miscellaneous_id, member_id) DO NOTHING`, [event.id, memberId]);
            await manager.query(`INSERT INTO external_event_registrations
           (organization_id, miscellaneous_id, account_id, member_id,
            profile_type, shared_profile, registration_data,
            profile_consent_at, profile_consent_version)
         VALUES ($1, $2, $3, $4, $5, $6::jsonb, $7::jsonb, now(), 'external-event-v2')
         ON CONFLICT (miscellaneous_id, account_id) DO NOTHING`, [
                event.organization_id,
                event.id,
                accountId,
                memberId,
                input.profile_type,
                JSON.stringify({
                    name,
                    email,
                    phone: phone ?? null,
                    cpf: cpf ?? existingMembers[0]?.cpf ?? null,
                    event_registration_schema: schema,
                    ...(profileDefinition ? { organization_profile_key: profileDefinition.key, organization_profile_name: profileDefinition.name, profile_fields: profileDefinition.fields, profile_data: profileData } : {}),
                    ...(input.profile_type === 'academic' ? { academic_data: academicData } : {}),
                }),
                JSON.stringify(registrationData),
            ]);
            await this.domainEmails.participationConfirmed(event.id, memberId, manager);
            return event.id;
        });
        return { registered: true, event_id: eventId, message: 'Inscrição realizada. Use seu email e senha para entrar na plataforma.' };
    }
    async getMyProfile(accountId) {
        if (!accountId)
            throw new common_1.ForbiddenException('A sessão não possui uma conta global.');
        const profiles = await db_1.AppDataBase.query(`SELECT account.email, profile.display_name, profile.profile_type, profile.phone,
              profile.academic_data, profile.additional_attributes,
              profile.created_at, profile.updated_at
       FROM external_account_profiles AS profile
       JOIN user_accounts AS account ON account.id = profile.account_id
       WHERE profile.account_id = $1`, [accountId]);
        return profiles[0] ?? null;
    }
    async getMyRegistrations(accountId, organizationId) {
        if (!accountId)
            throw new common_1.ForbiddenException('A sessão não possui conta.');
        return db_1.AppDataBase.query(`SELECT event.id, event.title, event.start_date, event.status, event.public_slug,
              event.public_access_enabled, participant.joined_at AS registered_at
       FROM miscellaneous_participants participant
       JOIN members member ON member.id = participant.member_id
       JOIN miscellaneous event ON event.id = participant.miscellaneous_id
       WHERE member.account_id = $1 AND member.organization_id = $2
         AND event.organization_id = $2 AND event.type = 'event' AND event.deleted_at IS NULL
       ORDER BY event.start_date DESC`, [accountId, organizationId]);
    }
    async requireEventParticipant(slug, organizationId, accountId) {
        if (!accountId)
            throw new common_1.ForbiddenException('Entre com sua conta para acessar sua participação.');
        const event = await this.getPublicEvent(slug, organizationId);
        const [participant] = await db_1.AppDataBase.query(`SELECT member.id FROM members member
       JOIN miscellaneous_participants participant ON participant.member_id = member.id
       WHERE member.account_id = $1 AND member.organization_id = $2
         AND member.registration_status = 'approved' AND participant.miscellaneous_id = $3`, [accountId, organizationId, event.id]);
        if (!participant)
            throw new common_1.ForbiddenException('Você não está inscrito neste evento.');
        return { eventId: event.id, memberId: participant.id };
    }
    async loadParticipantAnswers(manager, eventId, organizationId, accountId) {
        if (!accountId)
            throw new common_1.ForbiddenException('Entre com sua conta para acessar os dados da inscrição.');
        const [event] = await manager.query(`SELECT event.external_registration_schema FROM miscellaneous event
       JOIN organizations organization ON organization.id = event.organization_id
       WHERE event.id = $1 AND event.organization_id = $2 AND event.type = 'event'
         AND event.deleted_at IS NULL AND organization.status IN ('ACTIVE', 'TRIAL')
       FOR SHARE OF event`, [eventId, organizationId]);
        if (!event)
            throw new common_1.NotFoundException('Evento não encontrado.');
        const [participant] = await manager.query(`SELECT member.id AS member_id, member.name, member.email_personal, registration.registration_data, registration.shared_profile
       FROM miscellaneous_participants participant
       JOIN members member ON member.id = participant.member_id
       LEFT JOIN external_event_registrations registration ON registration.miscellaneous_id = participant.miscellaneous_id AND registration.account_id = member.account_id
       WHERE participant.miscellaneous_id = $1 AND member.organization_id = $2 AND member.account_id = $3
         AND member.registration_status = 'approved'`, [eventId, organizationId, accountId]);
        if (!participant)
            throw new common_1.ForbiddenException('Você não está inscrito neste evento.');
        return { ...participant, fields: this.validateSchema(event.external_registration_schema ?? []) };
    }
    async getParticipantAnswers(eventId, organizationId, accountId) {
        return db_1.AppDataBase.transaction(async (manager) => {
            const participant = await this.loadParticipantAnswers(manager, eventId, organizationId, accountId);
            const previousSchema = participant.shared_profile?.event_registration_schema;
            const previousFields = Array.isArray(previousSchema) ? previousSchema : [];
            const data = participant.registration_data ?? {};
            const validData = {};
            const pending = [];
            for (const field of participant.fields) {
                const value = data[field.key];
                let valid = true;
                try {
                    Object.assign(validData, this.validateRegistrationData([field], value === undefined ? {} : { [field.key]: value }));
                }
                catch (cause) {
                    if (!(cause instanceof common_1.BadRequestException))
                        throw cause;
                    valid = false;
                }
                const previous = previousFields.find(item => item?.key === field.key);
                const changed = !previous || JSON.stringify([previous.label, previous.type, previous.options ?? []]) !==
                    JSON.stringify([field.label, field.type, field.options ?? []]);
                if (!valid || changed && (value === undefined || value === null || value === ''))
                    pending.push(field);
            }
            return { registration_fields: participant.fields, registration_data: validData, pending_fields: pending };
        });
    }
    async updateParticipantAnswers(eventId, organizationId, accountId, input) {
        if (input.accepted_privacy !== true)
            throw new common_1.BadRequestException('Confirme o uso das respostas para sua participação no evento.');
        await db_1.AppDataBase.transaction(async (manager) => {
            const participant = await this.loadParticipantAnswers(manager, eventId, organizationId, accountId);
            const answers = this.validateRegistrationData(participant.fields, input.registration_data ?? {});
            const shared = { name: participant.name, email: participant.email_personal,
                event_registration_schema: participant.fields,
                event_answers_consent_at: new Date().toISOString(), event_answers_consent_version: 'event-answers-v1' };
            await manager.query(`INSERT INTO external_event_registrations
         (organization_id, miscellaneous_id, account_id, member_id, profile_type, shared_profile, registration_data, profile_consent_at, profile_consent_version)
         VALUES ($1, $2, $3, $4, 'basic', $5::jsonb, $6::jsonb, now(), 'event-answers-v1')
         ON CONFLICT (miscellaneous_id, account_id) DO UPDATE
         SET registration_data = (external_event_registrations.registration_data - $7::text[]) || EXCLUDED.registration_data,
             shared_profile = external_event_registrations.shared_profile || EXCLUDED.shared_profile`, [organizationId, eventId, accountId, participant.member_id, JSON.stringify(shared), JSON.stringify(answers), participant.fields.map(field => field.key)]);
        });
        return this.getParticipantAnswers(eventId, organizationId, accountId);
    }
    async updateMyProfile(accountId, input) {
        if (!accountId)
            throw new common_1.ForbiddenException('A sessão não possui uma conta global.');
        const current = await this.getMyProfile(accountId);
        if (!current)
            throw new common_1.NotFoundException('Perfil externo não encontrado.');
        const profileType = input.profile_type ?? current.profile_type;
        if (profileType !== 'basic' && profileType !== 'academic') {
            throw new common_1.BadRequestException('Selecione um perfil básico ou acadêmico.');
        }
        const displayName = input.display_name?.trim() ?? current.display_name;
        if (typeof displayName !== 'string' || !displayName.trim() || displayName.length > 255) {
            throw new common_1.BadRequestException('Informe um nome válido de até 255 caracteres.');
        }
        const academicData = input.academic_data
            ? this.validateAcademicData(profileType, input.academic_data)
            : current.academic_data;
        if (input.phone !== undefined && input.phone !== null && input.phone.length > 20) {
            throw new common_1.BadRequestException('O telefone deve ter até 20 caracteres.');
        }
        const additionalAttributes = input.additional_attributes ?? current.additional_attributes;
        if (typeof additionalAttributes !== 'object' ||
            additionalAttributes === null ||
            Array.isArray(additionalAttributes) ||
            JSON.stringify(additionalAttributes).length > 20000) {
            throw new common_1.BadRequestException('Atributos adicionais inválidos ou muito grandes.');
        }
        await db_1.AppDataBase.query(`UPDATE external_account_profiles
       SET display_name = $2, profile_type = $3, phone = COALESCE($4, phone),
           academic_data = $5::jsonb, additional_attributes = $6::jsonb,
           updated_at = now()
       WHERE account_id = $1`, [
            accountId,
            displayName,
            profileType,
            input.phone?.trim() ?? null,
            JSON.stringify(academicData),
            JSON.stringify(additionalAttributes),
        ]);
        return this.getMyProfile(accountId);
    }
    async findPublicEvent(slug) {
        const rows = await db_1.AppDataBase.query(`SELECT event.id, event.organization_id, organization.name AS organization_name,
              event.title, event.description, event.type, event.status,
              event.start_date, event.end_date,
              event.location_street, event.location_number, event.location_neighborhood,
              event.location_city, event.location_state,
              event.registration_start_date, event.registration_end_date,
              event.max_members, event.max_participants, event.public_access_enabled,
              event.external_registration_schema,
              organization.status AS organization_status
       FROM miscellaneous AS event
       JOIN organizations AS organization ON organization.id = event.organization_id
       WHERE event.public_slug = $1
         AND event.public_access_enabled = true
         AND event.deleted_at IS NULL
       LIMIT 1`, [slug]);
        const event = rows[0];
        if (!event || event.type !== miscellaneous_1.MiscellaneousType.EVENT) {
            throw new common_1.NotFoundException('Evento não encontrado.');
        }
        return event;
    }
    assertOrganizationAvailable(event) {
        if (!['ACTIVE', 'TRIAL'].includes(event.organization_status)) {
            throw new common_1.NotFoundException('Evento não encontrado.');
        }
    }
    validateSchema(schema) {
        if (!Array.isArray(schema) || schema.length > 40) {
            throw new common_1.BadRequestException('O evento possui uma configuração de inscrição inválida.');
        }
        const keys = new Set();
        for (const field of schema) {
            if (!field ||
                typeof field.key !== 'string' ||
                !/^[a-zA-Z][a-zA-Z0-9_]{0,63}$/.test(field.key) ||
                typeof field.label !== 'string' ||
                !field.label.trim() ||
                !FIELD_TYPES.has(field.type) ||
                keys.has(field.key)) {
                throw new common_1.BadRequestException('O evento possui campos de inscrição inválidos.');
            }
            if (field.type === 'select' && (!Array.isArray(field.options) || field.options.length < 1 || field.options.length > 50)) {
                throw new common_1.BadRequestException(`Configure opções válidas para o campo "${field.key}".`);
            }
            keys.add(field.key);
        }
        return schema;
    }
    validateRegistrationData(schema, data) {
        if (!data || typeof data !== 'object' || Array.isArray(data)) {
            throw new common_1.BadRequestException('As respostas adicionais da inscrição são inválidas.');
        }
        const schemaByKey = new Map(schema.map((field) => [field.key, field]));
        const unknownKeys = Object.keys(data).filter((key) => !schemaByKey.has(key));
        if (unknownKeys.length > 0) {
            throw new common_1.BadRequestException(`Campos de inscrição desconhecidos: ${unknownKeys.join(', ')}.`);
        }
        const result = {};
        for (const field of schema) {
            const value = data[field.key];
            if (value === undefined || value === null || value === '' || typeof value === 'string' && !value.trim()) {
                if (field.required)
                    throw new common_1.BadRequestException(`O campo "${field.label}" é obrigatório.`);
                continue;
            }
            switch (field.type) {
                case 'text':
                    if (typeof value !== 'string' || value.length > 2000)
                        throw new common_1.BadRequestException(`Valor inválido para "${field.label}".`);
                    break;
                case 'email':
                    if (typeof value !== 'string' || !EMAIL_PATTERN.test(value) || value.length > 255)
                        throw new common_1.BadRequestException(`Email inválido em "${field.label}".`);
                    break;
                case 'number':
                    if (typeof value !== 'number' || !Number.isFinite(value))
                        throw new common_1.BadRequestException(`Valor numérico inválido para "${field.label}".`);
                    break;
                case 'date':
                    if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value) || Number.isNaN(Date.parse(`${value}T00:00:00Z`)) ||
                        new Date(`${value}T00:00:00Z`).toISOString().slice(0, 10) !== value) {
                        throw new common_1.BadRequestException(`Data inválida para "${field.label}".`);
                    }
                    break;
                case 'select':
                    if (typeof value !== 'string' || !field.options?.includes(value))
                        throw new common_1.BadRequestException(`Seleção inválida para "${field.label}".`);
                    break;
                case 'checkbox':
                    if (typeof value !== 'boolean')
                        throw new common_1.BadRequestException(`Resposta inválida para "${field.label}".`);
                    if (field.required && value !== true)
                        throw new common_1.BadRequestException(`O campo "${field.label}" é obrigatório.`);
                    break;
            }
            result[field.key] = value;
        }
        return result;
    }
    validateAcademicData(profileType, academicData) {
        if (profileType === 'basic')
            return {};
        if (academicData !== undefined &&
            (typeof academicData !== 'object' || academicData === null || Array.isArray(academicData))) {
            throw new common_1.BadRequestException('Informe os dados acadêmicos em formato válido.');
        }
        const data = academicData ?? {};
        const required = ['ra', 'academic_email', 'course', 'institution', 'city'];
        for (const key of required) {
            if (typeof data[key] !== 'string' || !data[key]?.trim()) {
                throw new common_1.BadRequestException(`O campo acadêmico "${key}" é obrigatório.`);
            }
        }
        if (!EMAIL_PATTERN.test(data.academic_email.trim())) {
            throw new common_1.BadRequestException('Informe um email acadêmico válido.');
        }
        const normalized = {};
        for (const key of [...required, 'state']) {
            const rawValue = data[key];
            if (rawValue !== undefined && typeof rawValue !== 'string') {
                throw new common_1.BadRequestException(`O campo acadêmico "${key}" deve ser texto.`);
            }
            const value = rawValue?.trim();
            if (value) {
                if (value.length > 255)
                    throw new common_1.BadRequestException(`O campo acadêmico "${key}" é muito longo.`);
                normalized[key] = key === 'academic_email' ? value.toLowerCase() : value;
            }
        }
        return normalized;
    }
};
exports.ExternalEventRegistrationService = ExternalEventRegistrationService;
exports.ExternalEventRegistrationService = ExternalEventRegistrationService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [DomainEmailService_1.DomainEmailService])
], ExternalEventRegistrationService);
