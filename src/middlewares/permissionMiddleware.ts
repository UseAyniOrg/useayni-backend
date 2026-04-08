import { Request, Response, NextFunction } from "express";
import { SetMetadata } from '@nestjs/common';
import { AppDataBase } from "../db";
import { Member } from "../models/member";

export const ROLES_KEY = 'roles';
export const Roles = (...roles: string[]) => SetMetadata(ROLES_KEY, roles);

export function requirePermission(resource: string, action: string) {
  return async (req: Request, res: Response, next: NextFunction) => {
    const userId = req.user?.id;
    
    if (!userId) {
      res.status(401).json({ error: "Não autenticado" });
      return;
    }

    const memberRepo = AppDataBase.getRepository(Member);
    const member = await memberRepo.findOne({
      where: { id: userId },
      relations: ["roles", "roles.permissions"],
    });

    if (!member) {
      res.status(404).json({ error: "Usuário não encontrado" });
      return;
    }

    const hasPermission = member.roles.some((role) =>
      role.permissions.some(
        (perm) => perm.resource === resource && perm.action === action
      )
    );

    if (!hasPermission) {
      res.status(403).json({ error: "Sem permissão para esta ação" });
      return;
    }

    next();
  };
}

export function requireRole(...roleNames: string[]) {
  return async (req: Request, res: Response, next: NextFunction) => {
    const userRoles = req.user?.roles || [];
    
    const hasRole = userRoles.some((role) => roleNames.includes(role));

    if (!hasRole) {
      res.status(403).json({ error: "Sem permissão para esta ação" });
      return;
    }

    next();
  };
}
