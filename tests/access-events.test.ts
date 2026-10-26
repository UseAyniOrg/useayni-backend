import 'reflect-metadata';
import type {} from '../src/interfaces/express';
import assert from 'node:assert/strict';
import { test } from 'node:test';
import { Reflector } from '@nestjs/core';
import { ExecutionContextHost } from '@nestjs/core/helpers/execution-context-host';
import { sign } from 'jsonwebtoken';
import { AuthorizationGuard } from '../src/middlewares/authorization.guard';
import { CommunitySessionGuard } from '../src/middlewares/communitySession.guard';
import { AppDataBase } from '../src/db';
import { Token } from '../src/models/token';
import { authConfig } from '../src/config/auth';
import { JWTPayload } from '../src/helpers/tokenHelper';
import { ROLES_KEY } from '../src/middlewares/permissionMiddleware';
import { generateMiscellaneousPublicSlug } from '../src/helpers/miscellaneousSlug';
import { ExternalProfileTypesService, externalProfileTypesSchema } from '../src/services/ExternalProfileTypesService';
import { MemberController } from '../src/controllers/MembersController';
import { PATH_METADATA, GUARDS_METADATA } from '@nestjs/common/constants';
import { isValidCpf } from '../src/helpers/cpf';
import { ExternalEventRegistrationService } from '../src/services/ExternalEventRegistrationService';
import { EntityManager } from 'typeorm';
import { AttendanceService } from '../src/services/MiscellaneousWaitlistAttendanceService';
import { AttendanceRepository } from '../src/repositories/AttendanceFormRepositories';
import { AttendanceSession } from '../src/models/attendance';
import { isTenantOrigin } from '../src/helpers/corsOrigin';

test('CORS aceita portas locais de desenvolvimento sem liberar origens externas ou producao', () => {
  for (const origin of ['http://localhost:5173', 'http://127.0.0.1:5180', 'http://creajrpr.localhost:5181', 'http://[::1]:5180']) {
    assert.equal(isTenantOrigin(origin, false), true, origin);
    assert.equal(isTenantOrigin(origin, true), false, origin);
  }
  assert.equal(isTenantOrigin('https://creajrpr.useayni.com', true), true);
  for (const origin of ['https://admin.useayni.com', 'http://externo.example:5180', 'http://localhost.evil.example:5180', 'http://localhost:5180/path', 'null']) {
    assert.equal(isTenantOrigin(origin, false), false, origin);
  }
});

test('exclusão de sessão verifica existência e autorização antes de remover', async () => {
  const calls: unknown[] = [];
  let exists = true;
  let allowed = true;
  const repository = {
    findSessionById: async () => exists ? { miscellaneous_id: 'event-one' } : null,
    deleteSession: async (id: string) => { calls.push(['delete', id]); return { affected: 1 }; },
  };
  const management = {
    ensureOwner: async (...args: unknown[]) => {
      calls.push(['authorize', ...args]);
      if (!allowed) throw new Error('Sem permissão');
    },
  };
  type Dependencies = ConstructorParameters<typeof AttendanceService>;
  const service = new AttendanceService(repository as unknown as Dependencies[0], {} as Dependencies[1],
    management as unknown as Dependencies[2], {} as Dependencies[3]);
  await service.deleteSession('session-one', baseUser.id, baseUser);
  assert.deepEqual(calls, [['authorize', 'event-one', baseUser.id, baseUser], ['delete', 'session-one']]);
  calls.length = 0;
  allowed = false;
  await assert.rejects(service.deleteSession('session-one', baseUser.id, baseUser), /Sem permissão/);
  assert.equal(calls.length, 1);
  calls.length = 0;
  exists = false;
  await assert.rejects(service.deleteSession('session-one', baseUser.id, baseUser), /Sessão não encontrada/);
  assert.deepEqual(calls, []);
});

test('repositório exclui somente a sessão solicitada, usando a cascata do banco', async (context) => {
  const deleted: unknown[] = [];
  context.mock.method(AppDataBase.getRepository(AttendanceSession), 'delete', async (id: unknown) => {
    deleted.push(id);
    return { affected: 1, raw: [] };
  });
  await new AttendanceRepository().deleteSession('session-one');
  assert.deepEqual(deleted, ['session-one']);
});

const organizationId = 'organization-one';
const baseUser: JWTPayload = {
  id: 'member-one', account_id: 'account-one', email: 'test@example.invalid',
  name: 'Teste', roles: [], positions: [], isActive: true,
  organization_id: organizationId, access_context: 'member',
};

