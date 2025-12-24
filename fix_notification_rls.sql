-- RUN THIS SCRIPT IN YOUR SUPABASE SQL EDITOR TO ENABLE ADMIN NOTIFICATIONS --

-- 1. Ensure the notifications table has Row Level Security enabled
alter table if exists notifications enable row level security;

-- 2. Drop existing policies to avoid conflicts
drop policy if exists "Admins can insert notifications" on notifications;
drop policy if exists "Users can see own notifications" on notifications;
drop policy if exists "Admins can see all notifications" on notifications;

-- 3. Create Policy: Allow ADMINS to send notifications to any user
create policy "Admins can insert notifications"
on notifications for insert
with check (
    exists (
        select 1 from profiles
        where profiles.id = auth.uid()
        and profiles.role = 'admin'
    )
);

-- 4. Create Policy: Allow USERS to read only their own notifications
create policy "Users can see own notifications"
on notifications for select
using (auth.uid() = user_id);

-- 5. Create Policy: Allow ADMINS to see all notifications (for management/audit)
create policy "Admins can see all notifications"
on notifications for select
using (
    exists (
        select 1 from profiles
        where profiles.id = auth.uid()
        and profiles.role = 'admin'
    )
);

-- 6. Audit Log entry for this configuration
insert into audit_logs (action, target_resource)
values ('System Update', 'Notifications RLS Policies Configured');
