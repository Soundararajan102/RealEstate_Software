import { Injectable, NotFoundException, BadRequestException, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { SmsService } from '../sms/sms.service';
import { CreatePaymentDto } from './dto/payment.dto';
import { BookingStatus, PlotStatus, InstallmentStatus } from '@prisma/client';

@Injectable()
export class PaymentsService {
  constructor(
    private prisma: PrismaService,
    private smsService: SmsService,
  ) {}

  private readonly logger = new Logger(PaymentsService.name);

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

  async findAll(search?: string) {
    const where: any = {};
    if (search) {
      where.OR = [
        { receiptNumber: { contains: search, mode: 'insensitive' } },
        { customer: { fullName: { contains: search, mode: 'insensitive' } } },
        { customer: { phone: { contains: search, mode: 'insensitive' } } },
        { transactionReference: { contains: search, mode: 'insensitive' } },
      ];
    }

    return this.prisma.payment.findMany({
      where,
      include: {
        customer: {
          select: { id: true, fullName: true, phone: true, customerCode: true },
        },
        booking: {
          select: {
            id: true,
            bookingCode: true,
            plot: {
              select: {
                plotNumber: true,
                project: { select: { name: true } },
              },
            },
          },
        },
        recordedBy: {
          select: { id: true, fullName: true, employeeId: true },
        },
      },
      orderBy: { paymentDate: 'desc' },
    });
  }

  async findOne(id: string) {
    const payment = await this.prisma.payment.findUnique({
      where: { id },
      include: {
        customer: true,
        booking: {
          include: {
            plot: {
              include: { project: true },
            },
            payments: {
              select: { amount: true },
            },
          },
        },
        recordedBy: {
          select: { id: true, fullName: true, employeeId: true, role: true },
        },
      },
    });

    if (!payment) {
      throw new NotFoundException('Payment record not found');
    }

    const totalPaidOnBooking = payment.booking.payments.reduce((sum, p) => sum + Number(p.amount), 0);
    const pendingBalance = Math.max(0, Number(payment.booking.finalPayableAmount) - totalPaidOnBooking);

    return {
      ...payment,
      totalPaidOnBooking,
      pendingBalance,
    };
  }

  async recordPayment(dto: CreatePaymentDto, recordedById: string) {
    if (dto.amount <= 0) {
      throw new BadRequestException('Payment amount must be greater than zero');
    }

    const booking = await this.prisma.booking.findUnique({
      where: { id: dto.bookingId },
      include: {
        customer: true,
        plot: { include: { project: true } },
      },
    });

    if (!booking) {
      throw new NotFoundException('Booking contract not found');
    }

    if (booking.status === BookingStatus.CANCELLED) {
      throw new BadRequestException('Cannot record payments against a cancelled booking');
    }

    const receiptNumber = await this.generateNextReceiptNumber();

    // Execute atomic transaction to prevent race conditions on balance and installment allocations
    const { payment, remainingBalanceAfterPayment } = await this.prisma.$transaction(async (tx) => {
      // 1. Concurrently safe balance check inside transaction
      const paymentsAgg = await tx.payment.aggregate({
        where: { bookingId: booking.id },
        _sum: { amount: true },
      });
      const currentlyPaid = Number(paymentsAgg._sum.amount || 0);
      const remainingBalance = Number(booking.finalPayableAmount) - currentlyPaid;

      if (dto.amount > remainingBalance) {
        throw new BadRequestException(
          `Payment amount (₹${dto.amount.toLocaleString('en-IN')}) exceeds remaining balance of ₹${remainingBalance.toLocaleString('en-IN')}`,
        );
      }

      // 2. Create Payment Record
      const newPayment = await tx.payment.create({
        data: {
          receiptNumber,
          bookingId: booking.id,
          customerId: booking.customerId,
          recordedById,
          paymentDate: new Date(),
          amount: dto.amount,
          paymentMethod: dto.paymentMethod,
          transactionReference: dto.transactionReference,
          bankName: dto.bankName,
          chequeDate: dto.chequeDate ? new Date(dto.chequeDate) : null,
          notes: dto.notes,
        },
      });

      // 3. Atomically reallocate installments if schedule exists
      const installments = await tx.installmentSchedule.findMany({
        where: { bookingId: booking.id },
        orderBy: { installmentNumber: 'asc' },
      });

      let unallocated = dto.amount;
      for (const inst of installments) {
        if (unallocated <= 0) break;
        const instExpected = Number(inst.expectedAmount);
        const instPaid = Number(inst.paidAmount);
        const instPending = instExpected - instPaid;

        if (instPending > 0) {
          const allocation = Math.min(unallocated, instPending);
          const updatedPaid = instPaid + allocation;
          const status = updatedPaid >= instExpected ? InstallmentStatus.PAID : InstallmentStatus.PARTIALLY_PAID;

          await tx.installmentSchedule.update({
            where: { id: inst.id },
            data: {
              paidAmount: updatedPaid,
              status,
            },
          });

          unallocated -= allocation;
        }
      }

      const remainingBalanceAfterPayment = Math.max(0, remainingBalance - dto.amount);
      const isNowFullyPaid = remainingBalanceAfterPayment <= 0;

      // 4. If fully settled, update booking status to COMPLETED and plot to SOLD
      if (isNowFullyPaid) {
        await tx.booking.update({
          where: { id: booking.id },
          data: { status: BookingStatus.COMPLETED },
        });

        await tx.plot.update({
          where: { id: booking.plotId },
          data: { status: PlotStatus.SOLD },
        });
      }

      return { payment: newPayment, remainingBalanceAfterPayment };
    });

    // 5. Trigger SMS receipt confirmation asynchronously
    try {
      await this.smsService.sendPaymentReceipt({
        paymentId: payment.id,
        bookingId: booking.id,
        customerId: booking.customer.id,
        customerPhone: booking.customer.phone,
        customerName: booking.customer.fullName,
        amount: dto.amount,
        receiptNumber: payment.receiptNumber,
        plotNumber: booking.plot.plotNumber,
        remainingBalance: remainingBalanceAfterPayment,
      });
    } catch (smsErr) {
      this.logger.warn(`Non-blocking SMS receipt error for ${payment.receiptNumber}: ${(smsErr as Error).message}`);
    }

    return this.findOne(payment.id);
  }
}
