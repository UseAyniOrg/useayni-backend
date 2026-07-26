import {
  IsString,
  IsOptional,
  IsBoolean,
  IsEnum,
  IsInt,
  IsUUID,
  IsDateString,
  ValidateNested,
  ArrayMinSize,
  MaxLength,
  Min,
  IsIn,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { QuestionType, ResultsVisibility } from '../../models/form';

export class CreateFormDto {
  @ApiProperty()
  @IsString()
  @MaxLength(255)
  title!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  anonymous?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsIn(['unlimited', 'once', 'limited'])
  response_limit_type?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  @Min(1)
  max_responses_per_user?: number;

  @ApiPropertyOptional({ enum: ResultsVisibility })
  @IsOptional()
  @IsEnum(ResultsVisibility)
  results_visibility?: ResultsVisibility;

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
  @IsBoolean()
  public_results_enabled?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  miscellaneous_id?: string;
}

export class FormOptionDto {
  @ApiProperty()
  @IsString()
  @MaxLength(255)
  label!: string;
}

export class CreateFormQuestionDto {
  @ApiProperty({ enum: QuestionType })
  @IsEnum(QuestionType)
  type!: QuestionType;

  @ApiProperty()
  @IsString()
  @MaxLength(255)
  title!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  required?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  scale_min?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  scale_max?: number;

  @ApiPropertyOptional({ type: [FormOptionDto] })
  @IsOptional()
  @ValidateNested({ each: true })
  @Type(() => FormOptionDto)
  @ArrayMinSize(2)
  options?: FormOptionDto[];
}

export class ReorderQuestionsDto {
  @ApiProperty({ type: [String] })
  @IsUUID('4', { each: true })
  question_ids!: string[];
}

export class FormAnswerDto {
  @ApiProperty()
  @IsUUID()
  question_id!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  value?: string;
}

export class SubmitFormResponseDto {
  @ApiProperty({ type: [FormAnswerDto] })
  @ValidateNested({ each: true })
  @Type(() => FormAnswerDto)
  answers!: FormAnswerDto[];
}
