-- Atomic purchase function: verifies balance, deducts coins, creates unlock in one transaction
CREATE OR REPLACE FUNCTION purchase_content_atomic(
  p_email TEXT,
  p_content_id UUID,
  p_cost INTEGER,
  p_title TEXT,
  p_slug TEXT
) RETURNS JSONB AS $$
DECLARE
  v_balance INTEGER;
  v_already_unlocked BOOLEAN;
BEGIN
  -- Check if already unlocked
  SELECT EXISTS(
    SELECT 1 FROM content_unlocks
    WHERE lead_email = p_email AND content_id = p_content_id
  ) INTO v_already_unlocked;

  IF v_already_unlocked THEN
    RETURN jsonb_build_object('ok', true, 'already_unlocked', true);
  END IF;

  -- Calculate current balance (from transactions, not cached total_coins)
  SELECT COALESCE(SUM(amount), 0) INTO v_balance
  FROM coin_transactions
  WHERE lead_email = p_email;

  -- Check sufficient balance
  IF v_balance < p_cost THEN
    RETURN jsonb_build_object('ok', false, 'error', 'insufficient_coins', 'balance', v_balance);
  END IF;

  -- Deduct coins
  INSERT INTO coin_transactions (lead_email, content_id, amount, type, description)
  VALUES (p_email, p_content_id, -p_cost, 'spent', 'Compra: ' || p_title);

  -- Create unlock record
  INSERT INTO content_unlocks (lead_email, content_id, method)
  VALUES (p_email, p_content_id, 'coins')
  ON CONFLICT (lead_email, content_id) DO NOTHING;

  -- Log activity
  INSERT INTO lead_activity_log (lead_email, action, content_id, metadata)
  VALUES (p_email, 'purchased_content', p_content_id, jsonb_build_object('cost', p_cost, 'slug', p_slug));

  RETURN jsonb_build_object('ok', true, 'already_unlocked', false);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
