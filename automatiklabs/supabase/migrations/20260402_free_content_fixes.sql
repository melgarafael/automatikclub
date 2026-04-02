-- ============================================================
-- Free Content Hub: Critical Fixes
-- Migration: 20260402_free_content_fixes.sql
--
-- FIX D1: Trigger handles INSERT, UPDATE, DELETE on coin_transactions
-- FIX D2: Balance check prevents negative coins at DB level
-- FIX D3: Email normalization on all lead-facing tables
-- ============================================================

-- ============================================================
-- FIX D1: Coin trigger for INSERT, UPDATE, and DELETE
-- ============================================================

DROP TRIGGER IF EXISTS trg_update_lead_coins ON coin_transactions;

CREATE OR REPLACE FUNCTION update_lead_total_coins()
RETURNS TRIGGER AS $$
DECLARE
  v_email TEXT;
BEGIN
  -- Determine the email to update
  IF TG_OP = 'DELETE' THEN
    v_email := OLD.lead_email;
  ELSE
    v_email := NEW.lead_email;
  END IF;

  -- Recalculate total_coins
  UPDATE leads
  SET total_coins = (
    SELECT COALESCE(SUM(amount), 0)
    FROM coin_transactions
    WHERE lead_email = v_email
  ),
  updated_at = now()
  WHERE email = v_email;

  -- Handle UPDATE where email changed
  IF TG_OP = 'UPDATE' AND OLD.lead_email <> NEW.lead_email THEN
    UPDATE leads
    SET total_coins = (
      SELECT COALESCE(SUM(amount), 0)
      FROM coin_transactions
      WHERE lead_email = OLD.lead_email
    ),
    updated_at = now()
    WHERE email = OLD.lead_email;
  END IF;

  IF TG_OP = 'DELETE' THEN
    RETURN OLD;
  ELSE
    RETURN NEW;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trg_update_lead_coins
  AFTER INSERT OR UPDATE OR DELETE ON coin_transactions
  FOR EACH ROW
  EXECUTE FUNCTION update_lead_total_coins();

-- ============================================================
-- FIX D2: Prevent negative balance via BEFORE INSERT trigger
-- ============================================================

CREATE OR REPLACE FUNCTION check_coin_balance()
RETURNS TRIGGER AS $$
DECLARE
  v_balance INTEGER;
BEGIN
  -- Only check on 'spent' type transactions (negative amounts)
  IF NEW.type = 'spent' AND NEW.amount < 0 THEN
    SELECT COALESCE(SUM(amount), 0) INTO v_balance
    FROM coin_transactions
    WHERE lead_email = NEW.lead_email;

    -- v_balance is BEFORE this insert, so check if balance + new amount >= 0
    IF (v_balance + NEW.amount) < 0 THEN
      RAISE EXCEPTION 'Insufficient coin balance. Current: %, Attempted spend: %', v_balance, ABS(NEW.amount);
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trg_check_coin_balance
  BEFORE INSERT ON coin_transactions
  FOR EACH ROW
  EXECUTE FUNCTION check_coin_balance();

-- ============================================================
-- FIX D3: Email normalization on all lead-facing tables
-- ============================================================

-- Normalize email on leads table
CREATE OR REPLACE FUNCTION normalize_lead_email()
RETURNS TRIGGER AS $$
BEGIN
  NEW.email := LOWER(TRIM(NEW.email));
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_normalize_lead_email
  BEFORE INSERT OR UPDATE ON leads
  FOR EACH ROW
  EXECUTE FUNCTION normalize_lead_email();

-- Normalize lead_email on all other tables
CREATE OR REPLACE FUNCTION normalize_transaction_email()
RETURNS TRIGGER AS $$
BEGIN
  NEW.lead_email := LOWER(TRIM(NEW.lead_email));
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_normalize_transaction_email
  BEFORE INSERT OR UPDATE ON coin_transactions
  FOR EACH ROW
  EXECUTE FUNCTION normalize_transaction_email();

CREATE TRIGGER trg_normalize_unlock_email
  BEFORE INSERT OR UPDATE ON content_unlocks
  FOR EACH ROW
  EXECUTE FUNCTION normalize_transaction_email();

CREATE TRIGGER trg_normalize_activity_email
  BEFORE INSERT OR UPDATE ON lead_activity_log
  FOR EACH ROW
  EXECUTE FUNCTION normalize_transaction_email();
