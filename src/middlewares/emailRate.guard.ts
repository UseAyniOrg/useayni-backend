import { CanActivate, ExecutionContext, HttpException, Injectable } from '@nestjs/common';
import { createHmac } from 'crypto';
import { AppDataBase } from '../db';
import { emailConfig } from '../config/email';

@Injectable()
export class EmailRateGuard implements CanActivate {
  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const key = emailConfig().encryptionKey;
    if (!key) throw new HttpException('O serviço de email ainda não está configurado.', 503);
    const bucket = createHmac('sha256', key).update(`public-email:${request.ip ?? request.socket?.remoteAddress ?? 'unknown'}`).digest('hex');
    const [row] = await AppDataBase.query(`INSERT INTO email_rate_limits(bucket,attempts,expires_at)
      VALUES($1,1,now()+interval '1 minute') ON CONFLICT(bucket) DO UPDATE
      SET attempts=CASE WHEN email_rate_limits.expires_at<=now() THEN 1 ELSE email_rate_limits.attempts+1 END,
        expires_at=CASE WHEN email_rate_limits.expires_at<=now() THEN now()+interval '1 minute' ELSE email_rate_limits.expires_at END
      RETURNING attempts`, [bucket]);
    if (row.attempts > 20) throw new HttpException('Muitas tentativas. Aguarde um minuto.', 429);
    return true;
  }
}