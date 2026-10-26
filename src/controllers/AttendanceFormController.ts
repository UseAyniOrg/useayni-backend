import {
  Controller, Get, Post, Patch, Delete, Param, Body, Req,
  HttpCode, HttpStatus, UseGuards, NotFoundException, ParseUUIDPipe,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { Request } from 'express';
import { AuthorizationGuard } from '../middlewares/authorization.guard';
import { FeatureFlagGuard, RequireFeature } from '../middlewares/requireFeature.decorator';
import { ExternalEventRegistrationService } from '../services/ExternalEventRegistrationService';
import { AttendanceService } from '../services/MiscellaneousWaitlistAttendanceService';
import { FormService } from '../services/FormService';
import { MiscellaneousRepository } from '../repositories/MiscellaneousRepository';
import { CreateAttendanceSessionDto, ManualCheckInDto } from '../dto/miscellaneous/actions.dto';
import { CreateFormDto, CreateFormQuestionDto, ReorderQuestionsDto, SubmitFormResponseDto } from '../dto/miscellaneous/form.dto';
import { MediaAssetService } from '../services/MediaAssetService';
import { CommunitySessionGuard } from '../middlewares/communitySession.guard';

@Controller('miscellaneous/:miscId/attendance-sessions')
@ApiTags('Attendance')
@UseGuards(AuthorizationGuard, FeatureFlagGuard)
@RequireFeature('miscellaneous_attendance')
@ApiBearerAuth()
export class AttendanceController {
  constructor(private readonly attendanceService: AttendanceService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create attendance session' })
  async createSession(
    @Param('miscId') miscId: string,
    @Body() dto: CreateAttendanceSessionDto,
    @Req() req: Request,
  ) {
    return this.attendanceService.createSession(miscId, req.user!.id, dto, req.user!);
  }

  @Get()
  @ApiOperation({ summary: 'List attendance sessions' })
  async listSessions(@Param('miscId') miscId: string) {
    return this.attendanceService.listSessions(miscId);
  }
}

@Controller('attendance-sessions')
@ApiTags('Attendance')
@UseGuards(AuthorizationGuard, FeatureFlagGuard)
@RequireFeature('miscellaneous_attendance')
export class AttendanceSessionController {
  constructor(private readonly attendanceService: AttendanceService) {}

  @Delete(':sessionId')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Permanently delete attendance session and its records (owner only)' })
  async deleteSession(@Param('sessionId', ParseUUIDPipe) sessionId: string, @Req() req: Request) {
    await this.attendanceService.deleteSession(sessionId, req.user!.id, req.user!);
  }

  @Get(':sessionId/token')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get QR token for current user' })
  async getToken(@Param('sessionId') sessionId: string, @Req() req: Request) {
    return this.attendanceService.getOrCreateToken(sessionId, req.user!.id);
  }

  @Post(':sessionId/check-in')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Check-in via QR token (owner only)' })
  async checkIn(
    @Param('sessionId') sessionId: string,
    @Body('token') token: string,
    @Req() req: Request,
  ) {
    return this.attendanceService.checkInByQr(sessionId, token, req.user!.id, req.user!);
  }

  @Patch(':sessionId/records/:userId')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Manual check-in (owner only)' })
  async manualCheckIn(
    @Param('sessionId') sessionId: string,
    @Param('userId') userId: string,
    @Body() dto: ManualCheckInDto,
    @Req() req: Request,
  ) {
    return this.attendanceService.manualCheckIn(sessionId, userId, req.user!.id, dto, req.user!);
  }

  @Get(':sessionId/records')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'List attendance records' })
  async getRecords(@Param('sessionId') sessionId: string) {
    return this.attendanceService.getRecords(sessionId);
  }
}

