import { Module } from '@nestjs/common';
import { CatalogModule } from '../catalog/catalog.module';
import { BookingController } from './booking.controller';
import { BookingService } from './booking.service';

@Module({
  imports: [CatalogModule],
  controllers: [BookingController],
  providers: [BookingService],
  exports: [BookingService],
})
export class BookingModule {}
