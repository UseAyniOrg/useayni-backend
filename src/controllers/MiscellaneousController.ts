import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
  Query,
  Req,
  HttpCode,
  HttpStatus,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { Request } from 'express';
import { AuthorizationGuard } from '../middlewares/authorization.guard';
import { MiscellaneousService } from '../services/MiscellaneousService';
import { MiscellaneousAccessService } from '../services/MiscellaneousAccessService';
import {
  MiscellaneousWaitlistService,
  AttendanceService,
} from '../services/MiscellaneousWaitlistAttendanceService';
import {
  CreateMiscellaneousDto,
  UpdateMiscellaneousDto,
  MiscellaneousFiltersDto,
} from '../dto/miscellaneous/miscellaneous.dto';
import {
  ApprovalActionDto,
  CreateRequestDto,
  ReviewRequestDto,
  CreateInviteDto,
  RejectInviteDto,
} from '../dto/miscellaneous/actions.dto';

@Controller('miscellaneous')
@ApiTags('Miscellaneous')
@UseGuards(AuthorizationGuard)
@ApiBearerAuth()
export class MiscellaneousController {
  constructor(
    private readonly miscService: MiscellaneousService,
    private readonly accessService: MiscellaneousAccessService,
    private readonly waitlistService: MiscellaneousWaitlistService
  ) {}

  // ─── CRUD ─────────────────────────────────────────────────────────────────

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create miscellaneous' })
  async create(@Body() dto: CreateMiscellaneousDto, @Req() req: Request) {
    const user = req.user!;
    return this.miscService.create(dto, user.id, user.roles);
  }

