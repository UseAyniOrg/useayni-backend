import { Module } from '@nestjs/common';
import { MemberModule } from './member.module';
import { AuthModule } from './auth.module';
import { AcademicModule } from './academic.module';
import { CarModule } from './car.module';
import { RoleModule } from './role.module';
import { CaeModule } from './cae.module';
import { CourseManagerModule } from './courseManager.module';

@Module({
  imports: [
    MemberModule,
    AuthModule,
    AcademicModule,
    CarModule,
    RoleModule,
    CaeModule,
    CourseManagerModule,
  ],
})
export class AppModule {}
