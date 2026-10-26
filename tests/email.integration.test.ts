import 'reflect-metadata';
import assert from 'node:assert/strict';
import { test } from 'node:test';
import { randomBytes, randomUUID } from 'crypto';
import { EntityManager } from 'typeorm';
import { AppDataBase } from '../src/db';
import { TransactionalEmail1793000000000 } from '../src/migrations/1793000000000-TransactionalEmail';
import { EmailService } from '../src/services/EmailService';
import { AccountEmailService } from '../src/services/AccountEmailService';
import { AccountProvisioningService } from '../src/services/AccountProvisioningService';
import { decryptEmailPayload } from '../src/lib/email/emailCrypto';
import { EmailEnvelope } from '../src/lib/email/emailProvider';
import bcrypt from 'bcryptjs';
import { OrganizationService } from '../src/services/OrganizationService';
import { OrganizationRepository } from '../src/repositories/OrganizationRepository';
import { OrgHomeService } from '../src/services/OrgHomeService';

test('PostgreSQL: convite em DRAFT, aceite, recuperação e outbox mock com rollback integral', async context => {
  const before = { key: process.env.EMAIL_TOKEN_ENCRYPTION_KEY, provider: process.env.EMAIL_PROVIDER,
    url: process.env.PUBLIC_APP_URL, nodeEnv: process.env.NODE_ENV };
  const key = randomBytes(32).toString('base64');
  process.env.EMAIL_TOKEN_ENCRYPTION_KEY = key;
  process.env.EMAIL_PROVIDER = 'mock';
  process.env.PUBLIC_APP_URL = 'http://localhost:5173';
  process.env.NODE_ENV = 'development';
  await AppDataBase.initialize();
  const runner = AppDataBase.createQueryRunner();
  await runner.connect();
  await runner.startTransaction();
  try {
    const [table] = await runner.query(`SELECT to_regclass('email_messages') AS name`);
    if (!table.name) await new TransactionalEmail1793000000000().up(runner);
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
    context.mock.method(AppDataBase.manager, 'query', (sql: string, parameters?: unknown[]) => runner.query(sql, parameters));
    context.mock.method(AppDataBase, 'getRepository', runner.manager.getRepository.bind(runner.manager));
    const organizationId = randomUUID();
    const suffix = randomBytes(8).toString('hex');
    const email = `owner-${suffix}@example.invalid`;
    await runner.query(`INSERT INTO organizations(id,name,slug,status) VALUES($1,'Organização de teste',$2,'DRAFT')`, [organizationId, `email-${suffix}`]);
    const emails = new EmailService();
    const service = new AccountEmailService(emails, new AccountProvisioningService());
    const invitation = await AppDataBase.transaction(manager => service.invite(organizationId, email, true, manager));
    assert.equal(invitation.delivery_status, 'queued');
    const [queued] = await runner.query(`SELECT * FROM email_messages WHERE organization_id=$1`, [organizationId]);
    const envelope = decryptEmailPayload<EmailEnvelope>(queued.payload, key);
    const link = envelope.text.match(/http[^\s]+#token=[^\s]+/)?.[0];
    assert.ok(link);
    const token = new URLSearchParams(new URL(link).hash.slice(1)).get('token')!;
    assert.equal(queued.payload.includes(token), false);
    assert.equal((await runner.query(`SELECT id FROM user_accounts WHERE email=$1`, [email])).length, 0);
    const inspected = await service.inspectInvitation(token);
    assert.equal(inspected.existing_account, false);
    assert.equal((await service.inspectInvitation(token)).id, inspected.id);
    const accepted = await service.acceptInvitation(token, 'senha-segura-para-teste', 'Owner de Teste');
    assert.equal(accepted.organization_ready, false);
    await assert.rejects(service.acceptInvitation(token, 'senha-segura-para-teste', 'Owner de Teste'), /Link inválido/);
    const [account] = await runner.query(`SELECT * FROM user_accounts WHERE email=$1`, [email]);
    assert.ok(account.email_verified_at);
    assert.equal(await bcrypt.compare('senha-segura-para-teste', account.password), true);
    const [role] = await runner.query(`SELECT role.name FROM member_roles mr JOIN roles role ON role.id=mr.role_id
      JOIN members member ON member.id=mr.member_id WHERE member.account_id=$1 AND role.name='organization.admin'`, [account.id]);
    assert.ok(role);
    await context.test('criar organização enfileira convite e mantém owner sem vínculo antes de aceitar', async () => {
      await runner.query(`INSERT INTO user_account_roles(account_id,role_name) VALUES($1,'EQUIPE_TECNICA') ON CONFLICT DO NOTHING`, [account.id]);
      const service = new OrganizationService(new OrganizationRepository(), new OrgHomeService(), new AccountProvisioningService(),
        new AccountEmailService(emails, new AccountProvisioningService()));
      const created = await service.create({ name: 'Tenant criado com convite', slug: `created-${suffix}`,
        settings: { provisioning: { admin_email: `new-owner-${suffix}@example.invalid` } } }, account.id, account.id);
      assert.equal(created.status, 'DRAFT');
      const [message] = await runner.query(`SELECT kind,status FROM email_messages WHERE organization_id=$1`, [created.id]);
      assert.equal(message.kind, 'organization.owner_invitation');
      assert.equal(message.status, 'queued');
      assert.equal((await runner.query(`SELECT id FROM members WHERE organization_id=$1`, [created.id])).length, 0);
    });
    await service.requestPasswordReset(email);
    const [resetMessage] = await runner.query(`SELECT * FROM email_messages WHERE recipient=$1 AND kind='account.password_reset'`, [email]);
    const resetEnvelope = decryptEmailPayload<EmailEnvelope>(resetMessage.payload, key);
    const resetLink = resetEnvelope.text.match(/http[^\s]+#token=[^\s]+/)?.[0];
    assert.ok(resetLink);
    const resetToken = new URLSearchParams(new URL(resetLink).hash.slice(1)).get('token')!;
    assert.deepEqual(await service.resetPassword(resetToken, 'outra-senha-segura-teste'), { changed: true });
    await assert.rejects(service.resetPassword(resetToken, 'outra-senha-segura-teste'), /Link inválido/);
    const [changed] = await runner.query(`SELECT password FROM user_accounts WHERE id=$1`, [account.id]);
    assert.equal(await bcrypt.compare('outra-senha-segura-teste', changed.password), true);
    await emails.processBatch();
    const [sent] = await runner.query(`SELECT status,payload,accepted_at FROM email_messages WHERE id=$1`, [queued.id]);
    assert.equal(sent.status, 'simulated');
    assert.equal(sent.payload, null);
    assert.equal(sent.accepted_at, null);
    await context.test('rollback da mutação elimina mensagem da outbox', async () => {
      const dedupeKey = `rollback:${suffix}`;
      await assert.rejects(AppDataBase.transaction(async manager => {
        await emails.enqueue({ to: email, kind: 'test', dedupeKey, content: { title: 'Teste', body: 'Não enviar', reason: 'Teste' } }, manager);
        throw new Error('rollback intentional');
      }), /rollback intentional/);
      assert.equal((await runner.query(`SELECT id FROM email_messages WHERE dedupe_key=$1`, [dedupeKey])).length, 0);
    });
  } finally {
    await runner.rollbackTransaction();
    await runner.release();
    await AppDataBase.destroy();
    for (const [name, value] of Object.entries({ EMAIL_TOKEN_ENCRYPTION_KEY: before.key,
      EMAIL_PROVIDER: before.provider, PUBLIC_APP_URL: before.url, NODE_ENV: before.nodeEnv })) {
      if (value === undefined) delete process.env[name];
      else process.env[name] = value;
    }
  }
});