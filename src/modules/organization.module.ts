import { Module, MiddlewareConsumer, NestModule, RequestMethod } from '@nestjs/common';
import { OrganizationController, TenantPublicController } from '../controllers/OrganizationController';
import { OrganizationService } from '../services/OrganizationService';
import { OrganizationRepository } from '../repositories/OrganizationRepository';
import { TenantMiddleware } from '../middlewares/tenant.middleware';
import { AuthModule } from './auth.module';
import {
  OrgHomeAdminController,
  PublicHomeMediaController,
  PublicOrgHomeController,
} from '../controllers/OrgHomeController';
import { OrgHomeService } from '../services/OrgHomeService';
import { MediaAssetService } from '../services/MediaAssetService';
import { AccountProvisioningService } from '../services/AccountProvisioningService';
import { HierarchyTemplateService } from '../services/HierarchyTemplateService';

@Module({
  imports: [AuthModule],
  controllers: [
    OrganizationController,
    TenantPublicController,
    PublicOrgHomeController,
    PublicHomeMediaController,
    OrgHomeAdminController,
  ],
  providers: [OrganizationService, OrganizationRepository, OrgHomeService, MediaAssetService, AccountProvisioningService, HierarchyTemplateService],
  exports: [OrganizationService, OrganizationRepository, OrgHomeService],
})
export class OrganizationModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(TenantMiddleware)
      .forRoutes({ path: '*', method: RequestMethod.ALL });
  }
}
