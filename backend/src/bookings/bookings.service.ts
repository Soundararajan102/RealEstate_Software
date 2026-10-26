import { Injectable, NotFoundException, ConflictException, BadRequestException, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { SmsService } from '../sms/sms.service';
import { CreateBookingDto } from './dto/booking.dto';
import { PlotStatus, BookingStatus, PaymentPlan, CommissionType, CommissionStatus, InstallmentStatus, PaymentMethod } from '@prisma/client';

@Injectable()
export class BookingsService {
  constructor(
    private prisma: PrismaService,
    private smsService: SmsService,
  ) {}

  private readonly logger = new Logger(BookingsService.name);

  private async generateNextBookingCode(): Promise<string> {
    const year = new Date().getFullYear();
    const lastBooking = await this.prisma.booking.findFirst({
      where: { bookingCode: { startsWith: `BK-${year}-` } },
      orderBy: { createdAt: 'desc' },
      select: { bookingCode: true },
    });

    if (!lastBooking) {
      return `BK-${year}-0001`;
    }

    const numPart = parseInt(lastBooking.bookingCode.replace(`BK-${year}-`, ''), 10);
    const nextNum = isNaN(numPart) ? 1 : numPart + 1;
    return `BK-${year}-${String(nextNum).padStart(4, '0')}`;
  }

  private async generateNextReceiptNumber(): Promise<string> {
    const year = new Date().getFullYear();
    const lastPayment = await this.prisma.payment.findFirst({
      where: { receiptNumber: { startsWith: `RCP-${year}-` } },
      orderBy: { createdAt: 'desc' },
      select: { receiptNumber: true },
    });

    if (!lastPayment) {
      return `RCP-${year}-0001`;
    }

    const numPart = parseInt(lastPayment.receiptNumber.replace(`RCP-${year}-`, ''), 10);
    const nextNum = isNaN(numPart) ? 1 : numPart + 1;
    return `RCP-${year}-${String(nextNum).padStart(4, '0')}`;
  }

  async findAll(filters?: { status?: BookingStatus; customerId?: string; search?: string }) {
    const where: any = {};

    if (filters?.status) {
      where.status = filters.status;
    }

    if (filters?.customerId) {
      where.customerId = filters.customerId;
    }

    if (filters?.search) {
      where.OR = [
        { bookingCode: { contains: filters.search, mode: 'insensitive' } },
        { customer: { fullName: { contains: filters.search, mode: 'insensitive' } } },
        { customer: { phone: { contains: filters.search, mode: 'insensitive' } } },
        { plot: { plotNumber: { contains: filters.search, mode: 'insensitive' } } },
      ];
    }

    const bookings = await this.prisma.booking.findMany({
      where,
      include: {
        customer: true,
        plot: {
          include: { project: true },
        },
        broker: true,
        salesExecutive: {
          select: { id: true, fullName: true, employeeId: true },
        },
        payments: {
          select: { amount: true },
        },
        installments: {
          orderBy: { installmentNumber: 'asc' },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return bookings.map((b) => {
      const totalPaid = b.payments.reduce((sum, p) => sum + Number(p.amount), 0);
      const pendingBalance = Math.max(0, Number(b.finalPayableAmount) - totalPaid);

      return {
        ...b,
        totalPaid,
        pendingBalance,
      };
    });
  }

  async findOne(id: string) {
    const booking = await this.prisma.booking.findUnique({
      where: { id },
      include: {
        customer: true,
        plot: {
          include: { project: true },
        },
        broker: true,
        salesExecutive: {
          select: { id: true, fullName: true, employeeId: true, phone: true },
        },
        installments: {
          orderBy: { installmentNumber: 'asc' },
        },
        payments: {
          include: {
            recordedBy: {
              select: { id: true, fullName: true, employeeId: true },
            },
          },
          orderBy: { paymentDate: 'desc' },
        },
        smsLogs: {
          orderBy: { sentAt: 'desc' },
        },
      },
    });

    if (!booking) {
      throw new NotFoundException('Booking contract not found');
    }

    const totalPaid = booking.payments.reduce((sum, p) => sum + Number(p.amount), 0);
    const pendingBalance = Math.max(0, Number(booking.finalPayableAmount) - totalPaid);

    return {
      ...booking,
      totalPaid,
      pendingBalance,
    };
  }

  async createBooking(dto: CreateBookingDto, salesExecutiveId: string) {
    // 1. Verify plot exists & is available
    const plot = await this.prisma.plot.findUnique({
      where: { id: dto.plotId },
      include: { project: true },
    });

    if (!plot) {
      throw new NotFoundException('Plot not found');
    }

    if (plot.status !== PlotStatus.AVAILABLE) {
      throw new ConflictException(`Plot ${plot.plotNumber} is not available (Current status: ${plot.status})`);
    }

    // 2. Verify customer exists
    const customer = await this.prisma.customer.findUnique({
      where: { id: dto.customerId },
    });

    if (!customer) {
      throw new NotFoundException('Customer not found');
    }

    // 3. Broker check & commission calculation
    let brokerCommissionAmount = 0;
    if (dto.brokerId) {
      const broker = await this.prisma.broker.findUnique({ where: { id: dto.brokerId } });
      if (broker) {
        if (broker.commissionType === CommissionType.PERCENTAGE) {
          const basePrice = Number(plot.areaSqFt) * dto.agreedRatePerSqFt - (dto.discountAmount || 0);
          brokerCommissionAmount = (basePrice * Number(broker.defaultCommissionValue)) / 100;
        } else {
          brokerCommissionAmount = Number(plot.areaSqFt) * Number(broker.defaultCommissionValue);
        }
      }
    }

    const bookingCode = await this.generateNextBookingCode();
    const agreedTotalPrice = Number(plot.areaSqFt) * dto.agreedRatePerSqFt;
    const discount = dto.discountAmount || 0;
    const finalPayableAmount = agreedTotalPrice - discount;
    const advancePaid = dto.bookingAdvancePaid || 0;

    if (advancePaid > finalPayableAmount) {
      throw new BadRequestException('Advance paid cannot exceed the final payable amount');
    }

    const paymentPlan = dto.paymentPlan || PaymentPlan.FULL_PAYMENT;
    const installmentCount = paymentPlan === PaymentPlan.INSTALLMENT ? Math.max(1, dto.installmentCount || 3) : 1;

    // 4. Execute atomic transaction
    const result = await this.prisma.$transaction(async (tx) => {
      const isFullPaid = advancePaid >= finalPayableAmount;
      const newPlotStatus = isFullPaid ? PlotStatus.SOLD : PlotStatus.BOOKED;

      // Atomic reservation guard preventing race conditions
      const updateResult = await tx.plot.updateMany({
        where: { id: plot.id, status: PlotStatus.AVAILABLE },
        data: { status: newPlotStatus },
      });

      if (updateResult.count === 0) {
        throw new ConflictException(
          `Plot ${plot.plotNumber} was concurrently booked by another session`,
        );
      }

      // Create Booking
      const booking = await tx.booking.create({
        data: {
          bookingCode,
          customerId: customer.id,
          plotId: plot.id,
          brokerId: dto.brokerId,
          salesExecutiveId,
          bookingDate: new Date(),
          agreedRatePerSqFt: dto.agreedRatePerSqFt,
          agreedTotalPrice,
          discountAmount: discount,
          finalPayableAmount,
          bookingAdvancePaid: advancePaid,
          paymentPlan,
          installmentCount,
          status: isFullPaid ? BookingStatus.COMPLETED : BookingStatus.ACTIVE,
          brokerCommissionAmount,
          brokerCommissionStatus: CommissionStatus.PENDING,
          notes: dto.notes,
        },
      });

      // Generate Installment Schedule if INSTALLMENT plan
      if (paymentPlan === PaymentPlan.INSTALLMENT && !isFullPaid) {
        const remainingToSchedule = finalPayableAmount - advancePaid;
        const equalAmount = Math.floor(remainingToSchedule / installmentCount);

        for (let i = 1; i <= installmentCount; i++) {
          const dueDate = new Date();
          dueDate.setDate(dueDate.getDate() + i * 30); // 30 days interval

          const expectedAmount = i === installmentCount ? remainingToSchedule - equalAmount * (installmentCount - 1) : equalAmount;

          await tx.installmentSchedule.create({
            data: {
              bookingId: booking.id,
              installmentNumber: i,
              dueDate,
              expectedAmount,
              paidAmount: 0,
              status: InstallmentStatus.PENDING,
            },
          });
        }
      }

      // Record Advance Payment if any
      let paymentRecord = null;
      if (advancePaid > 0) {
        const receiptNumber = await this.generateNextReceiptNumber();
        paymentRecord = await tx.payment.create({
          data: {
            receiptNumber,
            bookingId: booking.id,
            customerId: customer.id,
            recordedById: salesExecutiveId,
            paymentDate: new Date(),
            amount: advancePaid,
            paymentMethod: dto.advancePaymentMethod || PaymentMethod.CASH,
            transactionReference: dto.advancePaymentReference || 'Booking Token Advance',
            notes: 'Advance amount paid during booking confirmation',
          },
        });
      }

      return { booking, paymentRecord };
    });

    // 5. Send Transactional SMS Notifications asynchronously
    try {
      await this.smsService.sendBookingWelcome({
        bookingId: result.booking.id,
        customerId: customer.id,
        customerPhone: customer.phone,
        customerName: customer.fullName,
        plotNumber: plot.plotNumber,
        projectName: plot.project.name,
        bookingCode,
      });

      if (result.paymentRecord) {
        await this.smsService.sendPaymentReceipt({
          paymentId: result.paymentRecord.id,
          bookingId: result.booking.id,
          customerId: customer.id,
          customerPhone: customer.phone,
          customerName: customer.fullName,
          amount: advancePaid,
          receiptNumber: result.paymentRecord.receiptNumber,
          plotNumber: plot.plotNumber,
          remainingBalance: Math.max(0, finalPayableAmount - advancePaid),
        });
      }
    } catch (smsErr) {
      this.logger.warn(`Non-blocking SMS dispatch error for booking ${bookingCode}: ${(smsErr as Error).message}`);
    }

    return this.findOne(result.booking.id);
  }
}
