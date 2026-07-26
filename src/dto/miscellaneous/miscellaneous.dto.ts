import {
  IsString,
  IsEnum,
  IsOptional,
  IsDateString,
  IsBoolean,
  IsInt,
  IsUUID,
  MaxLength,
  Min,
  IsArray,
  ValidateNested,
  IsIn,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  MiscellaneousType,
  MiscellaneousScope,
  MiscellaneousParticipation,
  ActivityStatus,
  ActivityPriority,
} from '../../models/miscellaneous';

export class ScopeRuleDto {
  @IsIn(['general', 'cae', 'car', 'city', 'university', 'course', 'semester'])
  type!: string;

  @IsOptional() @IsUUID() cae_id?: string;
  @IsOptional() @IsUUID() car_id?: string;
  @IsOptional() @IsUUID() city_id?: string;
  @IsOptional() @IsUUID() university_id?: string;
  @IsOptional() @IsUUID() course_id?: string;
  @IsOptional() @IsInt() semester?: number;
}

export class CreateMiscellaneousDto {
  @ApiProperty({ maxLength: 120 })
  @IsString()
  @MaxLength(120)
  title!: string;

  @ApiProperty()
  @IsString()
  description!: string;

  @ApiProperty({ enum: MiscellaneousType })
  @IsEnum(MiscellaneousType)
  type!: MiscellaneousType;

  @ApiPropertyOptional({ description: 'public = free join, private = request-based' })
  @IsOptional()
  @IsIn(['public', 'private'])
  participation_type?: string;

  @ApiPropertyOptional({ type: [ScopeRuleDto], description: 'Scope rules (OR-combined)' })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ScopeRuleDto)
  scope_rules?: ScopeRuleDto[];

  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  @Min(1)
  max_participants?: number;

  @ApiProperty()
  @IsDateString()
  start_date!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  end_date?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  parent_id?: string;

  // Location
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  location_zip?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  location_street?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  location_number?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  location_neighborhood?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  location_city?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(2)
  location_state?: string;

  // Media
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  cover_url?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  banner_url?: string;

  // Event-specific
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  stream_link?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  @Min(0)
  capacity_presential?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  @Min(0)
  capacity_online?: number;

  // Meeting-specific
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  meeting_link?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  agenda?: string;

  // Goal-specific
  @ApiPropertyOptional()
  @IsOptional()
  goal_target?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(50)
  goal_unit?: string;

  // Activity-specific
  @ApiPropertyOptional({ enum: ActivityStatus })
  @IsOptional()
  @IsEnum(ActivityStatus)
  activity_status?: ActivityStatus;

  @ApiPropertyOptional({ enum: ActivityPriority })
  @IsOptional()
  @IsEnum(ActivityPriority)
  activity_priority?: ActivityPriority;

  // Registration
  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  registration_start_date?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  registration_end_date?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  @Min(1)
  max_members?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  waitlist_enabled?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  waitlist_message?: string;

  // Owners & members
  @ApiPropertyOptional({ type: [String] })
  @IsOptional()
  @IsUUID('4', { each: true })
  co_owner_ids?: string[];

  @ApiPropertyOptional({ type: [String] })
  @IsOptional()
  @IsUUID('4', { each: true })
  initial_member_ids?: string[];
}

export class UpdateMiscellaneousDto {
  @ApiPropertyOptional({ maxLength: 120 })
  @IsOptional()
  @IsString()
  @MaxLength(120)
  title?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ enum: MiscellaneousParticipation })
  @IsOptional()
  @IsEnum(MiscellaneousParticipation)
  visibility?: MiscellaneousParticipation;

  @ApiPropertyOptional({ enum: MiscellaneousScope })
  @IsOptional()
  @IsEnum(MiscellaneousScope)
  scope?: MiscellaneousScope;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  start_date?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  end_date?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  parent_id?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  location_zip?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  location_street?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  location_number?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  location_neighborhood?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  location_city?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(2)
  location_state?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  cover_url?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  banner_url?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  stream_link?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  capacity_presential?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  capacity_online?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  meeting_link?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  agenda?: string;

  @ApiPropertyOptional()
  @IsOptional()
  goal_target?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  goal_unit?: string;

  @ApiPropertyOptional()
  @IsOptional()
  goal_progress?: number;

  @ApiPropertyOptional({ enum: ActivityStatus })
  @IsOptional()
  @IsEnum(ActivityStatus)
  activity_status?: ActivityStatus;

  @ApiPropertyOptional({ enum: ActivityPriority })
  @IsOptional()
  @IsEnum(ActivityPriority)
  activity_priority?: ActivityPriority;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  registration_start_date?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  registration_end_date?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  max_members?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  waitlist_enabled?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  waitlist_message?: string;
}

export class MiscellaneousFiltersDto {
  @ApiPropertyOptional({ enum: MiscellaneousType })
  @IsOptional()
  @IsEnum(MiscellaneousType)
  type?: MiscellaneousType;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  status?: string;

  @ApiPropertyOptional({ enum: MiscellaneousParticipation })
  @IsOptional()
  @IsEnum(MiscellaneousParticipation)
  visibility?: MiscellaneousParticipation;

  @ApiPropertyOptional({ enum: MiscellaneousScope })
  @IsOptional()
  @IsEnum(MiscellaneousScope)
  scope?: MiscellaneousScope;

  @ApiPropertyOptional({ description: 'owner | participant | creator' })
  @IsOptional()
  @IsString()
  myRole?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  sortBy?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  @Min(1)
  page?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  @Min(1)
  limit?: number;
}
