/*
  # Create users profile table and security policies

  1. New Tables
    - `users_profile`
      - `id` (uuid, primary key, references auth.users)
      - `email` (text, not null)
      - `rank` (text, default: 'beginner')
      - `created_at` (timestamp with time zone)
      - `updated_at` (timestamp with time zone)

  2. Security
    - Enable RLS on users_profile table
    - Add policies for:
      - Users can read their own profile
      - Users can update their own profile
*/

create table if not exists public.users_profile (
  id uuid primary key references auth.users on delete cascade,
  email text not null,
  rank text default 'beginner',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table public.users_profile enable row level security;

create policy "Users can read own profile"
  on public.users_profile
  for select
  using (auth.uid() = id);

create policy "Users can update own profile"
  on public.users_profile
  for update
  using (auth.uid() = id);

-- Create a function to handle new user signup
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.users_profile (id, email)
  values (new.id, new.email);
  return new;
end;
$$;

-- Create a trigger to automatically create user profile
create or replace trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();