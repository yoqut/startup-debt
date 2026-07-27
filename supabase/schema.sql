-- Qarz Hisobchi -- Supabase sxemasi
-- Buni Supabase loyihangizda: Dashboard -> SQL Editor -> New query -> shu faylni joylashtirib "Run" bosing.
-- Fayl idempotent -- qayta ishga tushirsangiz ham xato bermaydi.

create extension if not exists "pgcrypto";

create table if not exists settings (
  id smallint primary key default 1,
  name0 text not null default 'Muhammadali',
  name1 text not null default 'Ulug''bek',
  constraint single_row check (id = 1)
);

insert into settings (id, name0, name1)
values (1, 'Muhammadali', 'Ulug''bek')
on conflict (id) do nothing;

create table if not exists transactions (
  id uuid primary key default gen_random_uuid(),
  type text not null check (type in ('expense', 'transfer')),
  -- xarid (type='expense'): har bir do'st shu xaridga qancha pul qo'shganini alohida yozamiz,
  -- shunda ulush avtomatik teng bo'linadi va ortiqcha to'lagan tomon qarzga o'tkaziladi.
  amount0 numeric check (amount0 is null or amount0 >= 0),
  amount1 numeric check (amount1 is null or amount1 >= 0),
  -- pul o'tkazma (type='transfer'): kimdan kimga to'liq summa
  from_friend smallint check (from_friend in (0, 1)),
  amount numeric check (amount is null or amount > 0),
  date date not null,
  note text,
  created_at timestamptz not null default now(),
  -- Kim (qaysi do'st) shu yozuvni kiritgani -- Telegram Web App orqali avtomatik aniqlanadi.
  created_by smallint check (created_by in (0, 1)),
  created_by_name text,
  constraint transactions_shape_check check (
    (type = 'expense' and amount0 is not null and amount1 is not null and (amount0 + amount1) > 0
      and from_friend is null and amount is null)
    or
    (type = 'transfer' and amount is not null and from_friend is not null
      and amount0 is null and amount1 is null)
  )
);

-- Eski ustunni tozalash (avvalgi "bitta to'lovchi" modelidan qolgan bo'lsa)
alter table transactions drop column if exists payer;

create index if not exists transactions_date_idx on transactions (date desc, created_at desc);

-- Oddiy (parolsiz) kirish: anon kalit bilan har kim o'qiy/yoza/o'chira oladi.
-- Bu 2 kishilik shaxsiy vosita uchun mo'ljallangan -- linkni begonalarga tarqatmang.
alter table settings enable row level security;
alter table transactions enable row level security;

drop policy if exists "settings anon all" on settings;
create policy "settings anon all" on settings
  for all using (true) with check (true);

drop policy if exists "transactions anon all" on transactions;
create policy "transactions anon all" on transactions
  for all using (true) with check (true);

-- Realtime yoqish (ikkala do'stning ekrani jonli sinxron bo'lishi uchun)
do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and tablename = 'transactions'
  ) then
    alter publication supabase_realtime add table transactions;
  end if;
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and tablename = 'settings'
  ) then
    alter publication supabase_realtime add table settings;
  end if;
end $$;
