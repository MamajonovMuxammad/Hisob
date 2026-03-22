-- Run this in Supabase SQL Editor: https://supabase.com/dashboard → SQL Editor

-- Create Tables with user_id
create table if not exists documents (
  id          bigint generated always as identity primary key,
  user_id     uuid references auth.users default auth.uid(),
  type        text not null,
  name        text not null,
  content     text,
  amount      numeric default 0,
  date        date,
  created_at  timestamptz default now()
);

create table if not exists transactions (
  id          bigint generated always as identity primary key,
  user_id     uuid references auth.users default auth.uid(),
  type        text not null check (type in ('income', 'expense')),
  amount      numeric not null,
  category    text,
  description text,
  date        date,
  created_at  timestamptz default now()
);

create table if not exists employees (
  id          bigint generated always as identity primary key,
  user_id     uuid references auth.users default auth.uid(),
  name        text not null,
  pinfl       text,
  position    text,
  hire_date   date,
  salary      numeric default 0,
  type        text default 'staff' check (type in ('staff', 'gpd')),
  created_at  timestamptz default now()
);

create table if not exists settings (
  id          bigint generated always as identity primary key,
  user_id     uuid references auth.users default auth.uid(),
  company     text,
  inn         text,
  oked        text,
  tax_system  text,
  address     text,
  bank        text,
  account     text,
  director    text,
  accountant  text,
  updated_at  timestamptz default now()
);

create table if not exists chats (
  id          bigint generated always as identity primary key,
  user_id     uuid references auth.users default auth.uid(),
  title       text not null,
  messages    jsonb not null default '[]',
  updated_at  timestamptz default now()
);

-- Enable RLS
alter table documents enable row level security;
alter table transactions enable row level security;
alter table employees enable row level security;
alter table settings enable row level security;
alter table chats enable row level security;

-- Drop Old insecure policies if they exist
drop policy if exists "Allow all for anon" on documents;
drop policy if exists "Allow all for anon" on transactions;
drop policy if exists "Allow all for anon" on employees;
drop policy if exists "Allow all for anon" on settings;
drop policy if exists "Allow all for anon" on chats;

-- Create Secure Policies (Only the owner can select, insert, update, or delete)
create policy "Users can access own documents" on documents for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "Users can access own transactions" on transactions for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "Users can access own employees" on employees for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "Users can access own settings" on settings for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "Users can access own chats" on chats for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- Migration script: To upgrade your existing tables, run these ALTERs (if the tables existed before user_id)
-- alter table documents add column if not exists user_id uuid references auth.users default auth.uid();
-- alter table transactions add column if not exists user_id uuid references auth.users default auth.uid();
-- alter table employees add column if not exists user_id uuid references auth.users default auth.uid();
-- alter table settings add column if not exists user_id uuid references auth.users default auth.uid();
-- alter table chats add column if not exists user_id uuid references auth.users default auth.uid();
