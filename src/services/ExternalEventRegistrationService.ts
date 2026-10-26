import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import bcrypt from 'bcryptjs';
import { randomUUID } from 'crypto';
import { AppDataBase } from '../db';
import { MiscellaneousType } from '../models/miscellaneous';
import { ExternalRegistrationFieldDto } from '../dto/miscellaneous/miscellaneous.dto';
import { ExternalProfileTypesService } from './ExternalProfileTypesService';
import { isValidCpf } from '../helpers/cpf';
import { EntityManager } from 'typeorm';
import { DomainEmailService } from './DomainEmailService';
import { EmailService } from './EmailService';

type ProfileType = 'basic' | 'academic';
type RegistrationField = ExternalRegistrationFieldDto;

interface ExternalRegistrationInput {
  name: string;
  email: string;
  password?: string;
  phone?: string;
  cpf?: string;
  profile_type?: ProfileType;
  academic_data?: {
    ra?: string;
    academic_email?: string;
    course?: string;
    institution?: string;
    city?: string;
    state?: string;
  };
  additional_attributes?: Record<string, unknown>;
  registration_data?: Record<string, unknown>;
  accepted_privacy?: boolean;
  organization_profile_key?: string;
  profile_data?: Record<string, unknown>;
}

interface ExternalAccountProfile {
  email: string;
  display_name: string;
  profile_type: ProfileType;
  phone: string | null;
  academic_data: ExternalRegistrationInput['academic_data'];
  additional_attributes: Record<string, unknown>;
  created_at: Date;
  updated_at: Date;
}

interface PublicEventRow {
  id: string;
  organization_id: string;
  organization_name: string;
  title: string;
  description: string;
  type: MiscellaneousType;
  status: string;
  start_date: Date;
  end_date: Date | null;
  registration_start_date: Date | null;
  registration_end_date: Date | null;
  max_members: number | null;
  max_participants: number | null;
  public_access_enabled: boolean;
  external_registration_schema: RegistrationField[] | null;
  organization_status: string;
  location_street: string | null;
  location_number: string | null;
  location_neighborhood: string | null;
  location_city: string | null;
  location_state: string | null;
}

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const FIELD_TYPES = new Set(['text', 'email', 'number', 'date', 'select', 'checkbox']);

