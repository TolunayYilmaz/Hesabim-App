-- ============================================================================
-- Muhasebe Trigger'lari
-- Finansal hareket (financial_transactions) girisi sonrasi Kasa/Banka ve
-- Cari bakiye otomatik guncellenir.
-- ============================================================================

-- Giris sonrasi: kasa + cari bakiyelerine isle
create or replace function public.apply_financial_transaction()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  sign numeric;
begin
  -- Tahsilat kasaya girer, Odeme/Masraf kasadan cikar
  sign := case when new.transaction_type = 'Tahsilat' then 1 else -1 end;

  update public.cash_accounts
     set balance = balance + (sign * new.amount), updated_at = now()
   where id = new.cash_account_id;

  -- Cari bakiyesi: Tahsilat musteri borcunu azaltir, Odeme borclu bakiyeyi artirir
  if new.identity_id is not null then
    update public.identities
       set balance = balance + case when new.transaction_type = 'Tahsilat' then -new.amount else new.amount end,
           updated_at = now()
     where id = new.identity_id;
  end if;

  return new;
end;
$$;

drop trigger if exists trg_financial_after_insert on public.financial_transactions;
create trigger trg_financial_after_insert
  after insert on public.financial_transactions
  for each row execute function public.apply_financial_transaction();