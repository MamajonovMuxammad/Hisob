-- Run this in Supabase SQL Editor: https://supabase.com/dashboard → SQL Editor

-- Documents table
create table if not exists documents (
  id          bigint generated always as identity primary key,
  type        text not null,
  name        text not null,
  content     text,
  amount      numeric default 0,
  date        date,
  created_at  timestamptz default now()
);

-- Transactions table (income / expenses)
create table if not exists transactions (
  id          bigint generated always as identity primary key,
  type        text not null check (type in ('income', 'expense')),
  amount      numeric not null,
  category    text,
  description text,
  date        date,
  created_at  timestamptz default now()
);

-- Employees table
create table if not exists employees (
  id          bigint generated always as identity primary key,
  name        text not null,
  pinfl       text,
  position    text,
  hire_date   date,
  salary      numeric default 0,
  type        text default 'staff' check (type in ('staff', 'gpd')),
  created_at  timestamptz default now()
);

-- Enable Row Level Security (temporarily open for MVP — add auth later)
alter table documents    enable row level security;
alter table transactions enable row level security;
alter table employees    enable row level security;

-- Allow all operations for anon key (MVP — no auth yet)
create policy "Allow all for anon" on documents    for all using (true) with check (true);
create policy "Allow all for anon" on transactions for all using (true) with check (true);
create policy "Allow all for anon" on employees    for all using (true) with check (true);

-- Settings table (Global MVP settings)
create table if not exists settings (
  id          bigint generated always as identity primary key,
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

alter table settings enable row level security;
create policy "Allow all for anon" on settings for all using (true) with check (true);

-- Chats table (Chat History)
create table if not exists chats (
  id          bigint generated always as identity primary key,
  title       text not null,
  messages    jsonb not null default '[]',
  updated_at  timestamptz default now()
);

alter table chats enable row level security;
create policy "Allow all for anon" on chats for all using (true) with check (true);
