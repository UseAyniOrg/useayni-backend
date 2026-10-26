import { Module } from '@nestjs/common';
import {
  OrgUnitTypeController,
  OrgUnitController,
  PositionController,
  MandateController,
} from '../controllers/OrgUnitController';
import { OrgUnitService } from '../services/OrgUnitService';
import { OrgUnitRepository } from '../repositories/OrgUnitRepository';
import { FeatureFlagGuard } from '../middlewares/requireFeature.decorator';

@Module({
  controllers: [
    OrgUnitTypeController,
    OrgUnitController,
    PositionController,
    MandateController,
  ],
  providers: [OrgUnitService, OrgUnitRepository, FeatureFlagGuard],
  exports: [OrgUnitService],
})
export class OrgUnitModule {}
