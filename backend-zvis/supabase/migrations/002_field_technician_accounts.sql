-- Field technician accounts
-- Share these credentials through a secure channel and rotate them after first use.
INSERT INTO users (id, full_name, email, phone, role, password_hash) VALUES
  ('a0000000-0000-0000-0000-000000000002', 'Kofi Asante', 'fieldtech@zvend.com', '0240000002', 'FieldTechnician', '$2b$12$pN.GSaA/Tb605/WbddisaeYBzhW183tj6Da0OA34ZkCDT8rQ0qysG'),
  ('a0000000-0000-0000-0000-000000000006', 'Yaw Mensah', 'fieldtech2@zvend.com', '0240000006', 'FieldTechnician', '$2b$12$fRt3U0xQ.ewu9YtyRpj/dudEnhXKnnmbXe.HrkWfv6Kvv3ZfTk6na'),
  ('a0000000-0000-0000-0000-000000000007', 'Adwoa Owusu', 'fieldtech3@zvend.com', '0240000007', 'FieldTechnician', '$2b$12$3O5tsHgLxtktFCMPYp5GkuFrqDmToJEsu5f0UxM/Ki.zDOhkrVwG6')
ON CONFLICT (id) DO UPDATE SET
  full_name = EXCLUDED.full_name,
  email = EXCLUDED.email,
  phone = EXCLUDED.phone,
  role = EXCLUDED.role,
  password_hash = EXCLUDED.password_hash;