"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.OrganizationModule = void 0;
const common_1 = require("@nestjs/common");
const OrganizationController_1 = require("../controllers/OrganizationController");
const OrganizationService_1 = require("../services/OrganizationService");
const OrganizationRepository_1 = require("../repositories/OrganizationRepository");
const tenant_middleware_1 = require("../middlewares/tenant.middleware");
const auth_module_1 = require("./auth.module");
const OrgHomeController_1 = require("../controllers/OrgHomeController");
const OrgHomeService_1 = require("../services/OrgHomeService");
const MediaAssetService_1 = require("../services/MediaAssetService");
const AccountProvisioningService_1 = require("../services/AccountProvisioningService");
const HierarchyTemplateService_1 = require("../services/HierarchyTemplateService");
let OrganizationModule = class OrganizationModule {
    configure(consumer) {
        consumer
            .apply(tenant_middleware_1.TenantMiddleware)
            .forRoutes({ path: '*', method: common_1.RequestMethod.ALL });
    }
};
exports.OrganizationModule = OrganizationModule;
exports.OrganizationModule = OrganizationModule = __decorate([
    (0, common_1.Module)({
        imports: [auth_module_1.AuthModule],
        controllers: [
            OrganizationController_1.OrganizationController,
            OrganizationController_1.TenantPublicController,
            OrgHomeController_1.PublicOrgHomeController,
            OrgHomeController_1.PublicHomeMediaController,
            OrgHomeController_1.OrgHomeAdminController,
        ],
        providers: [OrganizationService_1.OrganizationService, OrganizationRepository_1.OrganizationRepository, OrgHomeService_1.OrgHomeService, MediaAssetService_1.MediaAssetService, AccountProvisioningService_1.AccountProvisioningService, HierarchyTemplateService_1.HierarchyTemplateService],
        exports: [OrganizationService_1.OrganizationService, OrganizationRepository_1.OrganizationRepository, OrgHomeService_1.OrgHomeService],
    })
], OrganizationModule);
