import { Request, Response, NextFunction } from "express";
import * as jwt from "jsonwebtoken";
import { authConfig } from "../config/auth";
import { JWTPayload } from "../helpers/tokenHelper";

export async function authMiddleware(
  req: Request,
  res: Response,
  next: NextFunction
) {
  const authHeader = req.headers.authorization;

  if (!authHeader) {
    res.status(401).json({ error: "Token não fornecido" });
    return;
  }

  const parts = authHeader.split(" ");
  if (parts.length !== 2 || parts[0] !== "Bearer") {
    res.status(401).json({ error: "Formato de token inválido" });
    return;
  }

  const token = parts[1];

  try {
    if (!authConfig.jwt.secret) throw new Error("JWT secret is not defined");
    
    const decoded = jwt.verify(token, authConfig.jwt.secret) as JWTPayload;
    
    req.user = decoded;
    next();
  } catch (error) {
    res.status(401).json({ error: "Token inválido ou expirado" });
  }
}
