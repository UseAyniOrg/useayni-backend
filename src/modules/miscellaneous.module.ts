import { Module } from '@nestjs/common';
import {
  MiscellaneousController,
  ApprovalController,
  MyInvitesController,
} from '../controllers/MiscellaneousController';
import {
  AttendanceController,
  AttendanceSessionController,
  FormController,
  PublicController,
  ExternalProfileController,
  EventParticipationController,
} from '../controllers/AttendanceFormController';
import { MiscellaneousService } from '../services/MiscellaneousService';
import { MiscellaneousAccessService } from '../services/MiscellaneousAccessService';
import {
  MiscellaneousWaitlistService,
  AttendanceService,
} from '../services/MiscellaneousWaitlistAttendanceService';
import { FormService } from '../services/FormService';
import { MiscellaneousRepository } from '../repositories/MiscellaneousRepository';
import {
  MiscellaneousOwnerRepository,
  MiscellaneousParticipantRepository,
  MiscellaneousWaitlistRepository,
  MiscellaneousRequestRepository,
  MiscellaneousInviteRepository,
  MiscellaneousApprovalLogRepository,
} from '../repositories/MiscellaneousSubRepositories';
import { AttendanceRepository, FormRepository } from '../repositories/AttendanceFormRepositories';
import { MemberRepository } from '../repositories/MemberRepository';
import { FeatureFlagGuard } from '../middlewares/requireFeature.decorator';
import { ExternalEventRegistrationService } from '../services/ExternalEventRegistrationService';
import { MediaAssetService } from '../services/MediaAssetService';
import { CommunitySessionGuard } from '../middlewares/communitySession.guard';
import { ExternalProfileTypesController, PlatformExternalProfileTypesController } from '../controllers/ExternalProfileTypesController';
import { ExternalProfileTypesService } from '../services/ExternalProfileTypesService';

@Module({
  controllers: [
    ExternalProfileTypesController,
    PlatformExternalProfileTypesController,
    MiscellaneousController,
    ApprovalController,
    MyInvitesController,
    AttendanceController,
    AttendanceSessionController,
    FormController,
    PublicController,
    ExternalProfileController,
    EventParticipationController,
  ],
  providers: [
    ExternalProfileTypesService,
    MiscellaneousService,
    MiscellaneousAccessService,
    MiscellaneousWaitlistService,
    AttendanceService,
    FormService,
    MiscellaneousRepository,
    MiscellaneousOwnerRepository,
    MiscellaneousParticipantRepository,
    MiscellaneousWaitlistRepository,
    MiscellaneousRequestRepository,
    MiscellaneousInviteRepository,
    MiscellaneousApprovalLogRepository,
    AttendanceRepository,
    FormRepository,
    MemberRepository,
    FeatureFlagGuard,
    CommunitySessionGuard,
    ExternalEventRegistrationService,
    MediaAssetService,
  ],
  exports: [MiscellaneousService],
})
export class MiscellaneousModule {}
