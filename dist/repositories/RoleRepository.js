"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.RoleRepository = void 0;
const common_1 = require("@nestjs/common");
const db_1 = require("../db");
const role_1 = require("../models/role");
let RoleRepository = class RoleRepository {
    constructor() {
        this.repository = db_1.AppDataBase.getRepository(role_1.Role);
    }
    async findAll() {
        return this.repository.find({ relations: ["permissions"] });
    }
    async findById(id) {
        return this.repository.findOne({ where: { id }, relations: ["permissions", "members"] });
    }
    async findByName(name) {
        return this.repository.findOne({ where: { name }, relations: ["permissions"] });
    }
    async create(data) {
        const role = this.repository.create(data);
        return this.repository.save(role);
    }
    async update(id, data) {
        await this.repository.update(id, data);
        return this.findById(id);
    }
    async delete(id) {
        await this.repository.delete(id);
    }
    async assignPermissions(roleId, permissionIds) {
        await db_1.AppDataBase.query(`DELETE FROM role_permissions WHERE role_id = $1`, [roleId]);
        if (permissionIds.length > 0) {
            const values = permissionIds.map(permId => `('${roleId}', '${permId}')`).join(',');
            await db_1.AppDataBase.query(`INSERT INTO role_permissions (role_id, permission_id) VALUES ${values}`);
        }
        return this.findById(roleId);
    }
    async assignRoleToMember(roleId, memberId) {
        await db_1.AppDataBase.query(`INSERT INTO member_roles (member_id, role_id) VALUES ($1, $2) ON CONFLICT DO NOTHING`, [memberId, roleId]);
    }
    async removeRoleFromMember(roleId, memberId) {
        await db_1.AppDataBase.query(`DELETE FROM member_roles WHERE member_id = $1 AND role_id = $2`, [memberId, roleId]);
    }
};
exports.RoleRepository = RoleRepository;
exports.RoleRepository = RoleRepository = __decorate([
    (0, common_1.Injectable)()
], RoleRepository);
