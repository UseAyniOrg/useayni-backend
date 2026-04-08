import { SetMetadata } from '@nestjs/common';

export interface PositionRequirement {
  type: 'REPRESENTANTE' | 'DIRIGENTE' | 'CAR' | 'CAE';
  contextId?: string; // Se fornecido, valida posição específica
}

export const REQUIRE_POSITION_KEY = 'requirePosition';
export const RequirePosition = (type: PositionRequirement['type'], contextId?: string) =>
  SetMetadata(REQUIRE_POSITION_KEY, { type, contextId } as PositionRequirement);
