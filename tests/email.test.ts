import 'reflect-metadata';
import assert from 'node:assert/strict';
import { test } from 'node:test';
import { BrevoEmailProvider } from '../src/lib/email/brevoEmailProvider';
import { EmailEnvelope, MockEmailProvider } from '../src/lib/email/emailProvider';
import { decryptEmailPayload, encryptEmailPayload } from '../src/lib/email/emailCrypto';
import { randomBytes } from 'crypto';
import { emailActionUrl, emailTenantUrl } from '../src/config/email';
import { renderEmail } from '../src/emails/renderEmail';
import { AppDataBase } from '../src/db';
import { EmailService, QueueEmail } from '../src/services/EmailService';
import { AccountEmailService } from '../src/services/AccountEmailService';
import { AccountProvisioningService } from '../src/services/AccountProvisioningService';
import { EntityManager } from 'typeorm';
import bcrypt from 'bcryptjs';
import { DomainEmailService } from '../src/services/DomainEmailService';

const envelope: EmailEnvelope = {
  id: 'dispatch-one', to: 'owner@example.invalid', subject: 'Seu acesso',
  html: '<p>Olá</p>', text: 'Olá', kind: 'organization.owner_invitation',
};

test('Brevo envia um destinatário, remetente fixo e chave idempotente sem acessar rede real', async () => {
  const transport = (async (url: string | URL | Request, options?: RequestInit) => {
    assert.equal(url, 'https://api.brevo.com/v3/smtp/email');
    const body = JSON.parse(String(options?.body));
    assert.deepEqual(body.sender, { name: 'UseAyni', email: 'no-reply@useayni.com' });
    assert.deepEqual(body.to, [{ email: envelope.to }]);
    assert.equal(body.headers.IdempotencyKey, envelope.id);
    assert.equal(body.htmlContent, envelope.html);
    assert.equal(body.textContent, envelope.text);
    return new Response(JSON.stringify({ messageId: 'provider-one' }), { status: 201 });
  }) as typeof fetch;
  assert.deepEqual(await new BrevoEmailProvider('test-key', transport).send(envelope), { messageId: 'provider-one' });
});

test('Brevo classifica falhas sem vazar chave, resposta ou destinatário', async () => {
  for (const [status, code] of [[429, 'retry'], [401, 'configuration'], [400, 'permanent'], [503, 'unknown']] as const) {
    const transport = (async () => new Response('{"message":"private provider response"}', { status })) as typeof fetch;
    await assert.rejects(new BrevoEmailProvider('private-key', transport).send(envelope),
      (error: Error) => error.message === `Email delivery: ${code}`);
  }
  const transport = (async () => { throw new Error('network details'); }) as typeof fetch;
  await assert.rejects(new BrevoEmailProvider('key', transport).send(envelope), /delivery: unknown/);
  await assert.rejects(new BrevoEmailProvider('xsmtpsib-not-an-api-key', transport).send(envelope), /configuration/);
});

test('provider mock retorna recibo estável e não dispara email', async () => {
  assert.deepEqual(await new MockEmailProvider().send(envelope), { messageId: 'mock:dispatch-one' });
});

test('reserva de cota desconhecida é limitada ao dia UTC da tentativa', async context => {
  const queries: string[] = [];
  const manager = {
    query: async (sql: string) => {
      queries.push(sql);
      if (sql.includes('SELECT count(*)::int AS total')) return [{ total: 0 }];
      return [];
    },
  } as unknown as EntityManager;
  context.mock.method(AppDataBase, 'transaction', async (callback: (manager: EntityManager) => Promise<unknown>) => callback(manager));
  await new EmailService().processBatch();
  const quotaQuery = queries.find(sql => sql.includes('SELECT count(*)::int AS total')) ?? '';
  assert.match(quotaQuery, /accepted_at >= utc_day\.starts_at/);
  assert.match(quotaQuery, /created_at >= utc_day\.starts_at AND message\.status IN \('sending','unknown'\)/);
});

