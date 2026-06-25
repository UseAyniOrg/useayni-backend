"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.RoleModule = void 0;
const common_1 = require("@nestjs/common");
const RoleController_1 = require("../controllers/RoleController");
const PermissionController_1 = require("../controllers/PermissionController");
const RoleService_1 = require("../services/RoleService");
const PermissionService_1 = require("../services/PermissionService");
const RoleRepository_1 = require("../repositories/RoleRepository");
const PermissionRepository_1 = require("../repositories/PermissionRepository");
let RoleModule = class RoleModule {
};
exports.RoleModule = RoleModule;
exports.RoleModule = RoleModule = __decorate([
    (0, common_1.Module)({
        controllers: [RoleController_1.RoleController, PermissionController_1.PermissionController],
        providers: [RoleService_1.RoleService, PermissionService_1.PermissionService, RoleRepository_1.RoleRepository, PermissionRepository_1.PermissionRepository],
        exports: [RoleService_1.RoleService, PermissionService_1.PermissionService, RoleRepository_1.RoleRepository, PermissionRepository_1.PermissionRepository],
    })
], RoleModule);
