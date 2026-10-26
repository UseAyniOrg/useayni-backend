import {
  Controller,
  Get,
  Post,
  Patch,
  Put,
  Delete,
  Param,
  Body,
  HttpStatus,
  HttpCode,
  Headers,
  HttpException,
  ForbiddenException,
  UnauthorizedException,
  BadRequestException,
  UseGuards,
  Req,
  Query,
} from "@nestjs/common";
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiBody,
  ApiBearerAuth,
  ApiQuery,
} from "@nestjs/swagger";
import { MemberService } from "../services/MemberService";
import { CreateMemberDto } from "../dto/members/create-member.dto";
import { UpdateMemberDto } from "../dto/members/update-member.dto";
import { InviteMemberDto } from "../dto/members/invite-member.dto";
import { getMemberIdFromAccessToken } from "../helpers/tokenHelper";
import { Roles } from "../middlewares/permissionMiddleware";
import { AuthorizationGuard } from "../middlewares/authorization.guard";
import { FeatureFlagGuard, RequireFeature } from "../middlewares/requireFeature.decorator";
import { Request } from "express";
import { AppDataBase } from "../db";
import { MemberCustomFieldDefinition, MemberCustomFieldValue } from "../models/memberCustomField";
import { RegistrationDraft } from "../models/registrationDraft";
import { ExternalProfileTypesService } from "../services/ExternalProfileTypesService";

@Controller("members")
@ApiTags("Members")
export class MemberController {
  constructor(private readonly memberService: MemberService) {}

  private getOrganizationId(req: Request): string {
    if (!req.tenant?.organization_id) {
      throw new HttpException('Organização não identificada.', HttpStatus.BAD_REQUEST);
    }
    return req.tenant.organization_id;
  }

  private async assertMemberInTenant(memberId: string, req: Request): Promise<void> {
    const member = await this.memberService.getMemberById(
      memberId,
      this.getOrganizationId(req),
    );
    if (!member) throw new HttpException('Membro não encontrado nesta organização.', HttpStatus.NOT_FOUND);
  }

  private handleCreateMemberError(error: unknown): never {
    if (error instanceof HttpException) {
      throw error;
    }

    const message =
      error instanceof Error ? error.message : "Erro ao criar cadastro.";

    const conflictMessages = [
      "CPF, RA ou email",
      "CPF, RA or email",
      "ja cadastrados",
      "jÃ¡ cadastrados",
    ];

    if (conflictMessages.some((item) => message.includes(item))) {
      throw new HttpException({ message }, HttpStatus.CONFLICT);
    }

    const badRequestMessages = [
      "CPF invalido",
      "CPF inv",
      "Senha",
      "Nome do membro",
      "Estado obrigatorio",
      "Cidade obrigatoria",
      "Universidade obrigatoria",
      "Curso obrigatorio",
      "Semestre atual obrigatorio",
      "Data de ingresso",
      "Padrinho",
      "memberId",
    ];

    if (badRequestMessages.some((item) => message.includes(item))) {
      throw new HttpException({ message }, HttpStatus.BAD_REQUEST);
    }

    throw error;
  }

