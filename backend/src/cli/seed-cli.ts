import * as dotenv from 'dotenv';
dotenv.config();

import {
  PrismaClient,
  Role,
  ProjectStatus,
  PlotStatus,
  Facing,
  PaymentPlan,
  BookingStatus,
  CommissionType,
  CommissionStatus,
  InstallmentStatus,
  PaymentMethod,
  SmsEventType,
  SmsStatus,
} from '@prisma/client';
import * as bcrypt from 'bcryptjs';
import * as readline from 'readline/promises';
import { stdin as input, stdout as output } from 'process';

const prisma = new PrismaClient();

export const DEFAULT_PASSWORD = 'Password@123';

export interface SeedUserDefinition {
  employeeId: string;
  fullName: string;
  email: string;
  phone: string;
  role: Role;
  designation: string;
  quickSelectLabel?: string;
}

export const ALL_SEED_USERS: SeedUserDefinition[] = [
  // 1. Administrators
  {
    employeeId: 'EMP-1001',
    fullName: 'M. S. Parthiban',
    email: 'admin@mspproperties.com',
    phone: '9842012345',
    role: Role.ADMIN,
    designation: 'Managing Director & Full Administrator',
    quickSelectLabel: 'Admin (UI Fast Login)',
  },
  {
    employeeId: 'EMP-1000',
    fullName: 'S. K. Sundararajan',
    email: 'director@mspproperties.com',
    phone: '9842000001',
    role: Role.ADMIN,
    designation: 'Executive Director',
  },

  // 2. Sales Executives
  {
    employeeId: 'EMP-1002',
    fullName: 'K. R. Vignesh',
    email: 'vignesh@mspproperties.com',
    phone: '9842054321',
    role: Role.SALES_EXECUTIVE,
    designation: 'Senior Sales Executive',
    quickSelectLabel: 'Executive (UI Fast Login)',
  },
  {
    employeeId: 'EMP-1004',
    fullName: 'Sales Operations Desk',
    email: 'sales@mspproperties.com',
    phone: '9842055555',
    role: Role.SALES_EXECUTIVE,
    designation: 'Central Sales Department',
  },
  {
    employeeId: 'EMP-1005',
    fullName: 'Suresh Kumar',
    email: 'suresh@mspproperties.com',
    phone: '9842055556',
    role: Role.SALES_EXECUTIVE,
    designation: 'Site Relationship Manager',
  },
  {
    employeeId: 'EMP-1006',
    fullName: 'Priya Dharshini',
    email: 'priya@mspproperties.com',
    phone: '9842055557',
    role: Role.SALES_EXECUTIVE,
    designation: 'Customer Liaison Executive',
  },

  // 3. Accounts Executives
  {
    employeeId: 'EMP-1003',
    fullName: 'Anitha Ramesh',
    email: 'anitha@mspproperties.com',
    phone: '9842098765',
    role: Role.ACCOUNTS_EXECUTIVE,
    designation: 'Senior Accountant',
    quickSelectLabel: 'Accountant (UI Fast Login)',
  },
  {
    employeeId: 'EMP-1007',
    fullName: 'Accounts Operations Desk',
    email: 'accounts@mspproperties.com',
    phone: '9842099999',
    role: Role.ACCOUNTS_EXECUTIVE,
    designation: 'Central Billing Department',
  },
  {
    employeeId: 'EMP-1008',
    fullName: 'S. Meenakshi',
    email: 'meenakshi@mspproperties.com',
    phone: '9842099998',
    role: Role.ACCOUNTS_EXECUTIVE,
    designation: 'Reconciliation Specialist',
  },
];

// Visual Banner
function printBanner() {
  console.log('\x1b[36m%s\x1b[0m', '========================================================================');
  console.log('\x1b[1m\x1b[32m%s\x1b[0m', '      🏢  MSP PROPERTIES — REAL ESTATE DATABASE SEED CLI');
  console.log('\x1b[36m%s\x1b[0m', '========================================================================');
}

