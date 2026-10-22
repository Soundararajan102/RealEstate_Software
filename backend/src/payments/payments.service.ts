import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
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

  private async generateNextReceiptNumber(): Promise<string> {
    const lastPayment = await this.prisma.payment.findFirst({
      orderBy: { createdAt: 'desc' },
      select: { receiptNumber: true },
    });

    const year = new Date().getFullYear();
    if (!lastPayment || !lastPayment.receiptNumber.startsWith(`RCP-${year}-`)) {
      return `RCP-${year}-0004`;
    }

    const numPart = parseInt(lastPayment.receiptNumber.replace(`RCP-${year}-`, ''), 10);
    const nextNum = isNaN(numPart) ? 4 : numPart + 1;
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
    const booking = await this.prisma.booking.findUnique({
      where: { id: dto.bookingId },
      include: {
        customer: true,
        plot: { include: { project: true } },
        payments: true,
        installments: { orderBy: { installmentNumber: 'asc' } },
      },
    });

    if (!booking) {
      throw new NotFoundException('Booking not found');
    }

    const currentlyPaid = booking.payments.reduce((sum, p) => sum + Number(p.amount), 0);
    const remainingBalance = Number(booking.finalPayableAmount) - currentlyPaid;

    if (dto.amount > remainingBalance) {
      throw new BadRequestException(
        `Payment amount (₹${dto.amount.toLocaleString('en-IN')}) exceeds remaining balance of ₹${remainingBalance.toLocaleString('en-IN')}`,
      );
    }

    const receiptNumber = await this.generateNextReceiptNumber();
    const newTotalPaid = currentlyPaid + dto.amount;
    const newPendingBalance = Math.max(0, Number(booking.finalPayableAmount) - newTotalPaid);
    const isNowFullyPaid = newPendingBalance <= 0;

    // Execute atomic transaction
    const payment = await this.prisma.$transaction(async (tx) => {
      // 1. Create Payment
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

      // 2. Reallocate installments if installment plan exists
      let unallocated = dto.amount;
      for (const inst of booking.installments) {
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

      // 3. If fully settled, update booking status to COMPLETED and plot to SOLD
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

      return newPayment;
    });

    // 4. Trigger SMS receipt confirmation
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
        remainingBalance: newPendingBalance,
      });
    } catch (smsErr) {
      console.error('Non-blocking SMS error:', smsErr);
    }

    return this.findOne(payment.id);
  }
}
