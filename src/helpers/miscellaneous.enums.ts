/**
 * Enums centrais da Miscelânea.
 *
 * Os valores aqui DEVEM ser idênticos aos tipos ENUM criados na migration
 * (1776500000000-CreateMiscellaneous) e usados nos modelos TypeORM.
 */

export enum MiscellaneousType {
  PROJETO = 'projeto',
  EVENTO = 'evento',
  META = 'meta',
  REUNIAO = 'reuniao',
  ATIVIDADE = 'atividade',
  FORMULARIO = 'formulario',
}

export enum MiscellaneousVisibility {
  PUBLICO = 'publico',
  PRIVADO = 'privado',
}

export enum MiscellaneousStatus {
  RASCUNHO = 'rascunho',
  ATIVA = 'ativa',
  PENDENTE_APROVACAO = 'pendente_aprovacao',
}

export enum MiscellaneousScope {
  MEU_NIVEL = 'meu_nivel',
  CAR = 'car',
  CAE = 'cae',
  GERAL = 'geral',
  SELECAO_INDIVIDUAL = 'selecao_individual',
}

export enum MiscellaneousMemberStatus {
  PENDENTE = 'pendente',
  ACEITO = 'aceito',
  RECUSADO = 'recusado',
}

/** Nomes dos tipos ENUM no Postgres (usados na migration e nos modelos). */
export const MISC_ENUM_NAMES = {
  type: 'enum_miscellaneous_type',
  visibility: 'enum_miscellaneous_visibility',
  status: 'enum_miscellaneous_status',
  scope: 'enum_miscellaneous_scope',
  memberStatus: 'enum_miscellaneous_member_status',
} as const;
