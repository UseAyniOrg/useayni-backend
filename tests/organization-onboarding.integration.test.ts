import 'reflect-metadata';
import assert from 'node:assert/strict';
import { test } from 'node:test';
import { randomBytes, randomUUID } from 'node:crypto';
import { decode } from 'jsonwebtoken';
import { EntityManager } from 'typeorm';
import { AppDataBase } from '../src/db';
import { AccountProvisioningService } from '../src/services/AccountProvisioningService';
import { HierarchyTemplateService } from '../src/services/HierarchyTemplateService';
import { AuthService } from '../src/services/authService';
import { MemberRepository } from '../src/repositories/MemberRepository';
import { TokenRepository } from '../src/repositories/TokenRepository';
import { HIERARCHY_TEMPLATES } from '../src/config/hierarchyTemplates';
import { MemberRegistrationStatus } from '../src/models/member';
import { OrgUnitService } from '../src/services/OrgUnitService';
import { OrgUnitRepository } from '../src/repositories/OrgUnitRepository';
import { decodeToken } from '../src/helpers/tokenHelper';
import { MiscellaneousService } from '../src/services/MiscellaneousService';
import { MiscellaneousRepository } from '../src/repositories/MiscellaneousRepository';
import { MiscellaneousOwnerRepository, MiscellaneousParticipantRepository, MiscellaneousApprovalLogRepository, MiscellaneousRequestRepository, MiscellaneousInviteRepository, MiscellaneousWaitlistRepository } from '../src/repositories/MiscellaneousSubRepositories';
import { ExternalEventRegistrationService } from '../src/services/ExternalEventRegistrationService';
import { MiscellaneousType } from '../src/models/miscellaneous';
import { CreateMiscellaneousDto } from '../src/dto/miscellaneous/miscellaneous.dto';
import { MiscellaneousAccessService } from '../src/services/MiscellaneousAccessService';
import { AttendanceService, MiscellaneousWaitlistService } from '../src/services/MiscellaneousWaitlistAttendanceService';
import { AttendanceRepository } from '../src/repositories/AttendanceFormRepositories';
import { AttendanceMode } from '../src/models/attendance';
import { ExternalProfileTypesService, DEFAULT_EXTERNAL_PROFILE_TYPES } from '../src/services/ExternalProfileTypesService';
import { MemberService } from '../src/services/MemberService';
import { StateRepository } from '../src/repositories/StateRepository';
import { CityRepository } from '../src/repositories/CityRepository';
import { UniversityRepository } from '../src/repositories/UniversityRepository';
import { CourseRepository } from '../src/repositories/CourseRepository';
import { CourseUniversityRepository } from '../src/repositories/CourseUniversityRepository';
import { RoleRepository } from '../src/repositories/RoleRepository';

