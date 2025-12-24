-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- 1. COURSES TABLE
create table if not exists courses (
  id uuid default uuid_generate_v4() primary key,
  title_fr text not null,
  description_fr text,
  start_date timestamp with time zone,
  enrollment_mode text check (enrollment_mode in ('auto', 'manual')) default 'auto',
  status text default 'draft',
  created_at timestamp with time zone default now()
);

-- 2. MODULES TABLE
create table if not exists modules (
  id uuid default uuid_generate_v4() primary key,
  course_id uuid references courses(id) on delete cascade not null,
  title text not null,
  sort_order integer default 0,
  is_published boolean default false,
  created_at timestamp with time zone default now()
);

-- 3. COURSE ITEMS TABLE
create table if not exists course_items (
  id uuid default uuid_generate_v4() primary key,
  module_id uuid references modules(id) on delete cascade not null,
  title text not null,
  content_type text check (content_type in ('video', 'pdf', 'quiz', 'text')) not null,
  sort_order integer default 0,
  created_at timestamp with time zone default now()
);

-- 4. ENROLLMENTS TABLE
create table if not exists enrollments (
  user_id uuid not null, -- references auth.users(id) in real scneario
  course_id uuid references courses(id) on delete cascade not null,
  status text check (status in ('active', 'pending', 'rejected', 'completed')) default 'pending',
  created_at timestamp with time zone default now(),
  primary key (user_id, course_id)
);

-- 5. ASSETS (For Dashboard)
create table if not exists assets (
  id uuid default uuid_generate_v4() primary key,
  name text not null,
  status text check (status in ('operational', 'maintenance', 'offline')) default 'operational',
  next_maintenance timestamp with time zone,
  created_at timestamp with time zone default now()
);

-- 6. AUDIT LOGS (For Dashboard)
create table if not exists audit_logs (
  id uuid default uuid_generate_v4() primary key,
  action text not null,
  target_resource text,
  timestamp timestamp with time zone default now()
);

-- RLS POLICIES (Simple version: Public Read/Write for dev, lock down later)
alter table courses enable row level security;
create policy "Public courses are viewable" on courses for select using (true);

alter table modules enable row level security;
create policy "Public modules are viewable" on modules for select using (true);

alter table course_items enable row level security;
create policy "Public items are viewable" on course_items for select using (true);

alter table enrollments enable row level security;
create policy "Users can see own enrollments" on enrollments for select using (true); -- Relaxed for dev
create policy "Users can enroll themselves" on enrollments for insert with check (true);

alter table assets enable row level security;
create policy "Public assets view" on assets for select using (true);

alter table audit_logs enable row level security;
create policy "Public logs view" on audit_logs for select using (true);

-- SEED DATA
INSERT INTO courses (id, title_fr, description_fr, start_date, enrollment_mode, status)
VALUES 
  ('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'Sûreté de l''aviation (AVSEC 123)', 'Formation de base pour le personnel de sûreté aéroportuaire.', NOW() + interval '5 days', 'manual', 'published'),
  ('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a12', 'Contrôle de la Circulation Aérienne', 'Rudiments du contrôle aérien et communication radio.', NOW() + interval '10 days', 'auto', 'published')
ON CONFLICT (id) DO NOTHING;

INSERT INTO assets (name, status, next_maintenance)
VALUES 
  ('Cessna 172 Skyhawk', 'operational', NOW() + interval '30 days'),
  ('Simulateur A320', 'maintenance', NOW() + interval '2 days'),
  ('Radar Principal', 'operational', NOW() + interval '60 days');

INSERT INTO audit_logs (action, target_resource, timestamp)
VALUES 
  ('User Login', 'Portal', NOW() - interval '1 hour'),
  ('Course Created', 'AVSEC 123', NOW() - interval '2 hours'),
  ('Maintenance Request', 'Simulateur A320', NOW() - interval '1 day');
