"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.EmailRateGuard = void 0;
const common_1 = require("@nestjs/common");
const crypto_1 = require("crypto");
const db_1 = require("../db");
const email_1 = require("../config/email");
let EmailRateGuard = class EmailRateGuard {
    async canActivate(context) {
        const request = context.switchToHttp().getRequest();
        const key = (0, email_1.emailConfig)().encryptionKey;
        if (!key)
            throw new common_1.HttpException('O serviço de email ainda não está configurado.', 503);
        const bucket = (0, crypto_1.createHmac)('sha256', key).update(`public-email:${request.ip ?? request.socket?.remoteAddress ?? 'unknown'}`).digest('hex');
        const [row] = await db_1.AppDataBase.query(`INSERT INTO email_rate_limits(bucket,attempts,expires_at)
      VALUES($1,1,now()+interval '1 minute') ON CONFLICT(bucket) DO UPDATE
      SET attempts=CASE WHEN email_rate_limits.expires_at<=now() THEN 1 ELSE email_rate_limits.attempts+1 END,
        expires_at=CASE WHEN email_rate_limits.expires_at<=now() THEN now()+interval '1 minute' ELSE email_rate_limits.expires_at END
      RETURNING attempts`, [bucket]);
        if (row.attempts > 20)
            throw new common_1.HttpException('Muitas tentativas. Aguarde um minuto.', 429);
        return true;
    }
};
exports.EmailRateGuard = EmailRateGuard;
exports.EmailRateGuard = EmailRateGuard = __decorate([
    (0, common_1.Injectable)()
], EmailRateGuard);
