import { Module } from '@nestjs/common';
import { MiscellaneousController } from '../controllers/MiscellaneousController';
import { MiscellaneousService } from '../services/MiscellaneousService';
import { MiscellaneousRepository } from '../repositories/MiscellaneousRepository';
import { MemberRepository } from '../repositories/MemberRepository';

@Module({
  controllers: [MiscellaneousController],
  providers: [MiscellaneousService, MiscellaneousRepository, MemberRepository],
  exports: [MiscellaneousService, MiscellaneousRepository],
})
export class MiscellaneousModule {}
