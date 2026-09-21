-- ============================================================================
-- Stok ozetleri, dashboard ve bakiye yeniden hesaplama RPC'leri
-- T�m fonksiyonlar RLS'i atlayip (security definer) ait olduklari sirket
-- uyesi olma sartini manuel `is_company_member` ile denetler.
-- ============================================================================

-- Depo bazinda urun stok ozeti
create or replace function public.get_stock_summaries(p_company_id uuid)
returns table (
  product_id  uuid,
  product_name varchar,
  barcode     varchar,
  total_in    numeric,
  total_out   numeric,
  stock       numeric
)
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.is_company_member(p_company_id) then
    raise exception 'Erisim reddedildi.';
  end if;

  return query
  select
    p.id,
    p.name::varchar,
    p.barcode,
    coalesce(sum(case when st.transaction_type = 'Entry' then st.quantity end), 0)::numeric as total_in,
    coalesce(sum(case when st.transaction_type = 'Exit'  then st.quantity end), 0)::numeric as total_out,
    (coalesce(sum(case when st.transaction_type = 'Entry' then st.quantity end), 0)
   - coalesce(sum(case when st.transaction_type = 'Exit'  then st.quantity end), 0))::numeric as stock
  from public.products p
  left join public.stock_transactions st on st.product_id = p.id
  where p.company_id = p_company_id
  group by p.id, p.name, p.barcode
  order by p.name;
end;
$$;

