# Dayflow HRMS

Dayflow is a high-fidelity Human Resource Management System (HRMS) built using Next.js, Supabase, Tailwind, and a bespoke glassmorphic design system. It is designed to coordinate leave approvals, time tracking, employee onboarding, audit logging, and payroll calculations.

---

## Architecture & Technical Highlights

### 1. Dual-Layer Authorization Guard (Zero-Trust Client)
Rather than trusting the browser to control permissions, Dayflow enforces validation at both the frontend form and the server action boundaries:
- **Client-Side:** Form payloads are filtered based on the session role before validation and dispatch. Employees only submit personal contact info; HR/Admin submit job-level variables.
- **Server-Side:** Every server action re-queries Supabase Auth to confirm the caller's role, filters incoming payloads using strict Zod schemas (`EmployeeSelfEditSchema` vs `EmployeeSchema`), and explicitly rejects any unauthorized fields rather than silently ignoring them.

### 2. High-Fidelity Responsive Design
The interface is customized with visual polish matching the Stitch design language:
- **Typography:** Custom font pairing (Google Fonts Outfit + Roboto) with dynamic size tokens.
- **Visual Styles:** Smooth glassmorphic containers (`glass-card`), tailored state colors (avoiding plain default primaries), and subtle micro-animations (puckers, lifts, and pulses).
- **Responsive Layouts:** Tables on desktop automatically transition into interactive cards on mobile viewports.

### 3. Incremental, Deterministic Code Generation
Employee code and login identification generation is fully automated:
- **Format:** `DA` (Company Code) + `[NameInitials]` + `[DOJ Year]` + `[4-Digit Serial]` (e.g., `DAJADO20260001`).
- **Generation Safety:** The server queries the database for the max serial logged under that exact year and increments by 1. Check constraints block duplicate keys defensively.

---

## Core Domain Modules

### 👥 Onboarding & Employee Directory
- **HR Surface:** Directory listing showing employee photo, details, code, and active today status.
- **Onboarding Flow:** Interactive onboarding form requiring name, phone, department, designation, date of joining, manager, address, and email.
- **One-Time Credentials Panel:** Displays the newly generated login ID and temporary system password only once upon completion.
- **Dynamic Profile View:** Four-tabbed snapshot (Resume, Private Info, Salary Config, Security). Reusable in read-only mode for directory detail cards.

### ⏱️ Attendance & Live Status
- **Today Status Engine:** Deterministic daily status mapping (Present, Late, Half-day, Leave, Absent, Weekend).
- **Double Check-In Guard:** Server-side rules block duplicate punches or open sessions.
- **Directory Live Dots:** Directories and details show Today Status indicators (Green for Present, Yellow for Late) ONLY if attendance data is active for that day—avoiding fake states.

### 🌴 Leaves & Time Off
- **Weekend Exclusion:** Working days calculation ignores Saturdays and Sundays automatically.
- **Overlap Prevention:** Blocks submission if requested dates collide with any existing Pending or Approved time-off window.
- **Approval Drawer:** Dedicated review interface showing remaining balance, overlap warnings, and requiring comments for rejections.

### 💰 Payroll & Calculations
- **Base Split Validation:** Rejects configurations where Basic + HRA + Allowances do not equal exactly 100% of the Base wage.
- **Statutory Deductions:** Computes PF, PT, and Net Take Home Pay, factoring in unpaid leave deductions dynamically.

### 📜 System Audit Trail
- Structured logging of all administrative actions. Captures actor ID, action summary, category, timestamp, and JSON payloads showing before-and-after states.

---

## Developer Operations

### Prerequisites
- Node.js (v18.x or later)
- Supabase Project (Database tables configured)

### Setup & Installation
1. Clone the repository and install dependencies:
   ```bash
   npm install
   ```

2. Configure environment variables in `.env.local`:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
   ```

### Execution Commands
- **Development Server:**
  ```bash
  npm run dev
  ```
- **Build Production Bundle:**
  ```bash
  npm run build
  ```
- **Execute Domain Test Suite:**
  ```bash
  npm test
  ```
  *(Runs the validation test suite covering leave overlap, check-in guards, salary math, and audit filters).*