// Formatted table of all user logins
export function displayLoginsTable() {
  console.log('\n\x1b[1m\x1b[33m🔑 AVAILABLE SYSTEM LOGINS & CREDENTIALS:\x1b[0m');
  console.log('+' + '-'.repeat(16) + '+' + '-'.repeat(12) + '+' + '-'.repeat(24) + '+' + '-'.repeat(30) + '+' + '-'.repeat(16) + '+');
  console.log(
    '| ' +
      'Role'.padEnd(14) +
      ' | ' +
      'Emp ID'.padEnd(10) +
      ' | ' +
      'Full Name'.padEnd(22) +
      ' | ' +
      'Email Login'.padEnd(28) +
      ' | ' +
      'Password'.padEnd(14) +
      ' |',
  );
  console.log('+' + '-'.repeat(16) + '+' + '-'.repeat(12) + '+' + '-'.repeat(24) + '+' + '-'.repeat(30) + '+' + '-'.repeat(16) + '+');

  for (const user of ALL_SEED_USERS) {
    let roleColor = '\x1b[34m'; // blue
    if (user.role === Role.ADMIN) roleColor = '\x1b[35m'; // magenta
    if (user.role === Role.SALES_EXECUTIVE) roleColor = '\x1b[32m'; // green
    if (user.role === Role.ACCOUNTS_EXECUTIVE) roleColor = '\x1b[36m'; // cyan

    const quickNote = user.quickSelectLabel ? ' *' : '';
    console.log(
      '| ' +
        `${roleColor}${user.role.padEnd(14)}\x1b[0m` +
        ' | ' +
        user.employeeId.padEnd(10) +
        ' | ' +
        user.fullName.padEnd(22) +
        ' | ' +
        `\x1b[1m${user.email}\x1b[0m`.padEnd(37) +
        ' | ' +
        `${DEFAULT_PASSWORD}${quickNote}`.padEnd(14) +
        ' |',
    );
  }
  console.log('+' + '-'.repeat(16) + '+' + '-'.repeat(12) + '+' + '-'.repeat(24) + '+' + '-'.repeat(30) + '+' + '-'.repeat(16) + '+');
  console.log('  \x1b[90m(*) Matches the Quick Role Select buttons on the web login page.\x1b[0m\n');
}

// Clean Database Tables in reverse-dependency order
export async function cleanDatabase() {
  console.log('🧹 Purging existing transactional and master data...');
  await prisma.smsLog.deleteMany();
  await prisma.payment.deleteMany();
  await prisma.installmentSchedule.deleteMany();
  await prisma.booking.deleteMany();
  await prisma.plot.deleteMany();
  await prisma.project.deleteMany();
  await prisma.customer.deleteMany();
  await prisma.broker.deleteMany();
  await prisma.user.deleteMany();
  console.log('✅ Database cleaned successfully.');
}

// Clean all sample catalog & transactional data, keeping only Admin login
export async function cleanDataKeepAdmin() {
  console.log('🧹 Purging all sample data (plots, bookings, customers, brokers, payments, SMS)...');
  await prisma.smsLog.deleteMany();
  await prisma.payment.deleteMany();
  await prisma.installmentSchedule.deleteMany();
  await prisma.booking.deleteMany();
  await prisma.plot.deleteMany();
  await prisma.project.deleteMany();
  await prisma.customer.deleteMany();
  await prisma.broker.deleteMany();

  // Upsert the main Admin user so the live site remains accessible
  const passwordHash = await bcrypt.hash(DEFAULT_PASSWORD, 10);
  await prisma.user.upsert({
    where: { email: 'admin@mspproperties.com' },
    update: { passwordHash, isActive: true, role: Role.ADMIN },
    create: {
      employeeId: 'EMP-1001',
      fullName: 'M. S. Parthiban',
      email: 'admin@mspproperties.com',
      phone: '9842012345',
      passwordHash,
      role: Role.ADMIN,
      isActive: true,
      assignedProjects: [],
    },
  });
  console.log('✅ All sample plots, projects, customers & bookings deleted!');
  console.log('🔑 Preserved Admin Login: admin@mspproperties.com / Password@123\n');
}