@Controller('forms')
@ApiTags('Forms')
@UseGuards(AuthorizationGuard, FeatureFlagGuard)
@RequireFeature('miscellaneous_forms')
export class FormController {
  constructor(private readonly formService: FormService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create form' })
  async createForm(@Body() dto: CreateFormDto, @Req() req: Request) {
    return this.formService.createForm(dto, req.user!.id);
  }

  @Get(':id')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get form by ID' })
  async getForm(@Param('id') id: string) {
    return this.formService.getForm(id);
  }

  @Post(':id/questions')
  @HttpCode(HttpStatus.CREATED)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Add question to form' })
  async addQuestion(@Param('id') id: string, @Body() dto: CreateFormQuestionDto, @Req() req: Request) {
    return this.formService.addQuestion(id, dto, req.user!.id);
  }

  @Patch(':id/questions/reorder')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Reorder questions' })
  async reorderQuestions(@Param('id') id: string, @Body() dto: ReorderQuestionsDto, @Req() req: Request) {
    await this.formService.reorderQuestions(id, dto, req.user!.id);
    return { message: 'Perguntas reordenadas' };
  }

  @Post(':id/responses')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Submit form response (public or authenticated)' })
  async submitResponse(@Param('id') id: string, @Body() dto: SubmitFormResponseDto, @Req() req: Request) {
    const userId = req.user?.id ?? null;
    return this.formService.submitResponse(id, dto, userId);
  }

  @Get(':id/results')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get form results' })
  async getResults(@Param('id') id: string, @Req() req: Request) {
    return this.formService.getResults(id, req.user!.id);
  }
}

@Controller('public')
@ApiTags('Public')
@UseGuards(FeatureFlagGuard)
@RequireFeature('miscellaneous_public')
export class PublicController {
  constructor(
    private readonly miscRepo: MiscellaneousRepository,
    private readonly formService: FormService,
    private readonly externalRegistrationService: ExternalEventRegistrationService,
    private readonly mediaService: MediaAssetService,
    private readonly attendanceService: AttendanceService,
  ) {}

  @Get('eventos/:slug')
  @ApiOperation({ summary: 'Public event page (no auth)' })
  async publicEvent(@Param('slug') slug: string, @Req() request: Request) {
    const misc = await this.miscRepo.findBySlug(slug);
    if (!misc || !misc.public_access_enabled) {
      throw new NotFoundException('Evento n\u00e3o encontrado');
    }
    const media = await this.mediaService.publicMiscellaneousMedia(
      request.tenant!.organization_id,
      misc.id,
    );
    return { ...misc, media };
  }

  @Get('formularios/:slug')
  @ApiOperation({ summary: 'Public form page (no auth)' })
  async publicForm(@Param('slug') slug: string, @Req() request: Request) {
    const form = await this.formService.getFormBySlug(slug);
    const media = form.miscellaneous_id
      ? await this.mediaService.publicMiscellaneousMedia(
          request.tenant!.organization_id,
          form.miscellaneous_id,
        )
      : null;
    return { ...form, media };
  }

  @Get('events/:slug/registration')
  @UseGuards(FeatureFlagGuard)
  @RequireFeature('miscellaneous_public')
  @ApiOperation({ summary: 'Get public event and external registration requirements' })
  async eventRegistrationInfo(@Param('slug') slug: string, @Req() request: Request) {
    const event = await this.externalRegistrationService.getPublicEvent(slug, request.tenant!.organization_id);
    const mediaEnabled = request.tenant!.features.includes('media_storage');
    const media = mediaEnabled ? await this.mediaService.publicMiscellaneousMedia(
      request.tenant!.organization_id,
      event.id,
    ) : null;
    return { ...event, media, media_enabled: mediaEnabled };
  }

  @Get('events/:slug/my-registration')
  @UseGuards(CommunitySessionGuard)
  async myRegistration(@Param('slug') slug: string, @Req() request: Request) {
    return this.externalRegistrationService.registrationStatus(slug, request.tenant!.organization_id, request.user?.account_id);
  }

