-- ============================================================================
-- BizimHesap ERP - Supabase (PostgreSQL) Schema Script
-- ----------------------------------------------------------------------------
-- Kurulum       : Supabase Studio > SQL Editor > "New query" ile calistirin.
-- Gereksinim    : pgcrypto (gen_random_uuid) supabase'te varsayilan olarak aciktir.
--
-- Icerik        : Enum'lar, Tablolar (UUID PK), Foreign Key'ler,
--                 updated_at trigger'lari, company bazli RLS politikalari,
--                 performans index'leri ve auth.users entegrasyonu.
-- ============================================================================

begin;

create extension if not exists pgcrypto;

-- ============================================================================
-- 0) ENUMLAR (idempotent)
-- ============================================================================
do $$ begin
  create type public.identity_type as enum ('Customer', 'Supplier');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.transaction_type as enum ('Entry', 'Exit', 'Production');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.doc_type as enum ('SalesInvoice', 'PurchaseInvoice', 'Proposal', 'Waybill');
exception when duplicate_object then null; end $$;

-- ============================================================================
-- 1) KULLANICILAR (Supabase auth.users ile baglantili)
-- ============================================================================
create table if not exists public.users (
  id         uuid         primary key default gen_random_uuid()
                          references auth.users (id) on delete cascade,
  email      varchar(255) not null unique,
  full_name  varchar(255) not null default '',
  role       varchar(20)  not null default 'user',
  is_active  boolean      not null default true,
  created_at timestamptz  not null default now(),
  updated_at timestamptz  not null default now(),
  constraint users_role_check
    check (role in ('admin', 'accountant', 'user'))
);

-- ============================================================================
-- 2) SIRKETLER (multi-tenant cekirdek tablo)
-- ============================================================================
create table if not exists public.companies (
  id         uuid         primary key default gen_random_uuid(),
  title      varchar(255) not null,
  tax_office varchar(255),
  tax_number varchar(50),
  phone      varchar(50),
  email      varchar(255),
  address    text,
  created_at timestamptz  not null default now(),
  updated_at timestamptz  not null default now()
);

-- ============================================================================
-- 3) SIRKET - KULLANICI ILISKISI (RLS ve yetki temeli)
-- ============================================================================
create table if not exists public.company_users (
  company_id uuid         not null references public.companies (id) on delete cascade,
  user_id    uuid         not null references public.users (id)    on delete cascade,
  role       varchar(20)  not null default 'user',
  created_at timestamptz  not null default now(),
  primary key (company_id, user_id),
  constraint company_users_role_check
    check (role in ('admin', 'accountant', 'user'))
);

-- ============================================================================
-- 4) CARILER (Musteri / Tedarikci)
-- ============================================================================
create table if not exists public.identities (
  id            uuid           primary key default gen_random_uuid(),
  company_id    uuid           not null references public.companies (id) on delete cascade,
  identity_type public.identity_type not null default 'Customer',
  name          varchar(255)   not null,
  email         varchar(255),
  phone         varchar(50),
  tax_office    varchar(255),
  tax_number    varchar(50),
  address       text,
  bank_info     text,
  due_days      int            not null default 0,
  discount_rate numeric(5,2)   not null default 0,
  currency      varchar(10)    not null default 'TRY',
  balance       numeric(18,2)  not null default 0,
  created_at    timestamptz    not null default now(),
  updated_at    timestamptz    not null default now()
);

-- Mevcut veritabanlarinda (create table zaten calismissa) yeni kolonu ekler
alter table public.identities add column if not exists bank_info text;

-- Gider/masraf tablosuna ek alanlar (mevcut veritabanlari icin idempotent)
alter table public.expenses add column if not exists tax_rate        numeric(5,2)  not null default 0;
alter table public.expenses add column if not exists payment_date   date;
alter table public.expenses add column if not exists payment_status varchar(50)   not null default 'Odendi';
alter table public.expenses add column if not exists description    text;

-- Belge baskligi kopya (snapshot) alanlari + kalem indirimi (idempotent)
alter table public.documents     add column if not exists phone      varchar(50);
alter table public.documents     add column if not exists tax_office varchar(255);
alter table public.documents     add column if not exists tax_no     varchar(50);
alter table public.documents     add column if not exists address    text;
alter table public.document_items add column if not exists discount   numeric(18,2) not null default 0;

