import { Module } from '@nestjs/common';
import { BookingModule } from '../booking/booking.module';
import { CatalogModule } from '../catalog/catalog.module';
import { ChatController } from './chat.controller';
import { LangChainAgentService } from './langchain-agent.service';

@Module({
  imports: [CatalogModule, BookingModule],
  controllers: [ChatController],
  providers: [LangChainAgentService],
  exports: [LangChainAgentService],
})
export class ChatModule {}
