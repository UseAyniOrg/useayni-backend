import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  ForbiddenException,
  Param,
  Post,
    Put,
  Req,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Request } from 'express';
import { MediaAssetService } from '../services/MediaAssetService';
import { AuthorizationGuard } from '../middlewares/authorization.guard';
import { FeatureFlagGuard, RequireFeature } from '../middlewares/requireFeature.decorator';
import { Roles } from '../middlewares/permissionMiddleware';
import { MediaAssetVisibility } from '../models/mediaAsset';

@Controller('media')
@ApiTags('Media storage')
@UseGuards(AuthorizationGuard, FeatureFlagGuard)
@RequireFeature('media_storage')
@ApiBearerAuth()
export class MediaAssetController {
  constructor(private readonly mediaService: MediaAssetService) {}

  @Post('uploads')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Reserve an authenticated media upload' })
  createUpload(
    @Body() body: {
      category: string;
      mime_type: string;
      size_bytes: number;
      visibility?: MediaAssetVisibility;
    },
    @Req() request: Request,
  ) {
    return this.mediaService.createUpload(
      request.tenant!.organization_id,
      request.user!.id,
      body,
      request.user!.account_id,
    );
  }

  @Put('uploads/:id/content')
  @ApiOperation({ summary: 'Upload media content through the authenticated API' })
  uploadContent(@Param('id') id: string, @Req() request: Request) {
    return this.mediaService.uploadContent(
      request.tenant!.organization_id,
      id,
      request.body as Buffer,
      request.headers['content-type'] ?? '',
      request.user!.id,
      request.user!.account_id,
    );
  }

  @Post(':id/confirm')
  @Roles('organization.admin', 'organization.manage')
  @ApiOperation({ summary: 'Verify uploaded object and activate its media asset' })
  confirmUpload(@Param('id') id: string, @Req() request: Request) {
    return this.mediaService.confirmUpload(request.tenant!.organization_id, id);
  }

  @Get(':id/url')
  @ApiOperation({ summary: 'Create a short-lived private read URL' })
  getPrivateReadUrl(@Param('id') id: string, @Req() request: Request) {
    return this.mediaService.getPrivateReadUrl(request.tenant!.organization_id, id);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @Roles('organization.admin')
  @ApiOperation({ summary: 'Remove a media asset from this organization' })
  async remove(@Param('id') id: string, @Req() request: Request) {
    await this.mediaService.remove(request.tenant!.organization_id, id);
  }
}

@Controller('public/media')
@ApiTags('Public media')
@UseGuards(FeatureFlagGuard)
@RequireFeature('media_storage')
export class PublicMediaController {
  constructor(private readonly mediaService: MediaAssetService) {}

  @Get(':id/url')
  @ApiOperation({ summary: 'Create a short-lived URL for media referenced by public content' })
  getPublicReadUrl(@Param('id') id: string, @Req() request: Request) {
    if (!request.tenant) {
      throw new ForbiddenException('Organização não identificada.');
    }
    return this.mediaService.getPublicReadUrl(request.tenant.organization_id, id);
  }
}
