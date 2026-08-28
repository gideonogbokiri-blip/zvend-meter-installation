-- ============================================
-- 005: Inventory-driven workflow
-- Run this in Supabase SQL Editor
-- ============================================

-- New statuses: Inventory (added by Secretary),
-- Approved (GM approved, available for field men),
-- Assigned (claimed by a field technician)
ALTER TYPE meter_status ADD VALUE IF NOT EXISTS 'Inventory';
ALTER TYPE meter_status ADD VALUE IF NOT EXISTS 'Approved';
ALTER TYPE meter_status ADD VALUE IF NOT EXISTS 'Assigned';

-- Inventory meters may not have a facility yet;
-- the field technician selects it during installation
ALTER TABLE meter_installations
  ALTER COLUMN facility_id DROP NOT NULL;

-- The Secretary now inserts inventory meters too
DROP POLICY IF EXISTS "FieldTechnician can insert meters" ON meter_installations;
CREATE POLICY "Secretary and FieldTechnician can insert meters"
  ON meter_installations FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role IN ('Secretary', 'FieldTechnician')
    )
  );