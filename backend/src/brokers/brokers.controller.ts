import { Controller, Get, Post, Body, Param, Query, UseGuards } from '@nestjs/common';
import { BrokersService } from './brokers.service';
import { CreateBrokerDto } from './dto/broker.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { Role } from '@prisma/client';

@Controller('brokers')
@UseGuards(JwtAuthGuard, RolesGuard)
export class BrokersController {
  constructor(private readonly brokersService: BrokersService) {}

  @Get()
  async findAll(@Query('search') search?: string) {
    return this.brokersService.findAll(search);
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.brokersService.findOne(id);
  }

  @Post()
  @Roles(Role.ADMIN, Role.SALES_EXECUTIVE)
  async create(@Body() dto: CreateBrokerDto) {
    return this.brokersService.create(dto);
  }
}
