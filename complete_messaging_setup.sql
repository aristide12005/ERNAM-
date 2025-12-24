-- RUN THIS SCRIPT IN YOUR SUPABASE SQL EDITOR --

-- 1. Create the MESSAGES table
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

-- 2. Enable RLS
alter table messages enable row level security;

-- 3. RLS Policies for Messages

-- Users see messages they sent
drop policy if exists "Users can view sent messages" on messages;
create policy "Users can view sent messages" on messages for select using (auth.uid() = sender_id);

-- Users see private messages sent to them
drop policy if exists "Users can view private received messages" on messages;
create policy "Users can view private received messages" on messages for select using (auth.uid() = receiver_id);

-- Trainees see course broadcasts
drop policy if exists "Trainees can view course broadcasts" on messages;
create policy "Trainees can view course broadcasts" on messages for select using (
    course_id is not null and exists (
        select 1 from enrollments where enrollments.course_id = messages.course_id 
        and enrollments.user_id = auth.uid() and enrollments.status = 'active'
    )
);

-- Trainers see messages for their courses
drop policy if exists "Trainers can view course-related messages" on messages;
create policy "Trainers can view course-related messages" on messages for select using (
    course_id is not null and exists (
        select 1 from courses where courses.id = messages.course_id and courses.instructor_id = auth.uid()
    )
);

-- Admins see all
drop policy if exists "Admins can view all communications" on messages;
create policy "Admins can view all communications" on messages for select using (
    exists (select 1 from profiles where id = auth.uid() and role = 'admin')
);

-- Sending messages
drop policy if exists "Anyone can send messages" on messages;
create policy "Anyone can send messages" on messages for insert with check (auth.uid() = sender_id);

-- 4. Create STORAGE BUCKET for attachments
insert into storage.buckets (id, name, public) 
values ('message-attachments', 'message-attachments', true)
on conflict (id) do nothing;

-- 5. Storage Policies (Allow anyone to upload, public read)
drop policy if exists "Public Access" on storage.objects;
create policy "Public Access" on storage.objects for select using (bucket_id = 'message-attachments');

drop policy if exists "Authenticated Upload" on storage.objects;
create policy "Authenticated Upload" on storage.objects for insert with check (
    bucket_id = 'message-attachments' and auth.role() = 'authenticated'
);
