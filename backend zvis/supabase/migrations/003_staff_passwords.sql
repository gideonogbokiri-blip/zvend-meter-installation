-- Replace the original placeholder hashes before enabling bcrypt login.
-- Password for these four accounts: Field#2026A
UPDATE users
SET password_hash = '$2b$12$pN.GSaA/Tb605/WbddisaeYBzhW183tj6Da0OA34ZkCDT8rQ0qysG'
WHERE email IN ('secretary@zvend.com', 'gm@zvend.com', 'md@zvend.com', 'it@zvend.com');

-- Field technician accounts
INSERT INTO users (id, full_name, email, phone, role, password_hash) VALUES
  ('a0000000-0000-0000-0000-000000000006', 'Yaw Mensah', 'fieldtech2@zvend.com', '0240000006', 'FieldTechnician', '$2b$12$fRt3U0xQ.ewu9YtyRpj/dudEnhXKnnmbXe.HrkWfv6Kvv3ZfTk6na'),
  ('a0000000-0000-0000-0000-000000000007', 'Adwoa Owusu', 'fieldtech3@zvend.com', '0240000007', 'FieldTechnician', '$2b$12$3O5tsHgLxtktFCMPYp5GkuFrqDmToJEsu5f0UxM/Ki.zDOhkrVwG6')
ON CONFLICT (id) DO UPDATE SET password_hash = EXCLUDED.password_hash;