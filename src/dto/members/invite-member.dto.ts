import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEmail, IsOptional, IsString, MaxLength } from 'class-validator';

export class InviteMemberDto {
  @ApiProperty({ example: 'joao@email.com', description: 'Email do membro a ser convidado' })
  @IsEmail()
  email!: string;

  @ApiPropertyOptional({ example: 'Venha participar da nossa organização!' })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  message?: string;
}
