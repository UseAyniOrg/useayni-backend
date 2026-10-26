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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AccountEmailService = void 0;
const common_1 = require("@nestjs/common");
const crypto_1 = require("crypto");
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const db_1 = require("../db");
const EmailService_1 = require("./EmailService");
const AccountProvisioningService_1 = require("./AccountProvisioningService");
const email_1 = require("../config/email");
const hash = (value) => (0, crypto_1.createHash)('sha256').update(value).digest('hex');
const invalid = () => new common_1.BadRequestException('Link inválido, expirado ou já utilizado. Solicite um novo envio.');
let AccountEmailService = class AccountEmailService {
    constructor(emails, provisioning) {
        this.emails = emails;
        this.provisioning = provisioning;
    }
    async invite(organizationId, inputEmail, asAdmin, manager = db_1.AppDataBase.manager) {
        const email = inputEmail.trim().toLowerCase();
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 255)
            throw new common_1.BadRequestException('Informe um email válido.');
        const [org] = await manager.query(`SELECT id, name, slug, status FROM organizations WHERE id=$1 AND deleted_at IS NULL`, [organizationId]);
        if (!org || ['CANCELLED', 'SUSPENDED'].includes(org.status))
            throw new common_1.BadRequestException('Organização indisponível.');
        const purpose = asAdmin ? 'owner_invitation' : 'member_invitation';
        await manager.query(`SELECT pg_advisory_xact_lock(hashtextextended($1,0))`, [`email:${email}:${purpose}:${organizationId}`]);
        const [recent] = await manager.query(`SELECT id FROM account_email_challenges WHERE email=$1 AND purpose=$2
      AND organization_id=$3 AND created_at > now()-interval '60 seconds' LIMIT 1`, [email, purpose, organizationId]);
        if (recent)
            return { invitation_id: recent.id, delivery_status: 'queued' };
        await manager.query(`UPDATE account_email_challenges SET consumed_at=now() WHERE email=$1 AND purpose=$2
      AND organization_id=$3 AND consumed_at IS NULL`, [email, purpose, organizationId]);
        const token = (0, crypto_1.randomBytes)(32).toString('base64url');
        const id = (0, crypto_1.randomUUID)();
        const expiresAt = new Date(Date.now() + 86400000);
        await manager.query(`INSERT INTO account_email_challenges(id,organization_id,email,purpose,token_hash,expires_at)
      VALUES($1,$2,$3,$4,$5,$6)`, [id, organizationId, email, purpose, hash(token), expiresAt]);
        await this.emails.enqueue({
            organizationId, kind: asAdmin ? 'organization.owner_invitation' : 'organization.member_invitation', to: email,
            dedupeKey: `invitation:${id}`, priority: 1, expiresAt,
            content: {
                title: asAdmin ? 'Conclua seu acesso de administrador' : 'Você recebeu um convite', organization: org.name,
                body: `Você recebeu um convite para ${asAdmin ? 'administrar' : 'participar de'} ${org.name}. Conclua seu acesso pelo link abaixo.`,
                details: 'O link é válido por 24 horas. Se você já possui uma conta UseAyni, sua senha atual será preservada.',
                reason: 'Você recebeu esta mensagem porque a organização convidou este endereço.',
                action: { label: 'Concluir meu acesso', url: (0, email_1.emailActionUrl)('/email/convite', token) },
            },
        }, manager);
        return { invitation_id: id, delivery_status: 'queued' };
    }
    async inspectInvitation(token) {
        const [row] = await db_1.AppDataBase.query(`SELECT challenge.id, organization.name AS organization_name,
      EXISTS(SELECT 1 FROM user_accounts account WHERE lower(account.email)=challenge.email AND NOT account.password_change_required) AS existing_account
      FROM account_email_challenges challenge JOIN organizations organization ON organization.id=challenge.organization_id
      WHERE token_hash=$1 AND purpose IN ('owner_invitation','member_invitation') AND consumed_at IS NULL
      AND expires_at>now() AND attempts<5 AND organization.deleted_at IS NULL`, [hash(token)]);
        if (!row)
            throw invalid();
        return row;
    }
    async acceptInvitation(token, password, fullName) {
        const result = await db_1.AppDataBase.transaction(async (manager) => {
            const [challenge] = await manager.query(`SELECT * FROM account_email_challenges WHERE token_hash=$1
        AND purpose IN ('owner_invitation','member_invitation') AND consumed_at IS NULL AND expires_at>now() AND attempts<5 FOR UPDATE`, [hash(token)]);
            if (!challenge)
                return null;
            const [organization] = await manager.query(`SELECT status FROM organizations WHERE id=$1 AND deleted_at IS NULL FOR SHARE`, [challenge.organization_id]);
            if (!organization || ['CANCELLED', 'SUSPENDED'].includes(organization.status))
                return null;
            await manager.query(`UPDATE account_email_challenges SET attempts=attempts+1 WHERE id=$1`, [challenge.id]);
            await manager.query(`SELECT pg_advisory_xact_lock(hashtextextended($1,0))`, [challenge.email]);
            const [account] = await manager.query(`SELECT id,password,password_change_required FROM user_accounts WHERE lower(email)=$1 FOR UPDATE`, [challenge.email]);
            const requiresPassword = !account || account.password_change_required;
            if (!requiresPassword && !await bcryptjs_1.default.compare(password, account.password))
                return null;
            if (requiresPassword && (password.length < 12 || password.length > 128 || fullName.trim().length < 2))
                return null;
            const access = await this.provisioning.provisionMember(challenge.organization_id, challenge.email, challenge.purpose === 'owner_invitation', false, manager);
            const [member] = await manager.query(`SELECT account_id FROM members WHERE id=$1`, [access.member_id]);
            if (requiresPassword) {
                const passwordHash = await bcryptjs_1.default.hash(password, 12);
                await manager.query(`UPDATE user_accounts SET password=$2,password_change_required=false,email_verified_at=now(),updated_at=now() WHERE id=$1`, [member.account_id, passwordHash]);
                await manager.query(`UPDATE members SET password=$2 WHERE account_id=$1`, [member.account_id, passwordHash]);
                await manager.query(`UPDATE members SET name=$2 WHERE id=$1`, [access.member_id, fullName.trim()]);
                await manager.query(`DELETE FROM token WHERE account_id=$1 OR "memberId" IN (SELECT id FROM members WHERE account_id=$1)`, [member.account_id]);
            }
            else {
                await manager.query(`UPDATE user_accounts SET email_verified_at=COALESCE(email_verified_at,now()) WHERE id=$1`, [member.account_id]);
            }
            await manager.query(`UPDATE account_email_challenges SET consumed_at=now() WHERE id=$1`, [challenge.id]);
            const [org] = await manager.query(`SELECT slug,status FROM organizations WHERE id=$1`, [challenge.organization_id]);
            return { completed: true, organization_ready: ['ACTIVE', 'TRIAL'].includes(org.status),
                login_url: (0, email_1.emailTenantUrl)(org.slug, challenge.purpose === 'owner_invitation' ? '/admin/login' : '/login') };
        });
        if (!result)
            throw invalid();
        return result;
    }
    async requestPasswordReset(inputEmail, organizationId) {
        const email = inputEmail.trim().toLowerCase();
        await db_1.AppDataBase.transaction(async (manager) => {
            await manager.query(`SELECT pg_advisory_xact_lock(hashtextextended($1,0))`, [`reset:${email}`]);
            const [recent] = await manager.query(`SELECT id FROM account_email_challenges WHERE email=$1 AND purpose='password_reset'
        AND created_at>now()-interval '60 seconds' LIMIT 1`, [email]);
            if (recent)
                return;
            const [hourly] = await manager.query(`SELECT count(*)::int AS total FROM account_email_challenges
        WHERE email=$1 AND purpose='password_reset' AND created_at>now()-interval '1 hour'`, [email]);
            if (hourly.total >= 5)
                return;
            const [account] = await manager.query(`SELECT id FROM user_accounts WHERE lower(email)=$1`, [email]);
            if (!account)
                return;
            await manager.query(`UPDATE account_email_challenges SET consumed_at=now() WHERE email=$1 AND purpose='password_reset' AND consumed_at IS NULL`, [email]);
            const token = (0, crypto_1.randomBytes)(32).toString('base64url');
            const id = (0, crypto_1.randomUUID)();
            const expiresAt = new Date(Date.now() + 1800000);
            await manager.query(`INSERT INTO account_email_challenges(id,email,purpose,token_hash,expires_at)
        VALUES($1,$2,'password_reset',$3,$4)`, [id, email, hash(token), expiresAt]);
            await this.emails.enqueue({ organizationId, to: email, kind: 'account.password_reset', dedupeKey: `reset:${id}`,
                priority: 0, expiresAt, content: {
                    title: 'Redefina sua senha UseAyni', body: 'Recebemos uma solicitação para redefinir a senha da sua conta.',
                    details: 'O link é válido por 30 minutos. Se não foi você, ignore esta mensagem. Sua senha não será alterada.',
                    reason: 'Você recebeu este email por uma solicitação de recuperação de conta.',
                    action: { label: 'Redefinir minha senha', url: (0, email_1.emailActionUrl)('/email/redefinir-senha', token) },
                } }, manager);
        });
        return { message: 'Se o endereço estiver cadastrado, você receberá as instruções por email.' };
    }
    async resetPassword(token, password) {
        if (password.length < 12 || password.length > 128)
            throw new common_1.BadRequestException('Use uma senha entre 12 e 128 caracteres.');
        const result = await db_1.AppDataBase.transaction(async (manager) => {
            const [challenge] = await manager.query(`SELECT * FROM account_email_challenges WHERE token_hash=$1
        AND purpose='password_reset' AND consumed_at IS NULL AND expires_at>now() FOR UPDATE`, [hash(token)]);
            if (!challenge)
                return false;
            const [account] = await manager.query(`SELECT id FROM user_accounts WHERE lower(email)=$1 FOR UPDATE`, [challenge.email]);
            if (!account)
                return false;
            const passwordHash = await bcryptjs_1.default.hash(password, 12);
            await manager.query(`UPDATE user_accounts SET password=$2,password_change_required=false,email_verified_at=COALESCE(email_verified_at,now()),updated_at=now() WHERE id=$1`, [account.id, passwordHash]);
            await manager.query(`UPDATE members SET password=$2 WHERE account_id=$1`, [account.id, passwordHash]);
            await manager.query(`DELETE FROM token WHERE account_id=$1 OR "memberId" IN (SELECT id FROM members WHERE account_id=$1)`, [account.id]);
            await manager.query(`UPDATE account_email_challenges SET consumed_at=now() WHERE email=$1 AND consumed_at IS NULL`, [challenge.email]);
            await this.emails.enqueue({ to: challenge.email, kind: 'account.password_changed', dedupeKey: `changed:${challenge.id}`,
                content: { title: 'Sua senha foi alterada', body: 'A senha da sua conta UseAyni foi redefinida. As sessões anteriores foram encerradas.',
                    reason: 'Aviso de segurança da sua conta UseAyni.' } }, manager);
            return true;
        });
        if (!result)
            throw invalid();
        return { changed: true };
    }
};
exports.AccountEmailService = AccountEmailService;
exports.AccountEmailService = AccountEmailService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [EmailService_1.EmailService, AccountProvisioningService_1.AccountProvisioningService])
], AccountEmailService);