-- ============================================================================
-- 5) DEPOLAR
-- ============================================================================
create table if not exists public.warehouses (
  id         uuid        primary key default gen_random_uuid(),
  company_id uuid        not null references public.companies (id) on delete cascade,
  name       varchar(255) not null,
  is_active  boolean     not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ============================================================================
-- 6) URUNLER / STOK KARTLARI
-- ============================================================================
create table if not exists public.products (
  id         uuid          primary key default gen_random_uuid(),
  company_id uuid          not null references public.companies (id) on delete cascade,
  name       varchar(255)  not null,
  barcode    varchar(50),
  category   varchar(255),
  brand      varchar(255),
  reorder_level numeric(18,4) not null default 0,
  unit_price numeric(18,2) not null default 0,
  tax_rate   numeric(5,2)  not null default 0,
  is_active  boolean       not null default true,
  created_at timestamptz   not null default now(),
  updated_at timestamptz   not null default now()
);

-- ============================================================================
-- 7) STOK HAREKETLERI (Giris / Cikis / Uretim)
-- ============================================================================
create table if not exists public.stock_transactions (
  id               uuid                  primary key default gen_random_uuid(),
  product_id       uuid                  not null references public.products (id)   on delete cascade,
  warehouse_id     uuid                  not null references public.warehouses (id) on delete cascade,
  transaction_type public.transaction_type not null default 'Entry',
  quantity         numeric(18,4)         not null default 0,
  transaction_date date                  not null default current_date,
  created_at       timestamptz           not null default now()
);

-- ============================================================================
-- 8) KASA / BANKA HESAPLARI
-- ============================================================================
create table if not exists public.cash_accounts (
  id         uuid          primary key default gen_random_uuid(),
  company_id uuid          not null references public.companies (id) on delete cascade,
  name       varchar(255)  not null default 'Kasa',
  currency   varchar(10)   not null default 'TRY',
  balance    numeric(18,2) not null default 0,
  created_at timestamptz   not null default now(),
  updated_at timestamptz   not null default now()
);

-- ============================================================================
-- 9) BELGELER (Satis Faturasi, Alis Faturasi, Teklif, Irsaliye)
-- ============================================================================
create table if not exists public.documents (
  id           uuid          primary key default gen_random_uuid(),
  company_id   uuid          not null references public.companies (id)     on delete cascade,
  identity_id  uuid          not null references public.identities (id)    on delete restrict,
  doc_type     public.doc_type not null default 'SalesInvoice',
  document_no  varchar(50)   not null,
  issue_date   date          not null default current_date,
  due_date     date,
  total_amount numeric(18,2) not null default 0,
  status       varchar(50)   not null default 'Draft',
  phone        varchar(50),
  tax_office   varchar(255),
  tax_no       varchar(50),
  address      text,
  created_at   timestamptz   not null default now(),
  updated_at   timestamptz   not null default now(),
  constraint documents_unique_num unique (company_id, doc_type, document_no)
);

-- ============================================================================
-- 10) BELGE KALEMLERI
-- ============================================================================
create table if not exists public.document_items (
  id          uuid          primary key default gen_random_uuid(),
  document_id uuid          not null references public.documents (id) on delete cascade,
  product_id  uuid          not null references public.products (id)   on delete restrict,
  quantity    numeric(18,4) not null default 1,
  unit_price  numeric(18,2) not null default 0,
  discount    numeric(18,2) not null default 0,
  tax_rate    numeric(5,2)  not null default 0,
  created_at  timestamptz   not null default now()
);

-- ============================================================================
-- 11) FINANSAL HAREKETLER (Tahsilat, Odeme, Masraf)
-- ============================================================================
create table if not exists public.financial_transactions (
  id               uuid          primary key default gen_random_uuid(),
  company_id       uuid          not null references public.companies (id)       on delete cascade,
  cash_account_id  uuid          not null references public.cash_accounts (id)  on delete restrict,
  identity_id      uuid          references public.identities (id)               on delete set null,
  amount           numeric(18,2) not null default 0,
  transaction_date date          not null default current_date,
  transaction_type varchar(50)   not null default 'Tahsilat',
  description      text,
  created_at       timestamptz   not null default now()
);

