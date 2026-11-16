import { Module } from '@nestjs/common';
import { ChatModule } from '../chat/chat.module';
import { EvalController } from './eval.controller';
import { EvalService } from './eval.service';

@Module({
  imports: [ChatModule],
  controllers: [EvalController],
  providers: [EvalService],
  exports: [EvalService],
})
export class EvalModule {}
