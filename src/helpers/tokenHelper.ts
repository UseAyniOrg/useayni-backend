import * as jwt from "jsonwebtoken";
import { authConfig } from "../config/auth";

export interface MemberPosition {
  type: 'REPRESENTANTE' | 'DIRIGENTE' | 'CAR' | 'CAE';
  id: string;
  name: string;
}

export interface JWTPayload {
  id: string;
  email: string;
  name: string;
  isActive: boolean;
  roles: string[];
  positions: MemberPosition[];
}

/**
 * Extrai o memberId do accessToken
 * @param accessToken - O token de acesso JWT
 * @returns O memberId
 * @throws Error se o token for inválido ou expirado
 */
export function getMemberIdFromAccessToken(accessToken: string): string {
  if (!authConfig.jwt.secret) {
    throw new Error("JWT secret is not defined");
  }

  try {
    const decoded = jwt.verify(accessToken, authConfig.jwt.secret) as JWTPayload;
    return decoded.id;
  } catch (error) {
    throw new Error("Token inválido ou expirado");
  }
}

/**
 * Decodifica o token completo
 */
export function decodeToken(accessToken: string): JWTPayload {
  if (!authConfig.jwt.secret) {
    throw new Error("JWT secret is not defined");
  }

  try {
    return jwt.verify(accessToken, authConfig.jwt.secret) as JWTPayload;
  } catch (error) {
    throw new Error("Token inválido ou expirado");
  }
}
