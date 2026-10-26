import { Body, Controller, Get, Headers, HttpCode, Post, Query, UnauthorizedException, UseGuards } from '@nestjs/common';
import { createHash, timingSafeEqual } from 'crypto';
import { z } from 'zod';
import { AppDataBase } from '../db';
import { emailConfig } from '../config/email';
import { AuthorizationGuard } from '../middlewares/authorization.guard';
import { Roles } from '../middlewares/permissionMiddleware';

const webhookSchema = z.object({
  event: z.enum(['request', 'sent', 'delivered', 'deferred', 'soft_bounce', 'hard_bounce', 'spam', 'invalid_email', 'blocked', 'error']),
  'message-id': z.string().min(1).max(512),
  ts_event: z.number().int().positive(),
});

@Controller('email')
export class EmailController {
  @Post('webhooks/brevo')
  @HttpCode(204)
  async webhook(@Headers('x-email-webhook-secret') provided: string | undefined, @Body() body: unknown) {
    const secret = emailConfig().webhookSecret;
    const digest = (value: string) => createHash('sha256').update(value).digest();
    if (secret.length < 32 || !provided || !timingSafeEqual(digest(secret), digest(provided))) {
      throw new UnauthorizedException();
    }
    const result = webhookSchema.safeParse(body);
    if (!result.success) return;
    const event = result.data;
    const occurredAt = new Date(event.ts_event * 1000);
    if (!Number.isFinite(occurredAt.getTime())) return;
    const fingerprint = createHash('sha256').update(JSON.stringify(event)).digest('hex');
    await AppDataBase.transaction(async manager => {
      const [message] = await manager.query(`SELECT id, recipient FROM email_messages WHERE provider='brevo' AND message_id=$1 FOR UPDATE`, [event['message-id']]);
      if (!message) return;
      const inserted = await manager.query(`INSERT INTO email_provider_events(fingerprint,provider,message_id,event,occurred_at)
        VALUES($1,'brevo',$2,$3,$4) ON CONFLICT DO NOTHING RETURNING fingerprint`,
      [fingerprint, event['message-id'], event.event, occurredAt]);
      if (!inserted.length) return;
      if (event.event === 'delivered') {
        await manager.query(`UPDATE email_messages SET delivered_at=COALESCE(delivered_at,$2),
          delivery_status=CASE WHEN delivery_status IN ('hard_bounce','spam','blocked','invalid_email') THEN delivery_status ELSE 'delivered' END,
          updated_at=now() WHERE id=$1`, [message.id, occurredAt]);
      } else if (['hard_bounce', 'spam', 'blocked', 'invalid_email'].includes(event.event)) {
        await manager.query(`UPDATE email_messages SET delivery_status=$2, updated_at=now() WHERE id=$1`, [message.id, event.event]);
        await manager.query(`INSERT INTO email_suppressions(recipient,reason) VALUES($1,$2) ON CONFLICT DO NOTHING`, [message.recipient, event.event]);
      }
    });
  }

  @Get('usage')
  @UseGuards(AuthorizationGuard)
  @Roles('EQUIPE_TECNICA')
  async usage(@Query('from') from?: string, @Query('to') to?: string) {
    const range = z.object({ from: z.iso.date(), to: z.iso.date() }).parse({
      from: from ?? new Date(Date.now() - 30 * 86400000).toISOString().slice(0, 10),
      to: to ?? new Date().toISOString().slice(0, 10),
    });
    return AppDataBase.query(`SELECT message.organization_id, COALESCE(org.name,'Plataforma') AS organization_name,
      message.provider, message.kind, count(*)::int AS total,
      count(*) FILTER (WHERE accepted_at IS NOT NULL)::int AS accepted,
      count(*) FILTER (WHERE delivered_at IS NOT NULL)::int AS delivered,
      count(*) FILTER (WHERE message.status='queued')::int AS queued,
      count(*) FILTER (WHERE message.status IN ('failed','blocked','unknown'))::int AS failed,
      count(*) FILTER (WHERE delivery_status IN ('hard_bounce','soft_bounce','spam','invalid_email','blocked'))::int AS bounced,
      count(*) FILTER (WHERE message.status='simulated')::int AS simulated
      FROM email_messages message LEFT JOIN organizations org ON org.id=message.organization_id
      WHERE message.created_at >= $1::date AND message.created_at < $2::date + interval '1 day'
      GROUP BY message.organization_id, org.name, message.provider, message.kind
      ORDER BY organization_name, message.kind`, [range.from, range.to]);
  }
}