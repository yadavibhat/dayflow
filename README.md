# Dayflow HRMS

Dayflow is a modern, full-stack Human Resource Management System (HRMS) built for fast-moving teams. It handles core HR workflows including employee directory management, check-in/out attendance tracking, leave requests with overlap prevention, statutory payroll calculations (India / CTC structure), and chronological audit logging.

Built with **Next.js 16 (App Router)**, **TypeScript**, **Tailwind CSS**, and **Supabase**.

---

## Features & Modules

### 1. Dual-Role Architecture
Dayflow supports two distinct roles with tailored views and server-level access boundaries:
- **Employee**:
  - Personal dashboard with check-in status dot and quick actions.
  - One-click check-in/check-out with duration and overtime calculation.
  - Leave application with working-day computation (auto-excludes weekends) and real-time balance checks.
  - Read-only salary breakdown (`/payroll`) showing monthly gross, PF/PT deductions, and net take-home pay.
  - Personal profile view (`/profile`) with contact information self-service editing.
- **HR / Admin**:
  - Organization dashboard with live headcount, present-today count, and pending approval metrics.
  - Searchable employee directory (`/employees`) with onboarding modal, code generation (`DA...`), and profile detail cards.
  - Attendance management (`/hr/attendance`) with status indicators (Present, Late, On Leave), date pagination, and CSV export.
  - Leave approval surface (`/hr/leave`) with balance inspection, overlap warnings, and rejection reason tracking.
  - Payroll management (`/hr/payroll`) with annual CTC configuration, component allocation validation (Basic, HRA, Standard, Special = 100%), and confirmation dialogs.
  - System audit log (`/hr/audit`) with category filters, actor search, and chronological timeline.

### 2. Domain Logic & Business Rules

#### Attendance Engine
- **Deterministic Status**: Punctuality is derived from arrival time (`≤ 9:00 AM` → Present, `> 9:00 AM` → Late).
- **Duplicate Prevention**: Single active check-in allowed per calendar day.
- **Work Hours & Overtime**: Tracks total elapsed time upon check-out; hours worked beyond 8 hours are flagged as overtime.

#### Leave Management & Overlap Detection
- **Working Days Calculation**: Automatically skips Saturdays and Sundays when calculating requested leave duration.
- **Collision Guard**: Prevents creating leave requests that overlap with existing `Pending` or `Approved` dates for the same employee.
- **Balance Tracking**: Deducts approved days against annual entitlements per category (Paid Time Off, Sick Leave, Casual Leave).

#### Payroll & Salary Breakdown (Sec. 9 Rules)
- **100% Allocation Guarantee**: Basic + HRA + Standard Allowance + Special Allowance must equal exactly 100% of the defined base salary.
- **Auto-Balancing**: Special Allowance automatically adjusts to capture the remaining percentage of the base wage.
- **Statutory Deductions**:
  - **Provident Fund (PF)**: Computed at 12% of Basic Salary.
  - **Professional Tax (PT)**: Statutory fixed deduction (₹200/mo).
  - **Net Pay**: `Gross Earnings - (PF + PT + TDS + Unpaid Leave Deductions)`.

#### Audit Logging
- Immutable trail capturing actor, target entity, action description, category (`AUTH`, `ATTENDANCE`, `LEAVE`, `PAYROLL`, `PROFILE`, `SYSTEM`), IP address, and timestamp.

---

## Tech Stack

| Layer | Technology |
|---|---|
| **Framework** | Next.js 16 (App Router + Turbopack) |
| **Language** | TypeScript (Strict mode) |
| **Database & Auth** | Supabase (`@supabase/ssr` client/server dual pattern) |
| **Styling** | Tailwind CSS (Design tokens, custom glassmorphism) |
| **Form & Contract Validation** | Zod (Dual client/server schemas) |
| **Date Utilities** | `date-fns` |
| **Icons & Typography** | Google Material Symbols, Google Fonts (Outfit & Roboto) |

---

## Project Structure

```
src/
├── app/
│   ├── (employee)/profile/    # Employee profile route group
│   ├── (hr)/employees/        # HR employee directory & detail routes
│   ├── attendance/            # Employee attendance history
│   ├── dashboard/             # Overview dashboard (Role-aware)
│   ├── hr/
│   │   ├── attendance/        # Admin attendance management & export
│   │   ├── audit/             # System audit trail
│   │   ├── leave/             # Leave approvals review drawer
│   │   └── payroll/           # HR salary structure editor
│   ├── payroll/               # Employee read-only salary view
│   ├── payroll/[id]/          # Dynamic payroll configuration
│   ├── signin/ & signup/      # Auth screens
│   ├── timeoff/               # Employee leave application & balance view
│   └── layout.tsx             # Root layout with AppContextProvider
├── components/
│   ├── attendance/            # Systray check-in/out widget
│   ├── ui/                    # Reusable Card, StatCard, EmptyState components
│   ├── DashboardLayout.tsx    # Responsive shell with sidebar + header
│   ├── Header.tsx             # Topbar with check-in status dot & role switcher
│   ├── ProfileTabs.tsx        # Tabbed profile view (Resume, Private, Salary, Security)
│   └── Sidebar.tsx            # Navigation sidebar with role filtering
├── context/
│   └── AppContext.tsx         # Global app state with localStorage fallback & Supabase sync
├── hooks/
│   └── useDashboardStats.ts   # Real-time Supabase hooks & live metrics
├── lib/
│   ├── services/              # Server-side data services (employees, dashboard)
│   ├── supabase/              # Supabase browser & server clients
│   ├── types/                 # TypeScript domain types (employee, payroll, audit)
│   └── validations/           # Zod contract schemas
└── services/                  # Business logic services (attendance, leave, payroll, audit)
```

---

## Getting Started

### Prerequisites
- Node.js 18.17+ or 20+
- npm / yarn / pnpm

### 1. Clone & Install Dependencies
```bash
git clone https://github.com/yadavibhat/dayflow.git
cd dayflow
npm install
```

### 2. Environment Configuration
Create a `.env.local` file in the root directory:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

> **Note:** If Supabase credentials are not provided, Dayflow automatically runs in local-fallback mode using browser storage, allowing full UI exploration without external services.

### 3. Run Development Server
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser. The root path automatically redirects to `/signin`.

### 4. Build & Production Check
```bash
npm run build
npm run start
```

### 5. Running Tests
```bash
npm test
```
Runs unit test suites covering:
- Attendance calculations & double-check-in validation (`attendance.test.ts`)
- Leave date-overlap detection & balance deduction (`leave.test.ts`)
- Salary breakdown & percentage allocation rules (`payroll.test.ts`)
- Audit query filters & category aggregation (`audit.test.ts`)

---

## License
MIT License. Built for internal operations and team management.
