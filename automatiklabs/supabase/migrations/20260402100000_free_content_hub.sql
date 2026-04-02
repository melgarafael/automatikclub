-- ============================================================
-- Free Content Hub: Lead Capture + Coin Economy
-- Migration: 20260402_free_content_hub.sql
-- ============================================================

-- 1. LEADS
-- Captures non-student visitors from Instagram
CREATE TABLE IF NOT EXISTS leads (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  whatsapp TEXT NOT NULL,
  is_student BOOLEAN DEFAULT false,
  total_coins INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_leads_email ON leads(email);

-- 2. FREE_CONTENTS
-- Stores free content metadata and body (JSONB)
CREATE TABLE IF NOT EXISTS free_contents (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  slug TEXT UNIQUE NOT NULL,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  unlock_key TEXT NOT NULL,
  coin_reward INTEGER NOT NULL DEFAULT 5,
  coin_cost INTEGER NOT NULL DEFAULT 10,
  content_data JSONB NOT NULL DEFAULT '{}',
  published_at TIMESTAMPTZ DEFAULT now(),
  status TEXT NOT NULL DEFAULT 'published' CHECK (status IN ('draft', 'published', 'archived')),
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_free_contents_slug ON free_contents(slug);
CREATE INDEX IF NOT EXISTS idx_free_contents_status ON free_contents(status);

-- 3. CONTENT_UNLOCKS
-- Tracks which content each lead has unlocked
CREATE TABLE IF NOT EXISTS content_unlocks (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  lead_email TEXT NOT NULL,
  content_id UUID NOT NULL REFERENCES free_contents(id) ON DELETE CASCADE,
  method TEXT NOT NULL CHECK (method IN ('key', 'coins', 'student')),
  unlocked_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  CONSTRAINT unique_unlock UNIQUE (lead_email, content_id)
);

CREATE INDEX IF NOT EXISTS idx_content_unlocks_email ON content_unlocks(lead_email);

-- 4. COIN_TRANSACTIONS
-- Append-only ledger for coin economy
CREATE TABLE IF NOT EXISTS coin_transactions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  lead_email TEXT NOT NULL,
  content_id UUID REFERENCES free_contents(id) ON DELETE SET NULL,
  amount INTEGER NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('earned', 'spent')),
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_coin_transactions_email ON coin_transactions(lead_email);
CREATE INDEX IF NOT EXISTS idx_coin_transactions_created ON coin_transactions(created_at);

-- 5. LEAD_ACTIVITY_LOG
-- Audit trail of all lead actions
CREATE TABLE IF NOT EXISTS lead_activity_log (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  lead_email TEXT NOT NULL,
  action TEXT NOT NULL,
  content_id UUID REFERENCES free_contents(id) ON DELETE SET NULL,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_lead_activity_email ON lead_activity_log(lead_email);
CREATE INDEX IF NOT EXISTS idx_lead_activity_action ON lead_activity_log(action);
CREATE INDEX IF NOT EXISTS idx_lead_activity_created ON lead_activity_log(created_at);

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================

ALTER TABLE leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE free_contents ENABLE ROW LEVEL SECURITY;
ALTER TABLE content_unlocks ENABLE ROW LEVEL SECURITY;
ALTER TABLE coin_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE lead_activity_log ENABLE ROW LEVEL SECURITY;

-- free_contents: allow public read for published content
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'public_read_published' AND tablename = 'free_contents') THEN
    CREATE POLICY "public_read_published" ON free_contents FOR SELECT USING (status = 'published');
  END IF;
END $$;

-- All other tables: service_role only (API routes use createAdminClient())
-- No public policies needed

-- ============================================================
-- TRIGGER: Auto-update total_coins on leads
-- ============================================================

CREATE OR REPLACE FUNCTION update_lead_total_coins()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE leads
  SET total_coins = (
    SELECT COALESCE(SUM(amount), 0)
    FROM coin_transactions
    WHERE lead_email = NEW.lead_email
  ),
  updated_at = now()
  WHERE email = NEW.lead_email;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_update_lead_coins ON coin_transactions;
CREATE TRIGGER trg_update_lead_coins
  AFTER INSERT ON coin_transactions
  FOR EACH ROW
  EXECUTE FUNCTION update_lead_total_coins();

-- ============================================================
-- SEED DATA: Post 1
-- ============================================================

INSERT INTO free_contents (slug, title, description, unlock_key, coin_reward, coin_cost, content_data, published_at)
SELECT
  'post1',
  '3 Ferramentas Poderosas para Claude Code',
  'As 3 ferramentas que somadas ao Claude Code fazem um estrago: Claude-Mem, The Maestri e Obsidian. Aprenda a usar cada uma delas.',
  'tools3cc',
  5,
  10,
  '{
    "type": "tool-showcase",
    "intro": "Boaa! Vamos as 3 ferramentas poderosas que mencionei, que somadas ao Claude Code fazem um estrago!",
    "items": [
      {
        "title": "Claude-Mem",
        "emoji": "🧠",
        "description": "Gerencia memorias e contextos do Claude Code, traz economia de tempo e $$$, pois os contextos entre diferentes terminais e sessoes sao mantidos com maestria.",
        "link": "https://claude-mem.ai/",
        "linkLabel": "Acessar Claude-Mem",
        "tip": "So instalar o plugin no seu Claude Code como manda no proprio site deles, ele vai funcionar agora em todas suas sessoes."
      },
      {
        "title": "The Maestri",
        "emoji": "🎼",
        "description": "Um canvas de terminais, com sticky notes e workflows (tipo n8n), porem com varios Claude Codes, Codex, etc. Imagina o poder disso!",
        "link": "https://themaestri.app",
        "linkLabel": "Baixar The Maestri",
        "tip": "So baixar no seu desktop! Use os terminais dentro deles. No site deles tem os tutoriais de uso, e e bem simples!"
      },
      {
        "title": "Obsidian",
        "emoji": "💎",
        "description": "Um segundo cerebro com conteudos que linkam uns aos outros. Excelente para criar suas anotacoes la, escrever sobre seus projetos, ideias, modo de operar. As IAs do Claude Code podem aprender com isso e usar seu segundo cerebro para programar e trabalhar para voce.",
        "link": "https://obsidian.md/",
        "linkLabel": "Acessar Obsidian",
        "tip": "Crie seus vaults, organize por projetos e conecte ao Claude Code via MCP."
      }
    ]
  }'::jsonb,
  now()
WHERE NOT EXISTS (SELECT 1 FROM free_contents WHERE slug = 'post1');