-- Genel gorunum (dashboard) ozet verisi
create or replace function public.get_dashboard_summary(p_company_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_cash           numeric;
  v_customer       numeric;
  v_supplier       numeric;
  v_products       int;
  v_pending        int;
  v_pending_amt    numeric;
  v_month_expense  numeric;
  v_month_start    date;
begin
  if not public.is_company_member(p_company_id) then
    raise exception 'Erisim reddedildi.';
  end if;

  select coalesce(sum(balance), 0) into v_cash
    from public.cash_accounts where company_id = p_company_id;

  select coalesce(sum(balance), 0) into v_customer
    from public.identities
   where company_id = p_company_id and identity_type = 'Customer';

  select coalesce(sum(balance), 0) into v_supplier
    from public.identities
   where company_id = p_company_id and identity_type = 'Supplier';

  select count(*) into v_products
    from public.products where company_id = p_company_id and is_active = true;

  select count(*), coalesce(sum(amount), 0) into v_pending, v_pending_amt
    from public.cheques_bonds
   where company_id = p_company_id and status = 'Portfoyde'
     and (due_date is null or due_date >= current_date);

  v_month_start := date_trunc('month', current_date)::date;
  select coalesce(sum(amount), 0) into v_month_expense
    from public.expenses
   where company_id = p_company_id and expense_date >= v_month_start;

  return jsonb_build_object(
    'cash_balance',         coalesce(v_cash, 0),
    'customer_balance',     coalesce(v_customer, 0),
    'supplier_balance',     coalesce(v_supplier, 0),
    'product_count',        coalesce(v_products, 0),
    'pending_cheques',      coalesce(v_pending, 0),
    'pending_cheques_amount', coalesce(v_pending_amt, 0),
    'monthly_expenses',     coalesce(v_month_expense, 0)
  );
end;
$$;

-- Kasa/banka bakiyelerini hareketlerden yeniden hesaplar
create or replace function public.recompute_cash_balances(p_company_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  r record;
begin
  if not public.is_company_member(p_company_id) then
    raise exception 'Erisim reddedildi.';
  end if;

  for r in
    select c.id as cash_id,
           coalesce(sum(case when f.transaction_type = 'Tahsilat' then f.amount else -f.amount end), 0) as bal
      from public.cash_accounts c
      left join public.financial_transactions f
        on f.cash_account_id = c.id and f.company_id = p_company_id
     where c.company_id = p_company_id
     group by c.id
  loop
    update public.cash_accounts
       set balance = r.bal, updated_at = now()
     where id = r.cash_id;
  end loop;
end;
$$;

-- Cari bakiyelerini hareketlerden yeniden hesaplar
create or replace function public.recompute_identity_balances(p_company_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  r record;
begin
  if not public.is_company_member(p_company_id) then
    raise exception 'Erisim reddedildi.';
  end if;

  for r in
    select i.id as identity_id,
           coalesce(sum(case when f.transaction_type = 'Tahsilat' then -f.amount else f.amount end), 0) as bal
      from public.identities i
      left join public.financial_transactions f
        on f.identity_id = i.id and f.company_id = p_company_id
     where i.company_id = p_company_id
     group by i.id
  loop
    update public.identities
       set balance = r.bal, updated_at = now()
     where id = r.identity_id;
  end loop;
end;
$$;

-- ============================================================================
-- Gelismis Raporlar RPC'leri
-- ----------------------------------------------------------------------------
-- p_type sozlesmesi: NULL / '' / 'ALL' = tum hareketler,
--   'DEBIT' = Tahsilat disindaki hareketler (borc),
--   diger degerler = birebir transaction_type eslesmesi (Tahsilat/Odeme/...).
-- ============================================================================

-- Satis/alis raporu: cari bazinda finansal hareket ozeti
create or replace function public.report_sales(
  p_company_id uuid,
  p_start      date,
  p_end        date,
  p_identity   uuid,
  p_type       text
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_rows   jsonb;
  v_totals jsonb;
begin
  if not public.is_company_member(p_company_id) then
    raise exception 'Erisim reddedildi.';
  end if;

  select coalesce(jsonb_agg(t), '[]'::jsonb)
    into v_rows
    from (
      select
        i.id::text as identity_id,
        i.name     as identity_name,
        i.identity_type as identity_type,
        count(*)::int as movement_count,
        coalesce(sum(case when f.transaction_type = 'Tahsilat' then f.amount end), 0)::numeric as credit_total,
        coalesce(sum(case when f.transaction_type <> 'Tahsilat' then f.amount end), 0)::numeric as debit_total,
        (coalesce(sum(case when f.transaction_type = 'Tahsilat' then f.amount end), 0)
       - coalesce(sum(case when f.transaction_type <> 'Tahsilat' then f.amount end), 0))::numeric as net
      from public.identities i
      join public.financial_transactions f on f.identity_id = i.id
      where i.company_id = p_company_id
        and f.company_id = p_company_id
        and (p_start is null or f.transaction_date >= p_start)
        and (p_end   is null or f.transaction_date <= p_end)
        and (p_identity is null or f.identity_id = p_identity)
        and (
          p_type is null or p_type = '' or p_type = 'ALL'
          or (p_type = 'DEBIT' and f.transaction_type <> 'Tahsilat')
          or (p_type <> 'DEBIT' and f.transaction_type = p_type)
        )
      group by i.id, i.name, i.identity_type
      order by i.name
    ) t;

  select jsonb_build_object(
    'credit_total', coalesce(sum(x.credit_total), 0),
    'debit_total',  coalesce(sum(x.debit_total), 0),
    'net',          coalesce(sum(x.credit_total), 0) - coalesce(sum(x.debit_total), 0)
  )
    into v_totals
  from jsonb_to_recordset(v_rows) as x(credit_total numeric, debit_total numeric);

  return jsonb_build_object(
    'rows',   v_rows,
    'totals', v_totals
  );
end;
$$;

-- Cari durum ozeti: vadesi gecen alacak/borc + borclu/alacakli listesi
create or replace function public.report_cari(p_company_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_gec_alacak_sayi int;
  v_gec_alacak_tutar numeric;
  v_gec_borc_sayi   int;
  v_gec_borc_tutar  numeric;
  v_borclular  jsonb;
  v_alacaklilar jsonb;
begin
  if not public.is_company_member(p_company_id) then
    raise exception 'Erisim reddedildi.';
  end if;

  select count(*), coalesce(sum(total_amount), 0)
    into v_gec_alacak_sayi, v_gec_alacak_tutar
    from public.documents
   where company_id = p_company_id
     and doc_type = 'SalesInvoice'
     and status <> 'Cancelled'
     and due_date is not null
     and due_date < current_date;

  select count(*), coalesce(sum(total_amount), 0)
    into v_gec_borc_sayi, v_gec_borc_tutar
    from public.documents
   where company_id = p_company_id
     and doc_type = 'PurchaseInvoice'
     and status <> 'Cancelled'
     and due_date is not null
     and due_date < current_date;

  select coalesce(jsonb_agg(t), '[]'::jsonb)
    into v_borclular
    from (
      select id::text as identity_id, name as identity_name, balance
        from public.identities
       where company_id = p_company_id and balance < 0
       order by balance asc, name
    ) t;

  select coalesce(jsonb_agg(t), '[]'::jsonb)
    into v_alacaklilar
    from (
      select id::text as identity_id, name as identity_name, balance
        from public.identities
       where company_id = p_company_id and balance > 0
       order by balance desc, name
    ) t;

  return jsonb_build_object(
    'overdue_receivable_count',  coalesce(v_gec_alacak_sayi, 0),
    'overdue_receivable_amount', coalesce(v_gec_alacak_tutar, 0),
    'overdue_payable_count',     coalesce(v_gec_borc_sayi, 0),
    'overdue_payable_amount',    coalesce(v_gec_borc_tutar, 0),
    'debtors',   v_borclular,
    'creditors', v_alacaklilar
  );
end;
$$;

-- Kasa/banka raporu: devir bakiyesi dahil hesap bazli donem ozeti
create or replace function public.report_cash(
  p_company_id uuid,
  p_start      date,
  p_end        date,
  p_cash       uuid,
  p_type       text,
  p_devir      boolean
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_accounts jsonb;
  v_types    jsonb;
  v_total_in  numeric;
  v_total_out numeric;
begin
  if not public.is_company_member(p_company_id) then
    raise exception 'Erisim reddedildi.';
  end if;

  select coalesce(jsonb_agg(t order by t.cash_account_name), '[]'::jsonb)
    into v_accounts
    from (
      select
        c.id::text as cash_account_id,
        c.name     as cash_account_name,
        c.currency,
        coalesce(x.opening, 0)::numeric   as opening_balance,
        coalesce(y.period_in, 0)::numeric as period_in,
        coalesce(y.period_out, 0)::numeric as period_out,
        (coalesce(y.period_in, 0) - coalesce(y.period_out, 0))::numeric as net,
        (coalesce(x.opening, 0) + coalesce(y.period_in, 0) - coalesce(y.period_out, 0))::numeric as closing_balance
      from public.cash_accounts c
      left join lateral (
        select sum(case when f.transaction_type = 'Tahsilat' then f.amount else -f.amount end) as opening
          from public.financial_transactions f
         where f.cash_account_id = c.id
           and f.company_id = p_company_id
           and p_devir
           and p_start is not null
           and f.transaction_date < p_start
      ) x on true
      left join lateral (
        select
          sum(case when f.transaction_type = 'Tahsilat' then f.amount end)  as period_in,
          sum(case when f.transaction_type <> 'Tahsilat' then f.amount end) as period_out
          from public.financial_transactions f
         where f.cash_account_id = c.id
           and f.company_id = p_company_id
           and (p_start is null or f.transaction_date >= p_start)
           and (p_end   is null or f.transaction_date <= p_end)
           and (
             p_type is null or p_type = '' or p_type = 'ALL'
             or (p_type = 'DEBIT' and f.transaction_type <> 'Tahsilat')
             or (p_type <> 'DEBIT' and f.transaction_type = p_type)
           )
      ) y on true
      where c.company_id = p_company_id
        and (p_cash is null or c.id = p_cash)
    ) t;

  select coalesce(jsonb_agg(t), '[]'::jsonb)
    into v_types
    from (
      select f.transaction_type as transaction_type,
             count(*)::int as movement_count,
             coalesce(sum(f.amount), 0)::numeric as total
        from public.financial_transactions f
       where f.company_id = p_company_id
         and (p_cash is null or f.cash_account_id = p_cash)
         and (p_start is null or f.transaction_date >= p_start)
         and (p_end   is null or f.transaction_date <= p_end)
         and (
           p_type is null or p_type = '' or p_type = 'ALL'
           or (p_type = 'DEBIT' and f.transaction_type <> 'Tahsilat')
           or (p_type <> 'DEBIT' and f.transaction_type = p_type)
         )
       group by f.transaction_type
       order by f.transaction_type
    ) t;

  select coalesce(sum(period_in), 0), coalesce(sum(period_out), 0)
    into v_total_in, v_total_out
  from jsonb_to_recordset(v_accounts) as x(period_in numeric, period_out numeric);

  return jsonb_build_object(
    'accounts',  v_accounts,
    'type_rows', v_types,
    'total_in',  v_total_in,
    'total_out', v_total_out
  );
end;
$$;

-- Envanter raporu: belirtilen tarihe kadar anlik stok + donem hareketleri
create or replace function public.report_inventory(p_company_id uuid, p_end date)
returns table (
  product_id   uuid,
  product_name varchar,
  barcode      varchar,
  category     varchar,
  brand        varchar,
  reorder_level numeric,
  total_in     numeric,
  total_out    numeric,
  stock        numeric
)
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.is_company_member(p_company_id) then
    raise exception 'Erisim reddedildi.';
  end if;

  return query
  select
    p.id,
    p.name::varchar,
    p.barcode,
    p.category,
    p.brand,
    coalesce(p.reorder_level, 0)::numeric,
    coalesce(sum(case when st.transaction_type = 'Entry' then st.quantity end), 0)::numeric as total_in,
    coalesce(sum(case when st.transaction_type = 'Exit'  then st.quantity end), 0)::numeric as total_out,
    (coalesce(sum(case when st.transaction_type = 'Entry' then st.quantity end), 0)
   - coalesce(sum(case when st.transaction_type = 'Exit'  then st.quantity end), 0))::numeric as stock
  from public.products p
  left join public.stock_transactions st
    on st.product_id = p.id
   and (p_end is null or st.transaction_date <= p_end)
  where p.company_id = p_company_id
  group by p.id, p.name, p.barcode, p.category, p.brand, p.reorder_level
  order by p.name;
end;
$$;

grant execute on function public.report_sales(uuid, date, date, uuid, text)
  to authenticated, service_role, anon;
grant execute on function public.report_cari(uuid)
  to authenticated, service_role, anon;
grant execute on function public.report_cash(uuid, date, date, uuid, text, boolean)
  to authenticated, service_role, anon;
grant execute on function public.report_inventory(uuid, date)
  to authenticated, service_role, anon;