-- ============================================================
-- Restore Free Content Hub columns on `leads`
-- ============================================================
-- Context: another agent replaced the `leads` table schema with an
-- unrelated CRM/"analises" funnel (analise_id, nome, empresa,
-- estagio_funil, ...), dropping the columns and triggers the Free
-- Content Hub depends on. This broke lead registration with
-- "could not find the 'name' column of 'leads' in the schema cache"
-- and silently broke the coin trigger (UPDATE leads SET total_coins).
--
-- This migration is ADDITIVE: it restores what the Hub needs without
-- removing the 'analises' funnel columns, so both coexist on one table.
-- ============================================================

-- Columns the Free Content Hub reads/writes (lead-service.ts, content-service.ts)
ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS name TEXT;
ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS is_student BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS total_coins INTEGER NOT NULL DEFAULT 0;

-- Unique email — registerLead() relies on the 23505 conflict path and
-- checkEmail()/getLeadByEmail() use .single(). Column is nullable, so
-- Postgres still permits multiple NULLs (does not constrain 'analises').
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conrelid = 'public.leads'::regclass
      AND contype = 'u'
      AND conname = 'leads_email_unique'
  ) THEN
    ALTER TABLE public.leads ADD CONSTRAINT leads_email_unique UNIQUE (email);
  END IF;
END $$;

-- Restore email normalization (lowercase + trim) the Hub assumes on lookups
CREATE OR REPLACE FUNCTION public.normalize_lead_email()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.email IS NOT NULL THEN
    NEW.email := LOWER(TRIM(NEW.email));
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_normalize_lead_email ON public.leads;
CREATE TRIGGER trg_normalize_lead_email
  BEFORE INSERT OR UPDATE ON public.leads
  FOR EACH ROW EXECUTE FUNCTION public.normalize_lead_email();