// Seed Users only (safe upsert without deleting projects or bookings)
export async function seedLoginsOnly() {
  console.log(`\n🌱 Seeding / Upserting all ${ALL_SEED_USERS.length} user logins...`);
  const passwordHash = await bcrypt.hash(DEFAULT_PASSWORD, 10);

  for (const u of ALL_SEED_USERS) {
    const existingByEmail = await prisma.user.findUnique({ where: { email: u.email } });
    const existingByEmpId = await prisma.user.findUnique({ where: { employeeId: u.employeeId } });

    // If another user occupies this employeeId, give them a temporary unique ID
    if (existingByEmpId && existingByEmpId.email !== u.email) {
      await prisma.user.update({
        where: { id: existingByEmpId.id },
        data: { employeeId: `EMP-TMP-${Date.now().toString().slice(-6)}` },
      });
    }

    if (existingByEmail) {
      await prisma.user.update({
        where: { id: existingByEmail.id },
        data: {
          employeeId: u.employeeId,
          fullName: u.fullName,
          phone: u.phone,
          role: u.role,
          isActive: true,
          passwordHash,
        },
      });
    } else {
      await prisma.user.create({
        data: {
          employeeId: u.employeeId,
          fullName: u.fullName,
          email: u.email,
          phone: u.phone,
          passwordHash,
          role: u.role,
          isActive: true,
          assignedProjects: [],
        },
      });
    }
    console.log(`  ✓ Synced login: \x1b[32m${u.email}\x1b[0m [${u.role}] (${u.fullName})`);
  }

  console.log('\n🎉 All user logins are active and ready!');
  displayLoginsTable();
}

