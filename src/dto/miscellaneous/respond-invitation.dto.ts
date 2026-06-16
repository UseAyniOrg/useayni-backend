import { ApiProperty } from '@nestjs/swagger';
import { IsEnum } from 'class-validator';

export enum InvitationResponse {
  ACEITAR = 'aceitar',
  RECUSAR = 'recusar',
}

export class RespondInvitationDto {
  @ApiProperty({ enum: InvitationResponse, example: InvitationResponse.ACEITAR })
  @IsEnum(InvitationResponse)
  response: InvitationResponse;
}
