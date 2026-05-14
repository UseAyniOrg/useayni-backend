import { ApiProperty } from '@nestjs/swagger';
import {
  IsBoolean,
  IsDateString,
  IsEmail,
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
  Min,
} from 'class-validator';

export class CreateMemberDto {
  @ApiProperty({ example: 'Joao', required: false })
  @IsOptional()
  @IsString()
  first_name?: string;

  @ApiProperty({ example: 'Silva', required: false })
  @IsOptional()
  @IsString()
  last_name?: string;

  @ApiProperty({ example: 'Joao Silva', required: false })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiProperty({ example: '12345678900' })
  @IsString()
  cpf: string;

  @ApiProperty({ example: 'password123' })
  @IsString()
  password: string;

  @ApiProperty({ example: 'password123', required: false })
  @IsOptional()
  @IsString()
  confirm_password?: string;

  @ApiProperty({ example: '11999999999' })
  @IsString()
  phone: string;

  @ApiProperty({ example: 'joao@example.com' })
  @IsEmail()
  email_personal: string;

  @ApiProperty({ example: 'joao@university.edu' })
  @IsEmail()
  email_university: string;

  @ApiProperty({ example: '1234567890' })
  @IsString()
  ra: string;

  @ApiProperty({ example: '2000-01-01' })
  @IsDateString()
  birth_date: string;

  @ApiProperty({ example: 'uuid-do-estado', required: false })
  @IsOptional()
  @IsUUID()
  state_id?: string;

  @ApiProperty({ example: 'PR', required: false })
  @IsOptional()
  @IsString()
  state_uf?: string;

  @ApiProperty({ example: 'uuid-da-cidade', required: false })
  @IsOptional()
  @IsUUID()
  city_id?: string;

  @ApiProperty({ example: '4106902', required: false })
  @IsOptional()
  @IsString()
  city_ibge_code?: string;

  @ApiProperty({ example: 'Curitiba', required: false })
  @IsOptional()
  @IsString()
  city_name?: string;

  @ApiProperty({ example: 'uuid-da-universidade', required: false })
  @IsOptional()
  @IsUUID()
  university_id?: string;

  @ApiProperty({ example: '588', required: false })
  @IsOptional()
  @IsString()
  university_emec_code?: string;

  @ApiProperty({ example: 'Universidade Tecnologica Federal do Parana', required: false })
  @IsOptional()
  @IsString()
  university_name?: string;

  @ApiProperty({ example: 'UTFPR', required: false })
  @IsOptional()
  @IsString()
  university_acronym?: string;

  @ApiProperty({ example: false, required: false })
  @IsOptional()
  @IsBoolean()
  university_not_applicable?: boolean;

  @ApiProperty({ example: 'uuid-do-curso', required: false })
  @IsOptional()
  @IsUUID()
  course_id?: string;

  @ApiProperty({ example: 'Engenharia de Software', required: false })
  @IsOptional()
  @IsString()
  course_name?: string;

  @ApiProperty({ example: false, required: false })
  @IsOptional()
  @IsBoolean()
  course_not_applicable?: boolean;

  @ApiProperty({ example: 4, required: false })
  @IsOptional()
  @IsInt()
  @Min(1)
  current_semester?: number;

  @ApiProperty({ example: false, required: false })
  @IsOptional()
  @IsBoolean()
  current_semester_not_applicable?: boolean;

  @ApiProperty({
    example: 'uuid-do-vinculo-curso-universidade',
    description: 'Optional relation to a course university record',
    required: false,
  })
  @IsOptional()
  @IsUUID()
  course_university_id?: string;

  @ApiProperty({ example: '2024-01-01' })
  @IsDateString()
  admission_date: string;

  @ApiProperty({ example: 'Membro', required: false })
  @IsOptional()
  @IsString()
  position?: string;

  @ApiProperty({ example: 'sponsor-uuid-or-name', required: false })
  @IsOptional()
  @IsString()
  sponsor?: string;

  @ApiProperty({ example: 'Biografia do membro', required: false })
  @IsOptional()
  @IsString()
  biography?: string;
}