// Full Database Seed
export async function seedFullDatabase() {
  await cleanDatabase();

  console.log(`\n🌱 Step 1/7: Creating ${ALL_SEED_USERS.length} Staff Users...`);
  const passwordHash = await bcrypt.hash(DEFAULT_PASSWORD, 10);
  const createdUsers: Record<string, any> = {};

  for (const u of ALL_SEED_USERS) {
    const user = await prisma.user.create({
      data: {
        employeeId: u.employeeId,
        fullName: u.fullName,
        email: u.email,
        phone: u.phone,
        passwordHash,
        role: u.role,
        isActive: true,
        assignedProjects: [],
      },
    });
    createdUsers[u.email] = user;
    console.log(`  ✓ Created user: ${u.email} [${u.role}]`);
  }

  const admin = createdUsers['admin@mspproperties.com'];
  const sales = createdUsers['vignesh@mspproperties.com'] || createdUsers['sales@mspproperties.com'];
  const accounts = createdUsers['anitha@mspproperties.com'] || createdUsers['accounts@mspproperties.com'];

  console.log('\n🏗️ Step 2/7: Creating Real Estate Projects...');
  const project1 = await prisma.project.create({
    data: {
      name: 'MSP Green Valley Phase 1',
      location: 'NH-44 Bangalore-Salem Bypass, Salem',
      description:
        'DTCP & RERA Approved premium gated community residential plots with 40ft bitumen roads, avenue trees, LED streetlights, and underground utilities.',
      totalAreaSqFt: 72000,
      totalPlots: 40,
      status: ProjectStatus.ONGOING,
    },
  });

  const project2 = await prisma.project.create({
    data: {
      name: 'MSP Royal Orchards',
      location: 'Perundurai State Highway Road, Erode',
      description:
        'Exclusive villa plots adjacent to leading educational institutions and tech corridor. 24x7 security, individual water connections, and landscaped children park.',
      totalAreaSqFt: 54000,
      totalPlots: 30,
      status: ProjectStatus.ONGOING,
    },
  });
  console.log(`  ✓ Project 1: ${project1.name} (40 plots)`);
  console.log(`  ✓ Project 2: ${project2.name} (30 plots)`);

  console.log('\n📐 Step 3/7: Generating 70 Layout Plots...');
  const facings = [Facing.NORTH, Facing.EAST, Facing.SOUTH, Facing.WEST, Facing.NORTH_EAST];
  const plotTemplates = [
    { dimension: '30 x 40', areaSqFt: 1200, ratePerSqFt: 1650 },
    { dimension: '30 x 50', areaSqFt: 1500, ratePerSqFt: 1650 },
    { dimension: '40 x 50', areaSqFt: 2000, ratePerSqFt: 1750 },
    { dimension: '40 x 60', areaSqFt: 2400, ratePerSqFt: 1800 },
  ];

  const project1Plots = [];
  for (let i = 1; i <= 40; i++) {
    const template = plotTemplates[(i - 1) % plotTemplates.length];
    const facing = facings[(i - 1) % facings.length];
    const isCorner = i === 1 || i === 10 || i === 20 || i === 30 || i === 40;
    const rate = isCorner ? template.ratePerSqFt + 100 : template.ratePerSqFt;
    const total = template.areaSqFt * rate;

    let status: PlotStatus = PlotStatus.AVAILABLE;
    if (i === 12) status = PlotStatus.BOOKED;
    if (i === 1) status = PlotStatus.SOLD;

    const plot = await prisma.plot.create({
      data: {
        projectId: project1.id,
        plotNumber: `P-${String(i).padStart(2, '0')}`,
        surveyNumber: `SF-${140 + Math.floor(i / 5)}/${(i % 5) + 1}`,
        facing,
        dimension: template.dimension,
        areaSqFt: template.areaSqFt,
        ratePerSqFt: rate,
        totalPrice: total,
        isCornerPlot: isCorner,
        status,
      },
    });
    project1Plots.push(plot);
  }

  const project2Plots = [];
  for (let i = 1; i <= 30; i++) {
    const template = plotTemplates[(i - 1) % plotTemplates.length];
    const facing = facings[i % facings.length];
    const isCorner = i === 1 || i === 15 || i === 30;
    const rate = isCorner ? 1950 : 1850;
    const total = template.areaSqFt * rate;

    let status: PlotStatus = PlotStatus.AVAILABLE;
    if (i === 5) status = PlotStatus.SOLD;
    if (i === 14) status = PlotStatus.BOOKED;

    const plot = await prisma.plot.create({
      data: {
        projectId: project2.id,
        plotNumber: `R-${String(i).padStart(2, '0')}`,
        surveyNumber: `SF-${210 + Math.floor(i / 5)}/${(i % 5) + 1}`,
        facing,
        dimension: template.dimension,
        areaSqFt: template.areaSqFt,
        ratePerSqFt: rate,
        totalPrice: total,
        isCornerPlot: isCorner,
        status,
      },
    });
    project2Plots.push(plot);
  }
  console.log(`  ✓ Generated 40 plots for ${project1.name}`);
  console.log(`  ✓ Generated 30 plots for ${project2.name}`);

  console.log('\n🤝 Step 4/7: Creating Commission Brokers...');
  const broker1 = await prisma.broker.create({
    data: {
      brokerCode: 'BRK-1001',
      fullName: 'S. Ramesh Kumar',
      phone: '9842100001',
      agencyName: 'Apex Realty Consultants',
      email: 'ramesh.apex@gmail.com',
      address: '22 Cherry Road, Hasthampatti, Salem',
      commissionType: CommissionType.PERCENTAGE,
      defaultCommissionValue: 1.5,
      isActive: true,
    },
  });

  const broker2 = await prisma.broker.create({
    data: {
      brokerCode: 'BRK-1002',
      fullName: 'V. Selvaraj',
      phone: '9842100002',
      agencyName: 'Kongu Land Advisory',
      email: 'selvaraj.kongu@gmail.com',
      address: '55 Brough Road, Erode',
      commissionType: CommissionType.FIXED_PER_SQFT,
      defaultCommissionValue: 25.0,
      isActive: true,
    },
  });

  const broker3 = await prisma.broker.create({
    data: {
      brokerCode: 'BRK-1003',
      fullName: 'C. Mohanraj',
      phone: '9842100003',
      agencyName: 'Durozen Prime Properties',
      email: 'mohanraj.dpp@gmail.com',
      address: '101 Meyyanur Main Rd, Salem',
      commissionType: CommissionType.PERCENTAGE,
      defaultCommissionValue: 2.0,
      isActive: true,
    },
  });
  console.log(`  ✓ Created 3 brokers: ${broker1.fullName}, ${broker2.fullName}, ${broker3.fullName}`);

  console.log('\n👥 Step 5/7: Creating Registered Customers...');
  const customer1 = await prisma.customer.create({
    data: {
      customerCode: 'CUST-1001',
      fullName: 'Rajesh Kumar M.',
      phone: '9894011111',
      alternatePhone: '9894011112',
      email: 'rajesh.kumar@gmail.com',
      address: '14/A Gandhi Road, Fairlands, Salem - 636016',
      idProofType: 'Aadhaar',
      idProofNumber: '7823-9012-3456',
      notes: 'Interested in North-facing plots for personal villa construction.',
    },
  });

  const customer2 = await prisma.customer.create({
    data: {
      customerCode: 'CUST-1002',
      fullName: 'Karthik Subramanian',
      phone: '9894022222',
      email: 'karthik.subramanian@gmail.com',
      address: '88 Perundurai Main Rd, Erode - 638011',
      idProofType: 'PAN',
      idProofNumber: 'ABCPS1234F',
      notes: 'Opted for full down payment on plot R-05.',
    },
  });

  const customer3 = await prisma.customer.create({
    data: {
      customerCode: 'CUST-1003',
      fullName: 'Priya Venkatesh',
      phone: '9894033333',
      email: 'priya.venkatesh@gmail.com',
      address: '5 Anna Nagar, Salem - 636008',
      idProofType: 'Aadhaar',
      idProofNumber: '6743-1289-5678',
      notes: 'Looking for 1500 sqft corner plots.',
    },
  });

  const customer4 = await prisma.customer.create({
    data: {
      customerCode: 'CUST-1004',
      fullName: 'Anand Swaminathan',
      phone: '9894044444',
      email: 'anand.swaminathan@yahoo.com',
      address: '102 Royal Enclave, Avinashi Road, Coimbatore',
      idProofType: 'Aadhaar',
      idProofNumber: '4532-6789-0123',
    },
  });

  const customer5 = await prisma.customer.create({
    data: {
      customerCode: 'CUST-1005',
      fullName: 'Murugan Chettiar',
      phone: '9894055555',
      address: '12 Bazaar St, Namakkal - 637001',
      idProofType: 'Voter ID',
      idProofNumber: 'TNJ1298471',
    },
  });
  console.log(`  ✓ Created 5 customer profiles.`);

  console.log('\n📝 Step 6/7: Creating Active Bookings, Installments, and Payments...');
  const plotP12 = project1Plots.find((p) => p.plotNumber === 'P-12')!;
  const agreedTotal1 = Number(plotP12.totalPrice);
  const discount1 = 30000;
  const finalPayable1 = agreedTotal1 - discount1;
  const advance1 = 500000;
  const brokerComm1 = (finalPayable1 * 1.5) / 100;

  const booking1 = await prisma.booking.create({
    data: {
      bookingCode: 'BK-2026-0001',
      customerId: customer1.id,
      plotId: plotP12.id,
      brokerId: broker1.id,
      salesExecutiveId: sales.id,
      bookingDate: new Date('2026-09-15T10:30:00Z'),
      agreedRatePerSqFt: plotP12.ratePerSqFt,
      agreedTotalPrice: agreedTotal1,
      discountAmount: discount1,
      finalPayableAmount: finalPayable1,
      bookingAdvancePaid: advance1,
      paymentPlan: PaymentPlan.INSTALLMENT,
      installmentCount: 3,
      status: BookingStatus.ACTIVE,
      brokerCommissionAmount: brokerComm1,
      brokerCommissionStatus: CommissionStatus.PARTIALLY_PAID,
      notes: 'Customer opted for 3 equal installments after advance payment.',
    },
  });

  const rem1 = finalPayable1 - advance1;
  const inst1Amount = Math.round(rem1 / 3);
  const inst2Amount = Math.round(rem1 / 3);
  const inst3Amount = rem1 - inst1Amount - inst2Amount;

  await prisma.installmentSchedule.create({
    data: {
      bookingId: booking1.id,
      installmentNumber: 1,
      dueDate: new Date('2026-10-15T00:00:00Z'),
      expectedAmount: inst1Amount,
      paidAmount: inst1Amount,
      status: InstallmentStatus.PAID,
    },
  });

  await prisma.installmentSchedule.create({
    data: {
      bookingId: booking1.id,
      installmentNumber: 2,
      dueDate: new Date('2026-11-15T00:00:00Z'),
      expectedAmount: inst2Amount,
      paidAmount: 0,
      status: InstallmentStatus.PENDING,
    },
  });

  await prisma.installmentSchedule.create({
    data: {
      bookingId: booking1.id,
      installmentNumber: 3,
      dueDate: new Date('2026-12-15T00:00:00Z'),
      expectedAmount: inst3Amount,
      paidAmount: 0,
      status: InstallmentStatus.PENDING,
    },
  });

  const payment1 = await prisma.payment.create({
    data: {
      receiptNumber: 'RCP-2026-0001',
      bookingId: booking1.id,
      customerId: customer1.id,
      recordedById: accounts.id,
      paymentDate: new Date('2026-09-15T11:00:00Z'),
      amount: advance1,
      paymentMethod: PaymentMethod.CHEQUE,
      transactionReference: 'CHQ-890123',
      bankName: 'HDFC Bank, Salem Main',
      notes: 'Booking advance token payment cleared.',
    },
  });

  const payment2 = await prisma.payment.create({
    data: {
      receiptNumber: 'RCP-2026-0002',
      bookingId: booking1.id,
      customerId: customer1.id,
      recordedById: accounts.id,
      paymentDate: new Date('2026-10-14T15:20:00Z'),
      amount: inst1Amount,
      paymentMethod: PaymentMethod.UPI,
      transactionReference: 'UPI-AXIS-992810481',
      bankName: 'Axis Bank UPI',
      notes: 'First installment payment received via UPI.',
    },
  });

  const plotR05 = project2Plots.find((p) => p.plotNumber === 'R-05')!;
  const agreedTotal2 = Number(plotR05.totalPrice);

  const booking2 = await prisma.booking.create({
    data: {
      bookingCode: 'BK-2026-0002',
      customerId: customer2.id,
      plotId: plotR05.id,
      brokerId: broker2.id,
      salesExecutiveId: sales.id,
      bookingDate: new Date('2026-10-01T14:00:00Z'),
      agreedRatePerSqFt: plotR05.ratePerSqFt,
      agreedTotalPrice: agreedTotal2,
      discountAmount: 0,
      finalPayableAmount: agreedTotal2,
      bookingAdvancePaid: agreedTotal2,
      paymentPlan: PaymentPlan.FULL_PAYMENT,
      installmentCount: 1,
      status: BookingStatus.COMPLETED,
      brokerCommissionAmount: plotR05.areaSqFt * 25,
      brokerCommissionStatus: CommissionStatus.PAID,
      notes: 'Full payment received upfront. Registration scheduled.',
    },
  });

  const payment3 = await prisma.payment.create({
    data: {
      receiptNumber: 'RCP-2026-0003',
      bookingId: booking2.id,
      customerId: customer2.id,
      recordedById: accounts.id,
      paymentDate: new Date('2026-10-01T14:30:00Z'),
      amount: agreedTotal2,
      paymentMethod: PaymentMethod.BANK_TRANSFER,
      transactionReference: 'RTGS-SBIN00291048',
      bankName: 'State Bank of India, Erode SME',
      notes: 'Full settlement amount received.',
    },
  });
  console.log(`  ✓ Created 2 bookings, 3 installments, and 3 payments.`);

  console.log('\n📱 Step 7/7: Seeding SMS Dispatch Records...');
  await prisma.smsLog.createMany({
    data: [
      {
        recipientPhone: customer1.phone,
        recipientName: customer1.fullName,
        customerId: customer1.id,
        bookingId: booking1.id,
        eventType: SmsEventType.BOOKING_WELCOME,
        messageBody: `Dear Rajesh Kumar, thank you for booking Plot P-12 in MSP Green Valley Phase 1! Your Booking ID is BK-2026-0001. Warm regards, MSP Properties.`,
        status: SmsStatus.SIMULATED,
        gatewayResponse: '{"status":"success","code":200,"msg":"Message simulated"}',
        sentAt: new Date('2026-09-15T11:05:00Z'),
      },
      {
        recipientPhone: customer1.phone,
        recipientName: customer1.fullName,
        customerId: customer1.id,
        bookingId: booking1.id,
        paymentId: payment1.id,
        eventType: SmsEventType.PAYMENT_RECEIPT,
        messageBody: `Dear Rajesh Kumar, we have received Rs. 500,000 for Plot P-12. Receipt No: RCP-2026-0001. Thank you, MSP Properties.`,
        status: SmsStatus.SIMULATED,
        gatewayResponse: '{"status":"success","code":200,"msg":"Message simulated"}',
        sentAt: new Date('2026-09-15T11:10:00Z'),
      },
      {
        recipientPhone: customer1.phone,
        recipientName: customer1.fullName,
        customerId: customer1.id,
        bookingId: booking1.id,
        paymentId: payment2.id,
        eventType: SmsEventType.PAYMENT_RECEIPT,
        messageBody: `Dear Rajesh Kumar, we have received Rs. ${inst1Amount.toLocaleString('en-IN')} for Installment 1 on Plot P-12. Receipt No: RCP-2026-0002. Balance pending: Rs. 986,667. Thank you, MSP Properties.`,
        status: SmsStatus.SIMULATED,
        gatewayResponse: '{"status":"success","code":200,"msg":"Message simulated"}',
        sentAt: new Date('2026-10-14T15:25:00Z'),
      },
      {
        recipientPhone: customer2.phone,
        recipientName: customer2.fullName,
        customerId: customer2.id,
        bookingId: booking2.id,
        paymentId: payment3.id,
        eventType: SmsEventType.PAYMENT_RECEIPT,
        messageBody: `Dear Karthik Subramanian, full payment of Rs. ${agreedTotal2.toLocaleString('en-IN')} received for Plot R-05 in MSP Royal Orchards. Receipt No: RCP-2026-0003. Outstanding: Rs. 0. MSP Properties.`,
        status: SmsStatus.SIMULATED,
        gatewayResponse: '{"status":"success","code":200,"msg":"Message simulated"}',
        sentAt: new Date('2026-10-01T14:35:00Z'),
      },
    ],
  });
  console.log(`  ✓ Seeded 4 customer notification logs.`);

  console.log('\n\x1b[32m%s\x1b[0m', '✨ FULL DATABASE SEEDING COMPLETED SUCCESSFULLY!');
  displayLoginsTable();
}