@Injectable()
export class ExternalEventRegistrationService {
  constructor(private readonly domainEmails: DomainEmailService = new DomainEmailService(new EmailService())) {}
  private readonly profileTypes = new ExternalProfileTypesService();
  async getPublicEvent(slug: string, organizationId?: string) {
    const event = await this.findPublicEvent(slug);
    if (organizationId && event.organization_id !== organizationId) throw new NotFoundException('Evento não encontrado.');
    this.assertOrganizationAvailable(event);
    if (event.status !== 'active') throw new NotFoundException('Evento não encontrado.');
    const [{ count }] = await AppDataBase.query(
      `SELECT count(*)::int AS count FROM miscellaneous_participants WHERE miscellaneous_id = $1`, [event.id],
    ) as { count: number }[];
    const limits = [event.max_participants, event.max_members].filter((limit): limit is number => limit != null);
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

  async registrationStatus(slug: string, organizationId: string, accountId?: string) {
    const event = await this.getPublicEvent(slug, organizationId);
    if (!accountId) return { authenticated: false, registered: false, membership: null };
    const [membership] = await AppDataBase.query(
      `SELECT member.id, member.name, member.phone, member.cpf, member.registration_status,
         EXISTS (SELECT 1 FROM member_roles mr JOIN roles r ON r.id = mr.role_id WHERE mr.member_id = member.id AND r.name = 'EXTERNO') AS external,
         EXISTS (SELECT 1 FROM miscellaneous_participants p WHERE p.member_id = member.id AND p.miscellaneous_id = $2) AS registered
       FROM members member WHERE member.account_id = $1 AND member.organization_id = $3`,
      [accountId, event.id, organizationId],
    ) as { id: string; name: string; phone: string | null; cpf: string | null; registration_status: string; external: boolean; registered: boolean }[];
    const profile = await this.getMyProfile(accountId);
    const organizationProfiles = profile?.additional_attributes?.organization_profiles;
    const savedProfile = typeof organizationProfiles === 'object' && organizationProfiles !== null
      ? (organizationProfiles as Record<string, unknown>)[organizationId] : undefined;
    const types = await this.profileTypes.list(organizationId);
    const storedFields = profile?.additional_attributes?.external_fields;
    const reusable = typeof storedFields === 'object' && storedFields !== null && !Array.isArray(storedFields)
      ? storedFields as Record<string, unknown> : {};
    const reusableValues: Record<string, unknown> = {};
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

  async register(slug: string, input: ExternalRegistrationInput, organizationId?: string, authenticatedAccountId?: string) {
    input = { ...input, profile_type: input.profile_type ?? 'basic' };
    if (input.cpf !== undefined && (typeof input.cpf !== 'string' || (input.cpf !== '' && !isValidCpf(input.cpf)))) {
      throw new BadRequestException('Informe um CPF válido.');
    }
    const cpf = input.cpf?.replace(/\D/g, '') || null;
    if (authenticatedAccountId) {
      const [account] = await AppDataBase.query(`SELECT email FROM user_accounts WHERE id = $1`, [authenticatedAccountId]) as { email: string }[];
      if (!account) throw new ForbiddenException('Conta não encontrada. Faça login novamente.');
      input = { ...input, email: account.email };
    }
    if (input.accepted_privacy !== true) {
      throw new BadRequestException('É necessário aceitar o aviso de privacidade para continuar.');
    }
    if (typeof input.name !== 'string' || typeof input.email !== 'string') {
      throw new BadRequestException('Informe nome e email válidos.');
    }
    const name = input.name?.trim();
    const email = input.email?.trim().toLowerCase();
    if (!name || name.length > 255) throw new BadRequestException('Informe um nome válido.');
    if (!email || email.length > 255 || !EMAIL_PATTERN.test(email)) {
      throw new BadRequestException('Informe um email válido.');
    }
    if (!authenticatedAccountId && (typeof input.password !== 'string' || input.password.length < 8 || Buffer.byteLength(input.password, 'utf8') > 72)) {
      throw new BadRequestException('A senha deve ter pelo menos 8 caracteres e no máximo 72 bytes.');
    }
    if (input.profile_type !== 'basic' && input.profile_type !== 'academic') {
      throw new BadRequestException('Selecione um perfil básico ou acadêmico.');
    }
    if (input.phone !== undefined && typeof input.phone !== 'string') {
      throw new BadRequestException('Informe um telefone válido.');
    }
    const phone = input.phone?.trim();
    if (phone && phone.length > 20) throw new BadRequestException('O telefone deve ter até 20 caracteres.');
    if (
      input.additional_attributes !== undefined &&
      (typeof input.additional_attributes !== 'object' ||
        input.additional_attributes === null ||
        Array.isArray(input.additional_attributes) ||
        JSON.stringify(input.additional_attributes).length > 20000)
    ) {
      throw new BadRequestException('Atributos adicionais inválidos ou muito grandes.');
    }

    const eventId = await AppDataBase.transaction(async (manager) => {
      const eventRows = await manager.query(
        `SELECT event.id, event.organization_id, event.status, event.type,
                event.registration_start_date, event.registration_end_date,
                event.max_members, event.max_participants, event.external_registration_schema,
                organization.status AS organization_status
         FROM miscellaneous AS event
         JOIN organizations AS organization ON organization.id = event.organization_id
         WHERE event.public_slug = $1
           AND event.public_access_enabled = true
           AND event.deleted_at IS NULL
         FOR UPDATE OF event`,
        [slug],
      ) as (PublicEventRow & { organization_status: string })[];
      const event = eventRows[0];
      if (!event || event.status !== 'active' || event.type !== MiscellaneousType.EVENT) {
        throw new NotFoundException('Evento não encontrado.');
      }
      if (organizationId && event.organization_id !== organizationId) throw new NotFoundException('Evento não encontrado.');
      this.assertOrganizationAvailable(event);
      const now = new Date();
      if (event.registration_start_date && new Date(event.registration_start_date) > now) {
        throw new BadRequestException('As inscrições ainda não começaram.');
      }
      if (event.registration_end_date && new Date(event.registration_end_date) < now) {
        throw new BadRequestException('As inscrições para este evento foram encerradas.');
      }

      const schema = this.validateSchema(event.external_registration_schema ?? []);
      const registrationData = this.validateRegistrationData(schema, input.registration_data ?? {});
      const academicData = this.validateAcademicData(input.profile_type ?? 'basic', input.academic_data);

      await manager.query(`SELECT pg_advisory_xact_lock(hashtextextended($1, 0))`, [email]);
      const existingAccounts = await manager.query(
        `SELECT id, password, password_change_required FROM user_accounts
         WHERE lower(email) = lower($1)
         FOR UPDATE`,
        [email],
      ) as { id: string; password: string; password_change_required: boolean }[];
      let accountId: string;
      if (existingAccounts.length > 0) {
        if (existingAccounts[0].password_change_required) {
          throw new ForbiddenException('Entre na plataforma e defina sua senha pessoal antes de se inscrever.');
        }
        if (!authenticatedAccountId && !(await bcrypt.compare(input.password!, existingAccounts[0].password))) {
          throw new ConflictException('Este email já possui uma conta UseAyni. Entre com a senha atual para se inscrever.');
        }
        accountId = existingAccounts[0].id;
        if (authenticatedAccountId && accountId !== authenticatedAccountId) throw new ForbiddenException('A conta não corresponde à sessão.');
      } else {
        if (authenticatedAccountId) throw new ForbiddenException('Conta não encontrada.');
        const passwordHash = await bcrypt.hash(input.password!, 12);
        const insertedAccounts = await manager.query(
          `INSERT INTO user_accounts (email, password)
           VALUES ($1, $2)
           RETURNING id`,
          [email, passwordHash],
        ) as { id: string }[];
        accountId = insertedAccounts[0].id;
      }

      const existingRegistration = await manager.query(
        `SELECT 1 FROM external_event_registrations
         WHERE miscellaneous_id = $1 AND account_id = $2`,
        [event.id, accountId],
      );
      if (existingRegistration.length > 0) return event.id;

      const existingMembers = await manager.query(
        `SELECT id, registration_status, cpf
         FROM members
         WHERE account_id = $1 AND organization_id = $2
         LIMIT 1`,
        [accountId, event.organization_id],
      ) as { id: string; registration_status: string; cpf: string | null }[];
      if (cpf) {
        if (existingMembers[0]?.cpf && existingMembers[0].cpf !== cpf) {
          throw new ConflictException('O CPF informado difere do cadastro existente. Solicite a correção à organização.');
        }
        const duplicateCpf = await manager.query(
          `SELECT id FROM members WHERE organization_id = $1 AND cpf = $2 AND account_id IS DISTINCT FROM $3`,
          [event.organization_id, cpf, accountId],
        );
        if (duplicateCpf.length) throw new ConflictException('Este CPF já está vinculado a outra conta nesta organização.');
      }
      let memberId: string;
      if (existingMembers.length > 0) {
        if (existingMembers[0].registration_status !== 'approved') {
          throw new ForbiddenException('Seu vínculo com esta organização ainda não foi aprovado.');
        }
        memberId = existingMembers[0].id;
        if (cpf && !existingMembers[0].cpf) await manager.query(`UPDATE members SET cpf = $2 WHERE id = $1`, [memberId, cpf]);
      } else {
        const accountRows = await manager.query(
          `SELECT password FROM user_accounts WHERE id = $1`,
          [accountId],
        ) as { password: string }[];
        const memberRows = await manager.query(
          `INSERT INTO members
             (name, email_personal, password, account_id, organization_id,
              registration_status, status, phone, slug, cpf)
           VALUES ($1, $2, $3, $4, $5, 'approved', 'ACTIVE', $6, $7, $8)
           RETURNING id`,
          [name, email, accountRows[0].password, accountId, event.organization_id, phone ?? null, `comunidade-${randomUUID()}`, cpf],
        ) as { id: string }[];
        memberId = memberRows[0].id;
        await manager.query(
          `INSERT INTO member_roles (member_id, role_id)
           SELECT $1, role.id FROM roles AS role WHERE role.name = 'EXTERNO'
           ON CONFLICT (member_id, role_id) DO NOTHING`,
          [memberId],
        );
      }

      const [memberType] = await manager.query(
        `SELECT EXISTS (SELECT 1 FROM member_roles mr JOIN roles r ON r.id = mr.role_id
         WHERE mr.member_id = $1 AND r.name = 'EXTERNO') AS external`, [memberId],
      ) as { external: boolean }[];
      let profileData: Record<string, unknown> = {};
      let profileDefinition;
      const reusableFields: Record<string, unknown> = {};
      if (memberType.external) {
        const resolved = await this.profileTypes.resolve(event.organization_id, input.organization_profile_key, input.profile_data);
        profileDefinition = resolved.definition;
        profileData = resolved.values;
        for (const field of profileDefinition.fields) {
          if (profileData[field.key] !== undefined) reusableFields[field.key] = {
            label: field.label, type: field.type, options: field.options ?? [], value: profileData[field.key],
          };
        }
      }
      if (memberType.external && input.profile_type === 'academic') await manager.query(
        `INSERT INTO external_account_profiles
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
             updated_at = now()`,
        [
          accountId,
          name,
          input.profile_type,
          phone ?? null,
          JSON.stringify(academicData),
          JSON.stringify({ external_fields: reusableFields }),
        ],
      );
      if (profileDefinition) {
        await this.profileTypes.saveAccountProfile(manager, accountId, event.organization_id, name,
          phone ?? null, profileDefinition, profileData, cpf);
      }

      const counts = await manager.query(
        `SELECT count(*)::int AS count
         FROM miscellaneous_participants
         WHERE miscellaneous_id = $1`,
        [event.id],
      ) as { count: number }[];
      const limit = [event.max_members, event.max_participants]
        .filter((value): value is number => value !== null)
        .reduce((minimum, value) => Math.min(minimum, value), Number.POSITIVE_INFINITY);
      const alreadyParticipant = await manager.query(
        `SELECT 1 FROM miscellaneous_participants WHERE miscellaneous_id = $1 AND member_id = $2`, [event.id, memberId],
      );
      if (!alreadyParticipant.length && counts[0].count >= limit) {
        throw new ConflictException('As vagas deste evento foram preenchidas.');
      }

      await manager.query(
        `INSERT INTO miscellaneous_participants (miscellaneous_id, member_id)
         VALUES ($1, $2)
         ON CONFLICT (miscellaneous_id, member_id) DO NOTHING`,
        [event.id, memberId],
      );
      await manager.query(
        `INSERT INTO external_event_registrations
           (organization_id, miscellaneous_id, account_id, member_id,
            profile_type, shared_profile, registration_data,
            profile_consent_at, profile_consent_version)
         VALUES ($1, $2, $3, $4, $5, $6::jsonb, $7::jsonb, now(), 'external-event-v2')
         ON CONFLICT (miscellaneous_id, account_id) DO NOTHING`,
        [
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
        ],
      );
      await this.domainEmails.participationConfirmed(event.id, memberId, manager);
      return event.id;
    });

    return { registered: true, event_id: eventId, message: 'Inscrição realizada. Use seu email e senha para entrar na plataforma.' };
  }

  async getMyProfile(accountId: string | undefined) {
    if (!accountId) throw new ForbiddenException('A sessão não possui uma conta global.');
    const profiles = await AppDataBase.query(
      `SELECT account.email, profile.display_name, profile.profile_type, profile.phone,
              profile.academic_data, profile.additional_attributes,
              profile.created_at, profile.updated_at
       FROM external_account_profiles AS profile
       JOIN user_accounts AS account ON account.id = profile.account_id
       WHERE profile.account_id = $1`,
      [accountId],
    ) as ExternalAccountProfile[];
    return profiles[0] ?? null;
  }

  async getMyRegistrations(accountId: string | undefined, organizationId: string) {
    if (!accountId) throw new ForbiddenException('A sessão não possui conta.');
    return AppDataBase.query(
      `SELECT event.id, event.title, event.start_date, event.status, event.public_slug,
              event.public_access_enabled, participant.joined_at AS registered_at
       FROM miscellaneous_participants participant
       JOIN members member ON member.id = participant.member_id
       JOIN miscellaneous event ON event.id = participant.miscellaneous_id
       WHERE member.account_id = $1 AND member.organization_id = $2
         AND event.organization_id = $2 AND event.type = 'event' AND event.deleted_at IS NULL
       ORDER BY event.start_date DESC`, [accountId, organizationId],
    );
  }

  async requireEventParticipant(slug: string, organizationId: string, accountId?: string) {
    if (!accountId) throw new ForbiddenException('Entre com sua conta para acessar sua participação.');
    const event = await this.getPublicEvent(slug, organizationId);
    const [participant] = await AppDataBase.query(
      `SELECT member.id FROM members member
       JOIN miscellaneous_participants participant ON participant.member_id = member.id
       WHERE member.account_id = $1 AND member.organization_id = $2
         AND member.registration_status = 'approved' AND participant.miscellaneous_id = $3`,
      [accountId, organizationId, event.id],
    ) as { id: string }[];
    if (!participant) throw new ForbiddenException('Você não está inscrito neste evento.');
    return { eventId: event.id, memberId: participant.id };
  }

  private async loadParticipantAnswers(manager: EntityManager, eventId: string, organizationId: string, accountId?: string) {
    if (!accountId) throw new ForbiddenException('Entre com sua conta para acessar os dados da inscrição.');
    const [event] = await manager.query(
      `SELECT event.external_registration_schema FROM miscellaneous event
       JOIN organizations organization ON organization.id = event.organization_id
       WHERE event.id = $1 AND event.organization_id = $2 AND event.type = 'event'
         AND event.deleted_at IS NULL AND organization.status IN ('ACTIVE', 'TRIAL')
       FOR SHARE OF event`, [eventId, organizationId],
    ) as { external_registration_schema: RegistrationField[] }[];
    if (!event) throw new NotFoundException('Evento não encontrado.');
    const [participant] = await manager.query(
      `SELECT member.id AS member_id, member.name, member.email_personal, registration.registration_data, registration.shared_profile
       FROM miscellaneous_participants participant
       JOIN members member ON member.id = participant.member_id
       LEFT JOIN external_event_registrations registration ON registration.miscellaneous_id = participant.miscellaneous_id AND registration.account_id = member.account_id
       WHERE participant.miscellaneous_id = $1 AND member.organization_id = $2 AND member.account_id = $3
         AND member.registration_status = 'approved'`,
      [eventId, organizationId, accountId],
    ) as { member_id: string; name: string; email_personal: string; registration_data: Record<string, unknown> | null; shared_profile: Record<string, unknown> | null }[];
    if (!participant) throw new ForbiddenException('Você não está inscrito neste evento.');
    return { ...participant, fields: this.validateSchema(event.external_registration_schema ?? []) };
  }

  async getParticipantAnswers(eventId: string, organizationId: string, accountId?: string) {
    return AppDataBase.transaction(async manager => {
      const participant = await this.loadParticipantAnswers(manager, eventId, organizationId, accountId);
      const previousSchema = participant.shared_profile?.event_registration_schema;
      const previousFields = Array.isArray(previousSchema) ? previousSchema as RegistrationField[] : [];
      const data = participant.registration_data ?? {};
      const validData: Record<string, unknown> = {};
      const pending: RegistrationField[] = [];
      for (const field of participant.fields) {
        const value = data[field.key];
        let valid = true;
        try {
          Object.assign(validData, this.validateRegistrationData([field], value === undefined ? {} : { [field.key]: value }));
        } catch (cause) {
          if (!(cause instanceof BadRequestException)) throw cause;
          valid = false;
        }
        const previous = previousFields.find(item => item?.key === field.key);
        const changed = !previous || JSON.stringify([previous.label, previous.type, previous.options ?? []]) !==
          JSON.stringify([field.label, field.type, field.options ?? []]);
        if (!valid || changed && (value === undefined || value === null || value === '')) pending.push(field);
      }
      return { registration_fields: participant.fields, registration_data: validData, pending_fields: pending };
    });
  }

  async updateParticipantAnswers(eventId: string, organizationId: string, accountId: string | undefined,
    input: { registration_data?: Record<string, unknown>; accepted_privacy?: boolean }) {
    if (input.accepted_privacy !== true) throw new BadRequestException('Confirme o uso das respostas para sua participação no evento.');
    await AppDataBase.transaction(async manager => {
      const participant = await this.loadParticipantAnswers(manager, eventId, organizationId, accountId);
      const answers = this.validateRegistrationData(participant.fields, input.registration_data ?? {});
      const shared = { name: participant.name, email: participant.email_personal,
        event_registration_schema: participant.fields,
        event_answers_consent_at: new Date().toISOString(), event_answers_consent_version: 'event-answers-v1' };
      await manager.query(
        `INSERT INTO external_event_registrations
         (organization_id, miscellaneous_id, account_id, member_id, profile_type, shared_profile, registration_data, profile_consent_at, profile_consent_version)
         VALUES ($1, $2, $3, $4, 'basic', $5::jsonb, $6::jsonb, now(), 'event-answers-v1')
         ON CONFLICT (miscellaneous_id, account_id) DO UPDATE
         SET registration_data = (external_event_registrations.registration_data - $7::text[]) || EXCLUDED.registration_data,
             shared_profile = external_event_registrations.shared_profile || EXCLUDED.shared_profile`,
        [organizationId, eventId, accountId, participant.member_id, JSON.stringify(shared), JSON.stringify(answers), participant.fields.map(field => field.key)],
      );
    });
    return this.getParticipantAnswers(eventId, organizationId, accountId);
  }

  async updateMyProfile(
    accountId: string | undefined,
    input: Partial<ExternalRegistrationInput> & { display_name?: string },
  ) {
    if (!accountId) throw new ForbiddenException('A sessão não possui uma conta global.');
    const current = await this.getMyProfile(accountId);
    if (!current) throw new NotFoundException('Perfil externo não encontrado.');
    const profileType = input.profile_type ?? current.profile_type;
    if (profileType !== 'basic' && profileType !== 'academic') {
      throw new BadRequestException('Selecione um perfil básico ou acadêmico.');
    }
    const displayName = input.display_name?.trim() ?? current.display_name;
    if (typeof displayName !== 'string' || !displayName.trim() || displayName.length > 255) {
      throw new BadRequestException('Informe um nome válido de até 255 caracteres.');
    }
    const academicData = input.academic_data
      ? this.validateAcademicData(profileType, input.academic_data)
      : current.academic_data;
    if (input.phone !== undefined && input.phone !== null && input.phone.length > 20) {
      throw new BadRequestException('O telefone deve ter até 20 caracteres.');
    }
    const additionalAttributes = input.additional_attributes ?? current.additional_attributes;
    if (
      typeof additionalAttributes !== 'object' ||
      additionalAttributes === null ||
      Array.isArray(additionalAttributes) ||
      JSON.stringify(additionalAttributes).length > 20000
    ) {
      throw new BadRequestException('Atributos adicionais inválidos ou muito grandes.');
    }
    await AppDataBase.query(
      `UPDATE external_account_profiles
       SET display_name = $2, profile_type = $3, phone = COALESCE($4, phone),
           academic_data = $5::jsonb, additional_attributes = $6::jsonb,
           updated_at = now()
       WHERE account_id = $1`,
      [
        accountId,
        displayName,
        profileType,
        input.phone?.trim() ?? null,
        JSON.stringify(academicData),
        JSON.stringify(additionalAttributes),
      ],
    );
    return this.getMyProfile(accountId);
  }

  private async findPublicEvent(slug: string): Promise<PublicEventRow> {
    const rows = await AppDataBase.query(
      `SELECT event.id, event.organization_id, organization.name AS organization_name,
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
       LIMIT 1`,
      [slug],
    ) as PublicEventRow[];
    const event = rows[0];
    if (!event || event.type !== MiscellaneousType.EVENT) {
      throw new NotFoundException('Evento não encontrado.');
    }
    return event;
  }

  private assertOrganizationAvailable(event: Pick<PublicEventRow, 'organization_status'>) {
    if (!['ACTIVE', 'TRIAL'].includes(event.organization_status)) {
      throw new NotFoundException('Evento não encontrado.');
    }
  }

  private validateSchema(schema: RegistrationField[]): RegistrationField[] {
    if (!Array.isArray(schema) || schema.length > 40) {
      throw new BadRequestException('O evento possui uma configuração de inscrição inválida.');
    }
    const keys = new Set<string>();
    for (const field of schema) {
      if (
        !field ||
        typeof field.key !== 'string' ||
        !/^[a-zA-Z][a-zA-Z0-9_]{0,63}$/.test(field.key) ||
        typeof field.label !== 'string' ||
        !field.label.trim() ||
        !FIELD_TYPES.has(field.type) ||
        keys.has(field.key)
      ) {
        throw new BadRequestException('O evento possui campos de inscrição inválidos.');
      }
      if (field.type === 'select' && (!Array.isArray(field.options) || field.options.length < 1 || field.options.length > 50)) {
        throw new BadRequestException(`Configure opções válidas para o campo "${field.key}".`);
      }
      keys.add(field.key);
    }
    return schema;
  }

  private validateRegistrationData(
    schema: RegistrationField[],
    data: Record<string, unknown>,
  ): Record<string, unknown> {
    if (!data || typeof data !== 'object' || Array.isArray(data)) {
      throw new BadRequestException('As respostas adicionais da inscrição são inválidas.');
    }
    const schemaByKey = new Map(schema.map((field) => [field.key, field]));
    const unknownKeys = Object.keys(data).filter((key) => !schemaByKey.has(key));
    if (unknownKeys.length > 0) {
      throw new BadRequestException(`Campos de inscrição desconhecidos: ${unknownKeys.join(', ')}.`);
    }
    const result: Record<string, unknown> = {};
    for (const field of schema) {
      const value = data[field.key];
      if (value === undefined || value === null || value === '' || typeof value === 'string' && !value.trim()) {
        if (field.required) throw new BadRequestException(`O campo "${field.label}" é obrigatório.`);
        continue;
      }
      switch (field.type) {
        case 'text':
          if (typeof value !== 'string' || value.length > 2000) throw new BadRequestException(`Valor inválido para "${field.label}".`);
          break;
        case 'email':
          if (typeof value !== 'string' || !EMAIL_PATTERN.test(value) || value.length > 255) throw new BadRequestException(`Email inválido em "${field.label}".`);
          break;
        case 'number':
          if (typeof value !== 'number' || !Number.isFinite(value)) throw new BadRequestException(`Valor numérico inválido para "${field.label}".`);
          break;
        case 'date':
          if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value) || Number.isNaN(Date.parse(`${value}T00:00:00Z`)) ||
              new Date(`${value}T00:00:00Z`).toISOString().slice(0, 10) !== value) {
            throw new BadRequestException(`Data inválida para "${field.label}".`);
          }
          break;
        case 'select':
          if (typeof value !== 'string' || !field.options?.includes(value)) throw new BadRequestException(`Seleção inválida para "${field.label}".`);
          break;
        case 'checkbox':
          if (typeof value !== 'boolean') throw new BadRequestException(`Resposta inválida para "${field.label}".`);
          if (field.required && value !== true) throw new BadRequestException(`O campo "${field.label}" é obrigatório.`);
          break;
      }
      result[field.key] = value;
    }
    return result;
  }