-- ============================================================================
-- 12) CEK / SENET (Portfoyde, Ciro Edildi, Tahsil Edildi)
-- ============================================================================
create table if not exists public.cheques_bonds (
  id              uuid          primary key default gen_random_uuid(),
  company_id      uuid          not null references public.companies (id)  on delete cascade,
  identity_id     uuid          references public.identities (id)          on delete set null,
  cash_account_id uuid          references public.cash_accounts (id)       on delete set null,
  type            varchar(20)   not null default 'Cheque',
  serial_no       varchar(100),
  amount          numeric(18,2) not null default 0,
  currency_rate   numeric(18,4) not null default 0,
  deduction       numeric(18,2) not null default 0,
  collection_date date,
  due_date        date,
  payment_date    date,
  payment_method  varchar(50),
  bank_name       varchar(255),
  status          varchar(50)   not null default 'Portfoyde',
  description     text,
  created_at      timestamptz   not null default now(),
  updated_at      timestamptz   not null default now(),
  constraint cheques_bonds_type_check
    check (type in ('Cheque', 'Bond')),
  constraint cheques_bonds_status_check
    check (status in ('Portfoyde', 'Ciro Edildi', 'Tahsil Edildi'))
);

-- ============================================================================
-- 13) GIDERLER / MASRAFLAR
-- ============================================================================
create table if not exists public.expenses (
  id              uuid          primary key default gen_random_uuid(),
  company_id      uuid          not null references public.companies (id)       on delete cascade,
  cash_account_id uuid          references public.cash_accounts (id)            on delete set null,
  category        varchar(100)  not null default 'Genel',
  amount          numeric(18,2) not null default 0,
  tax_rate        numeric(5,2)  not null default 0,
  document_no     varchar(50),
  expense_date    date          not null default current_date,
  payment_date    date,
  payment_status  varchar(50)   not null default 'Odendi',
  is_recurring    boolean       not null default false,
  description     text,
  created_at      timestamptz   not null default now(),
  updated_at      timestamptz   not null default now()
);

-- ============================================================================
-- 14) updated_at TRIGGER FONKSIYONU
-- ============================================================================
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_users_updated_at   on public.users;
drop trigger if exists trg_companies_updated_at on public.companies;
drop trigger if exists trg_identities_updated_at on public.identities;
drop trigger if exists trg_warehouses_updated_at on public.warehouses;
drop trigger if exists trg_products_updated_at  on public.products;
drop trigger if exists trg_cash_accounts_updated_at on public.cash_accounts;
drop trigger if exists trg_documents_updated_at on public.documents;
drop trigger if exists trg_cheques_bonds_updated_at on public.cheques_bonds;
drop trigger if exists trg_expenses_updated_at on public.expenses;

create trigger trg_users_updated_at          before update on public.users          for each row execute function public.set_updated_at();
create trigger trg_companies_updated_at      before update on public.companies      for each row execute function public.set_updated_at();
create trigger trg_identities_updated_at     before update on public.identities     for each row execute function public.set_updated_at();
create trigger trg_warehouses_updated_at     before update on public.warehouses     for each row execute function public.set_updated_at();
create trigger trg_products_updated_at       before update on public.products       for each row execute function public.set_updated_at();
create trigger trg_cash_accounts_updated_at  before update on public.cash_accounts  for each row execute function public.set_updated_at();
create trigger trg_documents_updated_at      before update on public.documents      for each row execute function public.set_updated_at();
create trigger trg_cheques_bonds_updated_at  before update on public.cheques_bonds  for each row execute function public.set_updated_at();
create trigger trg_expenses_updated_at       before update on public.expenses       for each row execute function public.set_updated_at();

-- ============================================================================
-- 15) RLS YARDIMCI FONKSIYONLARI
-- ============================================================================
-- Kullanici belirtilen sirketin aktif uyesi mi?
create or replace function public.is_company_member(p_company_id uuid)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1
    from public.company_users cu
    join public.users u on u.id = cu.user_id
    where cu.company_id = p_company_id
      and cu.user_id = auth.uid()
      and u.is_active = true
  );
$$;

