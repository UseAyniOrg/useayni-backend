"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.EmailController = void 0;
const common_1 = require("@nestjs/common");
const crypto_1 = require("crypto");
const zod_1 = require("zod");
const db_1 = require("../db");
const email_1 = require("../config/email");
const authorization_guard_1 = require("../middlewares/authorization.guard");
const permissionMiddleware_1 = require("../middlewares/permissionMiddleware");
const webhookSchema = zod_1.z.object({
    event: zod_1.z.enum(['request', 'sent', 'delivered', 'deferred', 'soft_bounce', 'hard_bounce', 'spam', 'invalid_email', 'blocked', 'error']),
    'message-id': zod_1.z.string().min(1).max(512),
    ts_event: zod_1.z.number().int().positive(),
});
let EmailController = class EmailController {
    async webhook(provided, body) {
        const secret = (0, email_1.emailConfig)().webhookSecret;
        const digest = (value) => (0, crypto_1.createHash)('sha256').update(value).digest();
        if (secret.length < 32 || !provided || !(0, crypto_1.timingSafeEqual)(digest(secret), digest(provided))) {
            throw new common_1.UnauthorizedException();
        }
        const result = webhookSchema.safeParse(body);
        if (!result.success)
            return;
        const event = result.data;
        const occurredAt = new Date(event.ts_event * 1000);
        if (!Number.isFinite(occurredAt.getTime()))
            return;
        const fingerprint = (0, crypto_1.createHash)('sha256').update(JSON.stringify(event)).digest('hex');
        await db_1.AppDataBase.transaction(async (manager) => {
            const [message] = await manager.query(`SELECT id, recipient FROM email_messages WHERE provider='brevo' AND message_id=$1 FOR UPDATE`, [event['message-id']]);
            if (!message)
                return;
            const inserted = await manager.query(`INSERT INTO email_provider_events(fingerprint,provider,message_id,event,occurred_at)
        VALUES($1,'brevo',$2,$3,$4) ON CONFLICT DO NOTHING RETURNING fingerprint`, [fingerprint, event['message-id'], event.event, occurredAt]);
            if (!inserted.length)
                return;
            if (event.event === 'delivered') {
                await manager.query(`UPDATE email_messages SET delivered_at=COALESCE(delivered_at,$2),
          delivery_status=CASE WHEN delivery_status IN ('hard_bounce','spam','blocked','invalid_email') THEN delivery_status ELSE 'delivered' END,
          updated_at=now() WHERE id=$1`, [message.id, occurredAt]);
            }
            else if (['hard_bounce', 'spam', 'blocked', 'invalid_email'].includes(event.event)) {
                await manager.query(`UPDATE email_messages SET delivery_status=$2, updated_at=now() WHERE id=$1`, [message.id, event.event]);
                await manager.query(`INSERT INTO email_suppressions(recipient,reason) VALUES($1,$2) ON CONFLICT DO NOTHING`, [message.recipient, event.event]);
            }
        });
    }
    async usage(from, to) {
        const range = zod_1.z.object({ from: zod_1.z.iso.date(), to: zod_1.z.iso.date() }).parse({
            from: from ?? new Date(Date.now() - 30 * 86400000).toISOString().slice(0, 10),
            to: to ?? new Date().toISOString().slice(0, 10),
        });
        return db_1.AppDataBase.query(`SELECT message.organization_id, COALESCE(org.name,'Plataforma') AS organization_name,
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
};
exports.EmailController = EmailController;
__decorate([
    (0, common_1.Post)('webhooks/brevo'),
    (0, common_1.HttpCode)(204),
    __param(0, (0, common_1.Headers)('x-email-webhook-secret')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], EmailController.prototype, "webhook", null);
__decorate([
    (0, common_1.Get)('usage'),
    (0, common_1.UseGuards)(authorization_guard_1.AuthorizationGuard),
    (0, permissionMiddleware_1.Roles)('EQUIPE_TECNICA'),
    __param(0, (0, common_1.Query)('from')),
    __param(1, (0, common_1.Query)('to')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], EmailController.prototype, "usage", null);
exports.EmailController = EmailController = __decorate([
    (0, common_1.Controller)('email')
], EmailController);
