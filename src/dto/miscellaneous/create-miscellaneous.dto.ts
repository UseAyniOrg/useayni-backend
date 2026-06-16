import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsArray,
  IsBoolean,
  IsDateString,
  IsEnum,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
} from 'class-validator';
import {
  MiscellaneousScope,
  MiscellaneousType,
  MiscellaneousVisibility,
} from '../../helpers/miscellaneous.enums';

export class CreateMiscellaneousDto {
  @ApiProperty({ enum: MiscellaneousType, example: MiscellaneousType.PROJETO })
  @IsEnum(MiscellaneousType)
  type: MiscellaneousType;

  @ApiProperty({ example: 'Mutirão de arrecadação', maxLength: 120 })
  @IsString()
  @MaxLength(120)
  title: string;

  @ApiProperty({ example: 'Descrição rica da miscelânea.' })
  @IsString()
  description: string;

  @ApiProperty({ example: '2026-07-01T09:00:00.000Z' })
  @IsDateString()
  start_date: string;

  @ApiPropertyOptional({
    example: '2026-07-10T18:00:00.000Z',
    description: 'Obrigatório para todos os tipos, exceto Meta.',
  })
  @IsOptional()
  @IsDateString()
  end_date?: string;

  @ApiProperty({ enum: MiscellaneousVisibility, example: MiscellaneousVisibility.PUBLICO })
  @IsEnum(MiscellaneousVisibility)
  visibility: MiscellaneousVisibility;

  @ApiProperty({ enum: MiscellaneousScope, example: MiscellaneousScope.MEU_NIVEL })
  @IsEnum(MiscellaneousScope)
  scope: MiscellaneousScope;

  // Donos adicionais além do criador (RN-001 adiciona o criador automaticamente).
  @ApiPropertyOptional({ type: [String], description: 'IDs de donos adicionais' })
  @IsOptional()
  @IsArray()
  @IsUUID('4', { each: true })
  ownerIds?: string[];

  // Membros iniciais / convidados (obrigatório na seleção individual).
  @ApiPropertyOptional({ type: [String], description: 'IDs de membros iniciais/convidados' })
  @IsOptional()
  @IsArray()
  @IsUUID('4', { each: true })
  memberIds?: string[];

  // Local (opcional)
  @ApiPropertyOptional({ example: '80000-000' })
  @IsOptional()
  @IsString()
  @MaxLength(9)
  cep?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  bairro?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  rua?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(20)
  numero?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  cidade?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  estado?: string;

  // Mídia (opcional)
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  cover_photo_url?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  banner_url?: string;

  // Vínculo de aninhamento (opcional)
  @ApiPropertyOptional({ description: 'ID da miscelânea pai (respeita aninhamento)' })
  @IsOptional()
  @IsUUID('4')
  parentId?: string;

  // Salvar como rascunho ao invés de aplicar o fluxo de status automático.
  @ApiPropertyOptional({ default: false, description: 'Cria com status rascunho' })
  @IsOptional()
  @IsBoolean()
  isDraft?: boolean;
}