-- Kullanici sirketin admin'i mi?
create or replace function public.is_company_admin(p_company_id uuid)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1
    from public.company_users cu
    join public.users u on u.id = cu.user_id
    where cu.company_id = p_company_id
      and cu.user_id = auth.uid()
      and cu.role = 'admin'
      and u.is_active = true
  );
$$;

-- Global admin (users.role = 'admin') mi?
create or replace function public.is_admin()
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1
    from public.users
    where id = auth.uid() and role = 'admin' and is_active = true
  );
$$;

-- ============================================================================
-- 16) ROW LEVEL SECURITY (RLS)
-- ============================================================================
alter table public.users               enable row level security;
alter table public.companies           enable row level security;
alter table public.company_users       enable row level security;
alter table public.identities          enable row level security;
alter table public.warehouses          enable row level security;
alter table public.products            enable row level security;
alter table public.stock_transactions  enable row level security;
alter table public.cash_accounts       enable row level security;
alter table public.documents           enable row level security;
alter table public.document_items      enable row level security;
alter table public.financial_transactions enable row level security;
alter table public.cheques_bonds       enable row level security;
alter table public.expenses            enable row level security;

-- ---------- public.users ----------
create policy "users_select_own"        on public.users for select to authenticated using (id = auth.uid() or public.is_admin());
create policy "users_insert_own"        on public.users for insert to authenticated with check (id = auth.uid());
create policy "users_update_own"        on public.users for update to authenticated using (id = auth.uid() or public.is_admin()) with check (id = auth.uid() or public.is_admin());
create policy "users_delete_admin"      on public.users for delete to authenticated using (public.is_admin());

-- ---------- public.companies ----------
create policy "companies_select_member" on public.companies for select to authenticated using (public.is_company_member(id));
create policy "companies_insert_auth"   on public.companies for insert to authenticated with check (true);
create policy "companies_update_admin"  on public.companies for update to authenticated using (public.is_company_admin(id) or public.is_admin()) with check (public.is_company_admin(id) or public.is_admin());
create policy "companies_delete_admin"  on public.companies for delete to authenticated using (public.is_company_admin(id) or public.is_admin());

-- ---------- public.company_users ----------
create policy "company_users_select_member" on public.company_users for select to authenticated using (public.is_company_member(company_id));
create policy "company_users_insert_admin"  on public.company_users for insert to authenticated with check (
  public.is_company_admin(company_id) or public.is_admin()
);
create policy "company_users_update_admin"  on public.company_users for update to authenticated using (public.is_company_admin(company_id) or public.is_admin()) with check (public.is_company_admin(company_id) or public.is_admin());
create policy "company_users_delete_admin"  on public.company_users for delete to authenticated using (public.is_company_admin(company_id) or public.is_admin());

-- ---------- public.identities ----------
create policy "identities_select" on public.identities for select to authenticated using (public.is_company_member(company_id));
create policy "identities_insert" on public.identities for insert to authenticated with check (public.is_company_member(company_id));
create policy "identities_update" on public.identities for update to authenticated using (public.is_company_member(company_id)) with check (public.is_company_member(company_id));
create policy "identities_delete" on public.identities for delete to authenticated using (public.is_company_member(company_id));

-- ---------- public.warehouses ----------
create policy "warehouses_select" on public.warehouses for select to authenticated using (public.is_company_member(company_id));
create policy "warehouses_insert" on public.warehouses for insert to authenticated with check (public.is_company_member(company_id));
create policy "warehouses_update" on public.warehouses for update to authenticated using (public.is_company_member(company_id)) with check (public.is_company_member(company_id));
create policy "warehouses_delete" on public.warehouses for delete to authenticated using (public.is_company_member(company_id));

-- ---------- public.products ----------
create policy "products_select" on public.products for select to authenticated using (public.is_company_member(company_id));
create policy "products_insert" on public.products for insert to authenticated with check (public.is_company_member(company_id));
create policy "products_update" on public.products for update to authenticated using (public.is_company_member(company_id)) with check (public.is_company_member(company_id));
create policy "products_delete" on public.products for delete to authenticated using (public.is_company_member(company_id));

