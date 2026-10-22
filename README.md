# MSP Properties - Real Estate Management System
**Prepared by Durozen Technologies Pvt. Ltd.**

A simple, centralized, enterprise-grade system to manage customers, brokers, sales bookings, payment collections, employee access (RBAC), daily SMS communications, and layout project & plot records.

---

## 🛠️ Technology Stack
- **Frontend**: Next.js 16 (App Router), TypeScript, Tailwind CSS, Lucide Icons
- **Backend**: NestJS, TypeScript, Prisma ORM, Passport JWT, Class Validator
- **Database**: PostgreSQL (`msp_real_estate`) with full relational integrity and atomic transactions
- **Authentication**: JWT-based authentication with role-based access control (`ADMIN`, `SALES_EXECUTIVE`, `ACCOUNTS_EXECUTIVE`)

---

## 🚀 Quick Start Guide

### 1. Prerequisites
- Node.js v18+ (tested on Node v22)
- PostgreSQL running on `localhost:5432` with user `postgres` (password: `root`)

### 2. Backend Setup
```bash
cd backend
# Database URL is configured in .env:
# DATABASE_URL="postgresql://postgres:root@localhost:5432/msp_real_estate?schema=public"

# Run migrations & populate demo data:
npx prisma migrate dev
npx prisma db seed

# Run the API server:
npm run build
node dist/main.js
# API running at: http://localhost:4000/api
```

### 3. Frontend Setup
```bash
cd frontend

# Run production build or development server:
npm run build
npx next start -p 3000
# Portal accessible at: http://localhost:3000
```

---

## 🔑 Pre-Configured Demo Accounts

| Role | Email ID | Password | Access Rights |
|---|---|---|---|
| **Super Admin** | `admin@mspproperties.com` | `Password@123` | Full control over all projects, plot pricing, employee ID creation, deactivation, and all financial reports. |
| **Sales Executive** | `sales@mspproperties.com` | `Password@123` | Real-time plot inventory, customer creation, plot booking wizard, and broker attribution. |
| **Accounts Executive** | `accounts@mspproperties.com` | `Password@123` | Record customer payments, installment tracking, and branded official receipt printing (`RCP-xxxx`). |

*(The login screen also provides 1-click quick login buttons for all 3 roles).*

---

## 📦 Key Functional Modules

### 1. Layout Projects & Interactive Plot Grid (`/projects`)
- Switch between layout projects (**MSP Green Valley Phase 1** & **MSP Royal Orchards**).
- Color-coded status grid:
  - 🟢 **AVAILABLE**: Green badge with instant 1-click "Book Plot" button.
  - 🟡 **BOOKED**: Amber badge showing active installment payment plans.
  - 🔵 **SOLD**: Blue badge for 100% settled and registered properties.
- Filter by facing (North, East, South, West, North-East) and search by plot or survey number.

### 2. Customer Management & Ledgers (`/customers`)
- Centralized profiles with auto-generated codes (`CUST-1001`, `CUST-1002`, etc.).
- Real-time customer balance calculations: Total Committed, Total Paid, and Outstanding Balance.
- Customer details drawer showing all booked plots, payment receipt vouchers, and contact notes.

### 3. Broker Management & Commission Tracking (`/brokers`)
- Registered broker profiles with codes (`BRK-1001`, `BRK-1002`, etc.).
- Configurable commission structures: **Percentage of Sale** (e.g. 1.5%) or **Fixed Rate per Sq.Ft.** (e.g. ₹25/sq.ft.).
- Performance metrics: Total client referrals, sales volume generated, earned commission, and pending payout balance.

### 4. Sales Booking Wizard (`/bookings`)
- Atomic plot booking with concurrency protection:
  1. Select Project & Available Plot (auto-populates area and base rate).
  2. Select Customer & optional Broker.
  3. Customize agreed rate per sq.ft. and special discounts.
  4. Select Payment Plan: **Full Down Payment** or **Installments** (2, 3, 4, or 6 months).
  5. Record token advance with Cash, Cheque, Bank Transfer, or UPI.
- Submitting automatically updates plot status to `BOOKED`, creates the booking contract, schedules equal installment milestones, and dispatches a Welcome SMS!

### 5. Collection Tracking & Branded Receipts (`/payments`)
- Record customer payments against active contracts with balance validation.
- Auto-allocates payments to the earliest pending installment milestones.
- Sequential receipt generation (`RCP-2026-0001`, `RCP-2026-0002`, etc.).
- Automatically marks booking as `COMPLETED` and plot as `SOLD` once balance reaches ₹0.
- **Branded Receipt Printer**: High-contrast, clean A4/A5 voucher with MSP Properties header, customer details, plot specifications, financial breakdown, amount in words, authorized signatory, and 1-click `window.print()` / PDF export.

### 6. SMS Notification Center (`/sms`)
- Transactional SMS log for Welcome messages, Payment Receipts, and Installment Reminders.
- Direct SMS composer to broadcast updates to customers.
- Pluggable provider architecture with built-in development simulator and production HTTP gateway support.

### 7. Employee ID Creation & RBAC (`/employees`)
- Administrator tool to register authorized staff with auto-generated IDs (`EMP-1001`, `EMP-1002`, etc.).
- Assign roles (`ADMIN`, `SALES_EXECUTIVE`, `ACCOUNTS_EXECUTIVE`).
- Instant 1-click **Deactivate / Activate** toggle to revoke credentials.
