"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PermissionRepository = void 0;
const common_1 = require("@nestjs/common");
const db_1 = require("../db");
const permission_1 = require("../models/permission");
let PermissionRepository = class PermissionRepository {
    constructor() {
        this.repository = db_1.AppDataBase.getRepository(permission_1.Permission);
    }
    async findAll() {
        return this.repository.find();
    }
    async findById(id) {
        return this.repository.findOne({ where: { id } });
    }
    async findByResource(resource) {
        return this.repository.find({ where: { resource } });
    }
    async create(data) {
        const permission = this.repository.create(data);
        return this.repository.save(permission);
    }
    async update(id, data) {
        await this.repository.update(id, data);
        return this.findById(id);
    }
    async delete(id) {
        await this.repository.delete(id);
    }
};
exports.PermissionRepository = PermissionRepository;
exports.PermissionRepository = PermissionRepository = __decorate([
    (0, common_1.Injectable)()
], PermissionRepository);