function printHelp() {
  printBanner();
  console.log(`
Usage:
  npx tsx src/cli/seed-cli.ts [options]
  npm run seed [options]

Options:
  --all, -a        Perform full clean and reseed (Users, Projects, Plots, Bookings, etc.)
  --blank, -b      Delete all sample data (plots, bookings, customers) but PRESERVE Admin login
  --logins, -l     Seed / Upsert ALL user logins only (Non-destructive, keeps existing data)
  --show, -s       Display the login credentials table and exit without modifying database
  --clean, -c      Wipe/Purge 100% of all database tables (including users)
  --help, -h       Display this help documentation

Examples:
  npm run seed                   # Runs full seed
  npm run seed -- --blank        # Wipes all sample data, leaves only Admin
  npm run seed -- --clean        # Wipes everything completely
  npm run seed -- --logins       # Only updates/creates login accounts
  npm run seed -- --show         # Shows all credentials
  npm run seed:cli               # Interactive prompt menu
`);
}

async function runInteractiveMenu() {
  printBanner();
  const rl = readline.createInterface({ input, output });

  console.log('\nSelect an operation:');
  console.log('  1. Full Seed (Clean database and seed all master & transactional data)');
  console.log('  2. Delete All Sample Data (Wipe plots, bookings, customers, etc. — Keep Admin)');
  console.log('  3. Seed / Upsert All User Logins Only (Safe, non-destructive)');
  console.log('  4. Show All User Login Credentials Table');
  console.log('  5. Clean / Wipe 100% of All Tables (Including users)');
  console.log('  6. Exit\n');

  try {
    const choice = await rl.question('Enter your choice (1-6): ');
    rl.close();

    switch (choice.trim()) {
      case '1':
        await seedFullDatabase();
        break;
      case '2':
        await cleanDataKeepAdmin();
        break;
      case '3':
        await seedLoginsOnly();
        break;
      case '4':
        displayLoginsTable();
        break;
      case '5':
        await cleanDatabase();
        break;
      case '6':
        console.log('👋 Goodbye!');
        break;
      default:
        console.log('❌ Invalid option selected.');
        break;
    }
  } catch (err) {
    rl.close();
    throw err;
  }
}

