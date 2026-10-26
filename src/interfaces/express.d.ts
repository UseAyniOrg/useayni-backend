import { JWTPayload } from '../helpers/tokenHelper';

export interface TenantContext {
  organization_id: string;
  slug: string;
  name: string;
  status: string;
  theme: Record<string, string>;
  features: string[];
}

declare global {
  namespace Express {
    interface Request {
      user?: JWTPayload;
      _tokenRaw?: string;
      tenant?: TenantContext;
      tenantSlugHint?: string;
    }
  }
}

export {};
