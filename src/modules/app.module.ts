import { Module } from '@nestjs/common';
import { MemberModule } from './member.module';
import { AuthModule } from './auth.module';
import { AcademicModule } from './academic.module';
import { CarModule } from './car.module';
import { RoleModule } from './role.module';
import { CaeModule } from './cae.module';
import { CourseManagerModule } from './courseManager.module';
import { MiscellaneousModule } from './miscellaneous.module';
// ─── Multi-tenant modules ─────────────────────────────────────────────────
import { OrganizationModule } from './organization.module';
import { OrgUnitModule } from './orgUnit.module';
import { MediaStorageModule } from './mediaStorage.module';
import { EmailModule } from './email.module';

@Module({
  imports: [
    EmailModule,
    // Multi-tenant foundation — must come first so TenantMiddleware is registered
    OrganizationModule,
    OrgUnitModule,
    MediaStorageModule,
    // Existing modules
    MemberModule,
    AuthModule,
    AcademicModule,
    CarModule,
    RoleModule,
    CaeModule,
    CourseManagerModule,
    MiscellaneousModule,
  ],
})
export class AppModule {}
