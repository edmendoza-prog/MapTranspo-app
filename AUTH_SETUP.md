# Authentication Setup Guide

## Creating an Admin Account

To access the logistics dashboard, you need to create an admin account in Supabase.

### Option 1: Using Supabase Dashboard (Recommended)

1. Go to your Supabase project: https://kxbiyqnldzpzqvcrhdpj.supabase.co
2. Navigate to **Authentication** → **Users** in the left sidebar
3. Click **Add User** → **Create new user**
4. Enter:
   - Email: `admin@example.com` (or your preferred email)
   - Password: Choose a strong password
   - Check "Auto Confirm User" to skip email verification
5. Click **Create User**

### Option 2: Using SQL (via MCP or Supabase SQL Editor)

Run this SQL to create an admin user:

```sql
-- Enable the pgcrypto extension if not already enabled
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Create admin user (replace email and password)
INSERT INTO auth.users (
  instance_id,
  id,
  aud,
  role,
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
  '00000000-0000-0000-0000-000000000000',
  gen_random_uuid(),
  'authenticated',
  'authenticated',
  'admin@example.com',
  crypt('your-password-here', gen_salt('bf')),
  NOW(),
  NOW(),
  NOW(),
  '{"provider":"email","providers":["email"]}',
  '{}',
  NOW(),
  NOW(),
  '',
  '',
  '',
  ''
);
```

**Note:** Replace `admin@example.com` and `your-password-here` with your desired credentials.

### Option 3: Enable Sign Up (Optional)

If you want to allow new users to sign up:

1. Go to Supabase Dashboard → **Authentication** → **Settings**
2. Enable **Email Auth**
3. Optionally disable "Confirm email" for easier testing

## Logging In

1. Navigate to http://localhost:3000
2. You'll be automatically redirected to the login page
3. Enter your admin credentials
4. Click **Sign In**
5. You'll be redirected to the dashboard

## Sign Out

Click the **Sign Out** button in the top-right corner of the dashboard.

## Security Notes

- The middleware protects all routes except `/login`
- Sessions are managed by Supabase Auth
- Cookies are HTTP-only and secure
- Change default credentials immediately in production
