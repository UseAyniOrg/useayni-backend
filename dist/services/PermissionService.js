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
exports.PermissionService = void 0;
const common_1 = require("@nestjs/common");
const PermissionRepository_1 = require("../repositories/PermissionRepository");
let PermissionService = class PermissionService {
    constructor(permissionRepository) {
        this.permissionRepository = permissionRepository;
    }
    async findAll() {
        return this.permissionRepository.findAll();
    }
    async findById(id) {
        const permission = await this.permissionRepository.findById(id);
        if (!permission)
            throw new Error("Permissão não encontrada");
        return permission;
    }
    async findByResource(resource) {
        return this.permissionRepository.findByResource(resource);
    }
    async create(data) {
        return this.permissionRepository.create(data);
    }
    async update(id, data) {
        return this.permissionRepository.update(id, data);
    }
    async delete(id) {
        return this.permissionRepository.delete(id);
    }
};
exports.PermissionService = PermissionService;
exports.PermissionService = PermissionService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [PermissionRepository_1.PermissionRepository])
], PermissionService);
