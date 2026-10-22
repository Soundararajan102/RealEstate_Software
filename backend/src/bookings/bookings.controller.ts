import { Controller, Get, Post, Body, Param, Query, UseGuards, Request } from '@nestjs/common';
import { BookingsService } from './bookings.service';
import { CreateBookingDto } from './dto/booking.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { BookingStatus } from '@prisma/client';

@Controller('bookings')
@UseGuards(JwtAuthGuard, RolesGuard)
export class BookingsController {
  constructor(private readonly bookingsService: BookingsService) {}

  @Get()
  async findAll(
    @Query('status') status?: BookingStatus,
    @Query('customerId') customerId?: string,
    @Query('search') search?: string,
  ) {
    return this.bookingsService.findAll({ status, customerId, search });
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.bookingsService.findOne(id);
  }

  @Post()
  async create(@Body() dto: CreateBookingDto, @Request() req: any) {
    return this.bookingsService.createBooking(dto, req.user.id);
  }
}
