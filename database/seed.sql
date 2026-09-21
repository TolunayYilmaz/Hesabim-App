-- ============================================================================
-- Hesabım ERP - Seed (Ornek Veri) Scripti
-- ----------------------------------------------------------------------------
-- Calistirma : Supabase Studio > SQL Editor > yeni sorgu > bu dosyanin
--              tamamini yapistirip "Run" deyin. (Runtime: 1 sn)
--
-- NOTLAR:
--  * Idempotent'tir: birden fazla calistirilabilir, mavi/cift kayit OLUŞMAZ.
--  * users.id, auth.users'ten alinir (rastgele degil!). Bu kullanici uygulamaya
--    giris yapan hesap oldugu icin UUID birebir eslesmek zorundadir.
--    (public.users.id -> auth.users(id) foreign key'i vardir.)
--  * Diger tablolarda id kolonlari `default gen_random_uuid()` ile otomatik
--    uretilir; elle UUID girilmez, CTE ile birbirine baglanir.
-- ============================================================================

begin;

-- ----------------------------------------------------------------------------
-- 1) KULLANICI (auth.users ile eslesen satir, email unique)
-- ----------------------------------------------------------------------------
insert into public.users (id, email, full_name, role, is_active)
select u.id, u.email, 'Tolunay Yılmaz', 'admin', true
from auth.users u
where u.email = 'tolunay894@gmail.com'
on conflict (email) do update
set full_name = excluded.full_name,
    role      = 'admin',
    is_active = true;

-- ----------------------------------------------------------------------------
-- 2) SIRKET (daha once yoksa eklenir)
-- ----------------------------------------------------------------------------
insert into public.companies (title, tax_office, tax_number, phone, email)
select 'Hesabım Teknoloji A.Ş.',
       'Kadıköy Vergi Dairesi',
       '1234567890',
       '02165554433',
       'info@hesabim.example'
where not exists (
  select 1 from public.companies c where c.title = 'Hesabım Teknoloji A.Ş.'
);

-- ----------------------------------------------------------------------------
-- 3) SIRKET-KULLANICI BAGLANTISI (admin) — RLS ve "Firma Seç" listesi icin
-- ----------------------------------------------------------------------------
with
  company as (select id from public.companies where title = 'Hesabım Teknoloji A.Ş.'),
  app_user as (select id from public.users where email = 'tolunay894@gmail.com')
insert into public.company_users (company_id, user_id, role)
select c.id, u.id, 'admin'
from company c, app_user u
where not exists (
  select 1 from public.company_users cu
  where cu.company_id = c.id and cu.user_id = u.id
);

-- ----------------------------------------------------------------------------
-- 4) DEPOLAR (2 adet)
-- ----------------------------------------------------------------------------
with company as (select id from public.companies where title = 'Hesabım Teknoloji A.Ş.')
insert into public.warehouses (company_id, name, is_active)
select c.id, w.name, true
from company c
cross join (values ('Merkez Depo'), ('Şube Depo')) as w(name)
where not exists (
  select 1 from public.warehouses x
  where x.company_id = c.id and x.name = w.name
);

-- ----------------------------------------------------------------------------
-- 5) KASA / BANKA HESAPLARI (3 adet)
-- ----------------------------------------------------------------------------
with company as (select id from public.companies where title = 'Hesabım Teknoloji A.Ş.')
insert into public.cash_accounts (company_id, name, currency, balance)
select c.id, a.name, a.currency, 0
from company c
cross join (values
  ('Merkez TL Kasa',    'TRY'),
  ('Garanti Bankası TL', 'TRY'),
  ('Ziraat Bankası USD', 'USD')
) as a(name, currency)
where not exists (
  select 1 from public.cash_accounts x
  where x.company_id = c.id and x.name = a.name
);

-- ----------------------------------------------------------------------------
-- 6) CARILER (1 Musteri + 1 Tedarikci)
-- ----------------------------------------------------------------------------
with company as (select id from public.companies where title = 'Hesabım Teknoloji A.Ş.')
insert into public.identities (company_id, identity_type, name, currency, balance, due_days, discount_rate)
select c.id, t.itype::public.identity_type, t.name, t.currency, 0, 0, 0
from company c
cross join (values
  ('Customer', 'Ahmet Yılmaz Limited', 'TRY'),
  ('Supplier', 'Agrovork Tarım A.Ş.',  'TRY')
) as t(itype, name, currency)
where not exists (
  select 1 from public.identities x
  where x.company_id = c.id and x.name = t.name
);

-- ----------------------------------------------------------------------------
-- 7) URUNLER (3 adet)
-- ----------------------------------------------------------------------------
with company as (select id from public.companies where title = 'Hesabım Teknoloji A.Ş.')
insert into public.products (company_id, name, barcode, category, unit_price, tax_rate, reorder_level, is_active)
select c.id, p.name, p.barcode, p.category, p.price::numeric, 0, 0, true
from company c
cross join (values
  ('TECNOFERT GENESİS 10-38-17', '869001', 'Gübre',     450.00),
  ('ADİLON MİKRO KOMBİ',          '869002', 'Zirai İlaç', 250.00),
  ('MAGNEZYUM SÜLFAT',            '869003', 'Gübre',     120.00)
) as p(name, barcode, category, price)
where not exists (
  select 1 from public.products x
  where x.company_id = c.id and x.barcode = p.barcode
);

commit;