  @Get()
  @UseGuards(AuthorizationGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: "Get all members" })
  @ApiResponse({ status: 200, description: "List of all members" })
  async getAllMembers(@Req() req: Request) {
    return this.memberService.getAllMembers(this.getOrganizationId(req));
  }

  @Get("sponsors/options")
  @UseGuards(FeatureFlagGuard)
  @RequireFeature('core')
  @ApiOperation({ summary: "Get sponsor options for signup" })
  @ApiResponse({ status: 200, description: "List of sponsor options" })
  async getSponsorOptions(@Req() req: Request) {
    return this.memberService.getSponsorOptions(this.getOrganizationId(req));
  }

  @Get("profile/:slug")
  @ApiOperation({ summary: "Get member profile by slug (public)" })
  @ApiParam({
    name: "slug",
    type: String,
    example: "john-doe",
  })
  @ApiResponse({ status: 200, description: "Member profile found" })
  @ApiResponse({ status: 404, description: "Member not found" })
  async getMemberBySlug(@Param("slug") slug: string, @Req() req: Request) {
    return this.memberService.getMemberBySlug(slug, this.getOrganizationId(req));
  }

  @Get("pending")
  @UseGuards(AuthorizationGuard, FeatureFlagGuard)
  @RequireFeature('registration_approval')
  @Roles('organization.admin')
  @ApiBearerAuth()
  @ApiOperation({ summary: "Get pending member registrations" })
  @ApiResponse({ status: 200, description: "Pending member registrations" })
  async getPendingMembers(@Req() req: Request) {
    return this.memberService.getPendingMembers(this.getOrganizationId(req));
  }

  @Patch(':id/approve')
  @UseGuards(AuthorizationGuard, FeatureFlagGuard)
  @RequireFeature('registration_approval')
  @Roles('organization.admin')
  @ApiBearerAuth()
  @ApiOperation({ summary: "Approve member registration" })
  @ApiParam({ name: "id", type: String, description: "Member ID" })
  @ApiResponse({ status: 200, description: "Member registration approved" })
  async approveMemberRegistration(
    @Param("id") id: string,
    @Req() req: Request,
  ) {
    const user = req.user!;
    const data = await this.memberService.approveMemberRegistration(
      id,
      user.id,
      this.getOrganizationId(req),
    );
    return { message: "Cadastro aprovado com sucesso.", data };
  }

  @Patch(':id/approve-with-edit')
  @UseGuards(AuthorizationGuard, FeatureFlagGuard)
  @RequireFeature('registration_approval')
  @Roles('organization.admin')
  @ApiBearerAuth()
  @ApiOperation({ summary: "Edit member data and approve registration" })
  @ApiParam({ name: "id", type: String, description: "Member ID" })
  @ApiBody({ type: UpdateMemberDto })
  @ApiResponse({ status: 200, description: "Member updated and approved" })
  async editAndApproveMember(
    @Param("id") id: string,
    @Body() updateData: UpdateMemberDto,
    @Req() req: Request,
  ) {
    const user = req.user!;
    const organizationId = this.getOrganizationId(req);
    await this.memberService.updateMember(id, updateData, organizationId);
    const data = await this.memberService.approveMemberRegistration(id, user.id, organizationId);
    return { message: "Cadastro atualizado e aprovado com sucesso.", data };
  }

  @Patch(":id/reject")
  @UseGuards(AuthorizationGuard, FeatureFlagGuard)
  @RequireFeature('registration_approval')
  @Roles('organization.admin')
  @ApiBearerAuth()
  @ApiOperation({ summary: "Reject member registration" })
  @ApiParam({ name: "id", type: String, description: "Member ID" })
  @ApiBody({
    schema: {
      type: "object",
      properties: {
        reason: {
          type: "string",
          example: "Dados incompletos",
        },
      },
    },
  })
  @ApiResponse({ status: 200, description: "Member registration rejected" })
  async rejectMemberRegistration(
    @Param("id") id: string,
    @Body() body: { reason?: string },
    @Req() req: Request,
  ) {
    const user = req.user!;
    const data = await this.memberService.rejectMemberRegistration(
      id,
      user.id,
      this.getOrganizationId(req),
      body.reason,
    );

    return {
      message: "Cadastro rejeitado com sucesso.",
      data,
    };
  }

  @Get("search")
  @UseGuards(AuthorizationGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: "Search members by name or email" })
  @ApiQuery({ name: "q", type: String, description: "Search query" })
  @ApiQuery({ name: "limit", type: Number, required: false })
  @ApiResponse({ status: 200, description: "Members found" })
  async searchMembers(
    @Req() req: Request,
    @Query("q") q: string,
    @Query("limit") limit?: string,
  ) {
    return this.memberService.searchMembers(
      q ?? '',
      Number(limit) || 10,
      this.getOrganizationId(req),
    );
  }

  @Get("email/:email")
  @UseGuards(AuthorizationGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: "Get member by email" })
  @ApiParam({ name: "email", type: String, example: "user@example.com" })
  @ApiResponse({ status: 200, description: "Member found" })
  @ApiResponse({ status: 202, description: "Member not found" })
  async getMemberByEmail(@Param("email") email: string, @Req() req: Request) {
    return this.memberService.getMemberByEmail(email, this.getOrganizationId(req));
  }

  @Get("sponsor/:sponsorId")
  @UseGuards(AuthorizationGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: "Get members by sponsor" })
  @ApiParam({
    name: "sponsorId",
    type: String,
    example: "b314b18f-26d6-4f97-9ed2-1f3942f8b787",
  })
  @ApiResponse({ status: 200, description: "Members found" })
  @ApiResponse({ status: 404, description: "No members found" })
  async getMembersBySponsor(@Param("sponsorId") sponsorId: string, @Req() req: Request) {
    return this.memberService.getMembersBySponsor(sponsorId, this.getOrganizationId(req));
  }

  @Post()
  @UseGuards(FeatureFlagGuard)
  @RequireFeature('core')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: "Create new member (signup)" })
  @ApiBody({ type: CreateMemberDto })
  @ApiQuery({
    name: "memberId",
    required: false,
    type: String,
    description: "Optional sponsor member ID used as the default signup sponsor",
  })
  @ApiResponse({ status: 201, description: "Member created successfully" })
  @ApiResponse({ status: 409, description: "CPF, RA or email already exists" })
  async createNewMember(
    @Body() body: CreateMemberDto,
    @Req() request: Request,
    @Query("memberId") sponsorMemberId?: string,
  ) {
    try {
      if (!request.tenant) {
        throw new HttpException("Organização não identificada.", HttpStatus.BAD_REQUEST);
      }
      const result = await this.memberService.createMember(
        body,
        body.password,
        request.tenant.organization_id,
        sponsorMemberId,
      );
      return {
        message:
          "Otimo ter voce conosco, peco apenas mais um pouco de paciencia, seu cadastro esta em analise, sera notificado assim que esse processo for concluido.",
        data: result.member,
      };
    } catch (error) {
      this.handleCreateMemberError(error);
    }
  }

  @Put("id/:id")
  @UseGuards(AuthorizationGuard)
  @ApiOperation({ summary: "Update member data" })
  @ApiParam({
    name: "id",
    type: String,
    example: "b314b18f-26d6-4f97-9ed2-1f3942f8b787",
  })
  @ApiBody({ type: UpdateMemberDto })
  @ApiResponse({ status: 200, description: "Member updated successfully" })
  @ApiResponse({ status: 404, description: "Member not found" })
  async updateMemberData(
    @Param("id") id: string,
    @Body() updateData: UpdateMemberDto,
    @Req() req: Request,
  ) {
    const user = req.user!;

    // Apenas o próprio membro ou equipe técnica pode atualizar
    if (
      user.id !== id &&
      !user.roles.includes('EQUIPE_TECNICA') &&
      !user.roles.includes('organization.admin')
    ) {
      throw new UnauthorizedException('Você não tem permissão para atualizar este membro');
    }

    const savedMember = await this.memberService.updateMember(
      id,
      updateData,
      this.getOrganizationId(req),
    );
    return {
      message: "Member updated successfully!",
      data: savedMember,
    };
  }

  @Get(":memberId/roles-and-permissions")
  @ApiOperation({ summary: "Get member roles and permissions" })
  @ApiParam({
    name: "memberId",
    type: String,
    example: "b314b18f-26d6-4f97-9ed2-1f3942f8b787",
  })
  @ApiResponse({
    status: 200,
    description: "Member roles and permissions retrieved successfully",
  })
  @ApiResponse({ status: 404, description: "Member not found" })
  @ApiResponse({
    status: 401,
    description: "Unauthorized - Invalid token or memberId mismatch",
  })
  async getMemberRolesAndPermissions(
    @Param("memberId") memberId: string,
    @Headers("authorization") authorization: string,
  ) {
    try {
      if (!authorization) {
        throw new UnauthorizedException("Authorization header is missing");
      }

      const token = authorization.replace("Bearer ", "");

      const memberIdFromAcessToken = getMemberIdFromAccessToken(token);
      if (memberIdFromAcessToken !== memberId) {
        throw new UnauthorizedException(
          "Token memberId does not match the requested memberId",
        );
      }
      return this.memberService.getMemberRolesAndPermissions(memberId);
    } catch (error) {
      if (error instanceof UnauthorizedException) {
        throw error;
      }
      if (
        error instanceof Error &&
        error.message.includes("Token inválido ou expirado")
      ) {
        throw new UnauthorizedException(error.message);
      }
      throw error;
    }
  }

  // Gerenciamento de Roles (apenas EQUIPE_TECNICA)
  @Post(':memberId/roles')
  @UseGuards(AuthorizationGuard)
  @Roles('EQUIPE_TECNICA')
  @ApiOperation({ summary: 'Add role to member (EQUIPE_TECNICA only)' })
  @ApiBody({ schema: { type: 'object', properties: { roleName: { type: 'string', example: 'LIDER' } }, required: ['roleName'] } })
  @ApiResponse({ status: 200, description: 'Role added successfully' })
  async addRoleToMember(
    @Param('memberId') memberId: string,
    @Body('roleName') roleName: string,
    @Req() req: Request,
  ) {
    if (!roleName) throw new HttpException({ message: 'roleName is required' }, HttpStatus.BAD_REQUEST);
    if (roleName === 'EQUIPE_TECNICA') {
      throw new ForbiddenException('O papel global da equipe técnica não pode ser concedido por este endpoint.');
    }
    await this.assertMemberInTenant(memberId, req);
    await this.memberService.addRoleToMember(memberId, roleName);
    return { message: 'Role adicionada com sucesso. Usuário deve fazer login novamente.' };
  }

  @Delete(':memberId/roles/:roleName')
  @UseGuards(AuthorizationGuard)
  @Roles('EQUIPE_TECNICA')
  @ApiOperation({ summary: 'Remove role from member (EQUIPE_TECNICA only)' })
  @ApiResponse({ status: 200, description: 'Role removed successfully' })
  async removeRoleFromMember(
    @Param('memberId') memberId: string,
    @Param('roleName') roleName: string,
    @Req() req: Request,
  ) {
    if (roleName === 'EQUIPE_TECNICA') {
      throw new ForbiddenException('O papel global da equipe técnica não pode ser removido por este endpoint.');
    }
    await this.assertMemberInTenant(memberId, req);
    await this.memberService.removeRoleFromMember(memberId, roleName);
    return { message: 'Role removida com sucesso. Usuário deve fazer login novamente.' };
  }

  // Gerenciamento de Posições
  @Post(':memberId/positions/dirigente')
  @UseGuards(AuthorizationGuard)
  @Roles('EQUIPE_TECNICA')
  @ApiOperation({ summary: 'Add DIRIGENTE position (EQUIPE_TECNICA only)' })
  async addDirigentePosition(
    @Param('memberId') memberId: string,
    @Body() body: { courseUniversityId: string; startDate?: string },
    @Req() req: Request,
  ) {
    await this.assertMemberInTenant(memberId, req);
    await this.memberService.addDirigentePosition(
      memberId,
      body.courseUniversityId,
      body.startDate ? new Date(body.startDate) : undefined,
    );
    return { message: 'Posição de DIRIGENTE adicionada. Usuário deve fazer login novamente.' };
  }

  @Delete(':memberId/positions/dirigente/:courseUniversityId')
  @UseGuards(AuthorizationGuard)
  @Roles('EQUIPE_TECNICA')
  @ApiOperation({ summary: 'Remove DIRIGENTE position (EQUIPE_TECNICA only)' })
  async removeDirigentePosition(
    @Param('memberId') memberId: string,
    @Param('courseUniversityId') courseUniversityId: string,
    @Req() req: Request,
  ) {
    await this.assertMemberInTenant(memberId, req);
    await this.memberService.removeDirigentePosition(memberId, courseUniversityId);
    return { message: 'Posição de DIRIGENTE removida. Usuário deve fazer login novamente.' };
  }

  @Post(':memberId/positions/car')
  @UseGuards(AuthorizationGuard)
  @Roles('EQUIPE_TECNICA')
  @ApiOperation({ summary: 'Add CAR position (EQUIPE_TECNICA only)' })
  async addCarPosition(
    @Param('memberId') memberId: string,
    @Body() body: { carId: string },
    @Req() req: Request,
  ) {
    await this.assertMemberInTenant(memberId, req);
    await this.memberService.addCarPosition(memberId, body.carId);
    return { message: 'Posição de CAR adicionada. Usuário deve fazer login novamente.' };
  }

  @Delete(':memberId/positions/car/:carId')
  @UseGuards(AuthorizationGuard)
  @Roles('EQUIPE_TECNICA')
  @ApiOperation({ summary: 'Remove CAR position (EQUIPE_TECNICA only)' })
  async removeCarPosition(
    @Param('memberId') memberId: string,
    @Param('carId') carId: string,
    @Req() req: Request,
  ) {
    await this.assertMemberInTenant(memberId, req);
    await this.memberService.removeCarPosition(memberId, carId);
    return { message: 'Posição de CAR removida. Usuário deve fazer login novamente.' };
  }

  @Post(':memberId/positions/cae')
  @UseGuards(AuthorizationGuard)
  @Roles('EQUIPE_TECNICA')
  @ApiOperation({ summary: 'Add CAE position (EQUIPE_TECNICA only)' })
  async addCaePosition(
    @Param('memberId') memberId: string,
    @Body() body: { caeId: string; startDate?: string },
    @Req() req: Request,
  ) {
    await this.assertMemberInTenant(memberId, req);
    await this.memberService.addCaePosition(
      memberId,
      body.caeId,
      body.startDate ? new Date(body.startDate) : undefined,
    );
    return { message: 'Posição de CAE adicionada. Usuário deve fazer login novamente.' };
  }

  @Delete(':memberId/positions/cae/:caeId')
  @UseGuards(AuthorizationGuard)
  @Roles('EQUIPE_TECNICA')
  @ApiOperation({ summary: 'Remove CAE position (EQUIPE_TECNICA only)' })
  async removeCaePosition(
    @Param('memberId') memberId: string,
    @Param('caeId') caeId: string,
    @Req() req: Request,
  ) {
    await this.assertMemberInTenant(memberId, req);
    await this.memberService.removeCaePosition(memberId, caeId);
    return { message: 'Posição de CAE removida. Usuário deve fazer login novamente.' };
  }

  @Post(':memberId/positions/representante')
  @UseGuards(AuthorizationGuard)
  @Roles('EQUIPE_TECNICA')
  @ApiOperation({ summary: 'Add REPRESENTANTE position (EQUIPE_TECNICA only)' })
  async addRepresentantePosition(
    @Param('memberId') memberId: string,
    @Body() body: { programSemesterId: string; startDate?: string },
    @Req() req: Request,
  ) {
    await this.assertMemberInTenant(memberId, req);
    await this.memberService.addRepresentantePosition(
      memberId,
      body.programSemesterId,
      body.startDate ? new Date(body.startDate) : undefined,
    );
    return { message: 'Posição de REPRESENTANTE adicionada. Usuário deve fazer login novamente.' };
  }

  @Delete(':memberId/positions/representante/:programSemesterId')
  @UseGuards(AuthorizationGuard)
  @Roles('EQUIPE_TECNICA')
  @ApiOperation({ summary: 'Remove REPRESENTANTE position (EQUIPE_TECNICA only)' })
  async removeRepresentantePosition(
    @Param('memberId') memberId: string,
    @Param('programSemesterId') programSemesterId: string,
    @Req() req: Request,
  ) {
    await this.assertMemberInTenant(memberId, req);
    await this.memberService.removeRepresentantePosition(memberId, programSemesterId);
    return { message: 'Posição de REPRESENTANTE removida. Usuário deve fazer login novamente.' };
  }

  // ─── Tenant: Invite member by admin ───────────────────────────────────────

  @Post('invite')
  @UseGuards(AuthorizationGuard)
  @Roles('organization.admin')
  @ApiBearerAuth()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Invite a member by email (admin sends set-password link)' })
  async inviteMember(@Body() dto: InviteMemberDto, @Req() req: Request) {
    const organizationId = req.tenant?.organization_id;
    if (!organizationId) throw new HttpException({ message: 'X-Org-Slug header obrigatório' }, HttpStatus.BAD_REQUEST);
    return this.memberService.inviteMemberByEmail(dto.email, organizationId, dto.message);
  }

  // ─── Tenant: Custom field definitions ────────────────────────────────────

  @Get('registration-profile-types')
  @ApiOperation({ summary: 'List public registration types for members and community' })
  async listRegistrationProfileTypes(@Req() req: Request) {
    if (!req.tenant) throw new HttpException('Organização não identificada.', HttpStatus.BAD_REQUEST);
    return new ExternalProfileTypesService().list(req.tenant.organization_id);
  }

  @Get('registration-fields')
  @ApiOperation({ summary: 'List public organization-specific registration fields' })
  async listRegistrationFields(@Req() req: Request) {
    const orgId = req.tenant?.organization_id;
    if (!orgId) return [];
    const features = await AppDataBase.query(
      `SELECT enabled FROM organization_features
       WHERE organization_id = $1 AND feature_slug = 'custom_fields'`,
      [orgId],
    ) as { enabled: boolean }[];
    if (!features[0]?.enabled) return [];
    return AppDataBase.getRepository(MemberCustomFieldDefinition).find({
      where: { organization_id: orgId },
      order: { position: 'ASC' },
    });
  }

  @Get('custom-fields')
  @UseGuards(AuthorizationGuard, FeatureFlagGuard)
  @RequireFeature('custom_fields')
  @Roles('organization.admin', 'organization.manage')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'List custom field definitions for the organization' })
  async listCustomFields(@Req() req: Request) {
    const orgId = req.tenant?.organization_id;
    if (!orgId) return [];
    return AppDataBase.getRepository(MemberCustomFieldDefinition).find({
      where: { organization_id: orgId },
      order: { position: 'ASC' },
    });
  }

  @Post('custom-fields')
  @UseGuards(AuthorizationGuard, FeatureFlagGuard)
  @RequireFeature('custom_fields')
  @Roles('organization.admin', 'organization.manage')
  @ApiBearerAuth()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create a custom field definition' })
  async createCustomField(
    @Body() body: { field_key: string; label: string; field_type?: string; required?: boolean; options?: string[]; position?: number },
    @Req() req: Request,
  ) {
    const orgId = req.tenant?.organization_id;
    if (!orgId) throw new HttpException({ message: 'X-Org-Slug obrigatório' }, HttpStatus.BAD_REQUEST);
    if (!/^[a-z][a-z0-9_]{1,99}$/.test(body.field_key) || !body.label?.trim()) {
      throw new BadRequestException('Informe uma chave válida e o nome do campo.');
    }
    if (body.field_type && !['text', 'number', 'date', 'select', 'checkbox', 'file'].includes(body.field_type)) {
      throw new BadRequestException('Tipo de campo inválido.');
    }
    if (body.options && (!Array.isArray(body.options) || body.options.some((option) => typeof option !== 'string'))) {
      throw new BadRequestException('As opções do campo são inválidas.');
    }
    const repo = AppDataBase.getRepository(MemberCustomFieldDefinition);
    const field = repo.create({ ...body, organization_id: orgId });
    return repo.save(field);
  }

  @Delete('custom-fields/:fieldKey')
  @UseGuards(AuthorizationGuard, FeatureFlagGuard)
  @RequireFeature('custom_fields')
  @Roles('organization.admin', 'organization.manage')
  @ApiBearerAuth()
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete a custom field definition' })
  async deleteCustomField(@Param('fieldKey') fieldKey: string, @Req() req: Request) {
    const orgId = req.tenant?.organization_id;
    if (!orgId) throw new HttpException({ message: 'X-Org-Slug obrigatório' }, HttpStatus.BAD_REQUEST);
    await AppDataBase.getRepository(MemberCustomFieldDefinition).delete({
      organization_id: orgId,
      field_key: fieldKey,
    });
  }

  @Patch('custom-fields/:fieldKey')
  @UseGuards(AuthorizationGuard, FeatureFlagGuard)
  @RequireFeature('custom_fields')
  @Roles('organization.admin', 'organization.manage')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update a custom registration field definition' })
  async updateCustomField(
    @Param('fieldKey') fieldKey: string,
    @Body() body: { label?: string; field_type?: string; required?: boolean; options?: string[] | null; position?: number },
    @Req() req: Request,
  ) {
    const orgId = req.tenant?.organization_id;
    if (!orgId) throw new HttpException({ message: 'X-Org-Slug obrigatório' }, HttpStatus.BAD_REQUEST);
    if (body.label !== undefined && !body.label.trim()) throw new BadRequestException('Informe o nome do campo.');
    if (body.field_type !== undefined && !['text', 'number', 'date', 'select', 'checkbox', 'file'].includes(body.field_type)) {
      throw new BadRequestException('Tipo de campo inválido.');
    }
    const repo = AppDataBase.getRepository(MemberCustomFieldDefinition);
    const field = await repo.findOneBy({ organization_id: orgId, field_key: fieldKey });
    if (!field) throw new HttpException('Campo de cadastro não encontrado.', HttpStatus.NOT_FOUND);
    Object.assign(field, body);
    return repo.save(field);
  }

  // ─── Tenant: Registration draft (step-by-step signup) ────────────────────

  @Get('registration-draft')
  @ApiOperation({ summary: 'Get in-progress registration draft by email' })
  async getRegistrationDraft(@Query('email') email: string, @Req() req: Request) {
    const orgId = req.tenant?.organization_id;
    if (!orgId || !email) return null;
    const repo = AppDataBase.getRepository(RegistrationDraft);
    const draft = await repo.findOne({ where: { organization_id: orgId, email } });
    if (!draft) return null;
    // Expire drafts older than 72h
    if (draft.expires_at < new Date()) {
      await repo.delete(draft.id);
      return null;
    }
    return draft;
  }

  @Post('registration-draft')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Save/update registration draft step' })
  async saveRegistrationDraft(
    @Body() body: { email: string; data: Record<string, unknown>; current_step: number },
    @Req() req: Request,
  ) {
    const orgId = req.tenant?.organization_id;
    if (!orgId) throw new HttpException({ message: 'X-Org-Slug obrigatório' }, HttpStatus.BAD_REQUEST);
    const repo = AppDataBase.getRepository(RegistrationDraft);

    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 72);

    const existing = await repo.findOne({ where: { organization_id: orgId, email: body.email } });
    if (existing) {
      await repo.save({
        ...existing,
        data: body.data,
        current_step: body.current_step,
        expires_at: expiresAt,
      });
      return repo.findOneBy({ id: existing.id });
    }

    const draft = repo.create({
      organization_id: orgId,
      email: body.email,
      data: body.data,
      current_step: body.current_step,
      expires_at: expiresAt,
    });
    return repo.save(draft);
  }

  @Delete('registration-draft')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete registration draft (after successful signup)' })
  async deleteRegistrationDraft(@Query('email') email: string, @Req() req: Request) {
    const orgId = req.tenant?.organization_id;
    if (!orgId || !email) return;
    await AppDataBase.getRepository(RegistrationDraft).delete({
      organization_id: orgId,
      email,
    });
  }

  @Get(':id')
  @UseGuards(AuthorizationGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get member by ID' })
  async getMemberById(@Param('id') id: string, @Req() req: Request) {
    return this.memberService.getMemberById(id, this.getOrganizationId(req));
  }
}
