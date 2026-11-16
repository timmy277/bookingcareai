import { Module } from '@nestjs/common';
import { BookingModule } from './booking/booking.module';
import { CatalogModule } from './catalog/catalog.module';
import { ChatModule } from './chat/chat.module';
import { EvalModule } from './eval/eval.module';

@Module({
  imports: [CatalogModule, BookingModule, ChatModule, EvalModule],
})
export class AppModule {}
