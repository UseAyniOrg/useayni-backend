"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.MiscellaneousModule = void 0;
const common_1 = require("@nestjs/common");
const MiscellaneousController_1 = require("../controllers/MiscellaneousController");
const AttendanceFormController_1 = require("../controllers/AttendanceFormController");
const MiscellaneousService_1 = require("../services/MiscellaneousService");
const MiscellaneousAccessService_1 = require("../services/MiscellaneousAccessService");
const MiscellaneousWaitlistAttendanceService_1 = require("../services/MiscellaneousWaitlistAttendanceService");
const FormService_1 = require("../services/FormService");
const MiscellaneousRepository_1 = require("../repositories/MiscellaneousRepository");
const MiscellaneousSubRepositories_1 = require("../repositories/MiscellaneousSubRepositories");
const AttendanceFormRepositories_1 = require("../repositories/AttendanceFormRepositories");
const MemberRepository_1 = require("../repositories/MemberRepository");
const requireFeature_decorator_1 = require("../middlewares/requireFeature.decorator");
const ExternalEventRegistrationService_1 = require("../services/ExternalEventRegistrationService");
const MediaAssetService_1 = require("../services/MediaAssetService");
const communitySession_guard_1 = require("../middlewares/communitySession.guard");
const ExternalProfileTypesController_1 = require("../controllers/ExternalProfileTypesController");
const ExternalProfileTypesService_1 = require("../services/ExternalProfileTypesService");
let MiscellaneousModule = class MiscellaneousModule {
};
exports.MiscellaneousModule = MiscellaneousModule;
exports.MiscellaneousModule = MiscellaneousModule = __decorate([
    (0, common_1.Module)({
        controllers: [
            ExternalProfileTypesController_1.ExternalProfileTypesController,
            ExternalProfileTypesController_1.PlatformExternalProfileTypesController,
            MiscellaneousController_1.MiscellaneousController,
            MiscellaneousController_1.ApprovalController,
            MiscellaneousController_1.MyInvitesController,
            AttendanceFormController_1.AttendanceController,
            AttendanceFormController_1.AttendanceSessionController,
            AttendanceFormController_1.FormController,
            AttendanceFormController_1.PublicController,
            AttendanceFormController_1.ExternalProfileController,
            AttendanceFormController_1.EventParticipationController,
        ],
        providers: [
            ExternalProfileTypesService_1.ExternalProfileTypesService,
            MiscellaneousService_1.MiscellaneousService,
            MiscellaneousAccessService_1.MiscellaneousAccessService,
            MiscellaneousWaitlistAttendanceService_1.MiscellaneousWaitlistService,
            MiscellaneousWaitlistAttendanceService_1.AttendanceService,
            FormService_1.FormService,
            MiscellaneousRepository_1.MiscellaneousRepository,
            MiscellaneousSubRepositories_1.MiscellaneousOwnerRepository,
            MiscellaneousSubRepositories_1.MiscellaneousParticipantRepository,
            MiscellaneousSubRepositories_1.MiscellaneousWaitlistRepository,
            MiscellaneousSubRepositories_1.MiscellaneousRequestRepository,
            MiscellaneousSubRepositories_1.MiscellaneousInviteRepository,
            MiscellaneousSubRepositories_1.MiscellaneousApprovalLogRepository,
            AttendanceFormRepositories_1.AttendanceRepository,
            AttendanceFormRepositories_1.FormRepository,
            MemberRepository_1.MemberRepository,
            requireFeature_decorator_1.FeatureFlagGuard,
            communitySession_guard_1.CommunitySessionGuard,
            ExternalEventRegistrationService_1.ExternalEventRegistrationService,
            MediaAssetService_1.MediaAssetService,
        ],
        exports: [MiscellaneousService_1.MiscellaneousService],
    })
], MiscellaneousModule);