test('PostgreSQL: provisionar, entrar, trocar senha e importar hierarquia (rollback integral)', async (context) => {
  await AppDataBase.initialize();
  const runner = AppDataBase.createQueryRunner();
  await runner.connect();
  await runner.startTransaction();
  try {
    context.mock.method(AppDataBase, 'transaction', async (callback: (manager: EntityManager) => Promise<unknown>) => {
      await runner.startTransaction();
      try {
        const result = await callback(runner.manager);
        await runner.commitTransaction();
        return result;
      } catch (error) {
        await runner.rollbackTransaction();
        throw error;
      }
    });
    context.mock.method(AppDataBase, 'query', (sql: string, parameters?: unknown[]) => runner.query(sql, parameters));
    context.mock.method(AppDataBase, 'getRepository', runner.manager.getRepository.bind(runner.manager));
    const organizationId = randomUUID();
    const suffix = randomBytes(8).toString('hex');
    await runner.query(
      `INSERT INTO organizations (id, name, slug, status) VALUES ($1, $2, $3, 'ACTIVE')`,
      [organizationId, 'Teste transacional onboarding', `teste-${suffix}`],
    );
    const provisioning = new AccountProvisioningService();
    const access = await provisioning.provisionMember(organizationId, `onboarding-${suffix}@example.invalid`, true);
    assert.ok(access.temporary_password);
    const auth = new AuthService(new MemberRepository(), new TokenRepository());
    await context.test('cadastro público básico cria vínculo pendente sem dados acadêmicos', async () => {
      const members = new MemberService(new MemberRepository(), new TokenRepository(),
        new StateRepository(), new CityRepository(), new UniversityRepository(),
        new CourseRepository(), new CourseUniversityRepository(), new RoleRepository(), provisioning);
      const password = randomBytes(24).toString('base64url');
      const result = await members.createMember({
        name: 'Cadastro público básico', email_personal: `publico-${suffix}@example.invalid`, password,
        cpf: '52998224725', confirm_password: password,
      }, password, organizationId);
      assert.equal(result.member.organization_id, organizationId);
      assert.equal(result.member.registration_status, 'pending');
      assert.ok(result.member.slug);
      assert.equal((await runner.query(`SELECT cpf FROM members WHERE id = $1`, [result.member.id]))[0].cpf, '52998224725');
      await assert.rejects(auth.login(result.member.email_personal, password, false, `teste-${suffix}`, 'member'), /analise/);
    });
    await context.test('cadastro interno usa os mesmos tipos configuráveis e registra dados e consentimento', async () => {
      const profiles = new ExternalProfileTypesService();
      const university = { key: 'university', name: 'Universitário', description: 'Dados definidos pela organização',
        fields: [{ key: 'instituicao', label: 'Instituição', type: 'text' as const, required: true }] };
      await profiles.save(organizationId, [DEFAULT_EXTERNAL_PROFILE_TYPES[0], university]);
      const members = new MemberService(new MemberRepository(), new TokenRepository(), new StateRepository(), new CityRepository(),
        new UniversityRepository(), new CourseRepository(), new CourseUniversityRepository(), new RoleRepository(), provisioning);
      const password = randomBytes(24).toString('base64url');
      const input = { name: 'Universitário interno', email_personal: `universitario-${suffix}@example.invalid`, password,
        organization_profile_key: 'university', profile_data: { instituicao: 'Universidade de teste' }, accepted_profile_sharing: true };
      await assert.rejects(members.createMember({ ...input, accepted_profile_sharing: false }, password, organizationId), /compartilhamento/);
      await assert.rejects(members.createMember({ ...input, profile_data: {} }, password, organizationId), /dados do perfil/);
      const created = await members.createMember(input, password, organizationId);
      assert.equal(created.member.registration_status, 'pending');
      assert.equal(created.member.ra, null);
      const [profile] = await runner.query(`SELECT additional_attributes FROM external_account_profiles WHERE account_id = $1`, [created.member.account_id]);
      const snapshot = profile.additional_attributes.organization_profiles[organizationId];
      assert.equal(snapshot.key, 'university');
      assert.deepEqual(snapshot.data, { instituicao: 'Universidade de teste' });
      assert.equal(snapshot.consent_version, 'registration-profile-v1');
      assert.ok(snapshot.consent_at);
      assert.equal(profile.additional_attributes.external_fields.instituicao.value, 'Universidade de teste');
      assert.equal((await runner.query(`SELECT 1 FROM member_roles mr JOIN roles r ON r.id = mr.role_id WHERE mr.member_id = $1 AND r.name = 'EXTERNO'`, [created.member.id])).length, 0);
      await profiles.save(organizationId, DEFAULT_EXTERNAL_PROFILE_TYPES);
    });
    const initial = await auth.login(access.email, access.temporary_password, true, `teste-${suffix}`, 'organization');
    const payload = decode(initial.accessToken);
    assert.ok(payload && typeof payload !== 'string');
    assert.equal(payload.password_change_required, true);
    assert.ok(payload.roles.includes('organization.admin'));
    const [member] = await runner.query(`SELECT account_id, slug FROM members WHERE id = $1`, [access.member_id]);
    assert.ok(member.slug);
    const newPassword = randomBytes(24).toString('base64url');
    await auth.changeTemporaryPassword(member.account_id, newPassword, access.member_id, 'Membro de Teste');
    const [tokens] = await runner.query(
      `SELECT count(*)::int AS total FROM token WHERE account_id = $1 OR "memberId" = $2`,
      [member.account_id, access.member_id],
    );
    assert.equal(tokens.total, 0);
    await assert.rejects(auth.login(access.email, access.temporary_password, false, `teste-${suffix}`), /Credenciais/);
    const personal = await auth.login(access.email, newPassword, false, `teste-${suffix}`);
    const personalPayload = decode(personal.accessToken);
    assert.ok(personalPayload && typeof personalPayload !== 'string');
    assert.equal(personalPayload.password_change_required, false);
    assert.equal(personalPayload.name, 'Membro de Teste');
    await context.test('mesma identidade mantém sessões separadas de plataforma, organização e membro', async () => {
      await runner.query(`INSERT INTO user_account_roles (account_id, role_name) VALUES ($1, 'EQUIPE_TECNICA')`, [member.account_id]);
      const platform = await auth.login(access.email, newPassword, true, undefined, 'platform');
      const organization = await auth.login(access.email, newPassword, true, `teste-${suffix}`, 'organization');
      const community = await auth.login(access.email, newPassword, true, `teste-${suffix}`, 'member');
      assert.equal(decodeToken(platform.accessToken).access_context, 'platform');
      assert.equal(decodeToken(platform.accessToken).organization_id, undefined);
      assert.equal(decodeToken(organization.accessToken).access_context, 'organization');
      assert.ok(decodeToken(organization.accessToken).roles.includes('organization.admin'));
      assert.ok(!decodeToken(organization.accessToken).roles.includes('EQUIPE_TECNICA'));
      assert.deepEqual(decodeToken(community.accessToken).roles, []);
      assert.equal(decodeToken(community.accessToken).access_context, 'member');
      await assert.rejects(auth.login(access.email, newPassword, false, `teste-${suffix}`, 'platform'), /endereço da plataforma/);
      await assert.rejects(auth.login(access.email, newPassword, false, undefined, 'organization'), /endereço da organização/);
      const refreshed = await auth.refreshToken(community.refreshToken!);
      assert.equal(decodeToken(refreshed.accessToken).access_context, 'member');
      assert.deepEqual(decodeToken(refreshed.accessToken).roles, []);
      await assert.rejects(auth.refreshToken(community.refreshToken!), /invalido/);
      await auth.logout(organization.accessToken, organization.refreshToken);
      await assert.rejects(auth.validateAccessToken(organization.accessToken), /invalido/);
      await assert.rejects(auth.refreshToken(organization.refreshToken!), /invalido/);
      assert.deepEqual(await auth.validateAccessToken(platform.accessToken), { valid: true });
      assert.deepEqual(await auth.validateAccessToken(refreshed.accessToken), { valid: true });
    });

    await context.test('evento criado em suporte pertence à organização e pode ser gerido por outro admin', async () => {
      const support = await auth.startSupportAccess(organizationId, member.account_id, member.account_id, 'Teste transacional de suporte e eventos');
      const supportUser = decodeToken(support.accessToken);
      const adminAccess = await provisioning.provisionMember(organizationId, `admin-evento-${suffix}@example.invalid`, true);
      const [adminAccount] = await runner.query(`SELECT account_id FROM members WHERE id = $1`, [adminAccess.member_id]);
      await auth.changeTemporaryPassword(adminAccount.account_id, newPassword, adminAccess.member_id, 'Admin do Evento');
      const adminSession = await auth.login(adminAccess.email, newPassword, false, `teste-${suffix}`, 'organization');
      const adminUser = decodeToken(adminSession.accessToken);
      const service = new MiscellaneousService(
        new MiscellaneousRepository(), new MiscellaneousOwnerRepository(),
        new MiscellaneousParticipantRepository(), new MiscellaneousApprovalLogRepository(), new MemberRepository(),
      );
      const dto: CreateMiscellaneousDto & { organization_id: string } = {
        organization_id: organizationId, title: 'Evento público de teste', description: 'Inscrição transacional',
        type: MiscellaneousType.EVENT, scope_rules: [{ type: 'general' }],
        start_date: new Date(Date.now() + 86400000).toISOString(), max_participants: 2,
        external_registration_schema: [{ key: 'turno', label: 'Turno', type: 'select', required: true, options: ['Manhã', 'Tarde'] }],
      };
      const { miscellaneous: event } = await service.create(dto, supportUser.id, supportUser.roles);
      assert.equal(event.organization_id, organizationId);
      assert.equal(event.status, 'active');
      const filters = { organization_id: organizationId, page: 1, limit: 20 };
      const listed = await service.findAll(filters, adminUser.id, true);
      assert.ok(listed.data.some((item) => item.id === event.id));
      await service.update(event.id, { title: 'Evento revisado pelo admin' }, adminUser.id, adminUser);
      const publicSlug = await service.enablePublicAccess(event.id, adminUser.id, adminUser);
      const accessService = new MiscellaneousAccessService(new MiscellaneousRepository(), new MiscellaneousRequestRepository(),
        new MiscellaneousInviteRepository(), new MiscellaneousParticipantRepository(), service);
      assert.deepEqual(await accessService.listRequests(event.id, adminUser.id, adminUser), []);
      assert.deepEqual(await accessService.listPendingInvites(event.id, adminUser.id, adminUser), []);
      const waitlist = new MiscellaneousWaitlistService(new MiscellaneousWaitlistRepository(), new MiscellaneousParticipantRepository(), service, new MiscellaneousRepository());
      assert.deepEqual(await waitlist.getWaitlist(event.id, adminUser.id, adminUser), []);
      const attendance = new AttendanceService(new AttendanceRepository(), new MiscellaneousRepository(), service, new MiscellaneousParticipantRepository());
      const attendanceSession = await attendance.createSession(event.id, adminUser.id, {
        title: 'Presença do evento', mode: AttendanceMode.MANUAL,
        starts_at: new Date().toISOString(), ends_at: new Date(Date.now() + 3600000).toISOString(),
      }, adminUser);
      assert.equal(attendanceSession.miscellaneous_id, event.id);
      await assert.rejects(service.ensureOwner(event.id, adminUser.id, { roles: [], organization_id: organizationId }), /Apenas donos/);
      await assert.rejects(service.ensureOwner(event.id, adminUser.id, { roles: ['organization.admin'], organization_id: randomUUID() }), /nesta organização/);

      const registrations = new ExternalEventRegistrationService();
      const input = { name: 'Participante externo', email: `externo-${suffix}@example.invalid`, password: newPassword,
        accepted_privacy: true, registration_data: { turno: 'Manhã' } };
      assert.equal((await registrations.getPublicEvent(publicSlug, organizationId)).registration_state, 'open');
      await assert.rejects(registrations.getPublicEvent(publicSlug, randomUUID()), /não encontrado/);
      await assert.rejects(registrations.register(publicSlug, input, randomUUID()), /não encontrado/);
      await assert.rejects(registrations.register(publicSlug, { ...input, registration_data: { turno: 'Inválido' } }, organizationId), /Seleção inválida/);
      await assert.rejects(registrations.register(publicSlug, { ...input, cpf: '11111111111' }, organizationId), /CPF válido/);
      assert.equal((await registrations.register(publicSlug, { ...input, cpf: '11144477735' }, organizationId)).registered, true);
      assert.equal((await registrations.register(publicSlug, input, organizationId)).registered, true);
      const [externalMember] = await runner.query(`SELECT account_id, slug FROM members WHERE email_personal = $1 AND organization_id = $2`, [input.email, organizationId]);
      assert.ok(externalMember.slug);
      const externalStatus = await registrations.registrationStatus(publicSlug, organizationId, externalMember.account_id);
      assert.equal(externalStatus.registered, true);
      assert.equal(externalStatus.membership, 'external');
      assert.equal(externalStatus.cpf, '11144477735');
      assert.equal((await registrations.getPublicEvent(publicSlug, organizationId)).title, 'Evento revisado pelo admin');
      const participant = await registrations.requireEventParticipant(publicSlug, organizationId, externalMember.account_id);
      await assert.rejects(registrations.requireEventParticipant(publicSlug, organizationId), /Entre com sua conta/);
      await assert.rejects(registrations.requireEventParticipant(publicSlug, organizationId, member.account_id), /não está inscrito/);
      const qrSession = await attendance.createSession(event.id, adminUser.id, {
        title: 'Código de presença', mode: AttendanceMode.QR_CODE,
        starts_at: new Date(Date.now() - 60000).toISOString(), ends_at: new Date(Date.now() + 3600000).toISOString(),
      }, adminUser);
      await assert.rejects(attendance.getParticipantToken(event.id, attendanceSession.id, participant.memberId), /manualmente/);
      await assert.rejects(attendance.getParticipantToken(randomUUID(), qrSession.id, participant.memberId), /neste evento/);
      const presence = await attendance.getParticipantToken(event.id, qrSession.id, participant.memberId);
      assert.ok(presence.token);
      assert.equal((await attendance.getParticipantToken(event.id, qrSession.id, participant.memberId)).token, presence.token);
      await assert.rejects(attendance.getParticipantToken(event.id, qrSession.id, adminUser.id), /não está inscrito/);
      await assert.rejects(attendance.checkInByQr(qrSession.id, 'invalid-token', adminUser.id, adminUser), /Token inválido/);
      await assert.rejects(attendance.checkInByQr(attendanceSession.id, presence.token, adminUser.id, adminUser), /não utiliza QR/);
      await assert.rejects(attendance.checkInByQr(qrSession.id, presence.token, participant.memberId, { roles: ['EXTERNO'], organization_id: organizationId }), /Apenas donos/);
      const otherQrSession = await attendance.createSession(event.id, adminUser.id, {
        title: 'Outra sessão QR', mode: AttendanceMode.QR_CODE,
        starts_at: new Date(Date.now() - 60000).toISOString(), ends_at: new Date(Date.now() + 3600000).toISOString(),
      }, adminUser);
      await assert.rejects(attendance.checkInByQr(otherQrSession.id, presence.token, adminUser.id, adminUser), /não pertence/);
      await runner.query(`UPDATE attendance_sessions SET starts_at = now() + interval '10 minutes' WHERE id = $1`, [qrSession.id]);
      await assert.rejects(attendance.getParticipantToken(event.id, qrSession.id, participant.memberId), /ainda não começou/);
      await assert.rejects(attendance.checkInByQr(qrSession.id, presence.token, adminUser.id, adminUser), /não está aberta/);
      await runner.query(`UPDATE attendance_sessions SET starts_at = now() - interval '2 minutes', ends_at = now() - interval '1 minute' WHERE id = $1`, [qrSession.id]);
      await assert.rejects(attendance.getParticipantToken(event.id, qrSession.id, participant.memberId), /encerrada/);
      await assert.rejects(attendance.checkInByQr(qrSession.id, presence.token, adminUser.id, adminUser), /não está aberta/);
      await runner.query(`UPDATE attendance_sessions SET ends_at = now() + interval '1 hour' WHERE id = $1`, [qrSession.id]);
      await runner.query(`UPDATE attendance_tokens SET expires_at = now() - interval '1 minute' WHERE token = $1`, [presence.token]);
      await assert.rejects(attendance.checkInByQr(qrSession.id, presence.token, adminUser.id, adminUser), /expirado/);
      await runner.query(`UPDATE attendance_tokens SET expires_at = now() + interval '1 hour' WHERE token = $1`, [presence.token]);
      const managerPeople = await service.getPeople(event.id, adminUser.id, organizationId, adminUser);
      const managerPerson = managerPeople.members.find(person => person.member_id === participant.memberId)!;
      assert.equal(managerPerson.member.email_personal, input.email);
      assert.equal(managerPerson.member.cpf, '11144477735');
      assert.equal(managerPerson.details?.registration_data.turno, 'Manhã');
      const participantPeople = await service.getPeople(event.id, participant.memberId, organizationId, { roles: ['EXTERNO'], organization_id: organizationId });
      assert.equal('email_personal' in participantPeople.members[0].member, false);
      assert.equal('details' in participantPeople.members[0], false);
      await assert.rejects(service.getPeople(event.id, adminUser.id, randomUUID(), adminUser), /não encontrad/);
      await attendance.checkInByQr(qrSession.id, presence.token, adminUser.id, adminUser);
      await assert.rejects(attendance.checkInByQr(qrSession.id, presence.token, adminUser.id, adminUser), /já utilizado/);
      assert.equal((await attendance.getParticipantToken(event.id, qrSession.id, participant.memberId)).checked_in, true);
      await service.update(event.id, { external_registration_schema: [
        { key: 'turno', label: 'Turno atualizado', type: 'select', required: true, options: ['Manhã', 'Tarde', 'Noite'] },
        { key: 'observacao', label: 'Observação', type: 'text', required: false },
        { key: 'alimentacao', label: 'Preferência alimentar', type: 'text', required: true },
      ] }, adminUser.id, adminUser);
      const editedPublicEvent = await registrations.getPublicEvent(publicSlug, organizationId);
      assert.equal(editedPublicEvent.registration_fields.length, 3);
      assert.equal(editedPublicEvent.registration_fields[0].label, 'Turno atualizado');
      const [originalAnswer] = await runner.query(`SELECT registration_data FROM external_event_registrations WHERE miscellaneous_id = $1 AND account_id = $2`, [event.id, externalMember.account_id]);
      assert.deepEqual(originalAnswer.registration_data, { turno: 'Manhã' });
      assert.equal((await registrations.registrationStatus(publicSlug, organizationId, externalMember.account_id)).registered, true);
      const pendingAnswers = await registrations.getParticipantAnswers(event.id, organizationId, externalMember.account_id);
      assert.deepEqual(pendingAnswers.pending_fields.map(field => field.key), ['observacao', 'alimentacao']);
      assert.deepEqual(pendingAnswers.registration_data, { turno: 'Manhã' });
      await assert.rejects(registrations.getParticipantAnswers(event.id, randomUUID(), externalMember.account_id), /não encontrado/);
      await assert.rejects(registrations.getParticipantAnswers(event.id, organizationId, member.account_id), /não está inscrito/);
      await assert.rejects(registrations.updateParticipantAnswers(event.id, organizationId, externalMember.account_id, {
        registration_data: { turno: 'Manhã', alimentacao: 'Vegetariana' }, accepted_privacy: false,
      }), /Confirme/);
      await assert.rejects(registrations.updateParticipantAnswers(event.id, organizationId, externalMember.account_id, {
        registration_data: { turno: 'Manhã' }, accepted_privacy: true,
      }), /Preferência alimentar/);
      const updatedAnswers = await registrations.updateParticipantAnswers(event.id, organizationId, externalMember.account_id, {
        registration_data: { turno: 'Manhã', alimentacao: 'Vegetariana' }, accepted_privacy: true,
      });
      assert.deepEqual(updatedAnswers.pending_fields, []);
      assert.deepEqual((await registrations.getParticipantAnswers(event.id, organizationId, externalMember.account_id)).pending_fields, []);
      assert.equal((await runner.query(`SELECT count(*)::int AS total FROM miscellaneous_participants WHERE miscellaneous_id = $1`, [event.id]))[0].total, 1);
      const [supplemented] = await runner.query(`SELECT shared_profile, profile_consent_version FROM external_event_registrations WHERE miscellaneous_id = $1`, [event.id]);
      assert.equal(supplemented.profile_consent_version, 'external-event-v2');
      assert.equal(supplemented.shared_profile.event_answers_consent_version, 'event-answers-v1');
      await service.update(event.id, { external_registration_schema: dto.external_registration_schema }, adminUser.id, adminUser);
      assert.deepEqual((await registrations.getParticipantAnswers(event.id, organizationId, externalMember.account_id)).registration_data, { turno: 'Manhã' });
      assert.equal((await runner.query(`SELECT registration_data->>'alimentacao' AS answer FROM external_event_registrations WHERE miscellaneous_id = $1`, [event.id]))[0].answer, 'Vegetariana');
      const externalLogin = await auth.login(input.email, newPassword, true, `teste-${suffix}`, 'member');
      assert.ok(decodeToken(externalLogin.accessToken).roles.includes('EXTERNO'));
      assert.equal((await registrations.getMyRegistrations(externalMember.account_id, organizationId)).length, 1);
      const profileTypes = new ExternalProfileTypesService();
      const organizationB = randomUUID();
      await runner.query(`INSERT INTO organizations (id, name, slug, status) VALUES ($1, 'Organização B', $2, 'ACTIVE')`, [organizationB, `org-b-${suffix}`]);
      const professional = {
        key: 'professional', name: 'Profissional', description: 'Participação profissional',
        fields: [{ key: 'conselho', label: 'Conselho profissional', type: 'text' as const, required: true }],
      };
      await profileTypes.save(organizationId, [professional], member.account_id);
      await profileTypes.save(organizationB, [
        professional, { key: 'visitor', name: 'Visitante', description: 'Comunidade', fields: [] },
      ], member.account_id);
      assert.equal((await profileTypes.list(organizationB)).length, 2);
      const anotherEvent = await service.create({ ...dto, max_participants: 10, external_registration_schema: [] }, supportUser.id, supportUser.roles);
      const anotherSlug = await service.enablePublicAccess(anotherEvent.miscellaneous.id, adminUser.id, adminUser);
      await assert.rejects(registrations.register(anotherSlug, {
        ...input, password: undefined, registration_data: {}, organization_profile_key: 'professional', profile_data: {},
      }, organizationId, externalMember.account_id), /dados do perfil/);
      await registrations.register(anotherSlug, {
        ...input, password: undefined, registration_data: {}, organization_profile_key: 'professional', profile_data: { conselho: 'CREA-TESTE' },
      }, organizationId, externalMember.account_id);
      const loginB = await auth.login(input.email, newPassword, true, `org-b-${suffix}`, 'member');
      const loginBUser = decodeToken(loginB.accessToken);
      assert.equal(loginBUser.community_only, true);
      assert.equal(loginBUser.organization_id, organizationB);
      assert.deepEqual(loginBUser.roles, ['EXTERNO']);
      assert.equal((await runner.query(`SELECT id FROM members WHERE account_id = $1 AND organization_id = $2`, [externalMember.account_id, organizationB])).length, 0);
      const refreshedB = await auth.refreshToken(loginB.refreshToken!);
      assert.equal(decodeToken(refreshedB.accessToken).organization_id, organizationB);
      const bDto = { ...dto, organization_id: organizationB, external_registration_schema: [] };
      const bEvent = await service.create(bDto, supportUser.id, supportUser.roles);
      const bContext = { roles: ['organization.admin'], organization_id: organizationB };
      const bSlug = await service.enablePublicAccess(bEvent.miscellaneous.id, adminUser.id, bContext);
      const statusB = await registrations.registrationStatus(bSlug, organizationB, externalMember.account_id);
      assert.equal(statusB.membership, null);
      assert.deepEqual(statusB.profile_data, { conselho: 'CREA-TESTE' });
      await assert.rejects(registrations.register(bSlug, {
        ...input, password: undefined, registration_data: {}, organization_profile_key: 'professional',
        profile_data: { conselho: 'CREA-TESTE' }, accepted_privacy: false,
      }, organizationB, externalMember.account_id), /privacidade/);
      await registrations.register(bSlug, {
        ...input, password: undefined, registration_data: {}, organization_profile_key: 'professional', profile_data: { conselho: 'CREA-TESTE' },
      }, organizationB, externalMember.account_id);
      const [sharedRegistration] = await runner.query(
        `SELECT shared_profile, profile_consent_version FROM external_event_registrations
         WHERE organization_id = $1 AND account_id = $2`,
        [organizationB, externalMember.account_id],
      );
      assert.equal(sharedRegistration.profile_consent_version, 'external-event-v2');
      assert.equal(sharedRegistration.shared_profile.organization_profile_name, 'Profissional');
      assert.deepEqual(sharedRegistration.shared_profile.profile_data, { conselho: 'CREA-TESTE' });
      const [accounts] = await runner.query(`SELECT count(*)::int AS total FROM user_accounts WHERE email = $1`, [input.email]);
      assert.equal(accounts.total, 1);
      assert.equal((await registrations.getMyRegistrations(externalMember.account_id, organizationB)).length, 1);
      const normalB = await auth.login(input.email, newPassword, false, `org-b-${suffix}`, 'member');
      assert.equal(decodeToken(normalB.accessToken).community_only, undefined);
      assert.ok(decodeToken(normalB.accessToken).roles.includes('EXTERNO'));
      await profileTypes.save(organizationB, [{ ...professional, fields: [{ ...professional.fields[0], label: 'Outro significado' }] }], member.account_id);
      const changedStatus = await registrations.registrationStatus(bSlug, organizationB, externalMember.account_id);
      assert.deepEqual(changedStatus.profile_data, {});
      await auth.logout(refreshedB.accessToken, refreshedB.refreshToken);
      await profileTypes.save(organizationId, DEFAULT_EXTERNAL_PROFILE_TYPES, member.account_id);

      assert.equal((await registrations.register(publicSlug, { ...input, password: undefined }, organizationId, adminAccount.account_id)).registered, true);
      const internalStatus = await registrations.registrationStatus(publicSlug, organizationId, adminAccount.account_id);
      assert.equal(internalStatus.membership, 'internal');
      assert.equal(internalStatus.registered, true);
      await service.update(event.id, { external_registration_schema: [
        ...dto.external_registration_schema!, { key: 'novo_dado', label: 'Novo dado', type: 'number', required: true },
      ] }, adminUser.id, adminUser);
      assert.deepEqual((await registrations.getParticipantAnswers(event.id, organizationId, adminAccount.account_id)).pending_fields.map(field => field.key), ['novo_dado']);
      await registrations.updateParticipantAnswers(event.id, organizationId, adminAccount.account_id, {
        registration_data: { turno: 'Manhã', novo_dado: 10 }, accepted_privacy: true,
      });
      assert.deepEqual((await registrations.getParticipantAnswers(event.id, organizationId, adminAccount.account_id)).pending_fields, []);
      await service.update(event.id, { external_registration_schema: dto.external_registration_schema }, adminUser.id, adminUser);
      const [profileCount] = await runner.query(`SELECT count(*)::int AS total FROM external_account_profiles WHERE account_id = $1`, [adminAccount.account_id]);
      assert.equal(profileCount.total, 0);
      const publicRegistrations = await service.getExternalRegistrations(event.id, adminUser.id, organizationId, adminUser) as { membership_type: string }[];
      assert.deepEqual(publicRegistrations.map((registration) => registration.membership_type).sort(), ['external', 'internal']);
      const pending = await provisioning.provisionMember(organizationId, `pending-${suffix}@example.invalid`, false);
      const [pendingAccount] = await runner.query(`SELECT account_id FROM members WHERE id = $1`, [pending.member_id]);
      await auth.changeTemporaryPassword(pendingAccount.account_id, newPassword, pending.member_id, 'Cadastro pendente');
      await runner.query(`UPDATE members SET registration_status = 'pending' WHERE id = $1`, [pending.member_id]);
      await assert.rejects(registrations.register(publicSlug, { ...input, password: undefined }, organizationId, pendingAccount.account_id), /não foi aprovado/);
      const fullEvent = await registrations.getPublicEvent(publicSlug, organizationId);
      assert.equal(fullEvent.registration_state, 'full');
      assert.equal(fullEvent.remaining_places, 0);
      await assert.rejects(registrations.register(publicSlug, { ...input, email: `lotado-${suffix}@example.invalid` }, organizationId), /vagas/);
      await service.update(event.id, { registration_end_date: new Date(Date.now() - 60000).toISOString() }, adminUser.id, adminUser);
      assert.equal((await registrations.getPublicEvent(publicSlug, organizationId)).registration_state, 'closed');
      await assert.rejects(registrations.register(publicSlug, input, organizationId), /encerradas/);
      assert.equal((await registrations.registrationStatus(publicSlug, organizationId, adminAccount.account_id)).registered, true);
      await auth.endSupportAccess(supportUser.support_session_id, supportUser.id, member.account_id);
      await runner.query(`DELETE FROM member_roles WHERE member_id = $1`, [adminAccess.member_id]);
      await runner.query(`INSERT INTO user_account_roles (account_id, role_name) VALUES ($1, 'EQUIPE_TECNICA')`, [adminAccount.account_id]);
      await assert.rejects(auth.login(adminAccess.email, newPassword, false, `teste-${suffix}`, 'organization'), /não é administradora/);
    });
    const reused = await provisioning.provisionMember(organizationId, access.email, true);
    assert.equal(reused.temporary_password, undefined);
    const repository = new MemberRepository();
    const profile = await repository.findByIdWithRelations(access.member_id, organizationId);
    assert.equal(profile?.name, 'Membro de Teste');
    const pendingMembers = await repository.findByRegistrationStatus(MemberRegistrationStatus.PENDING, organizationId);
    assert.equal(pendingMembers.some((entry) => entry.id === access.member_id), false);
    const hierarchy = new HierarchyTemplateService();
    const template = HIERARCHY_TEMPLATES[0];
    const result = await hierarchy.import(organizationId, { ...template, units: [...template.units].reverse() }, member.account_id);
    assert.deepEqual(result, { types: template.types.length, units: template.units.length, positions: template.positions.length });
    await assert.rejects(hierarchy.import(organizationId, template, member.account_id), /mesmo slug/);
    const [units] = await runner.query(`SELECT count(*)::int AS total FROM org_units WHERE organization_id = $1`, [organizationId]);
    assert.equal(units.total, template.units.length);
    const orgUnits = new OrgUnitService(new OrgUnitRepository());
    const flatUnits = await orgUnits.listAll(organizationId);
    const root = flatUnits.find((unit) => !unit.parent_id)!;
    const child = flatUnits.find((unit) => unit.parent_id === root.id)!;
    await assert.rejects(orgUnits.update(root.id, organizationId, { parent_id: child.id }, member.account_id), /ciclo/);
    await orgUnits.update(child.id, organizationId, { name: 'Unidade editada', parent_id: null }, member.account_id);
    assert.equal((await orgUnits.findById(child.id, organizationId)).parent_id, null);
    const [position] = await orgUnits.listPositions(organizationId);
    await orgUnits.updatePosition(position.id, organizationId, { mandate_duration_days: 180 }, member.account_id);
    const unit = flatUnits.find((entry) => entry.type_id === position.org_unit_type_id)!;
    const mandate = await orgUnits.createMandate({
      organization_id: organizationId, position_id: position.id, org_unit_id: unit.id,
      member_id: access.member_id, start_date: new Date('2026-01-01T00:00:00Z'),
    }, member.account_id);
    assert.equal(new Date(mandate.end_date!).toISOString().slice(0, 10), '2026-06-30');
    assert.equal((await orgUnits.closeMandate(mandate.id, organizationId, member.account_id, true))?.status, 'REVOKED');
  } finally {
    context.mock.restoreAll();
    await runner.rollbackTransaction();
    await runner.release();
    await AppDataBase.destroy();
  }
});
