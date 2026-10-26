import {
  BadRequestException,
  Body,
  Controller,
  ForbiddenException,
  Get,
  Header,
  Param,
  Post,
  Put,
  Req,
  Res,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Request, Response } from 'express';
import { isUUID } from 'class-validator';
import { AuthorizationGuard } from '../middlewares/authorization.guard';
import { MediaAssetVisibility } from '../models/mediaAsset';
import { OrgHomeService } from '../services/OrgHomeService';
import { MediaAssetService } from '../services/MediaAssetService';

@Controller('public/org-home')
@ApiTags('Public organization home')
export class PublicOrgHomeController {
  constructor(private readonly homeService: OrgHomeService) {}

  @Get(':slug')
  @Header('Cache-Control', 'public, max-age=0, must-revalidate')
  @ApiOperation({ summary: 'Get published public home content by tenant slug' })
  getPublishedHome(@Param('slug') slug: string) {
    return this.homeService.getPublicHome(slug);
  }
}

@Controller('m')
@ApiTags('Public media')
export class PublicHomeMediaController {
  constructor(private readonly homeService: OrgHomeService) {}

  @Get(':id')
  @ApiOperation({ summary: 'Serve public immutable media assets without exposing R2 credentials' })
  async getPublicAsset(@Param('id') id: string, @Res() response: Response) {
    const asset = await this.homeService.getPublicAsset(id);
    response.set({
      'Cache-Control': 'public, max-age=31536000, immutable',
      'Content-Type': asset.mime_type,
      'Content-Length': String(asset.size_bytes),
      'X-Content-Type-Options': 'nosniff',
      'Content-Disposition': 'inline',
    });
    response.send(Buffer.from(asset.body));
  }
}

@Controller('org-home')
@UseGuards(AuthorizationGuard)
@ApiTags('Organization home editor')
@ApiBearerAuth()
export class OrgHomeAdminController {
  constructor(
    private readonly homeService: OrgHomeService,
    private readonly mediaService: MediaAssetService,
  ) {}

  @Get('admin')
  @ApiOperation({ summary: 'Load the current organization home editor configuration' })
  async getCurrent(@Req() request: Request) {
    const organizationId = this.resolveOrganizationId(request);
    return this.homeService.getEditorConfig(organizationId);
  }

  @Get('admin/organizations/:organizationId')
  @ApiOperation({ summary: 'Load an organization home as platform super admin' })
  async getSelected(
    @Param('organizationId') organizationId: string,
    @Req() request: Request,
  ) {
    const resolvedId = this.resolveOrganizationId(request, organizationId);
    return this.homeService.getEditorConfig(resolvedId);
  }

  @Put('admin')
  @ApiOperation({ summary: 'Save the current organization home as a draft' })
  async saveCurrent(@Body() body: unknown, @Req() request: Request) {
    const organizationId = this.resolveOrganizationId(request);
    return this.homeService.saveDraft(organizationId, this.actorId(request), body);
  }

  @Put('admin/organizations/:organizationId')
  @ApiOperation({ summary: 'Save an organization home as platform super admin' })
  async saveSelected(
    @Param('organizationId') organizationId: string,
    @Body() body: unknown,
    @Req() request: Request,
  ) {
    const resolvedId = this.resolveOrganizationId(request, organizationId);
    return this.homeService.saveDraft(resolvedId, this.actorId(request), body);
  }

  @Post('admin/publish')
  @ApiOperation({ summary: 'Publish the current organization home and revalidate its cache' })
  async publishCurrent(@Req() request: Request) {
    const organizationId = this.resolveOrganizationId(request);
    return this.homeService.publish(organizationId, this.actorId(request));
  }

  @Post('admin/organizations/:organizationId/publish')
  @ApiOperation({ summary: 'Publish an organization home as platform super admin' })
  async publishSelected(
    @Param('organizationId') organizationId: string,
    @Req() request: Request,
  ) {
    const resolvedId = this.resolveOrganizationId(request, organizationId);
    return this.homeService.publish(resolvedId, this.actorId(request));
  }

  @Post('admin/organizations/:organizationId/media/uploads')
  @ApiOperation({ summary: 'Create a public home asset upload for a selected organization' })
  async createSelectedHomeUpload(
    @Param('organizationId') organizationId: string,
    @Body() body: {
      category: string;
      mime_type: string;
      size_bytes: number;
      visibility?: MediaAssetVisibility;
    },
    @Req() request: Request,
  ) {
    const resolvedId = this.resolveOrganizationId(request, organizationId);
    const isPlatformAdmin = request.user!.roles.includes('EQUIPE_TECNICA') && !request.user!.support_session_id;
    return this.mediaService.createUpload(
      resolvedId,
      isPlatformAdmin ? undefined : request.user!.id,
      body,
      request.user!.account_id,
    );
  }

  @Put('admin/organizations/:organizationId/media/:assetId/content')
  @ApiOperation({ summary: 'Upload selected organization media through the API' })
  async uploadSelectedHomeContent(
    @Param('organizationId') organizationId: string,
    @Param('assetId') assetId: string,
    @Req() request: Request,
  ) {
    const resolvedId = this.resolveOrganizationId(request, organizationId);
    return this.mediaService.uploadContent(
      resolvedId,
      assetId,
      request.body as Buffer,
      request.headers['content-type'] ?? '',
      this.actorId(request),
      request.user!.account_id,
    );
  }

  @Post('admin/organizations/:organizationId/media/:assetId/confirm')
  @ApiOperation({ summary: 'Confirm a public home asset upload for a selected organization' })
  async confirmSelectedHomeUpload(
    @Param('organizationId') organizationId: string,
    @Param('assetId') assetId: string,
    @Req() request: Request,
  ) {
    const resolvedId = this.resolveOrganizationId(request, organizationId);
    return this.mediaService.confirmUpload(resolvedId, assetId);
  }

  private resolveOrganizationId(request: Request, selectedId?: string): string {
    const user = request.user!;
    const isSuperAdmin = user.roles.includes('EQUIPE_TECNICA');
    if (isSuperAdmin && user.support_session_id) {
      const supportOrganizationId = request.tenant?.organization_id;
      if (!supportOrganizationId || (selectedId && selectedId !== supportOrganizationId)) {
        throw new ForbiddenException('A sessão de suporte está limitada à organização selecionada.');
      }
      return supportOrganizationId;
    }
    if (isSuperAdmin) {
      if (!selectedId || !isUUID(selectedId)) {
        throw new BadRequestException('O Super Admin deve selecionar uma organização válida.');
      }
      return selectedId;
    }

    const organizationId = request.tenant?.organization_id;
    const canEdit = user.roles.some((role) =>
      ['organization.admin', 'organization.manage'].includes(role),
    );
    if (
      !canEdit ||
      !organizationId ||
      user.organization_id !== organizationId ||
      (selectedId !== undefined && selectedId !== organizationId)
    ) {
      throw new ForbiddenException('Você não pode editar a home desta organização.');
    }
    return organizationId;
  }

  private actorId(request: Request): string {
    return request.user!.account_id ?? request.user!.id;
  }
}
