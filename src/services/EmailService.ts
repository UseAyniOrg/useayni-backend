import { Injectable, Logger, OnModuleDestroy, OnModuleInit, ServiceUnavailableException } from '@nestjs/common';
import { EntityManager } from 'typeorm';
import { randomUUID } from 'crypto';
import { AppDataBase } from '../db';
import { emailConfig } from '../config/email';
import { EmailContent, renderEmail } from '../emails/renderEmail';
import { decryptEmailPayload, encryptEmailPayload } from '../lib/email/emailCrypto';
import { BrevoEmailProvider } from '../lib/email/brevoEmailProvider';
import { EmailDeliveryError, EmailEnvelope, MockEmailProvider } from '../lib/email/emailProvider';

export interface QueueEmail {
  organizationId?: string;
  kind: string;
  to: string;
  dedupeKey: string;
  content: EmailContent;
  expiresAt?: Date;
  priority?: number;
}

interface DispatchRow {
  id: string;
  recipient: string;
  kind: string;
  payload: string;
  attempts: number;
  provider: string;
}

@Injectable()
export class EmailService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(EmailService.name);
  private timer?: ReturnType<typeof setInterval>;
  private running = false;

  onModuleInit() {
    if (!emailConfig().enabled) return;
    this.timer = setInterval(() => {
      void this.processBatch().catch(() => this.logger.error('Email worker failed; inspect queue metadata.'));
    }, 10000);
    this.timer.unref();
  }

  onModuleDestroy() {
    if (this.timer) clearInterval(this.timer);
  }

  async enqueue(input: QueueEmail, manager: EntityManager = AppDataBase.manager): Promise<string | undefined> {
    const recipient = input.to.trim().toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(recipient) || recipient.length > 255) throw new Error('Invalid email recipient');
    const config = emailConfig();
    if (Buffer.from(config.encryptionKey, 'base64').length !== 32) {
      throw new ServiceUnavailableException('Configure a chave de criptografia do serviço de email antes de emitir convites.');
    }
    const id = randomUUID();
    const rendered = renderEmail(input.content);
    const envelope: EmailEnvelope = { id, to: recipient, kind: input.kind, ...rendered };
    const payload = encryptEmailPayload(envelope, config.encryptionKey);
    const rows = await manager.query(
      `INSERT INTO email_messages (id, organization_id, kind, recipient, dedupe_key, payload, priority, provider, expires_at)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9) ON CONFLICT (dedupe_key) DO NOTHING RETURNING id`,
      [id, input.organizationId ?? null, input.kind, recipient, input.dedupeKey, payload,
        input.priority ?? 10, config.provider, input.expiresAt ?? null],
    );
    return rows[0]?.id;
  }

  async processBatch(): Promise<void> {
    if (this.running) return;
    this.running = true;
    try {
      for (let count = 0; count < 10; count++) {
        const row = await this.claim();
        if (!row) break;
        await this.deliver(row);
      }
    } finally {
      this.running = false;
    }
  }

  private async claim(): Promise<DispatchRow | undefined> {
    const config = emailConfig();
    return AppDataBase.transaction(async manager => {
      await manager.query(`SELECT pg_advisory_xact_lock(hashtextextended('email-global-budget', 0))`);
      await manager.query(`UPDATE email_messages SET status='unknown', payload=NULL, error_code='lease_expired', updated_at=now()
        WHERE status='sending' AND lease_until < now()`);
      await manager.query(`UPDATE email_messages SET status='expired', payload=NULL, updated_at=now()
        WHERE status='queued' AND expires_at <= now()`);
      await manager.query(`UPDATE email_messages SET status='suppressed', payload=NULL, updated_at=now()
        WHERE status='queued' AND recipient IN (SELECT recipient FROM email_suppressions)`);
      const [usage] = await manager.query(`WITH utc_day AS (
          SELECT date_trunc('day', now() AT TIME ZONE 'UTC') AT TIME ZONE 'UTC' AS starts_at
        )
        SELECT count(*)::int AS total FROM email_messages message CROSS JOIN utc_day
        WHERE message.provider=$1 AND (
          message.accepted_at >= utc_day.starts_at OR
          (message.created_at >= utc_day.starts_at AND message.status IN ('sending','unknown'))
        )`, [config.provider]);
      if (usage.total >= config.budget) return undefined;
      const [row] = await manager.query(`SELECT id, recipient, kind, payload, attempts, provider FROM email_messages
        WHERE status='queued' AND next_attempt_at <= now() AND provider=$1
        ORDER BY priority, created_at FOR UPDATE SKIP LOCKED LIMIT 1`, [config.provider]);
      if (!row) return undefined;
      if (config.provider === 'brevo' && process.env.NODE_ENV !== 'production' && !config.allowlist.includes(row.recipient)) {
        await manager.query(`UPDATE email_messages SET status='blocked', payload=NULL, error_code='test_allowlist', updated_at=now() WHERE id=$1`, [row.id]);
        return undefined;
      }
      await manager.query(`UPDATE email_messages SET status='sending', attempts=attempts+1,
        lease_until=now()+interval '2 minutes', updated_at=now() WHERE id=$1`, [row.id]);
      return { ...row, attempts: row.attempts + 1 };
    });
  }

  private async deliver(row: DispatchRow): Promise<void> {
    const config = emailConfig();
    const provider = row.provider === 'brevo' ? new BrevoEmailProvider(config.apiKey) : new MockEmailProvider();
    let receipt;
    try {
      const envelope = decryptEmailPayload<EmailEnvelope>(row.payload, config.encryptionKey);
      receipt = await provider.send(envelope);
    } catch (error) {
      const failure = error instanceof EmailDeliveryError ? error : new EmailDeliveryError('configuration', 3600);
      const retry = ['retry', 'quota', 'configuration'].includes(failure.code) && row.attempts < 6;
      const delay = Math.max(failure.retryAfterSeconds, Math.min(3600, 30 * 2 ** row.attempts));
      await AppDataBase.transaction(async manager => {
        await manager.query(`UPDATE email_messages SET status=$2::varchar, error_code=$3,
          payload=CASE WHEN $2::varchar='queued' THEN payload ELSE NULL END,
          next_attempt_at=now()+($4 * interval '1 second'), lease_until=NULL, updated_at=now() WHERE id=$1`,
        [row.id, retry ? 'queued' : failure.code === 'unknown' ? 'unknown' : 'failed', failure.code, delay]);
        await manager.query(`INSERT INTO email_attempts(message_id,outcome) VALUES($1,$2)`, [row.id, failure.code]);
      });
      return;
    }
    await AppDataBase.transaction(async manager => {
      await manager.query(`UPDATE email_messages SET status=$2::varchar, message_id=$3,
        accepted_at=CASE WHEN $2::varchar='accepted' THEN now() ELSE NULL END,
        payload=NULL, lease_until=NULL, updated_at=now() WHERE id=$1`,
      [row.id, provider.name === 'mock' ? 'simulated' : 'accepted', receipt.messageId]);
      await manager.query(`INSERT INTO email_attempts(message_id,outcome) VALUES($1,$2)`,
        [row.id, provider.name === 'mock' ? 'simulated' : 'accepted']);
    });
  }
}