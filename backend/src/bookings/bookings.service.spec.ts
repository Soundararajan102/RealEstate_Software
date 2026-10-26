import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NotFoundException, ConflictException, BadRequestException } from '@nestjs/common';
import { BookingsService } from './bookings.service';
import { PlotStatus, PaymentPlan, CommissionType, BookingStatus } from '@prisma/client';

describe('BookingsService Unit Tests', () => {
  let service: BookingsService;
  let mockPrisma: any;
  let mockSms: any;

  beforeEach(() => {
    mockPrisma = {
      booking: {
        findFirst: vi.fn(),
        findMany: vi.fn(),
        findUnique: vi.fn(),
        create: vi.fn(),
      },
      plot: {
        findUnique: vi.fn(),
        updateMany: vi.fn(),
      },
      customer: {
        findUnique: vi.fn(),
      },
      broker: {
        findUnique: vi.fn(),
      },
      payment: {
        findFirst: vi.fn(),
        create: vi.fn(),
      },
      installmentSchedule: {
        create: vi.fn(),
      },
      $transaction: vi.fn(async (callback) => {
        return callback(mockPrisma);
      }),
    };

    mockSms = {
      sendBookingWelcome: vi.fn().mockResolvedValue({ success: true }),
      sendPaymentReceipt: vi.fn().mockResolvedValue({ success: true }),
    };

    service = new BookingsService(mockPrisma, mockSms);
  });

  describe('createBooking input validation & pre-checks', () => {
    it('should throw NotFoundException when plot does not exist', async () => {
      mockPrisma.plot.findUnique.mockResolvedValue(null);

      await expect(
        service.createBooking(
          {
            customerId: 'cust-1',
            plotId: 'invalid-plot-id',
            agreedRatePerSqFt: 1500,
          },
          'sales-exec-1',
        ),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw ConflictException when plot is already BOOKED or SOLD', async () => {
      mockPrisma.plot.findUnique.mockResolvedValue({
        id: 'plot-1',
        plotNumber: 'P-101',
        status: PlotStatus.BOOKED,
      });

      await expect(
        service.createBooking(
          {
            customerId: 'cust-1',
            plotId: 'plot-1',
            agreedRatePerSqFt: 1500,
          },
          'sales-exec-1',
        ),
      ).rejects.toThrow(ConflictException);
    });

    it('should throw NotFoundException when customer does not exist', async () => {
      mockPrisma.plot.findUnique.mockResolvedValue({
        id: 'plot-1',
        plotNumber: 'P-101',
        status: PlotStatus.AVAILABLE,
        project: { name: 'Green Valley' },
      });
      mockPrisma.customer.findUnique.mockResolvedValue(null);

      await expect(
        service.createBooking(
          {
            customerId: 'non-existent-cust',
            plotId: 'plot-1',
            agreedRatePerSqFt: 1500,
          },
          'sales-exec-1',
        ),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw BadRequestException when advance paid exceeds final payable amount', async () => {
      mockPrisma.plot.findUnique.mockResolvedValue({
        id: 'plot-1',
        plotNumber: 'P-101',
        areaSqFt: 1200,
        status: PlotStatus.AVAILABLE,
        project: { name: 'Green Valley' },
      });
      mockPrisma.customer.findUnique.mockResolvedValue({
        id: 'cust-1',
        fullName: 'Rajesh Kumar',
        phone: '9876543210',
      });

      // agreedTotalPrice = 1200 * 1000 = 1,200,000. discount = 200,000 => payable = 1,000,000
      // advance = 1,500,000 (> 1,000,000)
      await expect(
        service.createBooking(
          {
            customerId: 'cust-1',
            plotId: 'plot-1',
            agreedRatePerSqFt: 1000,
            discountAmount: 200000,
            bookingAdvancePaid: 1500000,
          },
          'sales-exec-1',
        ),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('createBooking race condition protection & atomic transaction', () => {
    it('should throw ConflictException if plot was concurrently reserved during transaction', async () => {
      mockPrisma.plot.findUnique.mockResolvedValue({
        id: 'plot-1',
        plotNumber: 'P-101',
        areaSqFt: 1200,
        status: PlotStatus.AVAILABLE,
        project: { name: 'Green Valley' },
      });
      mockPrisma.customer.findUnique.mockResolvedValue({
        id: 'cust-1',
        fullName: 'Rajesh Kumar',
        phone: '9876543210',
      });
      mockPrisma.booking.findFirst.mockResolvedValue(null);

      // Simulate atomic update returning count = 0 (another transaction took it)
      mockPrisma.plot.updateMany.mockResolvedValue({ count: 0 });

      await expect(
        service.createBooking(
          {
            customerId: 'cust-1',
            plotId: 'plot-1',
            agreedRatePerSqFt: 1500,
            bookingAdvancePaid: 50000,
          },
          'sales-exec-1',
        ),
      ).rejects.toThrow(ConflictException);
    });

    it('should successfully execute booking with installment schedule and send SMS notifications', async () => {
      const year = new Date().getFullYear();
      mockPrisma.plot.findUnique.mockResolvedValue({
        id: 'plot-1',
        plotNumber: 'P-101',
        areaSqFt: 1200,
        status: PlotStatus.AVAILABLE,
        project: { name: 'Green Valley' },
      });
      mockPrisma.customer.findUnique.mockResolvedValue({
        id: 'cust-1',
        fullName: 'Rajesh Kumar',
        phone: '9876543210',
      });
      mockPrisma.broker.findUnique.mockResolvedValue({
        id: 'brk-1',
        commissionType: CommissionType.PERCENTAGE,
        defaultCommissionValue: 2, // 2%
      });
      mockPrisma.booking.findFirst.mockResolvedValue(null);
      mockPrisma.payment.findFirst.mockResolvedValue(null);

      // Atomic update succeeds
      mockPrisma.plot.updateMany.mockResolvedValue({ count: 1 });

      const createdBooking = {
        id: 'book-new-id',
        bookingCode: `BK-${year}-0001`,
        customerId: 'cust-1',
        plotId: 'plot-1',
        agreedTotalPrice: 1800000,
        finalPayableAmount: 1800000,
        bookingAdvancePaid: 300000,
        status: BookingStatus.ACTIVE,
      };
      mockPrisma.booking.create.mockResolvedValue(createdBooking);

      const createdPayment = {
        id: 'pay-new-id',
        receiptNumber: `RCP-${year}-0001`,
        amount: 300000,
      };
      mockPrisma.payment.create.mockResolvedValue(createdPayment);

      // Mock findOne for final return
      mockPrisma.booking.findUnique.mockResolvedValue({
        ...createdBooking,
        payments: [{ amount: 300000 }],
        customer: { fullName: 'Rajesh Kumar' },
        plot: { plotNumber: 'P-101', project: { name: 'Green Valley' } },
        installments: [],
      });

      const result = await service.createBooking(
        {
          customerId: 'cust-1',
          plotId: 'plot-1',
          brokerId: 'brk-1',
          agreedRatePerSqFt: 1500,
          bookingAdvancePaid: 300000,
          paymentPlan: PaymentPlan.INSTALLMENT,
          installmentCount: 3,
        },
        'sales-exec-1',
      );

      expect(mockPrisma.plot.updateMany).toHaveBeenCalledWith({
        where: { id: 'plot-1', status: PlotStatus.AVAILABLE },
        data: { status: PlotStatus.BOOKED },
      });
      // 3 installments created
      expect(mockPrisma.installmentSchedule.create).toHaveBeenCalledTimes(3);
      // Advance payment recorded
      expect(mockPrisma.payment.create).toHaveBeenCalled();
      // SMS notifications sent
      expect(mockSms.sendBookingWelcome).toHaveBeenCalled();
      expect(mockSms.sendPaymentReceipt).toHaveBeenCalled();

      expect(result.pendingBalance).toBe(1500000);
      expect(result.totalPaid).toBe(300000);
    });
  });

  describe('findAll and findOne queries', () => {
    it('should calculate totalPaid and pendingBalance correctly for list queries', async () => {
      mockPrisma.booking.findMany.mockResolvedValue([
        {
          id: 'b-1',
          finalPayableAmount: 2000000,
          payments: [{ amount: 500000 }, { amount: 300000 }],
        },
      ]);

      const list = await service.findAll();
      expect(list[0].totalPaid).toBe(800000);
      expect(list[0].pendingBalance).toBe(1200000);
    });

    it('should throw NotFoundException when findOne does not match', async () => {
      mockPrisma.booking.findUnique.mockResolvedValue(null);

      await expect(service.findOne('non-existent-id')).rejects.toThrow(NotFoundException);
    });

    it('should return booking with calculated totalPaid and pendingBalance for findOne', async () => {
      mockPrisma.booking.findUnique.mockResolvedValue({
        id: 'b-1',
        finalPayableAmount: 1500000,
        payments: [{ amount: 1500000 }],
      });

      const booking = await service.findOne('b-1');
      expect(booking.totalPaid).toBe(1500000);
      expect(booking.pendingBalance).toBe(0);
    });
  });
});
