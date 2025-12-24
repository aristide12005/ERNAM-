-- 1. Create PROFILES table if it doesn't exist
create table if not exists public.profiles (
  id uuid references auth.users(id) on delete cascade primary key,
  full_name text,
  role text check (role in ('admin', 'trainer', 'trainee')) not null,
  status text check (status in ('pending', 'approved', 'rejected')) default 'pending',
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

-- 2. Enable RLS
alter table public.profiles enable row level security;

-- 3. POLICIES
-- Allow SELECT for everyone (so we can check if profile exists)
drop policy if exists "Public profiles are viewable by everyone" on profiles;
create policy "Public profiles are viewable by everyone" 
  on profiles for select 
  using ( true );

-- Allow INSERT by the user (Backup if trigger fails)
drop policy if exists "Users can insert their own profile" on profiles;
create policy "Users can insert their own profile" 
  on profiles for insert 
  with check ( auth.uid() = id );

-- Allow UPDATE by the user
drop policy if exists "Users can update own profile" on profiles;
create policy "Users can update own profile" 
  on profiles for update 
  using ( auth.uid() = id );

-- 4. TRIGGER (Primary Method)
create or replace function public.handle_new_user() 
returns trigger as $$
begin
  insert into public.profiles (id, full_name, role, status)
  values (
    new.id,
    new.raw_user_meta_data->>'full_name',
    coalesce(new.raw_user_meta_data->>'role', 'trainee'),
    'pending'
  )
  on conflict (id) do nothing; -- Prevent error if manual insert happened first (unlikely) or trigger runs twice
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
