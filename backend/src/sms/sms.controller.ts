import { Controller, Get, Post, Body, Query, UseGuards } from '@nestjs/common';
import { SmsService } from './sms.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { Role } from '@prisma/client';
import { SendCustomSmsDto, RemindInstallmentDto } from './dto/sms.dto';

@Controller('sms')
@UseGuards(JwtAuthGuard, RolesGuard)
export class SmsController {
  constructor(private readonly smsService: SmsService) {}

  @Get()
  async findAll(@Query('search') search?: string) {
    return this.smsService.findAllLogs(search);
  }

  @Post('send-custom')
  @Roles(Role.ADMIN)
  async sendCustom(@Body() dto: SendCustomSmsDto) {
    return this.smsService.sendCustomSms(dto);
  }

  @Post('remind-installment')
  @Roles(Role.ADMIN, Role.ACCOUNTS_EXECUTIVE)
  async remindInstallment(@Body() dto: RemindInstallmentDto) {
    return this.smsService.sendInstallmentReminder({
      ...dto,
      dueDate: new Date(dto.dueDate),
    });
  }
}
