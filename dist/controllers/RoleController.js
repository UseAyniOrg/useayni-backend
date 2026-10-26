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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.RoleController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const RoleService_1 = require("../services/RoleService");
const role_dto_1 = require("../dto/role.dto");
const permissionMiddleware_1 = require("../middlewares/permissionMiddleware");
const authorization_guard_1 = require("../middlewares/authorization.guard");
let RoleController = class RoleController {
    constructor(roleService) {
        this.roleService = roleService;
    }
    async findAll() {
        return this.roleService.findAll();
    }
    async findById(id) {
        return this.roleService.findById(id);
    }
    async findByName(name) {
        return this.roleService.findByName(name);
    }
    async create(data) {
        return this.roleService.create(data);
    }
    async update(id, data) {
        return this.roleService.update(id, data);
    }
    async delete(id) {
        await this.roleService.delete(id);
        return { message: 'Role deleted successfully' };
    }
    async assignPermissions(roleId, data) {
        return this.roleService.assignPermissions(roleId, data.permissionIds);
    }
    async assignToMember(roleId, data) {
        return this.roleService.assignToMember(roleId, data.memberId);
    }
    async removeFromMember(roleId, memberId) {
        return this.roleService.removeFromMember(roleId, memberId);
    }
};
exports.RoleController = RoleController;
__decorate([
    (0, common_1.Get)(),
    (0, swagger_1.ApiOperation)({
        summary: 'List all roles',
        description: 'Returns all roles with their permissions',
    }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'List of roles' }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], RoleController.prototype, "findAll", null);
__decorate([
    (0, common_1.Get)(':id'),
    (0, swagger_1.ApiOperation)({
        summary: 'Get role by ID',
        description: 'Returns a role with permissions and members',
    }),
    (0, swagger_1.ApiParam)({ name: 'id', type: String, description: 'Role ID' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Role found' }),
    (0, swagger_1.ApiResponse)({ status: 404, description: 'Role not found' }),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], RoleController.prototype, "findById", null);
__decorate([
    (0, common_1.Get)('name/:name'),
    (0, swagger_1.ApiOperation)({
        summary: 'Get role by name',
        description: 'Returns a role by its name (e.g., MEMBRO, DIRIGENTE)',
    }),
    (0, swagger_1.ApiParam)({ name: 'name', type: String, example: 'DIRIGENTE', description: 'Role name' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Role found' }),
    (0, swagger_1.ApiResponse)({ status: 404, description: 'Role not found' }),
    __param(0, (0, common_1.Param)('name')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], RoleController.prototype, "findByName", null);
__decorate([
    (0, common_1.Post)(),
    (0, permissionMiddleware_1.Roles)('EQUIPE_TECNICA'),
    (0, swagger_1.ApiOperation)({
        summary: 'Create role ',
        description: 'Creates a new role in the system - DEPRECATED: Only EXTERNO and EQUIPE_TECNICA should exist',
    }),
    (0, swagger_1.ApiBody)({ type: role_dto_1.CreateRoleDto }),
    (0, swagger_1.ApiResponse)({ status: 201, description: 'Role created' }),
    (0, swagger_1.ApiResponse)({ status: 400, description: 'Invalid data or role already exists' }),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [role_dto_1.CreateRoleDto]),
    __metadata("design:returntype", Promise)
], RoleController.prototype, "create", null);
__decorate([
    (0, common_1.Put)(':id'),
    (0, permissionMiddleware_1.Roles)('EQUIPE_TECNICA'),
    (0, swagger_1.ApiOperation)({
        summary: 'Update role ',
        description: 'Updates role name and/or description',
    }),
    (0, swagger_1.ApiParam)({ name: 'id', type: String, description: 'Role ID' }),
    (0, swagger_1.ApiBody)({ type: role_dto_1.UpdateRoleDto }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Role updated' }),
    (0, swagger_1.ApiResponse)({ status: 404, description: 'Role not found' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, role_dto_1.UpdateRoleDto]),
    __metadata("design:returntype", Promise)
], RoleController.prototype, "update", null);
__decorate([
    (0, common_1.Delete)(':id'),
    (0, permissionMiddleware_1.Roles)('EQUIPE_TECNICA'),
    (0, common_1.HttpCode)(200),
    (0, swagger_1.ApiOperation)({
        summary: 'Delete role ',
        description: 'Deletes a role from the system',
    }),
    (0, swagger_1.ApiParam)({ name: 'id', type: String, description: 'Role ID' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Role deleted' }),
    (0, swagger_1.ApiResponse)({ status: 404, description: 'Role not found' }),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], RoleController.prototype, "delete", null);
__decorate([
    (0, common_1.Post)(':id/permissions'),
    (0, permissionMiddleware_1.Roles)('EQUIPE_TECNICA'),
    (0, swagger_1.ApiOperation)({
        summary: 'Assign permissions to role ',
        description: 'Replaces all permissions of a role with the provided list',
    }),
    (0, swagger_1.ApiParam)({ name: 'id', type: String, description: 'Role ID' }),
    (0, swagger_1.ApiBody)({ type: role_dto_1.AssignPermissionsDto }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Permissions assigned' }),
    (0, swagger_1.ApiResponse)({ status: 404, description: 'Role not found' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, role_dto_1.AssignPermissionsDto]),
    __metadata("design:returntype", Promise)
], RoleController.prototype, "assignPermissions", null);
__decorate([
    (0, common_1.Post)(':id/members'),
    (0, permissionMiddleware_1.Roles)('EQUIPE_TECNICA'),
    (0, swagger_1.ApiOperation)({
        summary: 'Assign role to member',
        description: 'Assigns a role to a member',
    }),
    (0, swagger_1.ApiParam)({ name: 'id', type: String, description: 'Role ID' }),
    (0, swagger_1.ApiBody)({ type: role_dto_1.AssignRoleToMemberDto }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Role assigned to member' }),
    (0, swagger_1.ApiResponse)({ status: 404, description: 'Role or member not found' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, role_dto_1.AssignRoleToMemberDto]),
    __metadata("design:returntype", Promise)
], RoleController.prototype, "assignToMember", null);
__decorate([
    (0, common_1.Delete)(':id/members/:memberId'),
    (0, permissionMiddleware_1.Roles)('EQUIPE_TECNICA'),
    (0, common_1.HttpCode)(200),
    (0, swagger_1.ApiOperation)({
        summary: 'Remove role from member',
        description: 'Removes a role from a member',
    }),
    (0, swagger_1.ApiParam)({ name: 'id', type: String, description: 'Role ID' }),
    (0, swagger_1.ApiParam)({ name: 'memberId', type: String, description: 'Member ID' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Role removed from member' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Param)('memberId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], RoleController.prototype, "removeFromMember", null);
exports.RoleController = RoleController = __decorate([
    (0, common_1.Controller)('roles'),
    (0, swagger_1.ApiTags)('Roles'),
    (0, common_1.UseGuards)(authorization_guard_1.AuthorizationGuard),
    __metadata("design:paramtypes", [RoleService_1.RoleService])
], RoleController);