test('CPF básico valida os dígitos e aceita máscara sem aceitar sequências repetidas', () => {
  assert.equal(isValidCpf('52998224725'), true);
  assert.equal(isValidCpf('529.982.247-25'), true);
  assert.equal(isValidCpf('52998224726'), false);
  assert.equal(isValidCpf('11111111111'), false);
});

test('pendências distinguem perguntas novas, obrigatórias e valores incompatíveis de opcionais já confirmadas', async (context) => {
  const manager = new EntityManager(AppDataBase);
  const optional = { key: 'opcional', label: 'Opcional', type: 'text', required: false };
  const fields = [
    optional,
    { key: 'novo', label: 'Novo opcional', type: 'text', required: false },
    { key: 'obrigatorio', label: 'Obrigatório', type: 'text', required: true },
    { key: 'turno', label: 'Turno', type: 'select', required: false, options: ['Noite'] },
  ];
  context.mock.method(manager, 'query', async (sql: string) => sql.includes('FOR SHARE')
    ? [{ external_registration_schema: fields }]
    : [{ member_id: 'member-one', name: 'Teste', email_personal: 'test@example.invalid',
      registration_data: { turno: 'Manhã', removido: 'Histórico' },
      shared_profile: { event_registration_schema: [optional, { ...fields[3], options: ['Manhã'] }] } }]);
  context.mock.method(AppDataBase, 'transaction', async (callback: (manager: EntityManager) => Promise<unknown>) => callback(manager));
  const result = await new ExternalEventRegistrationService().getParticipantAnswers('event-one', organizationId, 'account-one');
  assert.deepEqual(result.pending_fields.map(field => field.key), ['novo', 'obrigatorio', 'turno']);
  assert.deepEqual(result.registration_data, {});
});

test('rotas públicas do cadastro são registradas antes da rota genérica de membro', () => {
  const methods = Object.getOwnPropertyNames(MemberController.prototype);
  assert.ok(methods.indexOf('listRegistrationFields') < methods.indexOf('getMemberById'));
  assert.ok(methods.indexOf('listRegistrationProfileTypes') < methods.indexOf('getMemberById'));
  assert.ok(methods.indexOf('listCustomFields') < methods.indexOf('getMemberById'));
  assert.equal(Reflect.getMetadata(PATH_METADATA, MemberController.prototype.listRegistrationFields), 'registration-fields');
  assert.equal(Reflect.getMetadata(GUARDS_METADATA, MemberController.prototype.listRegistrationFields), undefined);
  assert.equal(Reflect.getMetadata(GUARDS_METADATA, MemberController.prototype.listRegistrationProfileTypes), undefined);
});

test('perfis externos validam tipos, campos obrigatórios e chaves estáveis', () => {
  const service = new ExternalProfileTypesService();
  const profile = { key: 'professional', name: 'Profissional', description: 'Dados profissionais', fields: [
    { key: 'conselho', label: 'Conselho', type: 'text' as const, required: true },
    { key: 'aceite', label: 'Aceite', type: 'checkbox' as const, required: true },
    { key: 'area', label: 'Área', type: 'select' as const, required: false, options: ['Engenharia'] },
  ] };
  assert.equal(externalProfileTypesSchema.safeParse([profile]).success, true);
  assert.equal(externalProfileTypesSchema.safeParse([profile, profile]).success, false);
  assert.equal(externalProfileTypesSchema.safeParse([{ ...profile, fields: [...profile.fields, profile.fields[0]] }]).success, false);
  assert.equal(externalProfileTypesSchema.safeParse([{ ...profile, fields: [{ ...profile.fields[0], type: 'file' }] }]).success, false);
  assert.deepEqual(service.validateValues(profile, { conselho: 'CREA', aceite: true }), { conselho: 'CREA', aceite: true });
  for (const value of [{ conselho: '', aceite: true }, { conselho: 'CREA', aceite: false }, { conselho: 'CREA', aceite: true, area: 'Outro' }, { conselho: 'CREA', aceite: true, estranho: 'x' }]) {
    assert.throws(() => service.validateValues(profile, value), /dados do perfil/);
  }
});

test('sessão de comunidade sem vínculo só acessa perfil e inscrições públicas', async (context) => {
  context.mock.method(AppDataBase.getRepository(Token), 'findOne', async () => new Token());
  const guard = new AuthorizationGuard(new Reflector());
  const user = { ...baseUser, community_only: true, roles: ['EXTERNO'] };
  assert.equal(await guard.canActivate(execution(user, '/external-profile/registrations')), true);
  await assert.rejects(guard.canActivate(execution(user, '/members')), /Conclua uma inscrição/);
  await assert.rejects(guard.canActivate(execution(user, '/miscellaneous')), /Conclua uma inscrição/);
});

