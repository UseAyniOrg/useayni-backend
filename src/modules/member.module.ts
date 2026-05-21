import { Module, NestModule, MiddlewareConsumer } from '@nestjs/common';import { MemberController } from '../controllers/MembersController';
import { MemberService } from '../services/MemberService';
import { MemberRepository } from '../repositories/MemberRepository';
import { TokenRepository } from '../repositories/TokenRepository';
import { StateRepository } from '../repositories/StateRepository';
import { CityRepository } from '../repositories/CityRepository';
import { UniversityRepository } from '../repositories/UniversityRepository';
import { CourseRepository } from '../repositories/CourseRepository';
import { CourseUniversityRepository } from '../repositories/CourseUniversityRepository';
import { authMiddleware } from '../middlewares/authMiddleware';

@Module({
  controllers: [MemberController],
  providers: [
    MemberService,
    MemberRepository,
    TokenRepository,
    StateRepository,
    CityRepository,
    UniversityRepository,
    CourseRepository,
    CourseUniversityRepository,
  ],
  exports: [MemberService],
})
export class MemberModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(authMiddleware)
      .forRoutes('*');
  }
}
