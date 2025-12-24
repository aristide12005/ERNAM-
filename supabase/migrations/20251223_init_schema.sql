-- 0. CLEANUP (Wipe old schema)
drop table if exists public.users cascade;
drop table if exists public.courses cascade;
drop table if exists public.enrollments cascade;
drop table if exists public.materials cascade;
drop table if exists public.archives cascade;
drop table if exists public.audit_logs cascade;
drop table if exists public.assets cascade;

-- Drop legacy tables from previous version
drop table if exists public.profiles cascade;
drop table if exists public.announcements cascade;
drop table if exists public.notifications cascade;
drop table if exists public.modules cascade;
drop table if exists public.assignments cascade;
drop table if exists public.resources cascade;
drop table if exists public.course_enrollments cascade;
drop table if exists public.assignment_submissions cascade;

-- Drop Types
drop type if exists public.user_role cascade;
drop type if exists public.language_pref cascade;
drop type if exists public.course_status cascade;
drop type if exists public.enrollment_status cascade;
drop type if exists public.material_type cascade;
drop type if exists public.asset_status cascade;

-- 1. Enum Definitions
create type public.user_role as enum ('trainee', 'trainer', 'admin', 'director');
create type public.language_pref as enum ('fr', 'en');
create type public.course_status as enum ('upcoming', 'active', 'completed');
create type public.enrollment_status as enum ('pending_payment', 'active', 'completed', 'failed');
create type public.material_type as enum ('pdf', 'video', 'slide');
create type public.asset_status as enum ('operational', 'maintenance', 'offline');

-- 2. Users (Profiles) linked to auth.users
create table public.users (
  id uuid references auth.users on delete cascade primary key,
  email text unique not null,
  role public.user_role not null default 'trainee',
  full_name text,
  language_pref public.language_pref default 'fr',
  avatar_url text,
  meta_data jsonb,
  created_at timestamptz default now()
);

-- 3. Assets (Digital Twin of Physical Assets)
create table public.assets (
  id uuid default gen_random_uuid() primary key,
  name text not null,
  status public.asset_status default 'operational',
  next_maintenance date,
  created_at timestamptz default now()
);

-- 4. Courses
create table public.courses (
  id uuid default gen_random_uuid() primary key,
  title_fr text not null,
  title_en text,
  description_fr text,
  description_en text,
  start_date timestamptz,
  end_date timestamptz,
  instructor_id uuid references public.users(id),
  status public.course_status default 'upcoming',
  created_at timestamptz default now()
);

-- 5. Enrollments
create table public.enrollments (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.users(id) not null,
  course_id uuid references public.courses(id) not null,
  status public.enrollment_status default 'pending_payment',
  grade_current float,
  created_at timestamptz default now(),
  unique(user_id, course_id)
);

-- 6. Materials
create table public.materials (
  id uuid default gen_random_uuid() primary key,
  course_id uuid references public.courses(id) not null,
  title text not null,
  type public.material_type not null,
  file_url text,
  created_at timestamptz default now()
);

-- 7. Archives (Historical Records)
create table public.archives (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.users(id),
  diploma_url text,
  year integer,
  license_number text,
  course_name_snapshot text,
  created_at timestamptz default now()
);

-- 8. Audit Logs
create table public.audit_logs (
  id uuid default gen_random_uuid() primary key,
  admin_id uuid references public.users(id),
  action text not null,
  target_resource text,
  timestamp timestamptz default now()
);

-- 9. Secure Row Level Security (RLS) Basics
-- Enable RLS
alter table public.users enable row level security;
alter table public.courses enable row level security;
alter table public.enrollments enable row level security;
alter table public.materials enable row level security;
alter table public.archives enable row level security;
alter table public.audit_logs enable row level security;
alter table public.assets enable row level security;

-- Basic Policies (To be refined)
-- Users can see their own profile
create policy "Users can view own profile" on public.users for select using (auth.uid() = id);

-- Public courses (viewable by all authenticated)
create policy "Public view courses" on public.courses for select using (auth.role() = 'authenticated');

-- Enrollments: Users view their own
create policy "View own enrollments" on public.enrollments for select using (auth.uid() = user_id);
