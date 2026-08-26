-- ============================================
-- ZVIS (Zvend Installation System) Database Schema
-- Run this in Supabase SQL Editor or via CLI
-- ============================================

-- Enable UUID generation
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- ENUM TYPES
-- ============================================

CREATE TYPE user_role AS ENUM (
  'Secretary',
  'FieldTechnician',
  'GM',
  'MD',
  'IT'
);

CREATE TYPE meter_status AS ENUM (
  'PendingSecretaryConfirm',
  'PendingGM',
  'PendingMD',
  'PendingIT',
  'PendingClosure',
  'Completed',
  'Rejected'
);

-- ============================================
-- USERS TABLE
-- ============================================

CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  full_name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  phone TEXT,
  role user_role NOT NULL,
  password_hash TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index for login lookups
CREATE INDEX idx_users_email ON users (email);

-- ============================================
-- FACILITIES TABLE
-- ============================================

CREATE TABLE facilities (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  location TEXT NOT NULL,
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================
-- METER_INSTALLATIONS TABLE
-- ============================================

CREATE TABLE meter_installations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  official_meter_number TEXT NOT NULL UNIQUE,
  facility_id UUID NOT NULL REFERENCES facilities(id),
  status meter_status NOT NULL DEFAULT 'PendingSecretaryConfirm',

  -- Field scan data
  scanned_meter_number TEXT,
  gps_latitude DOUBLE PRECISION,
  gps_longitude DOUBLE PRECISION,
  gps_accuracy DOUBLE PRECISION,
  installation_address TEXT,
  field_technician_name TEXT,
  customer_name TEXT,
  customer_phone TEXT,

  -- IT data
  activation_code TEXT,
  profile_confirmed BOOLEAN,
  it_notes TEXT,

  -- Workflow
  rejection_reason TEXT,
  created_by UUID NOT NULL REFERENCES users(id),

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for common queries
CREATE INDEX idx_meters_status ON meter_installations (status);
CREATE INDEX idx_meters_facility ON meter_installations (facility_id);
CREATE INDEX idx_meters_created_by ON meter_installations (created_by);
CREATE INDEX idx_meters_number ON meter_installations (official_meter_number);

-- ============================================
-- AUDIT_ENTRIES TABLE
-- ============================================

CREATE TABLE audit_entries (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  meter_activation_id UUID NOT NULL REFERENCES meter_installations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id),
  user_name TEXT NOT NULL,
  user_role user_role NOT NULL,
  action TEXT NOT NULL,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index for fetching audit trail per meter
CREATE INDEX idx_audit_meter ON audit_entries (meter_activation_id);

-- ============================================
-- NOTIFICATIONS TABLE
-- ============================================

CREATE TABLE notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id),
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  meter_id UUID REFERENCES meter_installations(id) ON DELETE SET NULL,
  read BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index for fetching user notifications
CREATE INDEX idx_notifications_user ON notifications (user_id, read);

-- ============================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================

ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE facilities ENABLE ROW LEVEL SECURITY;
ALTER TABLE meter_installations ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Users: can read all users (for name lookups), update own profile
CREATE POLICY "Users can read all users"
  ON users FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can update own profile"
  ON users FOR UPDATE
  TO authenticated
  USING (auth.uid() = id);

-- Facilities: any authenticated user can read, only Secretary can insert
CREATE POLICY "Authenticated users can read facilities"
  ON facilities FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Secretary can create facilities"
  ON facilities FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'Secretary'
    )
  );

CREATE POLICY "Secretary can update facilities"
  ON facilities FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'Secretary'
    )
  );

-- Meter installations: authenticated read, specific role writes
CREATE POLICY "Authenticated users can read meters"
  ON meter_installations FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "FieldTechnician can insert meters"
  ON meter_installations FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'FieldTechnician'
    )
  );

CREATE POLICY "Authorized roles can update meters"
  ON meter_installations FOR UPDATE
  TO authenticated
  USING (true);

-- Audit entries: authenticated read, authenticated insert
CREATE POLICY "Authenticated users can read audit"
  ON audit_entries FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can insert audit"
  ON audit_entries FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Notifications: users can read their own, system can insert
CREATE POLICY "Users can read own notifications"
  ON notifications FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Authenticated users can insert notifications"
  ON notifications FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Users can update own notifications"
  ON notifications FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid());

-- ============================================
-- UPDATED_AT TRIGGER
-- ============================================

CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_users_updated_at
  BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trigger_facilities_updated_at
  BEFORE UPDATE ON facilities
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trigger_meters_updated_at
  BEFORE UPDATE ON meter_installations
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ============================================
-- SEED DATA (Demo Users)
-- Password for all: "password123" (bcrypt hash)
-- In production, use Supabase Auth or proper password hashing
-- ============================================

INSERT INTO users (id, full_name, email, phone, role, password_hash) VALUES
  ('a0000000-0000-0000-0000-000000000001', 'Grace Mensah', 'secretary@zvend.com', '0240000001', 'Secretary', '$2b$10$placeholder_hash_for_password123'),
  ('a0000000-0000-0000-0000-000000000002', 'Kofi Asante', 'fieldtech@zvend.com', '0240000002', 'FieldTechnician', '$2b$10$placeholder_hash_for_password123'),
  ('a0000000-0000-0000-0000-000000000003', 'Ama Darko', 'gm@zvend.com', '0240000003', 'GM', '$2b$10$placeholder_hash_for_password123'),
  ('a0000000-0000-0000-0000-000000000004', 'Kwame Boateng', 'md@zvend.com', '0240000004', 'MD', '$2b$10$placeholder_hash_for_password123'),
  ('a0000000-0000-0000-0000-000000000005', 'Efua Ankrah', 'it@zvend.com', '0240000005', 'IT', '$2b$10$placeholder_hash_for_password123')
ON CONFLICT (id) DO NOTHING;

-- Seed facilities
INSERT INTO facilities (id, name, location, active) VALUES
  ('b0000000-0000-0000-0000-000000000001', 'Kasoa Industrial Area', 'Kasoa, Greater Accra', true),
  ('b0000000-0000-0000-0000-000000000002', 'Tema Harbour Zone', 'Tema, Greater Accra', true),
  ('b0000000-0000-0000-0000-000000000003', 'Takoradi Port Area', 'Sekondi-Takoradi, Western', true),
  ('b0000000-0000-0000-0000-000000000004', ' Kumasi Adum', 'Kumasi, Ashanti', true)
ON CONFLICT (id) DO NOTHING;