test('payload é autenticado e criptografado, nunca guardando segredo em texto puro', () => {
  const key = randomBytes(32).toString('base64');
  const encrypted = encryptEmailPayload({ token: 'secret-link' }, key);
  assert.ok(!encrypted.includes('secret-link'));
  assert.deepEqual(decryptEmailPayload(encrypted, key), { token: 'secret-link' });
  assert.throws(() => decryptEmailPayload(encrypted, randomBytes(32).toString('base64')));
  assert.throws(() => encryptEmailPayload({}, 'invalid'), /32 base64/);
});

test('links de email usam origem confiável, fragmento para segredos e rota tenant local', () => {
  const before = process.env.PUBLIC_APP_URL;
  process.env.PUBLIC_APP_URL = 'http://localhost:5173';
  try {
    assert.equal(emailActionUrl('/email/convite', 'secret'), 'http://localhost:5173/email/convite#token=secret');
    assert.equal(emailTenantUrl('creajrpr', '/home'), 'http://localhost:5173/o/creajrpr/home');
    assert.throws(() => emailTenantUrl('invalid.example', '/home'), /slug/);
  } finally {
    if (before === undefined) delete process.env.PUBLIC_APP_URL;
    else process.env.PUBLIC_APP_URL = before;
  }
});

test('template escapa texto dinâmico, rejeita URLs perigosas e funciona sem imagem', () => {
  const content = { title: '<script>unsafe</script>', body: '<img src=x onerror=alert(1)>', reason: 'Solicitação da conta' };
  const rendered = renderEmail(content);
  assert.ok(rendered.html.includes('&lt;script&gt;'));
  assert.ok(!rendered.html.includes('<script>'));
  assert.ok(!rendered.html.includes('{{'));
  assert.ok(rendered.text.includes(content.body));
  assert.ok(Buffer.byteLength(rendered.html) < 90000);
  assert.throws(() => renderEmail({ ...content, action: { label: 'Acessar', url: 'javascript:alert(1)' } }), /Unsafe/);
  const illustrated = renderEmail({ ...content, image: { url: 'https://assets.example.invalid/banner.png', alt: 'Evento' } });
  assert.ok(illustrated.html.includes('alt="Evento"'));
});

test('enqueue grava payload criptografado no manager recebido e não envia pela rede', async (context) => {
  const before = process.env.EMAIL_TOKEN_ENCRYPTION_KEY;
  const key = randomBytes(32).toString('base64');
  process.env.EMAIL_TOKEN_ENCRYPTION_KEY = key;
  const manager = new EntityManager(AppDataBase);
  let recorded: unknown[] = [];
  context.mock.method(manager, 'query', async (_sql: string, parameters: unknown[]) => { recorded = parameters; return [{ id: 'queued' }]; });
  try {
    const result = await new EmailService().enqueue({ to: 'Owner@Example.invalid', kind: 'test', dedupeKey: 'unique-transition',
      content: { title: 'Teste', body: 'secret-value', reason: 'Teste' } }, manager);
    assert.equal(result, 'queued');
    assert.equal(recorded[3], 'owner@example.invalid');
    assert.ok(!String(recorded[5]).includes('secret-value'));
    assert.equal(decryptEmailPayload<EmailEnvelope>(String(recorded[5]), key).text.includes('secret-value'), true);
  } finally {
    if (before === undefined) delete process.env.EMAIL_TOKEN_ENCRYPTION_KEY;
    else process.env.EMAIL_TOKEN_ENCRYPTION_KEY = before;
  }
});

test('inspeção de convite não consome token nem revela email ou segredo', async (context) => {
  const calls: string[] = [];
  context.mock.method(AppDataBase, 'query', async (sql: string) => {
    calls.push(sql);
    return [{ id: 'invitation', organization_name: 'Organização', existing_account: true }];
  });
  const result = await new AccountEmailService(new EmailService(), new AccountProvisioningService()).inspectInvitation('token');
  assert.deepEqual(result, { id: 'invitation', organization_name: 'Organização', existing_account: true });
  assert.equal(calls.some(sql => /^\s*(UPDATE|INSERT)\b/.test(sql)), false);
});

