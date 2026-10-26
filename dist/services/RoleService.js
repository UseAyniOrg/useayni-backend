"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.RoleService = void 0;
const common_1 = require("@nestjs/common");
const RoleRepository_1 = require("../repositories/RoleRepository");
let RoleService = class RoleService {
    constructor(roleRepository) {
        this.roleRepository = roleRepository;
    }
    async findAll() {
        return this.roleRepository.findAll();
    }
    async findById(id) {
        const role = await this.roleRepository.findById(id);
        if (!role)
            throw new Error("Role não encontrada");
        return role;
    }
    async findByName(name) {
        return this.roleRepository.findByName(name);
    }
    async create(data) {
        return this.roleRepository.create(data);
    }
    async update(id, data) {
        return this.roleRepository.update(id, data);
    }
    async delete(id) {
        return this.roleRepository.delete(id);
    }
    async assignPermissions(roleId, permissionIds) {
        return this.roleRepository.assignPermissions(roleId, permissionIds);
    }
    async assignToMember(roleId, memberId) {
        await this.roleRepository.assignRoleToMember(roleId, memberId);
        return { message: "Role atribuída ao membro com sucesso" };
    }
    async removeFromMember(roleId, memberId) {
        await this.roleRepository.removeRoleFromMember(roleId, memberId);
        return { message: "Role removida do membro com sucesso" };
    }
};
exports.RoleService = RoleService;
exports.RoleService = RoleService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [RoleRepository_1.RoleRepository])
], RoleService);
