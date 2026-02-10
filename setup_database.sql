-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- PROFILES TABLE (Public User Data)
create table public.profiles (
  id uuid references auth.users not null primary key,
  username text unique,
  avatar_url text,
  upi_id text, -- For payouts (e.g., user@oksbi)
  updated_at timestamp with time zone,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- PROJECTS TABLE (The Items for Sale)
create table public.projects (
  id uuid default uuid_generate_v4() primary key,
  seller_id uuid references public.profiles(id) not null,
  title text not null,
  description text,
  tech_stack text[], -- Array of strings e.g. ['nextjs', 'react']
  price numeric default 0,
  interaction_type text check (interaction_type in ('buy', 'adopt', 'collab')),
  file_url text, -- Secure link to the zip file in storage
  is_sold boolean default false,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- RLS POLICIES (Security)
alter table public.profiles enable row level security;
alter table public.projects enable row level security;

-- Profiles: Everyone can read, User can update own
create policy "Public profiles are viewable by everyone."
  on profiles for select
  using ( true );

create policy "Users can insert their own profile."
  on profiles for insert
  with check ( auth.uid() = id );

create policy "Users can update own profile."
  on profiles for update
  using ( auth.uid() = id );

-- Projects: Everyone can read, User can insert/update own
create policy "Projects are viewable by everyone."
  on projects for select
  using ( true );

create policy "Users can insert their own projects."
  on projects for insert
  with check ( auth.uid() = seller_id );

create policy "Users can update their own projects."
  on projects for update
  using ( auth.uid() = seller_id );
