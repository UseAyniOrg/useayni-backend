import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
  Req,
  HttpCode,
  HttpStatus,
  BadRequestException,
  NotFoundException,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { Request } from 'express';
import { AppDataBase } from '../db';
import { MemberCustomFieldDefinition } from '../models/memberCustomField';
import { AuthorizationGuard } from '../middlewares/authorization.guard';
import { Roles } from '../middlewares/permissionMiddleware';
import { OrganizationService } from '../services/OrganizationService';
import { AuthService } from '../services/authService';
import { HierarchyTemplateService } from '../services/HierarchyTemplateService';
import {
  CreateOrganizationDto,
  UpdateOrganizationDto,
  UpsertFeatureDto,
} from '../dto/organization/organization.dto';

/** Public endpoint — returns tenant info for the frontend TenantProvider */
@Controller('public/tenant')
@ApiTags('Tenant (public)')
export class TenantPublicController {
  constructor(private readonly orgService: OrganizationService) {}

  @Get(':slug')
  @ApiOperation({ summary: 'Get public tenant info by slug' })
  getTenantInfo(@Param('slug') slug: string) {
    return this.orgService.getTenantInfo(slug);
  }
}

/** Super-admin only — full org management */
@Controller('organizations')
@ApiTags('Organizations')
@UseGuards(AuthorizationGuard)
@Roles('EQUIPE_TECNICA')
@ApiBearerAuth()
export class OrganizationController {
  constructor(
    private readonly orgService: OrganizationService,
    private readonly authService: AuthService,
    private readonly hierarchyTemplates: HierarchyTemplateService,
  ) {}

  @Get()
  @ApiOperation({ summary: 'List all organizations (super admin)' })
  findAll() {
    return this.orgService.findAll();
  }

  @Get('plans')
  @ApiOperation({ summary: 'List available plans' })
  getPlans() {
    return this.orgService.getPlans();
  }

  @Get('feature-catalog')
  @ApiOperation({ summary: 'List feature flags and implementation availability' })
  getFeatureCatalog() {
    return this.orgService.getFeatureCatalog();
  }

  @Get('hierarchy-templates')
  getHierarchyTemplates() {
    return this.hierarchyTemplates.list();
  }

