import {
  Controller, Get, Post, Patch, Param, Body, Req,
  HttpCode, HttpStatus, UseGuards, NotFoundException,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { Request } from 'express';
import { AuthorizationGuard } from '../middlewares/authorization.guard';
import { AttendanceService } from '../services/MiscellaneousWaitlistAttendanceService';
import { FormService } from '../services/FormService';
import { MiscellaneousRepository } from '../repositories/MiscellaneousRepository';
import { CreateAttendanceSessionDto, ManualCheckInDto } from '../dto/miscellaneous/actions.dto';
import { CreateFormDto, CreateFormQuestionDto, ReorderQuestionsDto, SubmitFormResponseDto } from '../dto/miscellaneous/form.dto';

@Controller('miscellaneous/:miscId/attendance-sessions')
@ApiTags('Attendance')
@UseGuards(AuthorizationGuard)
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
    return this.attendanceService.createSession(miscId, req.user!.id, dto);
  }

  @Get()
  @ApiOperation({ summary: 'List attendance sessions' })
  async listSessions(@Param('miscId') miscId: string) {
    return this.attendanceService.listSessions(miscId);
  }
}

@Controller('attendance-sessions')
@ApiTags('Attendance')
export class AttendanceSessionController {
  constructor(private readonly attendanceService: AttendanceService) {}

  @Get(':sessionId/token')
  @UseGuards(AuthorizationGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get QR token for current user' })
  async getToken(@Param('sessionId') sessionId: string, @Req() req: Request) {
    return this.attendanceService.getOrCreateToken(sessionId, req.user!.id);
  }

  @Post(':sessionId/check-in')
  @UseGuards(AuthorizationGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Check-in via QR token (owner only)' })
  async checkIn(
    @Param('sessionId') sessionId: string,
    @Body('token') token: string,
    @Req() req: Request,
  ) {
    return this.attendanceService.checkInByQr(sessionId, token, req.user!.id);
  }

  @Patch(':sessionId/records/:userId')
  @UseGuards(AuthorizationGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Manual check-in (owner only)' })
  async manualCheckIn(
    @Param('sessionId') sessionId: string,
    @Param('userId') userId: string,
    @Body() dto: ManualCheckInDto,
    @Req() req: Request,
  ) {
    return this.attendanceService.manualCheckIn(sessionId, userId, req.user!.id, dto);
  }

  @Get(':sessionId/records')
  @UseGuards(AuthorizationGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'List attendance records' })
  async getRecords(@Param('sessionId') sessionId: string) {
    return this.attendanceService.getRecords(sessionId);
  }
}

@Controller('forms')
@ApiTags('Forms')
export class FormController {
  constructor(private readonly formService: FormService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @UseGuards(AuthorizationGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create form' })
  async createForm(@Body() dto: CreateFormDto, @Req() req: Request) {
    return this.formService.createForm(dto, req.user!.id);
  }

  @Get(':id')
  @UseGuards(AuthorizationGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get form by ID' })
  async getForm(@Param('id') id: string) {
    return this.formService.getForm(id);
  }

  @Post(':id/questions')
  @HttpCode(HttpStatus.CREATED)
  @UseGuards(AuthorizationGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Add question to form' })
  async addQuestion(@Param('id') id: string, @Body() dto: CreateFormQuestionDto, @Req() req: Request) {
    return this.formService.addQuestion(id, dto, req.user!.id);
  }

  @Patch(':id/questions/reorder')
  @UseGuards(AuthorizationGuard)
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
  @UseGuards(AuthorizationGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get form results' })
  async getResults(@Param('id') id: string, @Req() req: Request) {
    return this.formService.getResults(id, req.user!.id);
  }
}

@Controller('public')
@ApiTags('Public')
export class PublicController {
  constructor(
    private readonly miscRepo: MiscellaneousRepository,
    private readonly formService: FormService,
  ) {}

  @Get('eventos/:slug')
  @ApiOperation({ summary: 'Public event page (no auth)' })
  async publicEvent(@Param('slug') slug: string) {
    const misc = await this.miscRepo.findBySlug(slug);
    if (!misc || !misc.public_access_enabled) {
      throw new NotFoundException('Evento n\u00e3o encontrado');
    }
    return misc;
  }

  @Get('formularios/:slug')
  @ApiOperation({ summary: 'Public form page (no auth)' })
  async publicForm(@Param('slug') slug: string) {
    return this.formService.getFormBySlug(slug);
  }
}
