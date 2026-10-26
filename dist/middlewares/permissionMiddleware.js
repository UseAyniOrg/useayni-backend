"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Roles = exports.ROLES_KEY = void 0;
exports.requirePermission = requirePermission;
exports.requireRole = requireRole;
const common_1 = require("@nestjs/common");
const db_1 = require("../db");
const member_1 = require("../models/member");
exports.ROLES_KEY = 'roles';
const Roles = (...roles) => (0, common_1.SetMetadata)(exports.ROLES_KEY, roles);
exports.Roles = Roles;
function requirePermission(resource, action) {
    return async (req, res, next) => {
        const userId = req.user?.id;
        if (!userId) {
            res.status(401).json({ error: "Não autenticado" });
            return;
        }
        const memberRepo = db_1.AppDataBase.getRepository(member_1.Member);
        const member = await memberRepo.findOne({
            where: { id: userId },
            relations: ["roles", "roles.permissions"],
        });
        if (!member) {
            res.status(404).json({ error: "Usuário não encontrado" });
            return;
        }
        const hasPermission = member.roles.some((role) => role.permissions.some((perm) => perm.resource === resource && perm.action === action));
        if (!hasPermission) {
            res.status(403).json({ error: "Sem permissão para esta ação" });
            return;
        }
        next();
    };
}
function requireRole(...roleNames) {
    return async (req, res, next) => {
        const userRoles = req.user?.roles || [];
        const hasRole = userRoles.some((role) => roleNames.includes(role));
        if (!hasRole) {
            res.status(403).json({ error: "Sem permissão para esta ação" });
            return;
        }
        next();
    };
}
