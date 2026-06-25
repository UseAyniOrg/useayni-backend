"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AcademicModule = void 0;
const common_1 = require("@nestjs/common");
const UniversityController_1 = require("../controllers/UniversityController");
const CourseController_1 = require("../controllers/CourseController");
const CityController_1 = require("../controllers/CityController");
const StateController_1 = require("../controllers/StateController");
const UniversityRepository_1 = require("../repositories/UniversityRepository");
const CourseRepository_1 = require("../repositories/CourseRepository");
const CityRepository_1 = require("../repositories/CityRepository");
const StateRepository_1 = require("../repositories/StateRepository");
const MecCourseSyncService_1 = require("../services/MecCourseSyncService");
const MecUniversitySyncService_1 = require("../services/MecUniversitySyncService");
let AcademicModule = class AcademicModule {
};
exports.AcademicModule = AcademicModule;
exports.AcademicModule = AcademicModule = __decorate([
    (0, common_1.Module)({
        controllers: [UniversityController_1.UniversityController, CourseController_1.CourseController, CityController_1.CityController, StateController_1.StateController],
        providers: [
            UniversityRepository_1.UniversityRepository,
            CourseRepository_1.CourseRepository,
            CityRepository_1.CityRepository,
            StateRepository_1.StateRepository,
            MecCourseSyncService_1.MecCourseSyncService,
            MecUniversitySyncService_1.MecUniversitySyncService,
        ],
        exports: [
            UniversityRepository_1.UniversityRepository,
            CourseRepository_1.CourseRepository,
            CityRepository_1.CityRepository,
            StateRepository_1.StateRepository,
            MecCourseSyncService_1.MecCourseSyncService,
            MecUniversitySyncService_1.MecUniversitySyncService,
        ],
    })
], AcademicModule);
