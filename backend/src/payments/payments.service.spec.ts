import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NotFoundException, BadRequestException } from '@nestjs/common';
import { PaymentsService } from './payments.service';
import { BookingStatus, PlotStatus, InstallmentStatus, PaymentMethod } from '@prisma/client';

describe('PaymentsService Unit Tests', () => {
  let service: PaymentsService;
  let mockPrisma: any;
  let mockSms: any;

  beforeEach(() => {
    mockPrisma = {
      payment: {
        findFirst: vi.fn(),
        findMany: vi.fn(),
        findUnique: vi.fn(),
        create: vi.fn(),
        aggregate: vi.fn(),
      },
      booking: {
        findUnique: vi.fn(),
        update: vi.fn(),
      },
      plot: {
        update: vi.fn(),
      },
      installmentSchedule: {
        findMany: vi.fn(),
        update: vi.fn(),
      },
      $transaction: vi.fn(async (callback) => {
        return callback(mockPrisma);
      }),
    };

    mockSms = {
      sendPaymentReceipt: vi.fn().mockResolvedValue({ success: true }),
    };

    service = new PaymentsService(mockPrisma, mockSms);
  });

  describe('recordPayment validations', () => {
    it('should throw BadRequestException for zero or negative payment amounts', async () => {
      await expect(
        service.recordPayment(
          {
            bookingId: 'book-1',
            amount: 0,
            paymentMethod: PaymentMethod.CASH,
          },
          'admin-user-id',
        ),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw NotFoundException when booking does not exist', async () => {
      mockPrisma.booking.findUnique.mockResolvedValue(null);

      await expect(
        service.recordPayment(
          {
            bookingId: 'non-existent-booking',
            amount: 50000,
            paymentMethod: PaymentMethod.CASH,
          },
          'admin-user-id',
        ),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw BadRequestException when trying to pay against a cancelled booking', async () => {
      mockPrisma.booking.findUnique.mockResolvedValue({
        id: 'book-cancelled',
        status: BookingStatus.CANCELLED,
        finalPayableAmount: 1000000,
        customer: { fullName: 'Rajesh' },
        plot: { plotNumber: 'P-12' },
      });

      await expect(
        service.recordPayment(
          {
            bookingId: 'book-cancelled',
            amount: 50000,
            paymentMethod: PaymentMethod.CASH,
          },
          'admin-user-id',
        ),
      ).rejects.toThrow('Cannot record payments against a cancelled booking');
    });

    it('should throw BadRequestException if payment amount exceeds remaining balance', async () => {
      mockPrisma.booking.findUnique.mockResolvedValue({
        id: 'book-1',
        status: BookingStatus.ACTIVE,
        finalPayableAmount: 1000000,
        customer: { fullName: 'Rajesh' },
        plot: { plotNumber: 'P-12' },
      });

      // Already paid 900,000, remaining balance is 100,000
      mockPrisma.payment.aggregate.mockResolvedValue({
        _sum: { amount: 900000 },
      });

      // Attempting to pay 150,000 (> 100,000)
      await expect(
        service.recordPayment(
          {
            bookingId: 'book-1',
            amount: 150000,
            paymentMethod: PaymentMethod.BANK_TRANSFER,
          },
          'admin-user-id',
        ),
      ).rejects.toThrow(/exceeds remaining balance/);
    });
  });

  describe('recordPayment atomic execution & installment allocation', () => {
    it('should record payment, allocate across installments, and transition to COMPLETED/SOLD when balance reaches 0', async () => {
      const year = new Date().getFullYear();
      const bookingMock = {
        id: 'book-1',
        plotId: 'plot-1',
        customerId: 'cust-1',
        status: BookingStatus.ACTIVE,
        finalPayableAmount: 1000000,
        customer: { id: 'cust-1', fullName: 'Rajesh Kumar', phone: '9840123456' },
        plot: { id: 'plot-1', plotNumber: 'P-12', project: { name: 'MSP Green Valley' } },
      };

      mockPrisma.booking.findUnique.mockResolvedValue(bookingMock);
      mockPrisma.payment.findFirst.mockResolvedValue(null);

      // Current paid: 500,000. Balance remaining: 500,000.
      mockPrisma.payment.aggregate.mockResolvedValue({
        _sum: { amount: 500000 },
      });

      const newPayment = {
        id: 'pay-uuid-1',
        receiptNumber: `RCP-${year}-0001`,
        amount: 500000,
        bookingId: 'book-1',
        customerId: 'cust-1',
      };
      mockPrisma.payment.create.mockResolvedValue(newPayment);

      // Two installments: Inst 1 (250,000 due, 0 paid), Inst 2 (250,000 due, 0 paid)
      mockPrisma.installmentSchedule.findMany.mockResolvedValue([
        { id: 'inst-1', installmentNumber: 1, expectedAmount: 250000, paidAmount: 0 },
        { id: 'inst-2', installmentNumber: 2, expectedAmount: 250000, paidAmount: 0 },
      ]);

      // Mock findOne for final return
      mockPrisma.payment.findUnique.mockResolvedValue({
        ...newPayment,
        customer: bookingMock.customer,
        booking: {
          ...bookingMock,
          payments: [{ amount: 500000 }, { amount: 500000 }],
        },
        recordedBy: { id: 'usr-1', fullName: 'Accountant' },
      });

      const result = await service.recordPayment(
        {
          bookingId: 'book-1',
          amount: 500000,
          paymentMethod: PaymentMethod.BANK_TRANSFER,
          transactionReference: 'NEFT-884920492',
        },
        'usr-1',
      );

      // Verify installments were updated to PAID
      expect(mockPrisma.installmentSchedule.update).toHaveBeenCalledWith({
        where: { id: 'inst-1' },
        data: { paidAmount: 250000, status: InstallmentStatus.PAID },
      });
      expect(mockPrisma.installmentSchedule.update).toHaveBeenCalledWith({
        where: { id: 'inst-2' },
        data: { paidAmount: 250000, status: InstallmentStatus.PAID },
      });

      // Verify status transitions since remaining balance is now 0
      expect(mockPrisma.booking.update).toHaveBeenCalledWith({
        where: { id: 'book-1' },
        data: { status: BookingStatus.COMPLETED },
      });
      expect(mockPrisma.plot.update).toHaveBeenCalledWith({
        where: { id: 'plot-1' },
        data: { status: PlotStatus.SOLD },
      });

      // Verify SMS receipt notification was sent with remaining balance = 0
      expect(mockSms.sendPaymentReceipt).toHaveBeenCalledWith(
        expect.objectContaining({
          receiptNumber: `RCP-${year}-0001`,
          amount: 500000,
          remainingBalance: 0,
        }),
      );

      expect(result.pendingBalance).toBe(0);
      expect(result.totalPaidOnBooking).toBe(1000000);
    });
  });
});
