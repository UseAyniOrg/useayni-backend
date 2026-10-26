import { EmailDeliveryError, EmailEnvelope, EmailProvider, EmailReceipt } from './emailProvider';

export class BrevoEmailProvider implements EmailProvider {
  readonly name = 'brevo';

  constructor(private readonly apiKey: string, private readonly transport: typeof fetch = fetch) {}

  async send(message: EmailEnvelope): Promise<EmailReceipt> {
    if (!this.apiKey || this.apiKey.startsWith('xsmtpsib-')) {
      throw new EmailDeliveryError('configuration');
    }
    let response: Response;
    try {
      response = await this.transport('https://api.brevo.com/v3/smtp/email', {
        method: 'POST',
        headers: { 'api-key': this.apiKey, 'content-type': 'application/json', accept: 'application/json' },
        body: JSON.stringify({
          sender: { name: 'UseAyni', email: 'no-reply@useayni.com' },
          to: [{ email: message.to }],
          subject: message.subject,
          htmlContent: message.html,
          textContent: message.text,
          tags: [message.kind],
          headers: { IdempotencyKey: message.id },
        }),
        signal: AbortSignal.timeout(15000),
      });
    } catch {
      throw new EmailDeliveryError('unknown');
    }
    const body = await response.json().catch(() => ({})) as { messageId?: string; code?: string };
    if (response.ok && typeof body.messageId === 'string') return { messageId: body.messageId };
    const retryAfter = Number(response.headers.get('retry-after'));
    if (response.status === 429) throw new EmailDeliveryError('retry', retryAfter > 0 ? retryAfter : 60);
    if (body.code === 'not_enough_credits') throw new EmailDeliveryError('quota', 3600);
    if ([401, 403].includes(response.status)) throw new EmailDeliveryError('configuration', 3600);
    if (response.status >= 500 || response.ok) throw new EmailDeliveryError('unknown');
    throw new EmailDeliveryError('permanent');
  }
}