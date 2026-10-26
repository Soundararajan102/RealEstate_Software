import { describe, it, expect, vi, beforeEach } from 'vitest';
import { SmsService } from './sms.service';
import { SmsEventType, SmsStatus } from '@prisma/client';

describe('SmsService Unit Tests', () => {
  let service: SmsService;
  let mockPrisma: any;

  beforeEach(() => {
    mockPrisma = {
      smsLog: {
        create: vi.fn().mockImplementation(({ data }) => Promise.resolve({ id: 'log-1', ...data })),
        findMany: vi.fn().mockResolvedValue([]),
      },
    };

    service = new SmsService(mockPrisma);
  });

  it('should send booking welcome SMS and persist log with SIMULATED status in default environment', async () => {
    const log = await service.sendBookingWelcome({
      bookingId: 'bk-1',
      customerId: 'cust-1',
      customerPhone: '9840123456',
      customerName: 'Rajesh Kumar',
      plotNumber: 'P-12',
      projectName: 'MSP Green Valley',
      bookingCode: 'BK-2026-0001',
    });

    expect(log).toHaveProperty('id', 'log-1');
    expect(log.eventType).toBe(SmsEventType.BOOKING_WELCOME);
    expect(log.status).toBe(SmsStatus.SIMULATED);
    expect(log.messageBody).toContain('Plot P-12');
    expect(log.messageBody).toContain('MSP Green Valley');
    expect(mockPrisma.smsLog.create).toHaveBeenCalled();
  });

  it('should send payment receipt SMS with correct monetary formatting', async () => {
    const log = await service.sendPaymentReceipt({
      paymentId: 'pay-1',
      bookingId: 'bk-1',
      customerId: 'cust-1',
      customerPhone: '9840123456',
      customerName: 'Rajesh Kumar',
      amount: 500000,
      receiptNumber: 'RCP-2026-0001',
      plotNumber: 'P-12',
      remainingBalance: 250000,
    });

    expect(log.eventType).toBe(SmsEventType.PAYMENT_RECEIPT);
    expect(log.messageBody).toContain('RCP-2026-0001');
    expect(log.messageBody).toContain('5,00,000');
    expect(log.messageBody).toContain('2,50,000');
  });

  it('should send installment reminder with due date and amount', async () => {
    const log = await service.sendInstallmentReminder({
      bookingId: 'bk-1',
      customerId: 'cust-1',
      customerPhone: '9840123456',
      customerName: 'Rajesh Kumar',
      installmentNumber: 2,
      amount: 150000,
      dueDate: new Date('2026-11-15T00:00:00Z'),
      plotNumber: 'P-12',
    });

    expect(log.eventType).toBe(SmsEventType.INSTALLMENT_REMINDER);
    expect(log.messageBody).toContain('Installment #2');
    expect(log.messageBody).toContain('1,50,000');
  });

  it('should query SMS logs with optional search filter', async () => {
    mockPrisma.smsLog.findMany.mockResolvedValue([
      { id: 'log-1', recipientPhone: '9840123456', messageBody: 'Hello' },
    ]);

    const logs = await service.findAllLogs('9840');
    expect(logs).toHaveLength(1);
    expect(mockPrisma.smsLog.findMany).toHaveBeenCalledWith({
      where: {
        OR: [
          { recipientPhone: { contains: '9840', mode: 'insensitive' } },
          { recipientName: { contains: '9840', mode: 'insensitive' } },
          { messageBody: { contains: '9840', mode: 'insensitive' } },
        ],
      },
      orderBy: { sentAt: 'desc' },
      take: 100,
    });
  });
});
