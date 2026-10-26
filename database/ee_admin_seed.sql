-- =========================================================================
-- ENROLLEASE SYSTEM DATABASE: ADMINISTRATOR ACCOUNTS & AUTHENTICATION SEED
-- RUN IN THE 'enrollease' SUPABASE SQL EDITOR (Project: rkihpmmafukxeddpnlla)
-- =========================================================================

-- Step 1: Create Administrator Accounts Table
CREATE TABLE IF NOT EXISTS ee_admin_accounts (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  email VARCHAR(190) UNIQUE NOT NULL,
  department VARCHAR(50) NOT NULL,
  role VARCHAR(50) NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Step 2: Grant Permissions to web client
ALTER TABLE IF EXISTS ee_admin_accounts DISABLE ROW LEVEL SECURITY;
GRANT ALL ON TABLE ee_admin_accounts TO anon, authenticated;
GRANT ALL ON SEQUENCE ee_admin_accounts_id_seq TO anon, authenticated;

-- Step 3: Insert Default Admin Accounts for all 10 Departments
-- Passwords are encrypted with standard SHA-256 (Hash of 'admin1234')
-- SHA-256 Hash: ac9689e2272427085e35b9d3e3e8bed88cb3434828b43b86fc0596cad4c6e270
INSERT INTO ee_admin_accounts (name, email, department, role, password_hash) VALUES
('Maria L. Dizon', 'mis@college.edu', 'MIS', 'Main Admin', 'ac9689e2272427085e35b9d3e3e8bed88cb3434828b43b86fc0596cad4c6e270'),
('Angela Torres', 'ssg@college.edu', 'SSG', 'SSG Admin', 'ac9689e2272427085e35b9d3e3e8bed88cb3434828b43b86fc0596cad4c6e270'),
('Brian Reyes', 'codetech@college.edu', 'CodeTech', 'CodeTech Admin', 'ac9689e2272427085e35b9d3e3e8bed88cb3434828b43b86fc0596cad4c6e270'),
('Carla Garcia', 'coed@college.edu', 'COED', 'COED Admin', 'ac9689e2272427085e35b9d3e3e8bed88cb3434828b43b86fc0596cad4c6e270'),
('David Cruz', 'hm@college.edu', 'HM', 'HM Admin', 'ac9689e2272427085e35b9d3e3e8bed88cb3434828b43b86fc0596cad4c6e270'),
('Elena Lim', 'bit@college.edu', 'BIT', 'BIT Admin', 'ac9689e2272427085e35b9d3e3e8bed88cb3434828b43b86fc0596cad4c6e270'),
('Francis Ramos', 'registrar@college.edu', 'Registrar', 'Registrar Admin', 'ac9689e2272427085e35b9d3e3e8bed88cb3434828b43b86fc0596cad4c6e270'),
('Grace Santos', 'clinic@college.edu', 'Clinic', 'Clinic Admin', 'ac9689e2272427085e35b9d3e3e8bed88cb3434828b43b86fc0596cad4c6e270'),
('Henry Tan', 'cashier@college.edu', 'Cashier', 'Cashier Admin', 'ac9689e2272427085e35b9d3e3e8bed88cb3434828b43b86fc0596cad4c6e270'),
('Iris Mendoza', 'guidance@college.edu', 'Guidance', 'Guidance Admin', 'ac9689e2272427085e35b9d3e3e8bed88cb3434828b43b86fc0596cad4c6e270')
ON CONFLICT (email) DO UPDATE SET
  name = EXCLUDED.name,
  department = EXCLUDED.department,
  role = EXCLUDED.role,
  password_hash = EXCLUDED.password_hash,
  is_active = TRUE;