  @Post(':id/hierarchy/import')
  importHierarchy(@Param('id') id: string, @Body() body: unknown, @Req() req: Request) {
    return this.hierarchyTemplates.import(id, body, req.user!.account_id ?? req.user!.id);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get organization by ID' })
  findOne(@Param('id') id: string) {
    return this.orgService.findById(id);
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create organization' })
  create(@Body() dto: CreateOrganizationDto, @Req() req: Request) {
    return this.orgService.create(dto, req.user!.id, req.user!.account_id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update organization' })
  update(
    @Param('id') id: string,
    @Body() dto: UpdateOrganizationDto,
    @Req() req: Request,
  ) {
    return this.orgService.update(id, dto, req.user!.id, req.user!.account_id);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Soft-delete organization' })
  remove(@Param('id') id: string, @Req() req: Request) {
    return this.orgService.remove(id, req.user!.id, req.user!.account_id);
  }

  // ─── Feature flags ────────────────────────────────────────────────────────

  @Get(':id/features')
  @ApiOperation({ summary: 'List all features for an organization' })
  getFeatures(@Param('id') id: string) {
    return this.orgService.getFeatures(id);
  }

  @Get(':id/registration-fields')
  @ApiOperation({ summary: 'List registration fields for an organization' })
  listRegistrationFields(@Param('id') organizationId: string) {
    return AppDataBase.getRepository(MemberCustomFieldDefinition).find({
      where: { organization_id: organizationId },
      order: { position: 'ASC' },
    });
  }

  @Post(':id/registration-fields')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create an organization registration field' })
  async createRegistrationField(
    @Param('id') organizationId: string,
    @Body() body: {
      field_key: string;
      label: string;
      field_type: string;
      required: boolean;
      options?: string[] | null;
      position?: number;
    },
  ) {
    this.validateRegistrationField(body);
    const repo = AppDataBase.getRepository(MemberCustomFieldDefinition);
    if (await repo.findOneBy({ organization_id: organizationId, field_key: body.field_key })) {
      throw new BadRequestException('Já existe um campo com esta chave.');
    }
    return repo.save(repo.create({ ...body, organization_id: organizationId }));
  }

  @Patch(':id/registration-fields/:fieldKey')
  @ApiOperation({ summary: 'Update an organization registration field' })
  async updateRegistrationField(
    @Param('id') organizationId: string,
    @Param('fieldKey') fieldKey: string,
    @Body() body: {
      label?: string;
      field_type?: string;
      required?: boolean;
      options?: string[] | null;
      position?: number;
    },
  ) {
    if (body.label !== undefined && !body.label.trim()) throw new BadRequestException('Informe o nome do campo.');
    if (body.field_type !== undefined && !this.isRegistrationFieldType(body.field_type)) {
      throw new BadRequestException('Tipo de campo inválido.');
    }
    const repo = AppDataBase.getRepository(MemberCustomFieldDefinition);
    const field = await repo.findOneBy({ organization_id: organizationId, field_key: fieldKey });
    if (!field) throw new NotFoundException('Campo de cadastro não encontrado.');
    Object.assign(field, body);
    return repo.save(field);
  }

  @Delete(':id/registration-fields/:fieldKey')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete an organization registration field' })
  async deleteRegistrationField(
    @Param('id') organizationId: string,
    @Param('fieldKey') fieldKey: string,
  ) {
    await AppDataBase.getRepository(MemberCustomFieldDefinition).delete({
      organization_id: organizationId,
      field_key: fieldKey,
    });
  }

  private isRegistrationFieldType(value: string): boolean {
    return ['text', 'number', 'date', 'select', 'checkbox', 'file'].includes(value);
  }

  private validateRegistrationField(body: {
    field_key: string;
    label: string;
    field_type: string;
    required: boolean;
    options?: string[] | null;
    position?: number;
  }): void {
    if (!/^[a-z][a-z0-9_]{1,99}$/.test(body.field_key) || !body.label.trim()) {
      throw new BadRequestException('Informe uma chave válida e o nome do campo.');
    }
    if (!this.isRegistrationFieldType(body.field_type)) {
      throw new BadRequestException('Tipo de campo inválido.');
    }
    if (body.options && (!Array.isArray(body.options) || body.options.some((option) => typeof option !== 'string'))) {
      throw new BadRequestException('As opções do campo são inválidas.');
    }
  }

  @Get(':id/audit')
  @ApiOperation({ summary: 'List recent organization changes' })
  getAuditHistory(@Param('id') id: string) {
    return this.orgService.getAuditHistory(id);
  }

  @Patch(':id/features')
  @ApiOperation({ summary: 'Enable or disable a feature flag' })
  setFeature(
    @Param('id') id: string,
    @Body() dto: UpsertFeatureDto,
    @Req() req: Request,
  ) {
    return this.orgService.setFeature(
      id,
      dto.feature_slug,
      dto.enabled,
      dto.config,
      req.user!.id,
      req.user!.account_id,
    );
  }

  @Post(':id/admins')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Grant organization administrator to an approved member' })
  grantAdmin(
    @Param('id') id: string,
    @Body() body: { email: string },
    @Req() req: Request,
  ) {
    return this.orgService.grantAdmin(
      id,
      body.email,
      req.user!.id,
      req.user!.account_id,
    );
  }

  @Post(':id/admin-access')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Provision an organization admin with a one-time password when needed' })
  issueAdminAccess(
    @Param('id') id: string,
    @Body() body: { email: string },
    @Req() req: Request,
  ) {
    return this.orgService.issueAdminAccess(
      id,
      body.email,
      req.user!.id,
      req.user!.account_id,
    );
  }

  @Post(':id/members/import')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Import organization members by email; new accounts receive a one-time password' })
  importMembers(
    @Param('id') id: string,
    @Body() body: { emails: string[] },
    @Req() req: Request,
  ) {
    return this.orgService.importMembers(id, body.emails, req.user!.id, req.user!.account_id);
  }

  @Post(':id/member-access')
  issueMemberAccess(
    @Param('id') id: string, @Body() body: { email: string }, @Req() req: Request,
  ) {
    return this.orgService.issueMemberAccess(id, body.email, req.user!.id, req.user!.account_id);
  }

  @Post(':id/support-access')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Start an audited, temporary support session for an organization' })
  startSupportAccess(
    @Param('id') id: string,
    @Body() body: { reason: string },
    @Req() req: Request,
  ) {
    return this.authService.startSupportAccess(
      id,
      req.user!.id,
      req.user!.account_id,
      body.reason,
    );
  }
}
