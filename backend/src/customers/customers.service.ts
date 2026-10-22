import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateCustomerDto } from './dto/customer.dto';

@Injectable()
export class CustomersService {
  constructor(private prisma: PrismaService) {}

  private async generateNextCustomerCode(): Promise<string> {
    const lastCustomer = await this.prisma.customer.findFirst({
      orderBy: { createdAt: 'desc' },
      select: { customerCode: true },
    });

    if (!lastCustomer || !lastCustomer.customerCode.startsWith('CUST-')) {
      return 'CUST-1006';
    }

    const numPart = parseInt(lastCustomer.customerCode.replace('CUST-', ''), 10);
    const nextNum = isNaN(numPart) ? 1006 : numPart + 1;
    return `CUST-${nextNum}`;
  }

  async findAll(search?: string) {
    const where: any = {};
    if (search) {
      where.OR = [
        { fullName: { contains: search, mode: 'insensitive' } },
        { phone: { contains: search, mode: 'insensitive' } },
        { customerCode: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
      ];
    }

    const customers = await this.prisma.customer.findMany({
      where,
      include: {
        bookings: {
          select: {
            id: true,
            bookingCode: true,
            status: true,
            finalPayableAmount: true,
            plot: {
              select: {
                plotNumber: true,
                project: { select: { name: true } },
              },
            },
          },
        },
        payments: {
          select: {
            amount: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return customers.map((c) => {
      const totalBookings = c.bookings.length;
      const totalCommitted = c.bookings.reduce((sum, b) => sum + Number(b.finalPayableAmount), 0);
      const totalPaid = c.payments.reduce((sum, p) => sum + Number(p.amount), 0);
      const pendingBalance = totalCommitted - totalPaid;

      return {
        id: c.id,
        customerCode: c.customerCode,
        fullName: c.fullName,
        phone: c.phone,
        alternatePhone: c.alternatePhone,
        email: c.email,
        address: c.address,
        idProofType: c.idProofType,
        idProofNumber: c.idProofNumber,
        notes: c.notes,
        totalBookings,
        totalCommitted,
        totalPaid,
        pendingBalance: Math.max(0, pendingBalance),
        createdAt: c.createdAt,
      };
    });
  }

  async findOne(id: string) {
    const customer = await this.prisma.customer.findUnique({
      where: { id },
      include: {
        bookings: {
          include: {
            plot: {
              include: { project: true },
            },
            broker: true,
            installments: { orderBy: { installmentNumber: 'asc' } },
            payments: { orderBy: { paymentDate: 'desc' } },
          },
          orderBy: { createdAt: 'desc' },
        },
        payments: {
          orderBy: { paymentDate: 'desc' },
        },
        smsLogs: {
          orderBy: { sentAt: 'desc' },
          take: 10,
        },
      },
    });

    if (!customer) {
      throw new NotFoundException('Customer not found');
    }

    return customer;
  }

  async create(dto: CreateCustomerDto) {
    const existing = await this.prisma.customer.findUnique({
      where: { phone: dto.phone.trim() },
    });

    if (existing) {
      throw new ConflictException(`A customer with phone number ${dto.phone} already exists`);
    }

    const customerCode = await this.generateNextCustomerCode();

    return this.prisma.customer.create({
      data: {
        customerCode,
        fullName: dto.fullName.trim(),
        phone: dto.phone.trim(),
        alternatePhone: dto.alternatePhone?.trim(),
        email: dto.email?.toLowerCase().trim(),
        address: dto.address?.trim(),
        idProofType: dto.idProofType,
        idProofNumber: dto.idProofNumber,
        notes: dto.notes,
      },
    });
  }
}
