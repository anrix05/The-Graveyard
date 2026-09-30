-- Create Transactions Table if it doesn't exist
create table if not exists public.transactions (
  id uuid default uuid_generate_v4() primary key,
  buyer_id uuid references public.profiles(id) not null,
  project_id uuid references public.projects(id) not null,
  amount numeric not null,
  status text check (status in ('pending', 'completed', 'failed')),
  payment_id text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS
alter table public.transactions enable row level security;

-- Policies (Drop existing to avoid conflicts if re-running)
drop policy if exists "Users can view their own transactions" on transactions;
create policy "Users can view their own transactions"
  on transactions for select
  using ( auth.uid() = buyer_id );

drop policy if exists "Users can insert their own transactions" on transactions;
create policy "Users can insert their own transactions"
  on transactions for insert
  with check ( auth.uid() = buyer_id );
