import { Controller, Get, Post, Body, Query, UseGuards } from '@nestjs/common';
import { SmsService } from './sms.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';

@Controller('sms')
@UseGuards(JwtAuthGuard, RolesGuard)
export class SmsController {
  constructor(private readonly smsService: SmsService) {}

  @Get()
  async findAll(@Query('search') search?: string) {
    return this.smsService.findAllLogs(search);
  }

  @Post('send-custom')
  async sendCustom(
    @Body()
    body: {
      recipientPhone: string;
      recipientName?: string;
      customerId?: string;
      messageBody: string;
    },
  ) {
    return this.smsService.sendCustomSms(body);
  }

  @Post('remind-installment')
  async remindInstallment(
    @Body()
    body: {
      bookingId: string;
      customerId: string;
      customerPhone: string;
      customerName: string;
      installmentNumber: number;
      amount: number;
      dueDate: string;
      plotNumber: string;
    },
  ) {
    return this.smsService.sendInstallmentReminder({
      ...body,
      dueDate: new Date(body.dueDate),
    });
  }
}
