import { ApiProperty } from "@nestjs/swagger";
import { IsBoolean, IsEmail, IsIn, IsNotEmpty, IsOptional, IsString } from "class-validator";

export class LoginDto {
  @IsOptional()
  @IsIn(['platform', 'organization', 'member'])
  access_context?: 'platform' | 'organization' | 'member';
  @ApiProperty({ example: "user@example.com" })
  @IsString()
  @IsNotEmpty()
  personalEmail!: string;

  @ApiProperty({ example: "password123" })
  @IsString()
  @IsNotEmpty()
  password!: string;

  @ApiProperty({ example: true, required: false })
  @IsOptional()
  @IsBoolean()
  rememberMe?: boolean;
}

export class RefreshTokenDto {
  @ApiProperty({ example: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." })
  @IsString()
  @IsNotEmpty()
  refreshToken!: string;
}

export class SwitchOrganizationDto {
  @ApiProperty({ example: "creajr" })
  @IsString()
  @IsNotEmpty()
  tenant_slug!: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsBoolean()
  rememberMe?: boolean;
}