-- ---------- public.stock_transactions (sirket, depo uzerinden turetilir) ----------
create policy "stock_select" on public.stock_transactions for select to authenticated using (
  exists (select 1 from public.warehouses w where w.id = warehouse_id and public.is_company_member(w.company_id))
);
create policy "stock_insert" on public.stock_transactions for insert to authenticated with check (
  exists (select 1 from public.warehouses w where w.id = warehouse_id and public.is_company_member(w.company_id))
);
create policy "stock_update" on public.stock_transactions for update to authenticated using (
  exists (select 1 from public.warehouses w where w.id = warehouse_id and public.is_company_member(w.company_id))
) with check (
  exists (select 1 from public.warehouses w where w.id = warehouse_id and public.is_company_member(w.company_id))
);
create policy "stock_delete" on public.stock_transactions for delete to authenticated using (
  exists (select 1 from public.warehouses w where w.id = warehouse_id and public.is_company_member(w.company_id))
);

-- ---------- public.cash_accounts ----------
create policy "cash_accounts_select" on public.cash_accounts for select to authenticated using (public.is_company_member(company_id));
create policy "cash_accounts_insert" on public.cash_accounts for insert to authenticated with check (public.is_company_member(company_id));
create policy "cash_accounts_update" on public.cash_accounts for update to authenticated using (public.is_company_member(company_id)) with check (public.is_company_member(company_id));
create policy "cash_accounts_delete" on public.cash_accounts for delete to authenticated using (public.is_company_member(company_id));

-- ---------- public.documents ----------
create policy "documents_select" on public.documents for select to authenticated using (public.is_company_member(company_id));
create policy "documents_insert" on public.documents for insert to authenticated with check (public.is_company_member(company_id));
create policy "documents_update" on public.documents for update to authenticated using (public.is_company_member(company_id)) with check (public.is_company_member(company_id));
create policy "documents_delete" on public.documents for delete to authenticated using (public.is_company_member(company_id));

-- ---------- public.document_items (sirket, uzerindeki belge uzerinden turetilir) ----------
create policy "document_items_select" on public.document_items for select to authenticated using (
  exists (select 1 from public.documents d where d.id = document_id and public.is_company_member(d.company_id))
);
create policy "document_items_insert" on public.document_items for insert to authenticated with check (
  exists (select 1 from public.documents d where d.id = document_id and public.is_company_member(d.company_id))
);
create policy "document_items_update" on public.document_items for update to authenticated using (
  exists (select 1 from public.documents d where d.id = document_id and public.is_company_member(d.company_id))
) with check (
  exists (select 1 from public.documents d where d.id = document_id and public.is_company_member(d.company_id))
);
create policy "document_items_delete" on public.document_items for delete to authenticated using (
  exists (select 1 from public.documents d where d.id = document_id and public.is_company_member(d.company_id))
);

-- ---------- public.financial_transactions ----------
create policy "financial_select" on public.financial_transactions for select to authenticated using (public.is_company_member(company_id));
create policy "financial_insert" on public.financial_transactions for insert to authenticated with check (public.is_company_member(company_id));
create policy "financial_update" on public.financial_transactions for update to authenticated using (public.is_company_member(company_id)) with check (public.is_company_member(company_id));
create policy "financial_delete" on public.financial_transactions for delete to authenticated using (public.is_company_member(company_id));

-- ---------- public.cheques_bonds ----------
create policy "cheques_bonds_select" on public.cheques_bonds for select to authenticated using (public.is_company_member(company_id));
create policy "cheques_bonds_insert" on public.cheques_bonds for insert to authenticated with check (public.is_company_member(company_id));
create policy "cheques_bonds_update" on public.cheques_bonds for update to authenticated using (public.is_company_member(company_id)) with check (public.is_company_member(company_id));
create policy "cheques_bonds_delete" on public.cheques_bonds for delete to authenticated using (public.is_company_member(company_id));

-- ---------- public.expenses ----------
create policy "expenses_select" on public.expenses for select to authenticated using (public.is_company_member(company_id));
create policy "expenses_insert" on public.expenses for insert to authenticated with check (public.is_company_member(company_id));
create policy "expenses_update" on public.expenses for update to authenticated using (public.is_company_member(company_id)) with check (public.is_company_member(company_id));
create policy "expenses_delete" on public.expenses for delete to authenticated using (public.is_company_member(company_id));