test('slug público normaliza acentos, pontuação e separadores sem hífens repetidos', () => {
  assert.equal(
    generateMiscellaneousPublicSlug('Engravatados no Orla #1 - In Pato Branco / Paraná', '2p18s'),
    'engravatados-no-orla-1-in-pato-branco-parana-2p18s',
  );
  for (const title of [' --- Olá / Mundo --- ', 'a'.repeat(59) + ' - final', '🎉!!!', '  ']) {
    const slug = generateMiscellaneousPublicSlug(title, 'teste');
    assert.match(slug, /^[a-z0-9]+(?:-[a-z0-9]+)*$/);
    assert.ok(slug.length <= 66);
  }
});

function execution(user: JWTPayload, path = '/members', tenantId: string | null = organizationId) {
  const token = sign(user, authConfig.jwt.secret!, { expiresIn: '5m' });
  const request = {
    headers: { authorization: `Bearer ${token}` }, url: path, originalUrl: path,
    tenant: tenantId ? { organization_id: tenantId, status: 'ACTIVE' } : undefined,
  };
  return new ExecutionContextHost([request], class TestController {}, () => undefined);
}

test('guard permite admin da organização sem exigir sessão de suporte', async (context) => {
  context.mock.method(AppDataBase.getRepository(Token), 'findOne', async () => new Token());
  assert.equal(await new AuthorizationGuard(new Reflector()).canActivate(
    execution({ ...baseUser, access_context: 'organization', roles: ['organization.admin'] }),
  ), true);
});

test('guard permite trocar organização sem tenant na origem, mas exige tenant nas rotas internas', async (context) => {
  context.mock.method(AppDataBase.getRepository(Token), 'findOne', async () => new Token());
  const guard = new AuthorizationGuard(new Reflector());
  assert.equal(await guard.canActivate(execution(baseUser, '/auth/switch-organization', null)), true);
  await assert.rejects(guard.canActivate(execution(baseUser, '/members', null)), /não pertence/);
});

test('guard recusa sessão antiga, tenant diferente e SuperAdmin direto no tenant', async () => {
  const guard = new AuthorizationGuard(new Reflector());
  await assert.rejects(guard.canActivate(execution({ ...baseUser, access_context: undefined })), /login novamente/);
  await assert.rejects(guard.canActivate(execution(baseUser, '/members', 'organization-two')), /não pertence/);
  await assert.rejects(guard.canActivate(execution({ ...baseUser, access_context: 'platform', roles: ['EQUIPE_TECNICA'] })), /só pode ser usada na plataforma/);
});

test('guard não promove sessão pessoal a admin', async (context) => {
  context.mock.method(AppDataBase.getRepository(Token), 'findOne', async () => new Token());
  const http = execution(baseUser);
  Reflect.defineMetadata(ROLES_KEY, ['organization.admin'], http.getHandler());
  await assert.rejects(new AuthorizationGuard(new Reflector()).canActivate(http), /Acesso negado/);
});

test('guard público aceita visitante e conta pessoal válida, mas não suporte/plataforma', async (context) => {
  context.mock.method(AppDataBase.getRepository(Token), 'findOneBy', async () =>
    Object.assign(new Token(), { expiresAt: new Date(Date.now() + 60000) }),
  );
  const guard = new CommunitySessionGuard();
  const anonymous = new ExecutionContextHost([{ headers: {} }]);
  assert.equal(await guard.canActivate(anonymous), true);
  assert.equal(await guard.canActivate(execution(baseUser)), true);
  await assert.rejects(guard.canActivate(execution({ ...baseUser, access_context: 'platform' })), /acesso pessoal/);
  await assert.rejects(guard.canActivate(execution({ ...baseUser, access_context: 'support', support_session_id: 'support-one' })), /acesso pessoal/);
  await assert.rejects(guard.canActivate(execution({ ...baseUser, password_change_required: true })), /senha pessoal/);
});

test('guard público não ignora token inválido ou revogado', async (context) => {
  const guard = new CommunitySessionGuard();
  await assert.rejects(guard.canActivate(new ExecutionContextHost([{ headers: { authorization: 'Bearer invalid' } }])), /sessão expirou/);
  context.mock.method(AppDataBase.getRepository(Token), 'findOneBy', async () => null);
  await assert.rejects(guard.canActivate(execution(baseUser)), /Sessão encerrada/);
});
