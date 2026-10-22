export type Role = 'ADMIN' | 'SALES_EXECUTIVE' | 'ACCOUNTS_EXECUTIVE';

export interface User {
  id: string;
  employeeId: string;
  fullName: string;
  email: string;
  phone?: string;
  role: Role;
  isActive: boolean;
  assignedProjects: string[];
}

export type ProjectStatus = 'UPCOMING' | 'ONGOING' | 'COMPLETED';
export type PlotStatus = 'AVAILABLE' | 'BOOKED' | 'SOLD';
export type Facing = 'NORTH' | 'SOUTH' | 'EAST' | 'WEST' | 'NORTH_EAST' | 'NORTH_WEST' | 'SOUTH_EAST' | 'SOUTH_WEST';
export type PaymentPlan = 'FULL_PAYMENT' | 'INSTALLMENT';
export type BookingStatus = 'ACTIVE' | 'COMPLETED' | 'CANCELLED';
export type CommissionType = 'PERCENTAGE' | 'FIXED_PER_SQFT';
export type CommissionStatus = 'PENDING' | 'PARTIALLY_PAID' | 'PAID';
export type InstallmentStatus = 'PENDING' | 'PARTIALLY_PAID' | 'PAID' | 'OVERDUE';
export type PaymentMethod = 'CASH' | 'CHEQUE' | 'BANK_TRANSFER' | 'UPI';
export type SmsStatus = 'DELIVERED' | 'SIMULATED' | 'FAILED';
export type SmsEventType = 'BOOKING_WELCOME' | 'PAYMENT_RECEIPT' | 'INSTALLMENT_REMINDER' | 'PROJECT_UPDATE' | 'CUSTOM';

export interface Project {
  id: string;
  name: string;
  location: string;
  description?: string;
  totalAreaSqFt?: number;
  totalPlots: number;
  status: ProjectStatus;
  counts?: {
    total: number;
    available: number;
    booked: number;
    sold: number;
  };
}

export interface Plot {
  id: string;
  projectId: string;
  plotNumber: string;
  surveyNumber?: string;
  facing: Facing;
  dimension?: string;
  areaSqFt: number | string;
  ratePerSqFt: number | string;
  totalPrice: number | string;
  isCornerPlot: boolean;
  status: PlotStatus;
  project?: {
    id: string;
    name: string;
    location: string;
  };
}

export interface Customer {
  id: string;
  customerCode: string;
  fullName: string;
  phone: string;
  alternatePhone?: string;
  email?: string;
  address?: string;
  idProofType?: string;
  idProofNumber?: string;
  notes?: string;
  totalBookings?: number;
  totalCommitted?: number;
  totalPaid?: number;
  pendingBalance?: number;
  createdAt: string;
}

export interface Broker {
  id: string;
  brokerCode: string;
  fullName: string;
  phone: string;
  agencyName?: string;
  email?: string;
  address?: string;
  commissionType: CommissionType;
  defaultCommissionValue: number | string;
  isActive: boolean;
  referralCount?: number;
  totalSalesVolume?: number;
  totalCommission?: number;
  pendingCommission?: number;
}

export interface InstallmentSchedule {
  id: string;
  bookingId: string;
  installmentNumber: number;
  dueDate: string;
  expectedAmount: number | string;
  paidAmount: number | string;
  status: InstallmentStatus;
}

export interface Payment {
  id: string;
  receiptNumber: string;
  bookingId: string;
  customerId: string;
  recordedById: string;
  paymentDate: string;
  amount: number | string;
  paymentMethod: PaymentMethod;
  transactionReference?: string;
  bankName?: string;
  notes?: string;
  customer?: {
    id: string;
    fullName: string;
    phone: string;
    customerCode: string;
  };
  booking?: {
    id: string;
    bookingCode: string;
    plot?: {
      plotNumber: string;
      project?: { name: string };
    };
  };
  recordedBy?: {
    id: string;
    fullName: string;
    employeeId: string;
  };
}

export interface Booking {
  id: string;
  bookingCode: string;
  customerId: string;
  plotId: string;
  brokerId?: string;
  salesExecutiveId: string;
  bookingDate: string;
  agreedRatePerSqFt: number | string;
  agreedTotalPrice: number | string;
  discountAmount: number | string;
  finalPayableAmount: number | string;
  bookingAdvancePaid: number | string;
  paymentPlan: PaymentPlan;
  installmentCount: number;
  status: BookingStatus;
  brokerCommissionAmount: number | string;
  brokerCommissionStatus: CommissionStatus;
  notes?: string;
  totalPaid?: number;
  pendingBalance?: number;
  customer?: Customer;
  plot?: Plot;
  broker?: Broker;
  salesExecutive?: {
    id: string;
    fullName: string;
    employeeId: string;
  };
  installments?: InstallmentSchedule[];
  payments?: Payment[];
}

export interface SmsLog {
  id: string;
  recipientPhone: string;
  recipientName?: string;
  customerId?: string;
  bookingId?: string;
  paymentId?: string;
  eventType: SmsEventType;
  messageBody: string;
  status: SmsStatus;
  sentAt: string;
}

export interface DashboardSummary {
  inventory: {
    totalProjects: number;
    totalPlots: number;
    availablePlots: number;
    bookedPlots: number;
    soldPlots: number;
  };
  financials: {
    totalSalesValue: number;
    totalCollected: number;
    totalOutstanding: number;
    totalBrokerCommission: number;
  };
  counts: {
    totalCustomers: number;
    totalBrokers: number;
  };
  upcomingInstallments: Array<{
    id: string;
    installmentNumber: number;
    dueDate: string;
    expectedAmount: number;
    paidAmount: number;
    status: InstallmentStatus;
    booking: {
      customer: { fullName: string; phone: string };
      plot: { plotNumber: string; project: { name: string } };
    };
  }>;
  recentBookings: Array<{
    id: string;
    bookingCode: string;
    bookingDate: string;
    finalPayableAmount: number;
    status: BookingStatus;
    customer: { fullName: string; phone: string };
    plot: { plotNumber: string; project: { name: string } };
    salesExecutive: { fullName: string };
  }>;
  recentPayments: Array<{
    id: string;
    receiptNumber: string;
    amount: number;
    paymentDate: string;
    paymentMethod: PaymentMethod;
    customer: { fullName: string };
    booking: {
      bookingCode: string;
      plot: { plotNumber: string };
    };
  }>;
}
