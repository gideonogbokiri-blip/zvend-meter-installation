-- ============================================
-- 004: Meter codes + secretary daily records
-- Run this in Supabase SQL Editor
-- ============================================

-- IT records both a clear code and a tamper code
-- (IT may fill one and leave the other blank)
ALTER TABLE meter_installations
  ADD COLUMN IF NOT EXISTS clear_code TEXT,
  ADD COLUMN IF NOT EXISTS tamper_code TEXT,
  ADD COLUMN IF NOT EXISTS completed_at TIMESTAMPTZ;

-- ============================================
-- DAILY RECORDS TABLE
-- The Secretary saves a snapshot of the meters
-- installed each day for future reference
-- ============================================

CREATE TABLE IF NOT EXISTS daily_records (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  record_date DATE NOT NULL UNIQUE,
  meters JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE daily_records ENABLE ROW LEVEL SECURITY;

-- Any authenticated user can read daily records
CREATE POLICY "Authenticated users can read daily records"
  ON daily_records FOR SELECT
  TO authenticated
  USING (true);

-- Secretary can insert daily records
CREATE POLICY "Secretary can insert daily records"
  ON daily_records FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'Secretary'
    )
  );

-- Secretary can update daily records
CREATE POLICY "Secretary can update daily records"
  ON daily_records FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'Secretary'
    )
  );

CREATE TRIGGER trigger_daily_records_updated_at
  BEFORE UPDATE ON daily_records
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();