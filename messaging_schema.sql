-- MESSAGING SYSTEM SCHEMA
-- Enables threaded conversations, role-based broadcasts, and file sharing permissions.

-- 1. MESSAGES TABLE
create table if not exists messages (
    id uuid default uuid_generate_v4() primary key,
    sender_id uuid references auth.users(id) on delete cascade not null,
    receiver_id uuid references auth.users(id) on delete cascade, -- Null if broadcast to course
    course_id uuid references courses(id) on delete cascade,       -- Null if private message
    title text,
    content text not null,
    is_reply_allowed boolean default true,
    parent_id uuid references messages(id) on delete cascade,    -- For threading
    attachment_url text, -- Supabase Storage URL
    is_read boolean default false,
    created_at timestamp with time zone default now()
);

-- 2. ENABLE RLS
alter table messages enable row level security;

-- 3. RLS POLICIES

-- Users can see messages they sent
create policy "Users can view sent messages"
on messages for select
using (auth.uid() = sender_id);

-- Users can see messages sent specifically to them
create policy "Users can view private received messages"
on messages for select
using (auth.uid() = receiver_id);

-- Trainees can see messages broadcast to a course they are enrolled in
create policy "Trainees can view course broadcasts"
on messages for select
using (
    course_id is not null and
    exists (
        select 1 from enrollments
        where enrollments.course_id = messages.course_id
        and enrollments.user_id = auth.uid()
        and enrollments.status = 'approved'
    )
);

-- Trainers can see all messages related to courses they teach
create policy "Trainers can view course-related messages"
on messages for select
using (
    course_id is not null and
    exists (
        select 1 from courses
        where courses.id = messages.course_id
        and courses.instructor_id = auth.uid()
    )
);

-- Admins can see everything (Audit capability)
create policy "Admins can view all communications"
on messages for select
using (
    exists (
        select 1 from profiles
        where profiles.id = auth.uid()
        and profiles.role = 'admin'
    )
);

-- Generic Insert: Anyone can insert messages (Logic handled by App/RLS Check)
create policy "Anyone can send messages"
on messages for insert
with check (auth.uid() = sender_id);

-- 4. UPDATE STATUS (Marking as Read)
create policy "Receivers can update read status"
on messages for update
using (auth.uid() = receiver_id)
with check (auth.uid() = receiver_id);
