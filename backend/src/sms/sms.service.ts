import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { SmsEventType, SmsStatus } from '@prisma/client';

@Injectable()
export class SmsService {
  constructor(private prisma: PrismaService) {}

  async sendBookingWelcome(params: {
    bookingId: string;
    customerId: string;
    customerPhone: string;
    customerName: string;
    plotNumber: string;
    projectName: string;
    bookingCode: string;
  }) {
    const messageBody = `Dear ${params.customerName}, warm greetings from MSP Properties! Your booking for Plot ${params.plotNumber} in ${params.projectName} is confirmed. Booking ID: ${params.bookingCode}. We look forward to serving you!`;

    return this.dispatchSms({
      recipientPhone: params.customerPhone,
      recipientName: params.customerName,
      customerId: params.customerId,
      bookingId: params.bookingId,
      eventType: SmsEventType.BOOKING_WELCOME,
      messageBody,
    });
  }

  async sendPaymentReceipt(params: {
    paymentId: string;
    bookingId: string;
    customerId: string;
    customerPhone: string;
    customerName: string;
    amount: number;
    receiptNumber: string;
    plotNumber: string;
    remainingBalance: number;
  }) {
    const messageBody = `Dear ${params.customerName}, payment of Rs. ${params.amount.toLocaleString('en-IN')} received for Plot ${params.plotNumber}. Receipt No: ${params.receiptNumber}. Pending Balance: Rs. ${params.remainingBalance.toLocaleString('en-IN')}. Thank you, MSP Properties.`;

    return this.dispatchSms({
      recipientPhone: params.customerPhone,
      recipientName: params.customerName,
      customerId: params.customerId,
      bookingId: params.bookingId,
      paymentId: params.paymentId,
      eventType: SmsEventType.PAYMENT_RECEIPT,
      messageBody,
    });
  }

  async sendInstallmentReminder(params: {
    bookingId: string;
    customerId: string;
    customerPhone: string;
    customerName: string;
    installmentNumber: number;
    amount: number;
    dueDate: Date;
    plotNumber: string;
  }) {
    const formattedDate = new Date(params.dueDate).toLocaleDateString('en-IN');
    const messageBody = `Dear ${params.customerName}, gentle reminder: Installment #${params.installmentNumber} of Rs. ${params.amount.toLocaleString('en-IN')} for Plot ${params.plotNumber} is due on ${formattedDate}. Please arrange payment to avoid late fees. MSP Properties.`;

    return this.dispatchSms({
      recipientPhone: params.customerPhone,
      recipientName: params.customerName,
      customerId: params.customerId,
      bookingId: params.bookingId,
      eventType: SmsEventType.INSTALLMENT_REMINDER,
      messageBody,
    });
  }

  async sendCustomSms(params: {
    recipientPhone: string;
    recipientName?: string;
    customerId?: string;
    messageBody: string;
  }) {
    return this.dispatchSms({
      recipientPhone: params.recipientPhone,
      recipientName: params.recipientName,
      customerId: params.customerId,
      eventType: SmsEventType.CUSTOM,
      messageBody: params.messageBody,
    });
  }

  private async dispatchSms(data: {
    recipientPhone: string;
    recipientName?: string;
    customerId?: string;
    bookingId?: string;
    paymentId?: string;
    eventType: SmsEventType;
    messageBody: string;
  }) {
    const provider = process.env.SMS_PROVIDER || 'SIMULATED';
    let status: SmsStatus = SmsStatus.SIMULATED;
    let gatewayResponse = JSON.stringify({
      provider,
      status: 'success',
      simulated: true,
      timestamp: new Date().toISOString(),
    });

    // In production with live API key, send actual HTTP request to SMS gateway
    if (provider !== 'SIMULATED' && process.env.SMS_API_KEY) {
      try {
        // e.g. await fetch(SMS_ENDPOINT, ...)
        status = SmsStatus.DELIVERED;
      } catch (err: any) {
        status = SmsStatus.FAILED;
        gatewayResponse = JSON.stringify({ error: err.message });
      }
    }

    return this.prisma.smsLog.create({
      data: {
        recipientPhone: data.recipientPhone,
        recipientName: data.recipientName,
        customerId: data.customerId,
        bookingId: data.bookingId,
        paymentId: data.paymentId,
        eventType: data.eventType,
        messageBody: data.messageBody,
        status,
        gatewayResponse,
      },
    });
  }

  async findAllLogs(search?: string) {
    const where: any = {};
    if (search) {
      where.OR = [
        { recipientPhone: { contains: search, mode: 'insensitive' } },
        { recipientName: { contains: search, mode: 'insensitive' } },
        { messageBody: { contains: search, mode: 'insensitive' } },
      ];
    }

    return this.prisma.smsLog.findMany({
      where,
      orderBy: { sentAt: 'desc' },
      take: 100,
    });
  }
}
