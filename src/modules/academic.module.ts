import { Module } from '@nestjs/common';
import { UniversityController } from '../controllers/UniversityController';
import { CourseController } from '../controllers/CourseController';
import { CityController } from '../controllers/CityController';
import { StateController } from '../controllers/StateController';
import { UniversityRepository } from '../repositories/UniversityRepository';
import { CourseRepository } from '../repositories/CourseRepository';
import { CityRepository } from '../repositories/CityRepository';
import { StateRepository } from '../repositories/StateRepository';
import { MecCourseSyncService } from '../services/MecCourseSyncService';
import { MecUniversitySyncService } from '../services/MecUniversitySyncService';

@Module({
  controllers: [UniversityController, CourseController, CityController, StateController],
  providers: [
    UniversityRepository,
    CourseRepository,
    CityRepository,
    StateRepository,
    MecCourseSyncService,
    MecUniversitySyncService,
  ],
  exports: [
    UniversityRepository,
    CourseRepository,
    CityRepository,
    StateRepository,
    MecCourseSyncService,
    MecUniversitySyncService,
  ],
})
export class AcademicModule {}
