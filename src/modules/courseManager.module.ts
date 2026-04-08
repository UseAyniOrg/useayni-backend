import { Module } from '@nestjs/common';
import { CourseManagerController } from '../controllers/CourseManagerController';
import { CourseManagerService } from '../services/CourseManagerService';

@Module({
  controllers: [CourseManagerController],
  providers: [CourseManagerService],
  exports: [CourseManagerService],
})
export class CourseManagerModule {}
