import { Controller, Get, Post, Body, Param, Query, UseGuards } from '@nestjs/common';
import { BrokersService } from './brokers.service';
import { CreateBrokerDto } from './dto/broker.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';

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
  async create(@Body() dto: CreateBrokerDto) {
    return this.brokersService.create(dto);
  }
}
