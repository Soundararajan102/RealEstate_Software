import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateBrokerDto } from './dto/broker.dto';
import { CommissionStatus } from '@prisma/client';

@Injectable()
export class BrokersService {
  constructor(private prisma: PrismaService) {}

  private async generateNextBrokerCode(): Promise<string> {
    const lastBroker = await this.prisma.broker.findFirst({
      orderBy: { createdAt: 'desc' },
      select: { brokerCode: true },
    });

    if (!lastBroker || !lastBroker.brokerCode.startsWith('BRK-')) {
      return 'BRK-1004';
    }

    const numPart = parseInt(lastBroker.brokerCode.replace('BRK-', ''), 10);
    const nextNum = isNaN(numPart) ? 1004 : numPart + 1;
    return `BRK-${nextNum}`;
  }

  async findAll(search?: string) {
    const where: any = {};
    if (search) {
      where.OR = [
        { fullName: { contains: search, mode: 'insensitive' } },
        { phone: { contains: search, mode: 'insensitive' } },
        { agencyName: { contains: search, mode: 'insensitive' } },
        { brokerCode: { contains: search, mode: 'insensitive' } },
      ];
    }

    const brokers = await this.prisma.broker.findMany({
      where,
      include: {
        bookings: {
          select: {
            id: true,
            bookingCode: true,
            finalPayableAmount: true,
            brokerCommissionAmount: true,
            brokerCommissionStatus: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return brokers.map((b) => {
      const referralCount = b.bookings.length;
      const totalSalesVolume = b.bookings.reduce((sum, bk) => sum + Number(bk.finalPayableAmount), 0);
      const totalCommission = b.bookings.reduce((sum, bk) => sum + Number(bk.brokerCommissionAmount), 0);
      const pendingCommission = b.bookings
        .filter((bk) => bk.brokerCommissionStatus !== CommissionStatus.PAID)
        .reduce((sum, bk) => sum + Number(bk.brokerCommissionAmount), 0);

      return {
        id: b.id,
        brokerCode: b.brokerCode,
        fullName: b.fullName,
        phone: b.phone,
        agencyName: b.agencyName,
        email: b.email,
        address: b.address,
        commissionType: b.commissionType,
        defaultCommissionValue: b.defaultCommissionValue,
        isActive: b.isActive,
        referralCount,
        totalSalesVolume,
        totalCommission,
        pendingCommission,
        createdAt: b.createdAt,
      };
    });
  }

  async findOne(id: string) {
    const broker = await this.prisma.broker.findUnique({
      where: { id },
      include: {
        bookings: {
          include: {
            customer: true,
            plot: {
              include: { project: true },
            },
          },
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!broker) {
      throw new NotFoundException('Broker not found');
    }

    return broker;
  }

  async create(dto: CreateBrokerDto) {
    const existing = await this.prisma.broker.findUnique({
      where: { phone: dto.phone.trim() },
    });

    if (existing) {
      throw new ConflictException(`A broker with phone number ${dto.phone} already exists`);
    }

    const brokerCode = await this.generateNextBrokerCode();

    return this.prisma.broker.create({
      data: {
        brokerCode,
        fullName: dto.fullName.trim(),
        phone: dto.phone.trim(),
        agencyName: dto.agencyName?.trim(),
        email: dto.email?.toLowerCase().trim(),
        address: dto.address?.trim(),
        commissionType: dto.commissionType,
        defaultCommissionValue: dto.defaultCommissionValue || 1.0,
        isActive: true,
      },
    });
  }
}
