"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppModule = void 0;
const common_1 = require("@nestjs/common");
const member_module_1 = require("./member.module");
const auth_module_1 = require("./auth.module");
const academic_module_1 = require("./academic.module");
const car_module_1 = require("./car.module");
const role_module_1 = require("./role.module");
const cae_module_1 = require("./cae.module");
const courseManager_module_1 = require("./courseManager.module");
const miscellaneous_module_1 = require("./miscellaneous.module");
// ─── Multi-tenant modules ─────────────────────────────────────────────────
const organization_module_1 = require("./organization.module");
const orgUnit_module_1 = require("./orgUnit.module");
const mediaStorage_module_1 = require("./mediaStorage.module");
const email_module_1 = require("./email.module");
let AppModule = class AppModule {
};
exports.AppModule = AppModule;
exports.AppModule = AppModule = __decorate([
    (0, common_1.Module)({
        imports: [
            email_module_1.EmailModule,
            // Multi-tenant foundation — must come first so TenantMiddleware is registered
            organization_module_1.OrganizationModule,
            orgUnit_module_1.OrgUnitModule,
            mediaStorage_module_1.MediaStorageModule,
            // Existing modules
            member_module_1.MemberModule,
            auth_module_1.AuthModule,
            academic_module_1.AcademicModule,
            car_module_1.CarModule,
            role_module_1.RoleModule,
            cae_module_1.CaeModule,
            courseManager_module_1.CourseManagerModule,
            miscellaneous_module_1.MiscellaneousModule,
        ],
    })
], AppModule);
