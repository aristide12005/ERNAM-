-- LMS Extensions Schema

-- 1. Add file_url to Assignments for Instructor attachments
do $$ 
begin 
    if not exists (select 1 from information_schema.columns where table_name='assignments' and column_name='file_url') then
        alter table assignments add column file_url text;
    end if;
end $$;

-- 2. Submissions Table (Student side)
create table if not exists submissions (
    id uuid default uuid_generate_v4() primary key,
    assignment_id uuid references assignments(id) on delete cascade not null,
    student_id uuid references auth.users(id) on delete cascade not null,
    file_url text not null, -- Student's uploaded file
    status text check (status in ('submitted', 'graded')) default 'submitted',
    submitted_at timestamp with time zone default now(),
    updated_at timestamp with time zone default now()
);

-- 3. Update Grades to reference Submissions (Optional but better)
-- For simplicity, let's keep grade linked to assignment/student but add a status to submissions to trigger "Grade Now"

-- 4. Notifications Table
create table if not exists notifications (
    id uuid default uuid_generate_v4() primary key,
    user_id uuid references auth.users(id) on delete cascade not null,
    title text not null,
    message text,
    type text check (type in ('info', 'alert', 'success', 'priority')) default 'info',
    is_read boolean default false,
    action_link text, -- e.g. "/dashboard?view=gradebook"
    created_at timestamp with time zone default now()
);

-- 5. User Documents (Personal Storage)
create table if not exists user_documents (
    id uuid default uuid_generate_v4() primary key,
    user_id uuid references auth.users(id) on delete cascade not null,
    title text not null,
    file_url text not null,
    file_type text,
    category text default 'general', -- e.g. "grades", "notes", "course"
    created_at timestamp with time zone default now()
);

-- 6. RLS Policies
alter table submissions enable row level security;
drop policy if exists "Students can manage own submissions" on submissions;
create policy "Students can manage own submissions" on submissions 
    for all using (auth.uid() = student_id);
drop policy if exists "Trainers can view all submissions" on submissions;
create policy "Trainers can view all submissions" on submissions 
    for select using (exists (select 1 from profiles where id = auth.uid() and role = 'trainer'));

alter table notifications enable row level security;
drop policy if exists "Users can see own notifications" on notifications;
create policy "Users can see own notifications" on notifications 
    for select using (auth.uid() = user_id);
drop policy if exists "Users can update own notifications" on notifications;
create policy "Users can update own notifications" on notifications 
    for update using (auth.uid() = user_id);

alter table user_documents enable row level security;
drop policy if exists "Users can manage own documents" on user_documents;
create policy "Users can manage own documents" on user_documents 
    for all using (auth.uid() = user_id);
