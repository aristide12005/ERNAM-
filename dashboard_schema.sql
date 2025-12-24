-- 1. FLIGHT LOGS (For Trainee KPI)
create table if not exists flight_logs (
    id uuid default uuid_generate_v4() primary key,
    trainee_id uuid references auth.users(id) on delete cascade not null,
    date date not null,
    duration_hours numeric(4, 1) not null,
    aircraft_type text,
    notes text,
    created_at timestamp with time zone default now()
);

-- 2. SESSIONS (For Trainer Schedule)
create table if not exists sessions (
    id uuid default uuid_generate_v4() primary key,
    course_id uuid references courses(id) on delete cascade,
    trainer_id uuid references auth.users(id) on delete set null,
    title text not null,
    start_time timestamp with time zone not null,
    end_time timestamp with time zone not null,
    location text, -- e.g. "Sim Bay A"
    created_at timestamp with time zone default now()
);

-- 3. ATTENDANCE (For Trainee KPI)
create table if not exists attendance (
    id uuid default uuid_generate_v4() primary key,
    session_id uuid references sessions(id) on delete cascade not null,
    trainee_id uuid references auth.users(id) on delete cascade not null,
    status text check (status in ('present', 'absent', 'excused')) default 'present',
    created_at timestamp with time zone default now()
);

-- 4. RLS
alter table flight_logs enable row level security;
drop policy if exists "Trainees can see own logs" on flight_logs;
create policy "Trainees can see own logs" on flight_logs for select using (auth.uid() = trainee_id);

drop policy if exists "Trainers can see all logs" on flight_logs;
create policy "Trainers can see all logs" on flight_logs for select using (
    exists (select 1 from profiles where id = auth.uid() and role = 'trainer')
);

alter table sessions enable row level security;
drop policy if exists "Public sessions view" on sessions;
create policy "Public sessions view" on sessions for select using (true);

alter table attendance enable row level security;
drop policy if exists "View own attendance" on attendance;
create policy "View own attendance" on attendance for select using (auth.uid() = trainee_id);

-- 5. SEED DATA (Need valid UUIDs, so we'll just insert generic placeholders for now 
-- or rely on the user to interact. But for 'demo' we can insert linked to 'auth.uid()' dynamically if we had it, 
-- but SQL scripts run statically. We will skip complex seeding that depends on specific user IDs to avoid FK errors.)
