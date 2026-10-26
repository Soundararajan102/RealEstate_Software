import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ReportsService } from './reports.service';
import { PlotStatus, BookingStatus } from '@prisma/client';

describe('ReportsService Unit Tests', () => {
  let service: ReportsService;
  let mockPrisma: any;

  beforeEach(() => {
    mockPrisma = {
      project: {
        count: vi.fn(),
      },
      plot: {
        findMany: vi.fn(),
      },
      booking: {
        findMany: vi.fn(),
      },
      payment: {
        findMany: vi.fn(),
      },
      customer: {
        count: vi.fn(),
      },
      broker: {
        count: vi.fn(),
      },
      installmentSchedule: {
        findMany: vi.fn(),
      },
    };

    service = new ReportsService(mockPrisma);
  });

  it('should correctly aggregate inventory and financial metrics for dashboard', async () => {
    mockPrisma.project.count.mockResolvedValue(2);
    mockPrisma.customer.count.mockResolvedValue(10);
    mockPrisma.broker.count.mockResolvedValue(4);

    mockPrisma.plot.findMany.mockResolvedValue([
      { status: PlotStatus.AVAILABLE, totalPrice: 1000000 },
      { status: PlotStatus.AVAILABLE, totalPrice: 1200000 },
      { status: PlotStatus.BOOKED, totalPrice: 1500000 },
      { status: PlotStatus.SOLD, totalPrice: 2000000 },
    ]);

    mockPrisma.booking.findMany
      .mockResolvedValueOnce([
        // Active bookings
        { finalPayableAmount: 1500000, brokerCommissionAmount: 30000 },
        { finalPayableAmount: 2000000, brokerCommissionAmount: 40000 },
      ])
      .mockResolvedValueOnce([
        // Recent 5 bookings
        { id: 'b-1', bookingCode: 'BK-2026-0001' },
      ]);

    mockPrisma.payment.findMany
      .mockResolvedValueOnce([
        // All payments
        { amount: 500000 },
        { amount: 2000000 },
      ])
      .mockResolvedValueOnce([
        // Recent 5 payments
        { id: 'p-1', receiptNumber: 'RCP-2026-0001', amount: 500000 },
      ]);

    mockPrisma.installmentSchedule.findMany.mockResolvedValue([
      { id: 'inst-1', expectedAmount: 500000, paidAmount: 0 },
    ]);

    const summary = await service.getDashboardSummary();

    // Inventory Assertions
    expect(summary.inventory.totalProjects).toBe(2);
    expect(summary.inventory.totalPlots).toBe(4);
    expect(summary.inventory.availablePlots).toBe(2);
    expect(summary.inventory.bookedPlots).toBe(1);
    expect(summary.inventory.soldPlots).toBe(1);

    // Financial Assertions
    // Total sales = 1.5M + 2.0M = 3.5M
    expect(summary.financials.totalSalesValue).toBe(3500000);
    // Total collected = 500k + 2.0M = 2.5M
    expect(summary.financials.totalCollected).toBe(2500000);
    // Outstanding = 3.5M - 2.5M = 1.0M
    expect(summary.financials.totalOutstanding).toBe(1000000);
    expect(summary.financials.totalBrokerCommission).toBe(70000);

    // Counts Assertions
    expect(summary.counts.totalCustomers).toBe(10);
    expect(summary.counts.totalBrokers).toBe(4);
  });
});
