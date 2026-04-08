import { Module } from '@nestjs/common';
import { MemberController } from '../controllers/MembersController';
import { MemberService } from '../services/MemberService';
import { MemberRepository } from '../repositories/MemberRepository';
import { TokenRepository } from '../repositories/TokenRepository';

@Module({
  controllers: [MemberController],
  providers: [MemberService, MemberRepository, TokenRepository],
  exports: [MemberService],
})
export class MemberModule {}
