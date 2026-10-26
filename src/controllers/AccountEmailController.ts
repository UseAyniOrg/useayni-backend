import { BadRequestException, Body, Controller, HttpCode, Post, Req, UseGuards } from '@nestjs/common';
import { Request } from 'express';
import { z } from 'zod';
import { AccountEmailService } from '../services/AccountEmailService';
import { EmailRateGuard } from '../middlewares/emailRate.guard';

const tokenSchema = z.string().regex(/^[A-Za-z0-9_-]{43}$/);
const passwordSchema = z.string().min(1).max(128);
function parse<T>(schema: z.ZodType<T>, input: unknown): T {
  const result = schema.safeParse(input);
  if (!result.success) throw new BadRequestException('Dados inválidos. Verifique o link e os campos informados.');
  return result.data;
}

@Controller('account-email')
@UseGuards(EmailRateGuard)
export class AccountEmailController {
  constructor(private readonly service: AccountEmailService) {}

  @Post('invitation/inspect')
  @HttpCode(200)
  inspect(@Body() body: unknown) {
    return this.service.inspectInvitation(parse(z.object({ token: tokenSchema }), body).token);
  }

  @Post('invitation/accept')
  @HttpCode(200)
  accept(@Body() body: unknown) {
    const data = parse(z.object({ token: tokenSchema, password: passwordSchema, full_name: z.string().max(255).default('') }), body);
    return this.service.acceptInvitation(data.token, data.password, data.full_name);
  }

  @Post('password-reset')
  @HttpCode(200)
  requestReset(@Body() body: unknown, @Req() request: Request) {
    const data = parse(z.object({ email: z.email().max(255) }), body);
    return this.service.requestPasswordReset(data.email, request.tenant?.organization_id);
  }

  @Post('password-reset/complete')
  @HttpCode(200)
  reset(@Body() body: unknown) {
    const data = parse(z.object({ token: tokenSchema, password: passwordSchema }), body);
    return this.service.resetPassword(data.token, data.password);
  }
}