  @Get()
  @ApiOperation({ summary: 'List miscellaneous with filters' })
  async findAll(@Query() filters: MiscellaneousFiltersDto, @Req() req: Request) {
    return this.miscService.findAll(filters, req.user!.id);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get miscellaneous by ID' })
  async findOne(@Param('id') id: string) {
    return this.miscService.findById(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update miscellaneous' })
  async update(@Param('id') id: string, @Body() dto: UpdateMiscellaneousDto, @Req() req: Request) {
    return this.miscService.update(id, dto, req.user!.id);
  }

  @Patch(':id/archive')
  @ApiOperation({ summary: 'Archive miscellaneous' })
  async archive(@Param('id') id: string, @Req() req: Request) {
    await this.miscService.archive(id, req.user!.id);
    return { message: 'Miscelânea arquivada com sucesso' };
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Soft-delete miscellaneous' })
  async remove(@Param('id') id: string, @Req() req: Request) {
    await this.miscService.remove(id, req.user!.id);
  }

  // ─── HIERARCHY ────────────────────────────────────────────────────────────

  @Get(':id/children')
  @ApiOperation({ summary: 'Get children grouped by type' })
  async getChildren(@Param('id') id: string) {
    return this.miscService.getChildren(id);
  }

  // ─── PEOPLE ───────────────────────────────────────────────────────────────

  @Get(':id/people')
  @ApiOperation({ summary: 'Get owners and members' })
  async getPeople(@Param('id') id: string) {
    return this.miscService.getPeople(id);
  }

  @Get(':id/search-members')
  @ApiOperation({ summary: 'Search members by name or email' })
  async searchMembers(@Param('id') id: string, @Query('query') query: string, @Req() req: Request) {
    return this.miscService.searchMembers(id, req.user!.id, query);
  }

  @Post(':id/owners')
  @ApiOperation({ summary: 'Add co-owner' })
  async addOwner(
    @Param('id') id: string,
    @Body() body: { member_id?: string; member_query?: string },
    @Req() req: Request
  ) {
    const targetMemberId = await this.miscService.resolveMemberTarget(
      body.member_id,
      body.member_query
    );
    return this.miscService.addOwner(id, targetMemberId, req.user!.id);
  }

  @Delete(':id/owners/:userId')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Remove owner' })
  async removeOwner(@Param('id') id: string, @Param('userId') userId: string, @Req() req: Request) {
    await this.miscService.removeOwner(id, userId, req.user!.id);
  }

  @Post(':id/join')
  @ApiOperation({ summary: 'Join miscellaneous (any authenticated member)' })
  async joinMiscellaneous(@Param('id') id: string, @Req() req: Request) {
    return this.miscService.joinSelf(id, req.user!.id);
  }

  @Post(':id/members')
  @ApiOperation({ summary: 'Add member (owner only)' })
  async addMember(
    @Param('id') id: string,
    @Body() body: { member_id?: string; member_query?: string },
    @Req() req: Request
  ) {
    const targetMemberId = await this.miscService.resolveMemberTarget(
      body.member_id,
      body.member_query
    );
    return this.miscService.addMember(id, targetMemberId, req.user!.id);
  }

  @Delete(':id/members/:userId')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Remove member' })
  async removeMember(
    @Param('id') id: string,
    @Param('userId') userId: string,
    @Req() req: Request
  ) {
    await this.miscService.removeMember(id, userId, req.user!.id);
  }

  // ─── APPROVAL ─────────────────────────────────────────────────────────────

  @Patch(':id/approve')
  @ApiOperation({ summary: 'Approve miscellaneous (manager only)' })
  async approve(@Param('id') id: string, @Body() dto: ApprovalActionDto, @Req() req: Request) {
    await this.miscService.approve(id, req.user!.id, dto);
    return { message: 'Miscelânea aprovada com sucesso' };
  }

  @Patch(':id/reject')
  @ApiOperation({ summary: 'Reject miscellaneous' })
  async reject(@Param('id') id: string, @Body() dto: ApprovalActionDto, @Req() req: Request) {
    await this.miscService.reject(id, req.user!.id, dto);
    return { message: 'Miscelânea rejeitada' };
  }

  @Patch(':id/request-review')
  @ApiOperation({ summary: 'Request review for miscellaneous' })
  async requestReview(
    @Param('id') id: string,
    @Body() dto: ApprovalActionDto,
    @Req() req: Request
  ) {
    await this.miscService.requestReview(id, req.user!.id, dto);
    return { message: 'Solicitação de revisão registrada' };
  }

  @Get(':id/approval-history')
  @ApiOperation({ summary: 'Get approval history' })
  async approvalHistory(@Param('id') id: string) {
    return this.miscService.getApprovalHistory(id);
  }

  // ─── REQUESTS ─────────────────────────────────────────────────────────────

  @Post(':id/requests')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Submit participation request' })
  async createRequest(@Param('id') id: string, @Body() dto: CreateRequestDto, @Req() req: Request) {
    return this.accessService.createRequest(id, req.user!.id, dto);
  }

  @Get(':id/requests')
  @ApiOperation({ summary: 'List participation requests (owner only)' })
  async listRequests(@Param('id') id: string, @Req() req: Request) {
    return this.accessService.listRequests(id, req.user!.id);
  }

  @Patch(':id/requests/:requestId')
  @ApiOperation({ summary: 'Approve or reject request (owner only)' })
  async reviewRequest(
    @Param('id') id: string,
    @Param('requestId') requestId: string,
    @Body() dto: ReviewRequestDto,
    @Req() req: Request
  ) {
    return this.accessService.reviewRequest(id, requestId, req.user!.id, dto);
  }

  // ─── INVITES ──────────────────────────────────────────────────────────────

  @Post(':id/invites')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Send invite (owner only)' })
  async createInvite(@Param('id') id: string, @Body() dto: CreateInviteDto, @Req() req: Request) {
    return this.accessService.createInvite(id, req.user!.id, dto);
  }

  @Get(':id/invites')
  @ApiOperation({ summary: 'List pending invites (owner only)' })
  async listInvites(@Param('id') id: string, @Req() req: Request) {
    return this.accessService.listPendingInvites(id, req.user!.id);
  }

  @Patch(':id/invites/:inviteId/accept')
  @ApiOperation({ summary: 'Accept invite' })
  async acceptInvite(
    @Param('id') id: string,
    @Param('inviteId') inviteId: string,
    @Req() req: Request
  ) {
    await this.accessService.acceptInvite(id, inviteId, req.user!.id);
    return { message: 'Convite aceito' };
  }

  @Patch(':id/invites/:inviteId/reject')
  @ApiOperation({ summary: 'Reject invite' })
  async rejectInvite(
    @Param('id') id: string,
    @Param('inviteId') inviteId: string,
    @Body() dto: RejectInviteDto,
    @Req() req: Request
  ) {
    await this.accessService.rejectInvite(id, inviteId, req.user!.id, dto);
    return { message: 'Convite recusado' };
  }

  @Delete(':id/invites/:inviteId')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Cancel invite (owner only)' })
  async cancelInvite(
    @Param('id') id: string,
    @Param('inviteId') inviteId: string,
    @Req() req: Request
  ) {
    await this.accessService.cancelInvite(id, inviteId, req.user!.id);
  }

  // ─── WAITLIST ─────────────────────────────────────────────────────────────

  @Post(':id/waitlist/join')
  @ApiOperation({ summary: 'Join waitlist' })
  async joinWaitlist(@Param('id') id: string, @Req() req: Request) {
    return this.waitlistService.joinWaitlist(id, req.user!.id);
  }

  @Get(':id/waitlist')
  @ApiOperation({ summary: 'Get waitlist (owner only)' })
  async getWaitlist(@Param('id') id: string, @Req() req: Request) {
    return this.waitlistService.getWaitlist(id, req.user!.id);
  }

  @Post(':id/waitlist/promote/:userId')
  @ApiOperation({ summary: 'Promote user from waitlist (owner only)' })
  async promote(@Param('id') id: string, @Param('userId') userId: string, @Req() req: Request) {
    await this.waitlistService.promote(id, userId, req.user!.id);
    return { message: 'Usuário promovido da lista de espera' };
  }

  @Post(':id/registrations/close')
  @ApiOperation({ summary: 'Close registrations manually (owner only)' })
  async closeRegistrations(@Param('id') id: string, @Req() req: Request) {
    await this.miscService.ensureOwner(id, req.user!.id);
    await this.miscService.closeRegistrations(id);
    return { message: 'Inscrições encerradas' };
  }

  // ─── PUBLIC ACCESS ────────────────────────────────────────────────────────

  @Post(':id/public-access/enable')
  @ApiOperation({ summary: 'Enable public access (owner only)' })
  async enablePublicAccess(@Param('id') id: string, @Req() req: Request) {
    const slug = await this.miscService.enablePublicAccess(id, req.user!.id);
    return { slug, url: `/p/${slug}` };
  }

  @Post(':id/public-access/disable')
  @ApiOperation({ summary: 'Disable public access (owner only)' })
  async disablePublicAccess(@Param('id') id: string, @Req() req: Request) {
    await this.miscService.disablePublicAccess(id, req.user!.id);
    return { message: 'Acesso público desativado' };
  }
}

@Controller('approvals')
@ApiTags('Approvals')
@UseGuards(AuthorizationGuard)
@ApiBearerAuth()
export class ApprovalController {
  constructor(private readonly miscService: MiscellaneousService) {}

  @Get('pending')
  @ApiOperation({ summary: 'List all pending approvals (manager)' })
  async listPending() {
    return this.miscService.getPendingApprovals();
  }
}

@Controller('invites')
@ApiTags('Invites')
@UseGuards(AuthorizationGuard)
@ApiBearerAuth()
export class MyInvitesController {
  constructor(private readonly accessService: MiscellaneousAccessService) {}

  @Get('mine')
  @ApiOperation({ summary: 'List my pending invites' })
  async myInvites(@Req() req: Request) {
    return this.accessService.listMyInvites(req.user!.id);
  }
}
