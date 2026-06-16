import { MemberPosition } from './tokenHelper';
import {
  MiscellaneousScope,
  MiscellaneousType,
} from './miscellaneous.enums';

/**
 * Regras de negócio puras da criação de Miscelânea.
 *
 * Mantidas isoladas (sem dependência de banco/Nest) para serem facilmente
 * testáveis e reaproveitadas pelo service.
 */

/**
 * RN-005 — Tabela de aninhamento: tipos de filho permitidos por tipo de pai.
 *
 * Observação: Formulário (RN-006) é tratado à parte — pode ser filho de
 * qualquer tipo OU independente, então não depende desta tabela.
 */
export const NESTING_RULES: Record<MiscellaneousType, MiscellaneousType[]> = {
  [MiscellaneousType.PROJETO]: [
    MiscellaneousType.EVENTO,
    MiscellaneousType.META,
    MiscellaneousType.REUNIAO,
    MiscellaneousType.ATIVIDADE,
    MiscellaneousType.FORMULARIO,
  ],
  [MiscellaneousType.EVENTO]: [
    MiscellaneousType.REUNIAO,
    MiscellaneousType.ATIVIDADE,
    MiscellaneousType.FORMULARIO,
  ],
  [MiscellaneousType.META]: [
    MiscellaneousType.ATIVIDADE,
    MiscellaneousType.FORMULARIO,
  ],
  [MiscellaneousType.REUNIAO]: [
    MiscellaneousType.ATIVIDADE,
    MiscellaneousType.FORMULARIO,
  ],
  [MiscellaneousType.ATIVIDADE]: [MiscellaneousType.FORMULARIO],
  [MiscellaneousType.FORMULARIO]: [],
};

/**
 * RN-005 / RN-006 — Valida se um filho de `childType` pode ser aninhado
 * em um pai de `parentType`.
 */
export function isNestingAllowed(
  parentType: MiscellaneousType,
  childType: MiscellaneousType,
): boolean {
  // RN-006: Formulário pode ser vinculado a qualquer tipo.
  if (childType === MiscellaneousType.FORMULARIO) return true;
  return (NESTING_RULES[parentType] ?? []).includes(childType);
}

/**
 * Nível hierárquico de cada escopo de público.
 * Quanto maior o número, mais amplo o alcance.
 *
 * `selecao_individual` é um caso especial (não-hierárquico): tratado como o
 * mais restritivo possível (0), pois atinge apenas membros escolhidos a dedo.
 */
export const SCOPE_LEVEL: Record<MiscellaneousScope, number> = {
  [MiscellaneousScope.SELECAO_INDIVIDUAL]: 0,
  [MiscellaneousScope.MEU_NIVEL]: 1,
  [MiscellaneousScope.CAR]: 2,
  [MiscellaneousScope.CAE]: 3,
  [MiscellaneousScope.GERAL]: 4,
};

/**
 * Nível hierárquico do criador, derivado de suas posições e roles.
 *
 * - Membro autenticado sem posição de gestão: 1 (pode criar apenas no seu nível)
 * - REPRESENTANTE / DIRIGENTE: 1 (nível de turma/curso)
 * - Gestor de CAR: 2
 * - Gestor de CAE: 3
 * - EQUIPE_TECNICA: 4 (alcance geral)
 *
 * Retorna o MAIOR nível encontrado.
 */
export function getCreatorLevel(
  positions: MemberPosition[] = [],
  roles: string[] = [],
): number {
  let level = 1;

  if (roles.includes('EQUIPE_TECNICA')) {
    return 4;
  }

  for (const position of positions) {
    switch (position.type) {
      case 'CAE':
        level = Math.max(level, 3);
        break;
      case 'CAR':
        level = Math.max(level, 2);
        break;
      case 'REPRESENTANTE':
      case 'DIRIGENTE':
        level = Math.max(level, 1);
        break;
    }
  }

  return level;
}

/**
 * RN-002 — O escopo escolhido é mais amplo que o nível do criador?
 * `selecao_individual` nunca exige aprovação de gestão (RN-003).
 */
export function scopeExceedsCreatorLevel(
  scope: MiscellaneousScope,
  creatorLevel: number,
): boolean {
  if (scope === MiscellaneousScope.SELECAO_INDIVIDUAL) return false;
  return SCOPE_LEVEL[scope] > creatorLevel;
}

/**
 * RN-004 — Uma miscelânea filho não pode ter escopo mais amplo que o pai.
 */
export function childScopeWithinParent(
  childScope: MiscellaneousScope,
  parentScope: MiscellaneousScope,
): boolean {
  return SCOPE_LEVEL[childScope] <= SCOPE_LEVEL[parentScope];
}