-- ============================================================================
-- 17) PERFORMANS INDEXLERI
-- ============================================================================
create index if not exists idx_company_users_user   on public.company_users (user_id);
create index if not exists idx_identities_company   on public.identities (company_id, identity_type);
create index if not exists idx_identities_name      on public.identities (company_id, lower(name));
create index if not exists idx_warehouses_company   on public.warehouses (company_id);
create index if not exists idx_products_company     on public.products (company_id, is_active);
create index if not exists idx_products_barcode     on public.products (company_id, barcode);
create index if not exists idx_products_name        on public.products (company_id, lower(name));
create index if not exists idx_stock_product        on public.stock_transactions (product_id, transaction_date desc);
create index if not exists idx_stock_warehouse      on public.stock_transactions (warehouse_id);
create index if not exists idx_cash_accounts_company on public.cash_accounts (company_id);
create index if not exists idx_documents_company    on public.documents (company_id, doc_type);
create index if not exists idx_documents_identity   on public.documents (identity_id);
create index if not exists idx_documents_dates      on public.documents (company_id, issue_date desc);
create index if not exists idx_doc_items_document   on public.document_items (document_id);
create index if not exists idx_financial_company    on public.financial_transactions (company_id, transaction_date desc);
create index if not exists idx_financial_cash       on public.financial_transactions (cash_account_id);
create index if not exists idx_cheques_company      on public.cheques_bonds (company_id, status);
create index if not exists idx_cheques_due          on public.cheques_bonds (due_date);
create index if not exists idx_expenses_company     on public.expenses (company_id, expense_date desc);

-- ============================================================================
-- 18) YETKILER (GRANT)
-- ============================================================================
grant usage on schema public to anon, authenticated, service_role;
grant all on all tables    in schema public to authenticated, service_role;
grant all on all sequences in schema public to authenticated, service_role;
grant all on all tables    in schema public to anon;
grant all on all functions in schema public to authenticated, service_role;

-- Supabase'in auth.users yansisi (OLMADAN dahi calisir); varsa user row birebir ozel kullanici olur.
alter table public.users enable replica identity full;

-- ============================================================================
-- 19) DEMIRBASLAR (Assets)
-- ============================================================================
create table if not exists public.assets (
  id            uuid          primary key default gen_random_uuid(),
  company_id    uuid          not null references public.companies (id) on delete cascade,
  name          varchar(255)  not null,
  serial_number varchar(255),
  purchase_date date,
  price         numeric(18,2) not null default 0,
  description   text,
  created_at    timestamptz   not null default now(),
  updated_at    timestamptz   not null default now()
);

-- ============================================================================
-- 20) PROJELER (Projects)
-- ============================================================================
create table if not exists public.projects (
  id          uuid         primary key default gen_random_uuid(),
  company_id  uuid         not null references public.companies (id) on delete cascade,
  name        varchar(255) not null,
  description text,
  created_at  timestamptz  not null default now(),
  updated_at  timestamptz  not null default now()
);

-- ---------- updated_at triggerlari ----------
drop trigger if exists trg_assets_updated_at on public.assets;
drop trigger if exists trg_projects_updated_at on public.projects;
create trigger trg_assets_updated_at before update on public.assets
  for each row execute function public.set_updated_at();
create trigger trg_projects_updated_at before update on public.projects
  for each row execute function public.set_updated_at();

-- ---------- RLS ----------
alter table public.assets   enable row level security;
alter table public.projects enable row level security;

create policy "assets_select" on public.assets for select to authenticated using (public.is_company_member(company_id));
create policy "assets_insert" on public.assets for insert to authenticated with check (public.is_company_member(company_id));
create policy "assets_update" on public.assets for update to authenticated using (public.is_company_member(company_id)) with check (public.is_company_member(company_id));
create policy "assets_delete" on public.assets for delete to authenticated using (public.is_company_member(company_id));

create policy "projects_select" on public.projects for select to authenticated using (public.is_company_member(company_id));
create policy "projects_insert" on public.projects for insert to authenticated with check (public.is_company_member(company_id));
create policy "projects_update" on public.projects for update to authenticated using (public.is_company_member(company_id)) with check (public.is_company_member(company_id));
create policy "projects_delete" on public.projects for delete to authenticated using (public.is_company_member(company_id));

