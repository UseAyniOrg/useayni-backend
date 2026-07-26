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

@Module({
  controllers: [
    MiscellaneousController,
    ApprovalController,
    MyInvitesController,
    AttendanceController,
    AttendanceSessionController,
    FormController,
    PublicController,
  ],
  providers: [
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
  ],
  exports: [MiscellaneousService],
})
export class MiscellaneousModule {}
