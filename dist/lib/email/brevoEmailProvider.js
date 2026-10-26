"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BrevoEmailProvider = void 0;
const emailProvider_1 = require("./emailProvider");
class BrevoEmailProvider {
    constructor(apiKey, transport = fetch) {
        this.apiKey = apiKey;
        this.transport = transport;
        this.name = 'brevo';
    }
    async send(message) {
        if (!this.apiKey || this.apiKey.startsWith('xsmtpsib-')) {
            throw new emailProvider_1.EmailDeliveryError('configuration');
        }
        let response;
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
        }
        catch {
            throw new emailProvider_1.EmailDeliveryError('unknown');
        }
        const body = await response.json().catch(() => ({}));
        if (response.ok && typeof body.messageId === 'string')
            return { messageId: body.messageId };
        const retryAfter = Number(response.headers.get('retry-after'));
        if (response.status === 429)
            throw new emailProvider_1.EmailDeliveryError('retry', retryAfter > 0 ? retryAfter : 60);
        if (body.code === 'not_enough_credits')
            throw new emailProvider_1.EmailDeliveryError('quota', 3600);
        if ([401, 403].includes(response.status))
            throw new emailProvider_1.EmailDeliveryError('configuration', 3600);
        if (response.status >= 500 || response.ok)
            throw new emailProvider_1.EmailDeliveryError('unknown');
        throw new emailProvider_1.EmailDeliveryError('permanent');
    }
}
exports.BrevoEmailProvider = BrevoEmailProvider;
