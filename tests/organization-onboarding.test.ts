import 'reflect-metadata';
import assert from 'node:assert/strict';
import { test } from 'node:test';
import bcrypt from 'bcryptjs';
import { EntityManager } from 'typeorm';
import { AppDataBase } from '../src/db';
import { AccountProvisioningService } from '../src/services/AccountProvisioningService';
import { hierarchyTemplateSchema } from '../src/services/HierarchyTemplateService';
import { HIERARCHY_TEMPLATES } from '../src/config/hierarchyTemplates';
import { AuthService } from '../src/services/authService';
import { MemberRepository } from '../src/repositories/MemberRepository';
import { TokenRepository } from '../src/repositories/TokenRepository';

for (const template of HIERARCHY_TEMPLATES) {
  test(`biblioteca: ${template.slug} tem referências e regras válidas`, () => {
    assert.equal(hierarchyTemplateSchema.safeParse(template).success, true);
  });
}

test('importação recusa tipos duplicados, referências ausentes, ciclos e campos desconhecidos', () => {
  const template = HIERARCHY_TEMPLATES[0];
  const invalidTemplates = [
    { ...template, types: [...template.types, template.types[0]] },
    { ...template, units: [...template.units, template.units[0]] },
    { ...template, positions: [...template.positions, template.positions[0]] },
    { ...template, units: [{ ...template.units[0], type_slug: 'inexistente' }] },
    { ...template, units: [{ ...template.units[0], parent_slug: 'inexistente' }] },
    { ...template, units: [{ ...template.units[0], parent_slug: template.units[0].slug }] },
    { ...template, units: [
      { ...template.units[0], parent_slug: template.units[1].slug },
      { ...template.units[1], parent_slug: template.units[0].slug },
    ] },
    { ...template, positions: [{ ...template.positions[0], mandate_duration_days: -1 }] },
    { ...template, positions: [{ ...template.positions[0], investiture_type: 'INVALID' }] },
    { ...template, organization_id: 'nao-pode-escolher-outro-tenant' },
    { ...template, types: [{ slug: 'a'.repeat(51), name: 'Tipo' }] },
    { ...template, units: [] },
    { ...template, units: Array.from({ length: 501 }, (_, index) => ({ ...template.units[0], slug: `unidade-${index}` })) },
  ];
  for (const invalid of invalidTemplates) assert.equal(hierarchyTemplateSchema.safeParse(invalid).success, false);
});

test('importação aceita unidades fora de ordem no arquivo', () => {
  const template = HIERARCHY_TEMPLATES[0];
  assert.equal(hierarchyTemplateSchema.safeParse({ ...template, units: [...template.units].reverse() }).success, true);
});

test('email inválido é recusado antes de acessar o banco', async () => {
  await assert.rejects(new AccountProvisioningService().provisionMember('org', 'invalido'), /email válido/);
});

test('nova conta administrativa recebe hash, papel de admin e senha temporária', async (context) => {
  const calls: Array<{ sql: string; params?: unknown[] }> = [];
  context.mock.method(AppDataBase, 'transaction', async (callback: (manager: EntityManager) => Promise<unknown>) => callback(AppDataBase.manager));
  context.mock.method(AppDataBase.manager, 'query', async (sql: string, params?: unknown[]) => {
    calls.push({ sql, params });
    if (sql.includes('SELECT id FROM organizations')) return [{ id: 'org' }];
    if (sql.includes('INSERT INTO user_accounts')) return [{ id: 'account' }];
    if (sql.includes('INSERT INTO members')) return [{ id: 'member' }];
    if (sql.includes('RETURNING member_id')) return [{ member_id: 'member' }];
    return [];
  });
  const result = await new AccountProvisioningService().provisionMember('org', ' Admin@Exemplo.com ', true);
  assert.equal(result.email, 'admin@exemplo.com');
  assert.equal(result.role, 'organization.admin');
  assert.equal(result.password_change_required, true);
  assert.equal(result.existing_account, false);
  assert.ok(result.temporary_password && result.temporary_password.length >= 24);
  const accountInsert = calls.find((call) => call.sql.includes('INSERT INTO user_accounts'))!;
  assert.notEqual(accountInsert.params?.[1], result.temporary_password);
  assert.equal(await bcrypt.compare(result.temporary_password, String(accountInsert.params?.[1])), true);
  assert.ok(calls.some((call) => call.sql.includes("role.name = 'organization.admin'")));
});

