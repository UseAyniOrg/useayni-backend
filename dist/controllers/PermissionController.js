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
exports.PermissionController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const PermissionService_1 = require("../services/PermissionService");
const permission_dto_1 = require("../dto/permission.dto");
const authorization_guard_1 = require("../middlewares/authorization.guard");
let PermissionController = class PermissionController {
    constructor(permissionService) {
        this.permissionService = permissionService;
    }
    async findAll() {
        return this.permissionService.findAll();
    }
    async findById(id) {
        return this.permissionService.findById(id);
    }
    async findByResource(resource) {
        return this.permissionService.findByResource(resource);
    }
    async create(data) {
        return this.permissionService.create(data);
    }
    async update(id, data) {
        return this.permissionService.update(id, data);
    }
    async delete(id) {
        await this.permissionService.delete(id);
        return { message: 'Permission deleted successfully' };
    }
};
exports.PermissionController = PermissionController;
__decorate([
    (0, common_1.Get)(),
    (0, swagger_1.ApiOperation)({
        summary: 'List all permissions',
        description: 'Returns all permissions in the system'
    }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'List of permissions' }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], PermissionController.prototype, "findAll", null);
__decorate([
    (0, common_1.Get)(':id'),
    (0, swagger_1.ApiOperation)({
        summary: 'Get permission by ID',
        description: 'Returns a permission with its details'
    }),
    (0, swagger_1.ApiParam)({ name: 'id', type: String, description: 'Permission ID' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Permission found' }),
    (0, swagger_1.ApiResponse)({ status: 404, description: 'Permission not found' }),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], PermissionController.prototype, "findById", null);
__decorate([
    (0, common_1.Get)('resource/:resource'),
    (0, swagger_1.ApiOperation)({
        summary: 'Get permissions by resource',
        description: 'Returns all permissions for a specific resource (e.g., members, projects)'
    }),
    (0, swagger_1.ApiParam)({ name: 'resource', type: String, example: 'members', description: 'Resource name' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'List of permissions' }),
    __param(0, (0, common_1.Param)('resource')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], PermissionController.prototype, "findByResource", null);
__decorate([
    (0, common_1.Post)(),
    (0, swagger_1.ApiOperation)({
        summary: 'Create permission',
        description: 'Creates a new permission in the system'
    }),
    (0, swagger_1.ApiBody)({ type: permission_dto_1.CreatePermissionDto }),
    (0, swagger_1.ApiResponse)({ status: 201, description: 'Permission created' }),
    (0, swagger_1.ApiResponse)({ status: 400, description: 'Invalid data or permission already exists' }),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [permission_dto_1.CreatePermissionDto]),
    __metadata("design:returntype", Promise)
], PermissionController.prototype, "create", null);
__decorate([
    (0, common_1.Put)(':id'),
    (0, swagger_1.ApiOperation)({
        summary: 'Update permission',
        description: 'Updates permission details'
    }),
    (0, swagger_1.ApiParam)({ name: 'id', type: String, description: 'Permission ID' }),
    (0, swagger_1.ApiBody)({ type: permission_dto_1.UpdatePermissionDto }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Permission updated' }),
    (0, swagger_1.ApiResponse)({ status: 404, description: 'Permission not found' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, permission_dto_1.UpdatePermissionDto]),
    __metadata("design:returntype", Promise)
], PermissionController.prototype, "update", null);
__decorate([
    (0, common_1.Delete)(':id'),
    (0, common_1.HttpCode)(200),
    (0, swagger_1.ApiOperation)({
        summary: 'Delete permission',
        description: 'Deletes a permission from the system'
    }),
    (0, swagger_1.ApiParam)({ name: 'id', type: String, description: 'Permission ID' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Permission deleted' }),
    (0, swagger_1.ApiResponse)({ status: 404, description: 'Permission not found' }),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], PermissionController.prototype, "delete", null);
exports.PermissionController = PermissionController = __decorate([
    (0, common_1.Controller)('permissions'),
    (0, swagger_1.ApiTags)('Permissions'),
    (0, common_1.UseGuards)(authorization_guard_1.AuthorizationGuard),
    (0, swagger_1.ApiBearerAuth)(),
    __metadata("design:paramtypes", [PermissionService_1.PermissionService])
], PermissionController);
