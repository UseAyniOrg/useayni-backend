import { IsString, IsOptional, IsUUID, IsBoolean, MaxLength, MinLength, IsInt, Min, IsIn } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateOrganizationDto {
  @ApiProperty({ example: 'CreaJr' })
  @IsString()
  @MinLength(2)
  @MaxLength(255)
  name!: string;

  @ApiProperty({ example: 'creajr', description: 'Subdomain slug — lowercase, no spaces' })
  @IsString()
  @MinLength(2)
  @MaxLength(100)
  slug!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  plan_id?: string;

  @ApiPropertyOptional({ example: { primary_color: '#1a56db', logo_url: '/logo.png' } })
  @IsOptional()
  theme?: Record<string, unknown>;

  @ApiPropertyOptional()
  @IsOptional()
  settings?: Record<string, unknown>;
}

export class UpdateOrganizationDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(255)
  name?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  plan_id?: string;

  @ApiPropertyOptional({ example: 'ACTIVE' })
  @IsOptional()
  @IsIn(['DRAFT', 'ACTIVE', 'SUSPENDED', 'TRIAL', 'CANCELLED'])
  status?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  suspension_reason?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  @Min(1)
  onboarding_step?: number;

  @ApiPropertyOptional()
  @IsOptional()
  theme?: Record<string, unknown>;

  @ApiPropertyOptional()
  @IsOptional()
  settings?: Record<string, unknown>;
}

export class UpsertFeatureDto {
  @ApiProperty({ example: 'governance' })
  @IsString()
  feature_slug!: string;

  @ApiProperty({ example: true })
  @IsBoolean()
  enabled!: boolean;

  @ApiPropertyOptional({ example: { split_percentage: 5 } })
  @IsOptional()
  config?: Record<string, unknown>;
}