test('promover conta existente não redefine sua senha pessoal', async (context) => {
  const calls: string[] = [];
  context.mock.method(AppDataBase, 'transaction', async (callback: (manager: EntityManager) => Promise<unknown>) => callback(AppDataBase.manager));
  context.mock.method(AppDataBase.manager, 'query', async (sql: string) => {
    calls.push(sql);
    if (sql.includes('SELECT id FROM organizations')) return [{ id: 'org' }];
    if (sql.includes('SELECT member.id')) return [{ id: 'member', password_change_required: false }];
    if (sql.includes('RETURNING member_id')) return [{ member_id: 'member' }];
    return [];
  });
  const result = await new AccountProvisioningService().provisionMember('org', 'admin@exemplo.com', true);
  assert.equal(result.temporary_password, undefined);
  assert.equal(result.existing_account, true);
  assert.equal(calls.some((sql) => sql.includes('UPDATE user_accounts')), false);
});

test('reemitir acesso pendente invalida tokens sem promover o membro', async (context) => {
  const calls: string[] = [];
  context.mock.method(AppDataBase, 'transaction', async (callback: (manager: EntityManager) => Promise<unknown>) => callback(AppDataBase.manager));
  context.mock.method(AppDataBase.manager, 'query', async (sql: string) => {
    calls.push(sql);
    if (sql.includes('SELECT id FROM organizations')) return [{ id: 'org' }];
    if (sql.includes('SELECT member.id')) return [{ id: 'member', password_change_required: true }];
    if (sql.includes('UPDATE user_accounts')) return [{ id: 'account' }];
    return [];
  });
  const result = await new AccountProvisioningService().provisionMember('org', 'membro@exemplo.com', false, true);
  assert.ok(result.temporary_password);
  assert.equal(result.role, 'MEMBRO');
  assert.ok(calls.some((sql) => sql.includes('DELETE FROM token') && sql.includes('"memberId"')));
  assert.equal(calls.some((sql) => sql.includes("'organization.admin'")), false);
});

test('reimportar vínculo existente não troca senha nem aprova cadastro pendente', async (context) => {
  const calls: string[] = [];
  context.mock.method(AppDataBase, 'transaction', async (callback: (manager: EntityManager) => Promise<unknown>) => callback(AppDataBase.manager));
  context.mock.method(AppDataBase.manager, 'query', async (sql: string) => {
    calls.push(sql);
    if (sql.includes('SELECT id FROM organizations')) return [{ id: 'org' }];
    if (sql.includes('SELECT member.id')) return [{ id: 'member', password_change_required: true }];
    return [];
  });
  const result = await new AccountProvisioningService().provisionMember('org', 'membro@exemplo.com');
  assert.equal(result.temporary_password, undefined);
  assert.equal(calls.some((sql) => /^\s*UPDATE/.test(sql)), false);
});

test('troca de senha exige nome e recusa a própria senha temporária', async (context) => {
  const temporaryPassword = 'senha-temporaria-de-teste';
  const hash = await bcrypt.hash(temporaryPassword, 4);
  const service = new AuthService(new MemberRepository(), new TokenRepository());
  context.mock.method(AppDataBase, 'transaction', async (callback: (manager: EntityManager) => Promise<unknown>) => callback(AppDataBase.manager));
  const calls: string[] = [];
  context.mock.method(AppDataBase.manager, 'query', async (sql: string) => {
    calls.push(sql);
    return [{ password: hash }];
  });
  await assert.rejects(service.changeTemporaryPassword('account', 'nova-senha-de-teste', 'member', ''), /nome completo/);
  await assert.rejects(service.changeTemporaryPassword('account', temporaryPassword, 'member', 'Membro Teste'), /diferente da temporária/);
  assert.equal(calls.some((sql) => /^\s*UPDATE/.test(sql)), false);
});

test('troca da senha inicial atualiza conta, perfil e encerra todas as sessões', async (context) => {
  const service = new AuthService(new MemberRepository(), new TokenRepository());
  const calls: string[] = [];
  context.mock.method(AppDataBase, 'transaction', async (callback: (manager: EntityManager) => Promise<unknown>) => callback(AppDataBase.manager));
  context.mock.method(AppDataBase.manager, 'query', async (sql: string) => {
    calls.push(sql);
    if (sql.includes('SELECT password')) return [{ password: await bcrypt.hash('senha-inicial', 4) }];
    return [];
  });
  assert.deepEqual(await service.changeTemporaryPassword('account', 'nova-senha-de-teste', 'member', 'Membro Teste'), { changed: true });
  assert.ok(calls.some((sql) => sql.includes('password_change_required = false')));
  assert.ok(calls.some((sql) => sql.includes('UPDATE members SET name')));
  assert.ok(calls.some((sql) => sql.includes('DELETE FROM token') && sql.includes('"memberId"')));
});
