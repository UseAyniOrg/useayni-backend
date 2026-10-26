import * as jwt from "jsonwebtoken";
import { authConfig } from "../config/auth";

export interface MemberPosition {
  type: 'REPRESENTANTE' | 'DIRIGENTE' | 'CAR' | 'CAE';
  id: string;
  name: string;
}

export interface MemberMandate {
  mandate_id: string;
  position: string;
  position_id: string;
  org_unit_id: string;
  org_unit_name: string;
  org_unit_type: string;
}

export interface OrganizationMembership {
  member_id: string;
  organization_id: string;
  organization_name: string;
  tenant_slug: string;
  status: string;
  organization_status?: string;
}

export interface JWTPayload {
  access_context?: 'platform' | 'organization' | 'member' | 'support';
  community_only?: boolean;
  id: string;
  email: string;
  name: string;
  isActive: boolean;
  roles: string[];
  /** Legacy CreaJr positions — kept for backward compat */
  positions: MemberPosition[];
  /** Multi-tenant mandate-based positions */
  mandates?: MemberMandate[];
  /** Tenant context — present when logged in within an org */
  organization_id?: string;
  tenant_slug?: string;
  account_id?: string;
  password_change_required?: boolean;
  support_session_id?: string;
  organization_memberships?: OrganizationMembership[];
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