-- ---------- indexler ----------
create index if not exists idx_assets_company   on public.assets (company_id);
create index if not exists idx_projects_company on public.projects (company_id);

-- ---------- yetkiler (diger tablolar sect. 18'deki toplu grant'larla kapsaniyor) ----------
grant all on table public.assets,  public.projects to authenticated, service_role;
grant all on table public.assets,  public.projects to anon;

-- ============================================================================
-- 21) KREDILER (Credits)
-- ============================================================================
create table if not exists public.credits (
  id                      uuid          primary key default gen_random_uuid(),
  company_id              uuid          not null references public.companies (id)   on delete cascade,
  cash_account_id         uuid          references public.cash_accounts (id)        on delete set null,
  name                    varchar(255)  not null,
  remaining_debt          numeric(18,2) not null default 0,
  remaining_installments  integer       not null default 0,
  first_installment_date  date,
  payment_schedule        varchar(50)   not null default 'Her Ay',
  notes                   text,
  created_at              timestamptz   not null default now(),
  updated_at              timestamptz   not null default now(),
  constraint credits_installments_check
    check (remaining_installments between 0 and 144),
  constraint credits_schedule_check
    check (payment_schedule in ('Her Ay', 'İki Ayda Bir', 'Üç Ayda Bir', 'Dört Ayda Bir', 'Altı Ayda Bir', 'Yılda Bir'))
);

drop trigger if exists trg_credits_updated_at on public.credits;
create trigger trg_credits_updated_at before update on public.credits
  for each row execute function public.set_updated_at();

alter table public.credits enable row level security;

create policy "credits_select" on public.credits for select to authenticated using (public.is_company_member(company_id));
create policy "credits_insert" on public.credits for insert to authenticated with check (public.is_company_member(company_id));
create policy "credits_update" on public.credits for update to authenticated using (public.is_company_member(company_id)) with check (public.is_company_member(company_id));
create policy "credits_delete" on public.credits for delete to authenticated using (public.is_company_member(company_id));

create index if not exists idx_credits_company on public.credits (company_id);

grant all on table public.credits to authenticated, service_role;
grant all on table public.credits to anon;

-- ============================================================================
-- 22) CEK/SENET YENI ALANLAR (mevcut veritabanlari icin idempotent ALTER)
-- ============================================================================
alter table public.cheques_bonds add column if not exists cash_account_id uuid references public.cash_accounts (id) on delete set null;
alter table public.cheques_bonds add column if not exists currency_rate numeric(18,4) not null default 0;
alter table public.cheques_bonds add column if not exists deduction numeric(18,2) not null default 0;
alter table public.cheques_bonds add column if not exists collection_date date;
alter table public.cheques_bonds add column if not exists payment_date date;
alter table public.cheques_bonds add column if not exists payment_method varchar(50);
alter table public.cheques_bonds add column if not exists description text;

-- ============================================================================
-- 23) VARYANTLAR (product_variants)
-- ============================================================================
create table if not exists public.product_variants (
  id          uuid          primary key default gen_random_uuid(),
  company_id  uuid          not null references public.companies (id) on delete cascade,
  product_id  uuid          references public.products (id) on delete cascade,
  name        varchar(255)  not null,
  value       varchar(255)  not null,
  created_at  timestamptz   not null default now(),
  updated_at  timestamptz   not null default now()
);

drop trigger if exists trg_product_variants_updated_at on public.product_variants;
create trigger trg_product_variants_updated_at before update on public.product_variants
  for each row execute function public.set_updated_at();

alter table public.product_variants enable row level security;

create policy "product_variants_select" on public.product_variants for select to authenticated using (public.is_company_member(company_id));
create policy "product_variants_insert" on public.product_variants for insert to authenticated with check (public.is_company_member(company_id));
create policy "product_variants_update" on public.product_variants for update to authenticated using (public.is_company_member(company_id)) with check (public.is_company_member(company_id));
create policy "product_variants_delete" on public.product_variants for delete to authenticated using (public.is_company_member(company_id));

create index if not exists idx_product_variants_company on public.product_variants (company_id, name);
create index if not exists idx_product_variants_product on public.product_variants (product_id);

grant all on table public.product_variants to authenticated, service_role;
grant all on table public.product_variants to anon;

