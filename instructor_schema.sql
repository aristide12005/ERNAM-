-- INSTRUCTOR PORTAL SCHEMA
-- Idempotent script to setup Assignments, Grades, and Notices

-- 1. ASSIGNMENTS
create table if not exists public.assignments (
  id uuid default uuid_generate_v4() primary key,
  course_id uuid references public.courses(id) on delete cascade not null,
  title text not null,
  description text,
  max_score integer default 100,
  due_date timestamp with time zone,
  created_at timestamp with time zone default now()
);

-- 2. GRADES
create table if not exists public.grades (
  id uuid default uuid_generate_v4() primary key,
  assignment_id uuid references public.assignments(id) on delete cascade not null,
  student_id uuid references public.profiles(id) on delete cascade not null,
  score integer check (score >= 0),
  feedback text,
  graded_at timestamp with time zone default now(),
  unique(assignment_id, student_id)
);

-- 3. NOTICES (Admin Announcements)
create table if not exists public.notices (
  id uuid default uuid_generate_v4() primary key,
  content text not null,
  priority text check (priority in ('low', 'normal', 'high', 'urgent')) default 'normal',
  author_id uuid references public.profiles(id),
  created_at timestamp with time zone default now()
);

-- RLS POLICIES

-- Assignments: 
-- Instructors can create/edit. Students can view.
alter table public.assignments enable row level security;
drop policy if exists "Public assignments view" on public.assignments;
create policy "Public assignments view" on public.assignments for select using (true);

drop policy if exists "Instructors manage assignments" on public.assignments;
create policy "Instructors manage assignments" on public.assignments for all using (
  exists (
    select 1 from public.profiles
    where id = auth.uid() and role in ('trainer', 'admin')
  )
);

-- Grades:
-- Instructors can manage. Students see ONLY their own.
alter table public.grades enable row level security;
drop policy if exists "Students view own grades" on public.grades;
create policy "Students view own grades" on public.grades for select using (
  student_id = auth.uid()
);

drop policy if exists "Instructors manage grades" on public.grades;
create policy "Instructors manage grades" on public.grades for all using (
  exists (
    select 1 from public.profiles
    where id = auth.uid() and role in ('trainer', 'admin')
  )
);

-- Notices:
-- Everyone can read. Only Admin can write.
alter table public.notices enable row level security;
drop policy if exists "Everyone views notices" on public.notices;
create policy "Everyone views notices" on public.notices for select using (true);

drop policy if exists "Admins manage notices" on public.notices;
create policy "Admins manage notices" on public.notices for all using (
  exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'admin'
  )
);

-- SEED DATA (Safe insert)
insert into public.notices (content, priority)
values 
('Welcome to the new semester! Please update your profiles.', 'normal'),
('Maintenance scheduled for Simulator A320 this weekend.', 'high')
on conflict do nothing;
