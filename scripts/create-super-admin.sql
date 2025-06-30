-- =============================================
-- CREATE SUPER ADMIN USER
-- =============================================
-- Run this script to create the first super admin user
-- Replace the email and password with your desired credentials

-- Step 1: Create the auth user (replace email and password)
INSERT INTO auth.users (
  id,
  instance_id,
  email,
  encrypted_password,
  email_confirmed_at,
  recovery_sent_at,
  last_sign_in_at,
  raw_app_meta_data,
  raw_user_meta_data,
  created_at,
  updated_at,
  confirmation_token,
  email_change,
  email_change_token_new,
  recovery_token
) VALUES (
  gen_random_uuid(),
  '00000000-0000-0000-0000-000000000000',
  'admin@marketpaper.com', -- CHANGE THIS EMAIL
  crypt('SuperAdmin123!', gen_salt('bf')), -- CHANGE THIS PASSWORD
  NOW(),
  NULL,
  NULL,
  '{"provider":"email","providers":["email"]}',
  '{}',
  NOW(),
  NOW(),
  '',
  '',
  '',
  ''
) ON CONFLICT (email) DO NOTHING;

-- Step 2: Create the user profile
INSERT INTO user_profiles (
  id,
  email,
  full_name,
  role,
  status,
  preferences,
  timezone,
  locale
) 
SELECT 
  u.id,
  u.email,
  'Super Administrator',
  'super_admin',
  'active',
  '{"theme": "light", "language": "es"}',
  'America/Argentina/Buenos_Aires',
  'es-ES'
FROM auth.users u
WHERE u.email = 'admin@marketpaper.com' -- CHANGE THIS EMAIL
ON CONFLICT (id) DO UPDATE SET
  role = 'super_admin',
  status = 'active',
  full_name = 'Super Administrator';

-- Verify the user was created
SELECT 
  up.id,
  up.email,
  up.full_name,
  up.role,
  up.status,
  up.created_at
FROM user_profiles up
WHERE up.role = 'super_admin';

-- =============================================
-- ALTERNATIVE: Create via Supabase Dashboard
-- =============================================
-- If you prefer to use the Supabase Dashboard:
-- 1. Go to Authentication > Users
-- 2. Click "Add user"
-- 3. Enter email and password
-- 4. After creating, run this SQL to set the role:

/*
UPDATE user_profiles 
SET 
  role = 'super_admin',
  full_name = 'Super Administrator',
  status = 'active'
WHERE email = 'your-email@example.com'; -- Replace with actual email
*/ 