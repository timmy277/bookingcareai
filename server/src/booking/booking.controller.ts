import { Body, Controller, Get, NotFoundException, Param, Post } from '@nestjs/common';
import { BookingService, CreateBookingDto } from './booking.service';

@Controller('api/booking')
export class BookingController {
  constructor(private readonly bookingService: BookingService) {}

  @Post()
  createBooking(@Body() dto: CreateBookingDto) {
    try {
      const result = this.bookingService.createBooking(dto);
      return {
        success: true,
        message: 'Đặt lịch khám thành công!',
        data: result,
      };
    } catch (err: any) {
      return {
        success: false,
        message: err.message || 'Lỗi khi tạo lịch hẹn',
      };
    }
  }

  @Get()
  getAllBookings() {
    return this.bookingService.getAllAppointments();
  }

  @Get(':id')
  getBookingById(@Param('id') id: string) {
    const appt = this.bookingService.getAppointmentById(id);
    if (!appt) {
      throw new NotFoundException(`Không tìm thấy mã phiếu hẹn [${id}]`);
    }
    return appt;
  }
}