test('convite de conta existente com senha errada registra tentativa sem conceder papel', async (context) => {
  const calls: string[] = [];
  const password = await bcrypt.hash('senha-correta', 4);
  context.mock.method(AppDataBase, 'transaction', async (callback: (manager: EntityManager) => Promise<unknown>) => callback(AppDataBase.manager));
  context.mock.method(AppDataBase.manager, 'query', async (sql: string) => {
    calls.push(sql);
    if (sql.includes('SELECT * FROM account_email_challenges')) return [{ id: 'invite', email: 'owner@example.invalid', purpose: 'owner_invitation' }];
    if (sql.includes('SELECT status FROM organizations')) return [{ status: 'ACTIVE' }];
    if (sql.includes('SELECT id,password')) return [{ id: 'account', password, password_change_required: false }];
    return [];
  });
  const provisioning = new AccountProvisioningService();
  context.mock.method(provisioning, 'provisionMember', async () => { throw new Error('must not provision'); });
  const service = new AccountEmailService(new EmailService(), provisioning);
  await assert.rejects(service.acceptInvitation('token', 'senha-errada', ''), /Link inválido/);
  assert.ok(calls.some(sql => sql.includes('attempts=attempts+1')));
  assert.equal(calls.some(sql => sql.includes('consumed_at=now()')), false);
});

test('reset inválido não altera senha e não enfileira email', async (context) => {
  context.mock.method(AppDataBase, 'transaction', async (callback: (manager: EntityManager) => Promise<unknown>) => callback(AppDataBase.manager));
  const calls: string[] = [];
  context.mock.method(AppDataBase.manager, 'query', async (sql: string) => { calls.push(sql); return []; });
  const service = new AccountEmailService(new EmailService(), new AccountProvisioningService());
  await assert.rejects(service.resetPassword('invalid-token', 'nova-senha-segura'), /Link inválido/);
  assert.equal(calls.some(sql => /^\s*(UPDATE|INSERT)\b/.test(sql)), false);
});

test('confirmação usa mídia pública estável e dedupe da participação sem URL assinada', async (context) => {
  const manager = new EntityManager(AppDataBase);
  context.mock.method(manager, 'query', async (sql: string) => {
    if (sql.startsWith('SAVEPOINT') || sql.startsWith('RELEASE SAVEPOINT')) return [];
    assert.ok(sql.includes("banner.visibility='PUBLIC'"));
    assert.ok(sql.includes('member.organization_id=organization.id'));
    return [{ title: 'Evento', organization_id: 'org', organization_name: 'Org', slug: 'teste', email: 'member@example.invalid',
      email_banner_id: 'public-asset', banner_asset_id: 'public-asset', start_date: new Date('2026-10-26T18:00:00Z') }];
  });
  const emails = new EmailService();
  context.mock.method(emails, 'enqueue', async (input: QueueEmail, receivedManager?: EntityManager) => {
    assert.equal(receivedManager, manager);
    assert.equal(input.dedupeKey, 'participation:event:member:confirmed');
    assert.ok(input.content.image?.url.endsWith('/m/public-asset'));
    assert.ok(!input.content.image?.url.includes('?'));
    assert.ok(input.content.details?.includes('America/Sao_Paulo'));
    return 'queued';
  });
  await new DomainEmailService(emails).participationConfirmed('event', 'member', manager);
});

test('falha ao enfileirar confirmação reverte apenas savepoint, não a inscrição', async context => {
  const manager = new EntityManager(AppDataBase);
  const transactionCalls: string[] = [];
  context.mock.method(manager, 'query', async (sql: string) => {
    if (sql.startsWith('SAVEPOINT') || sql.startsWith('ROLLBACK TO') || sql.startsWith('RELEASE SAVEPOINT')) transactionCalls.push(sql);
    if (sql.includes('FROM miscellaneous event')) return [{ title: 'Evento', organization_id: 'org', organization_name: 'Org',
      slug: 'teste', email: 'member@example.invalid', start_date: new Date() }];
    return [];
  });
  const emails = new EmailService();
  context.mock.method(emails, 'enqueue', async () => { throw new Error('email crypto not configured'); });
  await new DomainEmailService(emails).participationConfirmed('event', 'member', manager);
  assert.deepEqual(transactionCalls, [
    'SAVEPOINT optional_participation_email',
    'ROLLBACK TO SAVEPOINT optional_participation_email',
    'RELEASE SAVEPOINT optional_participation_email',
  ]);
});