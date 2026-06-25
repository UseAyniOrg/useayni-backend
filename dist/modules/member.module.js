"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.MemberModule = void 0;
const common_1 = require("@nestjs/common");
const MembersController_1 = require("../controllers/MembersController");
const MemberService_1 = require("../services/MemberService");
const MemberRepository_1 = require("../repositories/MemberRepository");
const TokenRepository_1 = require("../repositories/TokenRepository");
const StateRepository_1 = require("../repositories/StateRepository");
const CityRepository_1 = require("../repositories/CityRepository");
const UniversityRepository_1 = require("../repositories/UniversityRepository");
const CourseRepository_1 = require("../repositories/CourseRepository");
const CourseUniversityRepository_1 = require("../repositories/CourseUniversityRepository");
const RoleRepository_1 = require("../repositories/RoleRepository");
let MemberModule = class MemberModule {
};
exports.MemberModule = MemberModule;
exports.MemberModule = MemberModule = __decorate([
    (0, common_1.Module)({
        controllers: [MembersController_1.MemberController],
        providers: [
            MemberService_1.MemberService,
            MemberRepository_1.MemberRepository,
            TokenRepository_1.TokenRepository,
            StateRepository_1.StateRepository,
            CityRepository_1.CityRepository,
            UniversityRepository_1.UniversityRepository,
            CourseRepository_1.CourseRepository,
            CourseUniversityRepository_1.CourseUniversityRepository,
            RoleRepository_1.RoleRepository,
        ],
        exports: [MemberService_1.MemberService],
    })
], MemberModule);
