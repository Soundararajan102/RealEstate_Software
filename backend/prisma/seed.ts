import { PrismaClient, Role, ProjectStatus, PlotStatus, Facing, PaymentPlan, BookingStatus, CommissionType, CommissionStatus, InstallmentStatus, PaymentMethod, SmsEventType, SmsStatus } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting MSP Real Estate database seeding...');

  // 1. Clean existing records in reverse dependency order
  await prisma.smsLog.deleteMany();
  await prisma.payment.deleteMany();
  await prisma.installmentSchedule.deleteMany();
  await prisma.booking.deleteMany();
  await prisma.plot.deleteMany();
  await prisma.project.deleteMany();
  await prisma.customer.deleteMany();
  await prisma.broker.deleteMany();
  await prisma.user.deleteMany();

  console.log('🧹 Cleaned existing tables.');

  // 2. Seed Users / Employees
  const passwordHash = await bcrypt.hash('Password@123', 10);

  const admin = await prisma.user.create({
    data: {
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

  const sales = await prisma.user.create({
    data: {
      employeeId: 'EMP-1002',
      fullName: 'K. R. Vignesh',
      email: 'sales@mspproperties.com',
      phone: '9842054321',
      passwordHash,
      role: Role.SALES_EXECUTIVE,
      isActive: true,
      assignedProjects: [],
    },
  });

  const accounts = await prisma.user.create({
    data: {
      employeeId: 'EMP-1003',
      fullName: 'S. Meenakshi',
      email: 'accounts@mspproperties.com',
      phone: '9842098765',
      passwordHash,
      role: Role.ACCOUNTS_EXECUTIVE,
      isActive: true,
      assignedProjects: [],
    },
  });

  console.log(`👤 Created 3 employees: Admin (${admin.email}), Sales (${sales.email}), Accounts (${accounts.email})`);

  // 3. Seed Projects
  const project1 = await prisma.project.create({
    data: {
      name: 'MSP Green Valley Phase 1',
      location: 'NH-44 Bangalore-Salem Bypass, Salem',
      description: 'DTCP & RERA Approved premium gated community residential plots with wide bitumen roads, avenue trees, and underground utilities.',
      totalAreaSqFt: 72000,
      totalPlots: 40,
      status: ProjectStatus.ONGOING,
    },
  });

  const project2 = await prisma.project.create({
    data: {
      name: 'MSP Royal Orchards',
      location: 'Perundurai State Highway Road, Erode',
      description: 'Exclusive villa plots adjacent to leading educational institutions and tech corridor. 24x7 security, water connection, and landscaped park.',
      totalAreaSqFt: 54000,
      totalPlots: 30,
      status: ProjectStatus.ONGOING,
    },
  });

  console.log(`🏗️ Created 2 projects: ${project1.name} & ${project2.name}`);

  // 4. Seed Plots for Project 1 (40 plots)
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

    // We will mark P-12 as BOOKED and P-01 as SOLD, rest AVAILABLE
    let status = PlotStatus.AVAILABLE;
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

  // Seed Plots for Project 2 (30 plots)
  const project2Plots = [];
  for (let i = 1; i <= 30; i++) {
    const template = plotTemplates[(i - 1) % plotTemplates.length];
    const facing = facings[i % facings.length];
    const isCorner = i === 1 || i === 15 || i === 30;
    const rate = isCorner ? 1950 : 1850;
    const total = template.areaSqFt * rate;

    let status = PlotStatus.AVAILABLE;
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

  console.log(`📐 Generated 70 plots across both projects.`);

  // 5. Seed Brokers
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

  console.log(`🤝 Created 3 registered brokers.`);

  // 6. Seed Customers
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

  console.log(`👥 Created 5 customer records.`);

  // 7. Seed Bookings & Installments
  // Booking 1: Rajesh Kumar on P-12 (Green Valley)
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

  // Installments for Booking 1: Remainder is finalPayable1 - advance1 = (1,950,000 - 500,000) = 1,450,000
  const rem1 = finalPayable1 - advance1;
  const inst1Amount = Math.round(rem1 / 3);
  const inst2Amount = Math.round(rem1 / 3);
  const inst3Amount = rem1 - inst1Amount - inst2Amount;

  const inst1 = await prisma.installmentSchedule.create({
    data: {
      bookingId: booking1.id,
      installmentNumber: 1,
      dueDate: new Date('2026-10-15T00:00:00Z'),
      expectedAmount: inst1Amount,
      paidAmount: inst1Amount,
      status: InstallmentStatus.PAID,
    },
  });

  const inst2 = await prisma.installmentSchedule.create({
    data: {
      bookingId: booking1.id,
      installmentNumber: 2,
      dueDate: new Date('2026-11-15T00:00:00Z'),
      expectedAmount: inst2Amount,
      paidAmount: 0,
      status: InstallmentStatus.PENDING,
    },
  });

  const inst3 = await prisma.installmentSchedule.create({
    data: {
      bookingId: booking1.id,
      installmentNumber: 3,
      dueDate: new Date('2026-12-15T00:00:00Z'),
      expectedAmount: inst3Amount,
      paidAmount: 0,
      status: InstallmentStatus.PENDING,
    },
  });

  // Payments for Booking 1
  const payment1 = await prisma.payment.create({
    data: {
      receiptNumber: 'RCP-2026-0001',
      bookingId: booking1.id,
      customerId: customer1.id,
      recordedById: accounts.id,
      paymentDate: new Date('2026-09-15T11:00:00Z'),
      amount: advance1,
      paymentMethod: PaymentMethod.CHEQUE,
      transactionReference: 'CHQ-892102',
      bankName: 'HDFC Bank, Salem Branch',
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
      transactionReference: 'UPI-42981023912',
      notes: 'Installment 1 paid via Google Pay / UPI.',
    },
  });

  // Booking 2: Karthik Subramanian on R-05 (Royal Orchards) - FULL_PAYMENT -> SOLD
  const plotR05 = project2Plots.find((p) => p.plotNumber === 'R-05')!;
  const agreedTotal2 = Number(plotR05.totalPrice);
  const brokerComm2 = Number(plotR05.areaSqFt) * 25.0; // Fixed 25/sqft

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
      brokerCommissionAmount: brokerComm2,
      brokerCommissionStatus: CommissionStatus.PAID,
      notes: 'Full payment settled via RTGS. Plot marked as SOLD.',
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

  console.log(`📝 Created 2 bookings, 3 installments, and 3 payment receipts.`);

  // 8. Seed SMS Logs
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

  console.log(`📱 Seeded 4 SMS notification records.`);
  console.log('✅ Seeding completed successfully!');
}

main()
  .catch((e) => {
    console.error('❌ Error during database seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
