-- Add "elvis" field technician account
-- Password: 12345678 (bcrypt hash)
-- Note: the users table has no location column, so "Asaba" is recorded here as a comment.
-- If a region/location column is added to users later, set it to 'Asaba'.
INSERT INTO users (id, full_name, email, phone, role, password_hash) VALUES
  ('9d7304b4-2110-4a92-b702-4d2f3c05ed2b', 'elvis', 'elivis@zvend.com', NULL, 'FieldTechnician', '$2b$12$F/EMXHHPo0FXnNDrPpbrluQToC3pQBNyi6lh0FFY61hwpV0M12hh2')
ON CONFLICT (id) DO UPDATE SET
  full_name = EXCLUDED.full_name,
  email = EXCLUDED.email,
  phone = EXCLUDED.phone,
  role = EXCLUDED.role,
  password_hash = EXCLUDED.password_hash;
