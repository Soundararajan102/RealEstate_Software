import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { PlotStatus, InstallmentStatus, BookingStatus } from '@prisma/client';

@Injectable()
export class ReportsService {
  constructor(private prisma: PrismaService) {}

  async getDashboardSummary() {
    // 1. Projects & Plots Counts
    const totalProjects = await this.prisma.project.count();
    const allPlots = await this.prisma.plot.findMany({
      select: { status: true, totalPrice: true },
    });

    const totalPlots = allPlots.length;
    const availablePlots = allPlots.filter((p) => p.status === PlotStatus.AVAILABLE).length;
    const bookedPlots = allPlots.filter((p) => p.status === PlotStatus.BOOKED).length;
    const soldPlots = allPlots.filter((p) => p.status === PlotStatus.SOLD).length;

    // 2. Financial Metrics from Bookings & Payments
    const bookings = await this.prisma.booking.findMany({
      where: { status: { not: BookingStatus.CANCELLED } },
      select: {
        finalPayableAmount: true,
        brokerCommissionAmount: true,
      },
    });

    const totalSalesValue = bookings.reduce((sum, b) => sum + Number(b.finalPayableAmount), 0);
    const totalBrokerCommission = bookings.reduce((sum, b) => sum + Number(b.brokerCommissionAmount), 0);

    const payments = await this.prisma.payment.findMany({
      select: { amount: true },
    });

    const totalCollected = payments.reduce((sum, p) => sum + Number(p.amount), 0);
    const totalOutstanding = Math.max(0, totalSalesValue - totalCollected);

    // 3. Customers & Brokers
    const totalCustomers = await this.prisma.customer.count();
    const totalBrokers = await this.prisma.broker.count();

    // 4. Upcoming / Overdue Installments
    const now = new Date();
    const thirtyDaysLater = new Date();
    thirtyDaysLater.setDate(thirtyDaysLater.getDate() + 30);

    const upcomingInstallments = await this.prisma.installmentSchedule.findMany({
      where: {
        status: { in: [InstallmentStatus.PENDING, InstallmentStatus.PARTIALLY_PAID] },
        dueDate: { lte: thirtyDaysLater },
      },
      include: {
        booking: {
          include: {
            customer: { select: { fullName: true, phone: true } },
            plot: {
              select: {
                plotNumber: true,
                project: { select: { name: true } },
              },
            },
          },
        },
      },
      orderBy: { dueDate: 'asc' },
      take: 10,
    });

    // 5. Recent 5 Bookings
    const recentBookings = await this.prisma.booking.findMany({
      include: {
        customer: { select: { fullName: true, phone: true } },
        plot: {
          select: {
            plotNumber: true,
            project: { select: { name: true } },
          },
        },
        salesExecutive: { select: { fullName: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: 5,
    });

    // 6. Recent 5 Payments
    const recentPayments = await this.prisma.payment.findMany({
      include: {
        customer: { select: { fullName: true } },
        booking: {
          select: {
            bookingCode: true,
            plot: { select: { plotNumber: true } },
          },
        },
      },
      orderBy: { paymentDate: 'desc' },
      take: 5,
    });

    return {
      inventory: {
        totalProjects,
        totalPlots,
        availablePlots,
        bookedPlots,
        soldPlots,
      },
      financials: {
        totalSalesValue,
        totalCollected,
        totalOutstanding,
        totalBrokerCommission,
      },
      counts: {
        totalCustomers,
        totalBrokers,
      },
      upcomingInstallments,
      recentBookings,
      recentPayments,
    };
  }
}
