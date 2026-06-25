import { IsString, IsOptional, IsUUID, IsEnum, IsDateString, MaxLength } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { AttendanceMode } from '../../models/attendance';

export class CreateRequestDto {
  @ApiProperty({ maxLength: 255 })
  @IsString()
  @MaxLength(255)
  title!: string;

  @ApiProperty()
  @IsString()
  message!: string;
}

export class ReviewRequestDto {
  @ApiProperty({ enum: ['approved', 'rejected'] })
  @IsEnum(['approved', 'rejected'])
  status!: 'approved' | 'rejected';

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  response_message?: string;
}

export class CreateInviteDto {
  @ApiProperty()
  @IsUUID()
  invited_user_id!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  message?: string;
}

export class RejectInviteDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  rejection_reason?: string;
}

export class ApprovalActionDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  comment?: string;
}

export class CreateAttendanceSessionDto {
  @ApiProperty()
  @IsString()
  @MaxLength(255)
  title!: string;

  @ApiProperty({ enum: AttendanceMode })
  @IsEnum(AttendanceMode)
  mode!: AttendanceMode;

  @ApiProperty()
  @IsDateString()
  starts_at!: string;

  @ApiProperty()
  @IsDateString()
  ends_at!: string;
}

export class ManualCheckInDto {
  @ApiProperty()
  present!: boolean;
}