  private validateAcademicData(
    profileType: ProfileType,
    academicData?: ExternalRegistrationInput['academic_data'],
  ) {
    if (profileType === 'basic') return {};
    if (
      academicData !== undefined &&
      (typeof academicData !== 'object' || academicData === null || Array.isArray(academicData))
    ) {
      throw new BadRequestException('Informe os dados acadêmicos em formato válido.');
    }
    const data = academicData ?? {};
    const required = ['ra', 'academic_email', 'course', 'institution', 'city'] as const;
    for (const key of required) {
      if (typeof data[key] !== 'string' || !data[key]?.trim()) {
        throw new BadRequestException(`O campo acadêmico "${key}" é obrigatório.`);
      }
    }
    if (!EMAIL_PATTERN.test(data.academic_email!.trim())) {
      throw new BadRequestException('Informe um email acadêmico válido.');
    }
    const normalized: Record<string, unknown> = {};
    for (const key of [...required, 'state'] as const) {
      const rawValue = data[key];
      if (rawValue !== undefined && typeof rawValue !== 'string') {
        throw new BadRequestException(`O campo acadêmico "${key}" deve ser texto.`);
      }
      const value = rawValue?.trim();
      if (value) {
        if (value.length > 255) throw new BadRequestException(`O campo acadêmico "${key}" é muito longo.`);
        normalized[key] = key === 'academic_email' ? value.toLowerCase() : value;
      }
    }
    return normalized;
  }
}
