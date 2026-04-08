import { Module } from '@nestjs/common';
import { CaeController } from '../controllers/CaeController';
import { CaeService } from '../services/CaeService';

@Module({
  controllers: [CaeController],
  providers: [CaeService],
  exports: [CaeService],
})
export class CaeModule {}
