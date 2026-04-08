import { JWTPayload } from '../helpers/tokenHelper';

declare global {
  namespace Express {
    interface Request {
      user?: JWTPayload;
    }
  }
}

export {};
