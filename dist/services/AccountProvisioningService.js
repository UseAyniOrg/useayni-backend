"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AccountProvisioningService = void 0;
const common_1 = require("@nestjs/common");
const crypto_1 = require("crypto");
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const db_1 = require("../db");
let AccountProvisioningService = class AccountProvisioningService {
    async provisionMember(organizationId, inputEmail, asAdmin = false, reissuePending = false, transactionManager) {
        if (typeof inputEmail !== 'string')
            throw new common_1.BadRequestException('Informe um email válido.');
        const email = inputEmail.trim().toLowerCase();
        if (email.length > 255 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
            throw new common_1.BadRequestException('Informe um email válido.');
        }
        const provision = async (manager) => {
            await manager.query(`SELECT pg_advisory_xact_lock(hashtextextended($1, 0))`, [email]);
            const [organization] = await manager.query(`SELECT id FROM organizations WHERE id = $1 AND deleted_at IS NULL`, [organizationId]);
            if (!organization)
                throw new common_1.NotFoundException('Organização não encontrada.');
            const [existingMember] = await manager.query(`SELECT member.id, account.password_change_required
         FROM members AS member
         JOIN user_accounts AS account ON account.id = member.account_id
         WHERE member.organization_id = $1 AND lower(account.email) = $2
         LIMIT 1
         FOR UPDATE OF member, account`, [organizationId, email]);
            if (existingMember) {
                if (asAdmin) {
                    await manager.query(`UPDATE members SET registration_status = 'approved', status = 'ACTIVE' WHERE id = $1`, [existingMember.id]);
                    await this.grantOrganizationAdmin(manager, existingMember.id);
                }
                const temporaryPassword = (asAdmin || reissuePending) && existingMember.password_change_required
                    ? await this.rotatePendingPassword(manager, email)
                    : undefined;
                return {
                    member_id: existingMember.id,
                    email,
                    ...(temporaryPassword ? { temporary_password: temporaryPassword } : {}),
                    password_change_required: existingMember.password_change_required,
                    existing_account: true,
                    role: asAdmin ? 'organization.admin' : 'MEMBRO',
                };
            }
            const [existingAccount] = await manager.query(`SELECT id, password, password_change_required
         FROM user_accounts
         WHERE lower(email) = $1
         FOR UPDATE`, [email]);
            let accountId = existingAccount?.id;
            let passwordHash = existingAccount?.password;
            let temporaryPassword;
            if (!existingAccount) {
                temporaryPassword = (0, crypto_1.randomBytes)(18).toString('base64url');
                passwordHash = await bcryptjs_1.default.hash(temporaryPassword, 12);
                const [createdAccount] = await manager.query(`INSERT INTO user_accounts (email, password, password_change_required)
           VALUES ($1, $2, true)
           RETURNING id`, [email, passwordHash]);
                accountId = createdAccount.id;
            }
            else if ((asAdmin || reissuePending) && existingAccount.password_change_required) {
                temporaryPassword = await this.rotatePendingPassword(manager, email);
                passwordHash = (await manager.query(`SELECT password FROM user_accounts WHERE id = $1`, [accountId]))[0].password;
            }
            const [member] = await manager.query(`INSERT INTO members
           (name, email_personal, password, account_id, organization_id, slug,
            registration_status, status, profile_visibility)
         VALUES ($1, $2, $3, $4, $5, $6, 'approved', 'ACTIVE', 'PRIVATE')
         RETURNING id`, [email.split('@')[0], email, passwordHash, accountId, organizationId,
                `membro-${(0, crypto_1.randomBytes)(12).toString('hex')}`]);
            if (asAdmin)
                await this.grantOrganizationAdmin(manager, member.id);
            return {
                member_id: member.id,
                email,
                ...(temporaryPassword ? { temporary_password: temporaryPassword } : {}),
                password_change_required: Boolean(existingAccount?.password_change_required ?? temporaryPassword),
                existing_account: Boolean(existingAccount),
                role: asAdmin ? 'organization.admin' : 'MEMBRO',
            };
        };
        return transactionManager ? provision(transactionManager) : db_1.AppDataBase.transaction(provision);
    }
    async rotatePendingPassword(manager, email) {
        const password = (0, crypto_1.randomBytes)(18).toString('base64url');
        const hash = await bcryptjs_1.default.hash(password, 12);
        const [account] = await manager.query(`UPDATE user_accounts SET password = $2, updated_at = now()
       WHERE lower(email) = $1 AND password_change_required = true RETURNING id`, [email, hash]);
        if (!account)
            throw new common_1.ConflictException('A conta já concluiu a definição de senha. Use a senha atual.');
        await manager.query(`UPDATE members SET password = $2 WHERE account_id = $1`, [account.id, hash]);
        await manager.query(`DELETE FROM token WHERE account_id = $1 OR "memberId" IN (SELECT id FROM members WHERE account_id = $1)`, [account.id]);
        return password;
    }
    async grantOrganizationAdmin(manager, memberId) {
        const inserted = await manager.query(`INSERT INTO member_roles (member_id, role_id)
       SELECT $1, role.id FROM roles AS role WHERE role.name = 'organization.admin'
       ON CONFLICT (member_id, role_id) DO NOTHING
       RETURNING member_id`, [memberId]);
        if (inserted.length === 0) {
            const [role] = await manager.query(`SELECT id FROM roles WHERE name = 'organization.admin' LIMIT 1`);
            if (!role)
                throw new common_1.ConflictException('O papel organization.admin não está configurado.');
        }
    }
};
exports.AccountProvisioningService = AccountProvisioningService;
exports.AccountProvisioningService = AccountProvisioningService = __decorate([
    (0, common_1.Injectable)()
], AccountProvisioningService);
