"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.OrgUnitModule = void 0;
const common_1 = require("@nestjs/common");
const OrgUnitController_1 = require("../controllers/OrgUnitController");
const OrgUnitService_1 = require("../services/OrgUnitService");
const OrgUnitRepository_1 = require("../repositories/OrgUnitRepository");
const requireFeature_decorator_1 = require("../middlewares/requireFeature.decorator");
let OrgUnitModule = class OrgUnitModule {
};
exports.OrgUnitModule = OrgUnitModule;
exports.OrgUnitModule = OrgUnitModule = __decorate([
    (0, common_1.Module)({
        controllers: [
            OrgUnitController_1.OrgUnitTypeController,
            OrgUnitController_1.OrgUnitController,
            OrgUnitController_1.PositionController,
            OrgUnitController_1.MandateController,
        ],
        providers: [OrgUnitService_1.OrgUnitService, OrgUnitRepository_1.OrgUnitRepository, requireFeature_decorator_1.FeatureFlagGuard],
        exports: [OrgUnitService_1.OrgUnitService],
    })
], OrgUnitModule);