// CLI Entrypoint
async function main() {
  const args = process.argv.slice(2);

  if (args.includes('--help') || args.includes('-h')) {
    printHelp();
    return;
  }

  if (args.includes('--show') || args.includes('-s')) {
    printBanner();
    displayLoginsTable();
    return;
  }

  if (args.includes('--blank') || args.includes('-b') || args.includes('--fresh')) {
    printBanner();
    await cleanDataKeepAdmin();
    return;
  }

  if (args.includes('--logins') || args.includes('-l') || args.includes('--users')) {
    printBanner();
    await seedLoginsOnly();
    return;
  }

  if (args.includes('--clean') || args.includes('-c') || args.includes('--wipe')) {
    printBanner();
    await cleanDatabase();
    return;
  }

  if (args.includes('--all') || args.includes('-a')) {
    printBanner();
    await seedFullDatabase();
    return;
  }

  // If no arguments provided:
  if (process.stdin.isTTY) {
    await runInteractiveMenu();
  } else {
    // Non-interactive fallback (e.g. running inside docker container or automated script)
    printBanner();
    await seedFullDatabase();
  }
}

// Only execute main() if this file is executed directly via node/tsx CLI
const isDirectCli =
  process.argv[1] &&
  (process.argv[1].endsWith('seed-cli.ts') ||
    process.argv[1].endsWith('seed-cli.js') ||
    process.argv[1].endsWith('seed-cli'));

if (isDirectCli) {
  main()
    .catch((err) => {
      console.error('\n\x1b[31m❌ Seed Error:\x1b[0m', err.message || err);
      process.exit(1);
    })
    .finally(async () => {
      await prisma.$disconnect();
    });
}
