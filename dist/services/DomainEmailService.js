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
var DomainEmailService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.DomainEmailService = void 0;
const common_1 = require("@nestjs/common");
const common_2 = require("@nestjs/common");
const EmailService_1 = require("./EmailService");
const email_1 = require("../config/email");
let DomainEmailService = DomainEmailService_1 = class DomainEmailService {
    constructor(emails) {
        this.emails = emails;
        this.logger = new common_2.Logger(DomainEmailService_1.name);
    }
    async participationConfirmed(eventId, memberId, manager) {
        const [event] = await manager.query(`SELECT event.title,event.organization_id,event.public_slug,event.start_date,
      event.location_city,event.location_state,event.cover_url,event.banner_url,event.cover_asset_id,event.banner_asset_id,
      organization.name AS organization_name,organization.slug,account.email,
      banner.id AS email_banner_id,cover.id AS email_cover_id
      FROM miscellaneous event JOIN organizations organization ON organization.id=event.organization_id
      LEFT JOIN media_assets banner ON banner.id=event.banner_asset_id AND banner.organization_id=organization.id
        AND banner.visibility='PUBLIC' AND banner.status='ACTIVE' AND banner.mime_type IN ('image/png','image/jpeg','image/webp')
      LEFT JOIN media_assets cover ON cover.id=event.cover_asset_id AND cover.organization_id=organization.id
        AND cover.visibility='PUBLIC' AND cover.status='ACTIVE' AND cover.mime_type IN ('image/png','image/jpeg','image/webp')
      JOIN organization_features feature ON feature.organization_id=organization.id
        AND feature.feature_slug='communication_email' AND feature.enabled=true
      JOIN members member ON member.id=$2 AND member.organization_id=organization.id
      JOIN user_accounts account ON account.id=member.account_id
      WHERE event.id=$1 AND event.public_access_enabled=true AND event.deleted_at IS NULL`, [eventId, memberId]);
        if (!event)
            return;
        const candidates = [!event.banner_asset_id && event.banner_url, !event.cover_asset_id && event.cover_url];
        const legacyImage = candidates.find(value => {
            if (typeof value !== 'string')
                return false;
            try {
                const url = new URL(value);
                return url.protocol === 'https:' && !url.username && !url.password && !url.search && /\.(png|jpe?g)$/i.test(url.pathname);
            }
            catch {
                return false;
            }
        });
        const publicAssetId = event.email_banner_id ?? event.email_cover_id;
        const image = publicAssetId ? new URL(`/m/${publicAssetId}`, (0, email_1.emailConfig)().publicApiUrl).toString() : legacyImage;
        const when = event.start_date ? new Intl.DateTimeFormat('pt-BR', {
            dateStyle: 'long', timeStyle: 'short', timeZone: 'America/Sao_Paulo',
        }).format(new Date(event.start_date)) + ' (America/Sao_Paulo)' : 'Consulte a programação';
        await manager.query('SAVEPOINT optional_participation_email');
        try {
            await this.emails.enqueue({ organizationId: event.organization_id, to: event.email,
                kind: 'participation.confirmed', dedupeKey: `participation:${eventId}:${memberId}:confirmed`,
                content: { title: 'Sua inscrição está confirmada', organization: event.organization_name,
                    body: `Sua participação em ${event.title} foi registrada.`,
                    details: [event.title, when, [event.location_city, event.location_state].filter(Boolean).join(' / ')].filter(Boolean).join('\n'),
                    reason: 'Você recebeu este email porque realizou uma inscrição nesta organização.',
                    image: image ? { url: image, alt: event.title } : undefined,
                    action: { label: 'Consultar minha inscrição', url: (0, email_1.emailTenantUrl)(event.slug, '/minhas-inscricoes') },
                } }, manager);
            await manager.query('RELEASE SAVEPOINT optional_participation_email');
        }
        catch {
            await manager.query('ROLLBACK TO SAVEPOINT optional_participation_email');
            await manager.query('RELEASE SAVEPOINT optional_participation_email');
            this.logger.warn('Inscrição registrada sem email de confirmação; verificar a fila e a configuração do provedor.');
        }
    }
};
exports.DomainEmailService = DomainEmailService;
exports.DomainEmailService = DomainEmailService = DomainEmailService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [EmailService_1.EmailService])
], DomainEmailService);