  @Post('events/:slug/register')
  @HttpCode(HttpStatus.CREATED)
  @UseGuards(FeatureFlagGuard, CommunitySessionGuard)
  @RequireFeature('miscellaneous_public')
  @ApiOperation({ summary: 'Create a global external account and register for a public event' })
  async registerForEvent(
    @Param('slug') slug: string,
    @Body() body: {
      name: string;
      email: string;
      password?: string;
      phone?: string;
      cpf?: string;
      profile_type?: 'basic' | 'academic';
      academic_data?: {
        ra?: string;
        academic_email?: string;
        course?: string;
        institution?: string;
        city?: string;
        state?: string;
      };
      additional_attributes?: Record<string, unknown>;
      registration_data?: Record<string, unknown>;
      accepted_privacy?: boolean;
      organization_profile_key?: string;
      profile_data?: Record<string, unknown>;
    },
    @Req() request: Request,
  ) {
    return this.externalRegistrationService.register(slug, body, request.tenant!.organization_id, request.user?.account_id);
  }

  @Get('events/:slug/attendance')
  @UseGuards(CommunitySessionGuard)
  async participantAttendance(@Param('slug') slug: string, @Req() request: Request) {
    const participant = await this.externalRegistrationService.requireEventParticipant(slug, request.tenant!.organization_id, request.user?.account_id);
    if (!request.tenant!.features.includes('miscellaneous_attendance')) return [];
    return this.attendanceService.listSessions(participant.eventId);
  }

  @Get('events/:slug/attendance/:sessionId/token')
  @UseGuards(CommunitySessionGuard, FeatureFlagGuard)
  @RequireFeature('miscellaneous_attendance')
  async participantAttendanceToken(@Param('slug') slug: string, @Param('sessionId', ParseUUIDPipe) sessionId: string, @Req() request: Request) {
    const participant = await this.externalRegistrationService.requireEventParticipant(slug, request.tenant!.organization_id, request.user?.account_id);
    return this.attendanceService.getParticipantToken(participant.eventId, sessionId, participant.memberId);
  }
}

@Controller('external-profile')
@ApiTags('External profiles')
@UseGuards(AuthorizationGuard)
@ApiBearerAuth()
export class ExternalProfileController {
  constructor(private readonly externalRegistrationService: ExternalEventRegistrationService) {}

  @Get('me')
  @ApiOperation({ summary: 'Get the authenticated account external profile' })
  getMyProfile(@Req() request: Request) {
    return this.externalRegistrationService.getMyProfile(request.user?.account_id);
  }

  @Get('registrations')
  getMyRegistrations(@Req() request: Request) {
    return this.externalRegistrationService.getMyRegistrations(request.user?.account_id, request.tenant!.organization_id);
  }

  @Patch('me')
  @ApiOperation({ summary: 'Update the authenticated account external profile' })
  updateMyProfile(
    @Req() request: Request,
    @Body() body: {
      display_name?: string;
      phone?: string;
      profile_type?: 'basic' | 'academic';
      academic_data?: {
        ra?: string;
        academic_email?: string;
        course?: string;
        institution?: string;
        city?: string;
        state?: string;
      };
      additional_attributes?: Record<string, unknown>;
    },
  ) {
    return this.externalRegistrationService.updateMyProfile(request.user?.account_id, body);
  }
}

@Controller('event-participation')
@UseGuards(CommunitySessionGuard)
export class EventParticipationController {
  constructor(private readonly registrations: ExternalEventRegistrationService) {}

  @Get(':id/answers')
  getAnswers(@Param('id', ParseUUIDPipe) id: string, @Req() req: Request) {
    return this.registrations.getParticipantAnswers(id, req.tenant!.organization_id, req.user?.account_id);
  }

  @Patch(':id/answers')
  updateAnswers(@Param('id', ParseUUIDPipe) id: string, @Req() req: Request,
    @Body() input: { registration_data?: Record<string, unknown>; accepted_privacy?: boolean }) {
    return this.registrations.updateParticipantAnswers(id, req.tenant!.organization_id, req.user?.account_id, input);
  }
}
