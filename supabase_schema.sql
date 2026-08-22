-- Dayflow HRMS Supabase Schema & Initial Data
-- Run this in your Supabase Dashboard -> SQL Editor

-- 1. PROFILES TABLE
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT UNIQUE NOT NULL,
  role TEXT NOT NULL DEFAULT 'employee' CHECK (role IN ('admin', 'hr', 'employee')),
  employee_id TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. EMPLOYEES TABLE
CREATE TABLE IF NOT EXISTS public.employees (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  profile_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  employee_code TEXT UNIQUE NOT NULL,
  full_name TEXT NOT NULL,
  designation TEXT NOT NULL,
  department TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'Active' CHECK (status IN ('Active', 'Away', 'On Leave')),
  profile_photo_url TEXT,
  personal_email TEXT,
  work_phone TEXT,
  dob TEXT,
  nationality TEXT DEFAULT 'Indian',
  marital_status TEXT DEFAULT 'Single',
  residing_address TEXT,
  joining_date TEXT,
  bank_name TEXT,
  account_number TEXT,
  ifsc_code TEXT,
  pan_number TEXT,
  uan_number TEXT,
  manager_id TEXT,
  salary JSONB DEFAULT '{"base": 1200000, "basicPct": 50, "hraPct": 25, "stdPct": 15, "pfPct": 12, "ptFixed": 200}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. ATTENDANCE TABLE
CREATE TABLE IF NOT EXISTS public.attendance (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  employee_id TEXT NOT NULL REFERENCES public.employees(id) ON DELETE CASCADE,
  employee_name TEXT,
  date TEXT NOT NULL,
  check_in TEXT,
  check_out TEXT,
  work_hours TEXT,
  extra_hours TEXT,
  status TEXT NOT NULL DEFAULT 'Present' CHECK (status IN ('Present', 'Late', 'Half-day', 'On Leave', 'Absent', 'Weekend')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 4. LEAVES (TIME OFF) TABLE
CREATE TABLE IF NOT EXISTS public.leaves (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  employee_id TEXT NOT NULL REFERENCES public.employees(id) ON DELETE CASCADE,
  employee_name TEXT,
  department TEXT,
  type TEXT NOT NULL CHECK (type IN ('Paid Leave', 'Sick Leave', 'Casual Leave', 'Unpaid Leave')),
  start_date TEXT NOT NULL,
  end_date TEXT NOT NULL,
  days INT NOT NULL DEFAULT 1,
  reason TEXT,
  status TEXT NOT NULL DEFAULT 'Pending' CHECK (status IN ('Pending', 'Approved', 'Rejected')),
  rejection_comment TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 5. AUDIT LOGS TABLE
CREATE TABLE IF NOT EXISTS public.audit_logs (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  action TEXT NOT NULL,
  actor_name TEXT NOT NULL,
  category TEXT DEFAULT 'SYSTEM',
  timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  metadata JSONB
);

-- Row Level Security (RLS) policies
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.employees ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.attendance ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.leaves ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- Allow read/write for authenticated and anon users (for dev flexibility)
CREATE POLICY "Allow public read on employees" ON public.employees FOR SELECT USING (true);
CREATE POLICY "Allow public insert on employees" ON public.employees FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update on employees" ON public.employees FOR UPDATE USING (true);
CREATE POLICY "Allow public delete on employees" ON public.employees FOR DELETE USING (true);

CREATE POLICY "Allow public read on attendance" ON public.attendance FOR SELECT USING (true);
CREATE POLICY "Allow public insert on attendance" ON public.attendance FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update on attendance" ON public.attendance FOR UPDATE USING (true);

CREATE POLICY "Allow public read on leaves" ON public.leaves FOR SELECT USING (true);
CREATE POLICY "Allow public insert on leaves" ON public.leaves FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update on leaves" ON public.leaves FOR UPDATE USING (true);

CREATE POLICY "Allow public read on audit_logs" ON public.audit_logs FOR SELECT USING (true);
CREATE POLICY "Allow public insert on audit_logs" ON public.audit_logs FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow public read on profiles" ON public.profiles FOR SELECT USING (true);
CREATE POLICY "Allow public insert on profiles" ON public.profiles FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update on profiles" ON public.profiles FOR UPDATE USING (true);

-- Seed initial Indian employee records
INSERT INTO public.employees (id, employee_code, full_name, designation, department, status, personal_email, work_phone, joining_date, salary)
VALUES 
  ('1', 'EMP001', 'Mahi Soni', 'HR Operations Lead', 'HR', 'Active', 'mahi.soni@dayflow.in', '+91 98234 56789', '2021-01-15', '{"base": 1500000, "basicPct": 50, "hraPct": 25, "stdPct": 15, "pfPct": 12, "ptFixed": 200}'::jsonb),
  ('2', 'EMP002', 'Aarav Sharma', 'Senior Software Engineer', 'Engineering', 'Active', 'aarav.sharma@dayflow.in', '+91 98111 22334', '2022-03-01', '{"base": 1800000, "basicPct": 50, "hraPct": 25, "stdPct": 15, "pfPct": 12, "ptFixed": 200}'::jsonb),
  ('3', 'EMP003', 'Priya Patel', 'Senior Product Designer', 'Design', 'On Leave', 'priya.patel@dayflow.in', '+91 98450 67890', '2022-06-15', '{"base": 1400000, "basicPct": 50, "hraPct": 25, "stdPct": 15, "pfPct": 12, "ptFixed": 200}'::jsonb),
  ('4', 'EMP004', 'Rohan Mehta', 'Full Stack Developer', 'Engineering', 'Away', 'rohan.mehta@dayflow.in', '+91 98765 43210', '2023-09-01', '{"base": 1100000, "basicPct": 50, "hraPct": 25, "stdPct": 15, "pfPct": 12, "ptFixed": 200}'::jsonb),
  ('5', 'EMP005', 'Ananya Iyer', 'Financial Analyst', 'Finance', 'Active', 'ananya.iyer@dayflow.in', '+91 98321 09876', '2024-01-10', '{"base": 950000, "basicPct": 50, "hraPct": 25, "stdPct": 15, "pfPct": 12, "ptFixed": 200}'::jsonb)
ON CONFLICT (id) DO NOTHING;
