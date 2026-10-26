import { Module } from '@nestjs/common';
import {
  MediaAssetController,
  PublicMediaController,
} from '../controllers/MediaAssetController';
import { MediaAssetService } from '../services/MediaAssetService';
import { AuthorizationGuard } from '../middlewares/authorization.guard';
import { FeatureFlagGuard } from '../middlewares/requireFeature.decorator';

@Module({
  controllers: [MediaAssetController, PublicMediaController],
  providers: [MediaAssetService, AuthorizationGuard, FeatureFlagGuard],
  exports: [MediaAssetService],
})
export class MediaStorageModule {}
