# Specification: MSP Real Estate Management System
**Prepared by Durozen Technologies Pvt. Ltd. for MSP Properties**

---

## 1. Objective & Scope

### 1.1 Objective
Build a centralized, reliable, and user-friendly internal Real Estate ERP & CRM web platform for MSP Properties. The system will eliminate fragmented manual records, prevent duplicate plot bookings, track customer payment installments and pending balances accurately, manage broker referrals, provide role-based employee access, and send transactional SMS notifications.

### 1.2 Target Users
1. **Super Admin / Management**: Full visibility into all projects, plot statuses, sales ledger, collections, employee accounts, and system audits.
2. **Sales Executives**: Check real-time plot availability, create customer inquiries, assign broker referrals, and initiate bookings.
3. **Accounts & Collection Staff**: Record customer payments (advance, installments, settlements), calculate remaining balances, generate official receipts, and monitor aging receivables.

### 1.3 Assumptions
1. The platform is designed desktop-first for office staff/managers on modern web browsers (Chrome, Edge, Firefox, Safari).
2. Payments are recorded manually (Cash, Cheque, Bank Transfer / NEFT / RTGS, UPI) rather than real-time credit card checkout.
3. SMS gateway integration supports a standard HTTP/REST provider (e.g. Fast2SMS / Textlocal) with an integrated local simulator/logger for development without incurring SMS charges.
4. Database is PostgreSQL running locally or in cloud.

---

## 2. Tech Stack & Commands

### 2.1 Tech Stack
- **Frontend**: Next.js 16 (App Router), TypeScript, Tailwind CSS, Lucide Icons.
- **Backend**: NestJS, TypeScript, Prisma ORM, Passport JWT, Class-Validator.
- **Database**: PostgreSQL 18 with relational integrity and transactional consistency.
- **Documentation & Testing**: Jest, Supertest, Prisma Client.

### 2.2 Standard Commands
```bash
# Backend (in /backend)
npm install
npx prisma migrate dev --name init
npm run build
node dist/main.js

# Frontend (in /frontend)
npm install
npm run build
npx next start -p 3000
```

---

## 3. Project Structure

```
d:/Real Estate Software/
├── docs/
│   ├── spec.md                   # This master specification
│   ├── plan.md                   # Implementation plan & task tracker
│   └── intent/                   # Confirmed intent statements
├── backend/                      # NestJS REST API
│   ├── src/
│   │   ├── auth/                 # JWT auth, login, guards, roles
│   │   ├── users/                # Employee management & RBAC
│   │   ├── projects/             # Projects & Plots inventory management
│   │   ├── customers/            # Customer records & interests
│   │   ├── brokers/              # Broker directory & commission records
│   │   ├── bookings/             # Plot booking & sales contracts
│   │   ├── payments/             # Collections, installment ledger, receipts
│   │   ├── sms/                  # SMS notification service & logs
│   │   ├── reports/              # Summary metrics & collection reports
│   │   ├── prisma/               # Prisma schema, seeds, migrations
│   │   ├── app.module.ts
│   │   └── main.ts
│   ├── package.json
│   └── tsconfig.json
├── frontend/                     # Next.js Web Application
│   ├── src/
│   │   ├── app/                  # App Router pages (Dashboard, Projects, Bookings, Customers, Brokers, Payments, Employees, SMS)
│   │   ├── components/           # Reusable UI (Sidebar, Navbar, BookingModal, PaymentModal, ReceiptModal)
│   │   ├── lib/                  # API client, auth session, currency/date formatters
│   │   └── types/                # TypeScript interface definitions
│   ├── package.json
│   └── next.config.ts
└── README.md
```

---

## 4. Core Functional Modules

### Module 1: Project & Plot Inventory Management
- **Projects**: Name, location, survey numbers, total area, total plots, launch date, status (`UPCOMING`, `ONGOING`, `COMPLETED`).
- **Plots**: Plot number, dimensions (width x length), area (sq. ft.), rate per sq. ft., total calculated price, facing direction (North, South, East, West, North-East), corner plot flag, status (`AVAILABLE`, `BOOKED`, `SOLD`).
- **Interactive Inventory Grid**: Color-coded visual status grid with quick filters for immediate checking during customer discussions.

### Module 2: Customer Management
- **Customer Profile**: Unique Customer Code (`CUST-0001`), full name, primary phone, alternate phone, email, address, identity proof reference, created date.
- **Interests & Bookings**: Associated project/plots of interest, booking history, lifetime total purchased, lifetime paid, outstanding balance.
- **Search & Filter**: Search by name, phone, plot number, or status.

### Module 3: Broker Management
- **Broker Profile**: Unique Broker ID (`BRK-0001`), broker name, phone, agency/firm name, address, active status.
- **Referral Tracking**: List of all customers referred by the broker and corresponding plot sales.
- **Commission Ledger**: Configurable commission rate (percentage or fixed per sqft), calculated commission per booking, payment status (`PENDING`, `PARTIALLY_PAID`, `PAID`).

### Module 4: Sales & Collection Tracking
- **Booking / Sale Contract**:
  - Customer, Plot, Broker (optional), agreed sale price, booking date.
  - Payment plan: `FULL_PAYMENT` or `INSTALLMENT`.
  - Installment schedule: Down payment / Advance amount, number of installments, due dates, installment amounts.
- **Payment Ledger & Receipts**:
  - Payment entry: Amount received, payment date, payment mode (`CASH`, `CHEQUE`, `BANK_TRANSFER`, `UPI`), reference / transaction number, remarks.
  - Auto-updating balance: Instantly recalculates Total Paid and Outstanding Balance.
  - Official Receipt: Auto-generated sequential receipt number (`RCP-2026-0001`), printable branded PDF/voucher view with MSP Properties header, customer details, plot details, and payment breakdown.

### Module 5: Employee ID Creation & Role-Based Access Control (RBAC)
- **Employee Profile**: Employee ID (`EMP-001`), full name, email, phone, secure hashed password.
- **Roles**:
  - `ADMIN`: Full system control (manage projects, plots, pricing, employees, settings, all reports).
  - `SALES_EXECUTIVE`: Project & plot viewing, customer registration, booking creation, broker referral tagging.
  - `ACCOUNTS_EXECUTIVE`: Payment recording, receipt printing, collection ledger viewing, overdue installment tracking.
- **Project Access Scoping**: Ability to restrict certain employees to designated projects only.
- **Status Toggle**: Active / Inactive switch with immediate session revocation.

### Module 6: Transactional SMS Notification System
- **Event Triggers**:
  1. *Welcome & Booking Confirmation*: Sent to customer immediately upon confirmed plot booking.
  2. *Payment Confirmation*: Sent with receipt number and remaining balance upon payment recording.
  3. *Installment Reminder*: Triggered manually or scheduled for upcoming/overdue installments.
  4. *Project Announcements*: Broadcast message to active customers of a project.
- **Provider Abstraction**: Pluggable SMS service with production gateway integration and local fallback simulator/audit log.
- **SMS Audit Trail**: Full log of recipient phone, template used, message content, delivery status, timestamp, and gateway reference.