-- ============================================================================
-- 24) URETIM FISLERI (productions)
-- ============================================================================
create table if not exists public.productions (
  id              uuid          primary key default gen_random_uuid(),
  company_id      uuid          not null references public.companies (id)          on delete cascade,
  product_id      uuid          not null references public.products (id)           on delete cascade,
  variant_id      uuid          references public.product_variants (id)            on delete set null,
  warehouse_id    uuid          not null references public.warehouses (id)         on delete cascade,
  production_date date          not null default current_date,
  quantity        numeric(18,3) not null default 0,
  brand           varchar(255),
  category        varchar(255),
  description     text,
  created_at      timestamptz   not null default now(),
  updated_at      timestamptz   not null default now()
);

drop trigger if exists trg_productions_updated_at on public.productions;
create trigger trg_productions_updated_at before update on public.productions
  for each row execute function public.set_updated_at();

alter table public.productions enable row level security;

create policy "productions_select" on public.productions for select to authenticated using (public.is_company_member(company_id));
create policy "productions_insert" on public.productions for insert to authenticated with check (public.is_company_member(company_id));
create policy "productions_update" on public.productions for update to authenticated using (public.is_company_member(company_id)) with check (public.is_company_member(company_id));
create policy "productions_delete" on public.productions for delete to authenticated using (public.is_company_member(company_id));

create index if not exists idx_productions_company  on public.productions (company_id, production_date desc);
create index if not exists idx_productions_product  on public.productions (product_id);
create index if not exists idx_productions_warehouse on public.productions (warehouse_id);

grant all on table public.productions to authenticated, service_role;
grant all on table public.productions to anon;

-- ============================================================================
-- 25) BELGE + KALEMLERI TEK TRANSACTION'DA KAYDEDER (atomik RPC)
--     postgrest.rpc -> create_document_with_items({p_document, p_items})
--     1) documents satirini ekler, 2) document_items'i basar (veya hepsi geri alinir).
-- ============================================================================
create or replace function public.create_document_with_items(
  p_document jsonb,
  p_items    jsonb
) returns jsonb
language plpgsql
as $$
declare
  v_doc jsonb;
begin
  insert into public.documents (
    company_id, identity_id, doc_type, document_no, issue_date, due_date, status,
    phone, tax_office, tax_no, address, total_amount
  )
  values (
    (p_document->>'company_id')::uuid,
    (p_document->>'identity_id')::uuid,
    coalesce(p_document->>'doc_type', 'SalesInvoice'),
    p_document->>'document_no',
    coalesce((p_document->>'issue_date')::date, current_date),
    nullif(p_document->>'due_date', '')::date,
    coalesce(p_document->>'status', 'Draft'),
    p_document->>'phone',
    p_document->>'tax_office',
    p_document->>'tax_no',
    p_document->>'address',
    (p_document->>'total_amount')::numeric
  )
  returning to_jsonb(t) into v_doc;

  insert into public.document_items (document_id, product_id, quantity, unit_price, discount, tax_rate)
  select
    (v_doc->>'id')::uuid,
    (item->>'product_id')::uuid,
    coalesce((item->>'quantity')::numeric, 1),
    coalesce((item->>'unit_price')::numeric, 0),
    coalesce((item->>'discount')::numeric, 0),
    coalesce((item->>'tax_rate')::numeric, 0)
  from jsonb_array_elements(p_items) as item;

  return v_doc;
end;
$$;

grant execute on function public.create_document_with_items(jsonb, jsonb) to authenticated, service_role;
grant execute on function public.create_document_with_items(jsonb, jsonb) to anon;

-- ============================================================================
-- 26) FIRMA / SISTEM AYARLARI + STOK KRITIK SEVIYE (idempotent ALTER'lar)
-- ----------------------------------------------------------------------------
-- companies: firma ayar formu (logo, banka bilgileri) ve API key alanlari.
-- products:  "Kritik stok seviyesi" rapor modu icin esik degeri.
-- ============================================================================
alter table public.companies add column if not exists logo_url  text;
alter table public.companies add column if not exists bank_info text;
alter table public.companies add column if not exists api_key   varchar(512);
alter table public.products add column if not exists reorder_level numeric(18,4) not null default 0;

commit;