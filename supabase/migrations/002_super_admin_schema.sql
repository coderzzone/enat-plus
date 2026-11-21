-- Migration: 002_super_admin_schema.sql
-- Enables Super Admin platform governance, hospital enrollment, and clinical staff verification

-- 1. Add 'super_admin' to user_role enum if not already present
DO $$ BEGIN
  ALTER TYPE user_role ADD VALUE IF NOT EXISTS 'super_admin';
EXCEPTION WHEN duplicate_object THEN null; END $$;

-- 2. Extend public.organizations with facility metadata & verification
ALTER TABLE public.organizations
  ADD COLUMN IF NOT EXISTS facility_type TEXT NOT NULL DEFAULT 'primary_hospital'
    CHECK (facility_type IN ('referral_hospital', 'primary_hospital', 'health_center', 'private_clinic')),
  ADD COLUMN IF NOT EXISTS license_number TEXT,
  ADD COLUMN IF NOT EXISTS verified BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS verified_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS region TEXT NOT NULL DEFAULT 'Addis Ababa';

-- 3. Extend public.organization_staff with clinical credentials & verification
ALTER TABLE public.organization_staff
  ADD COLUMN IF NOT EXISTS license_number TEXT,
  ADD COLUMN IF NOT EXISTS verified BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS verified_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS verified_by UUID REFERENCES auth.users(id);

-- 4. Helper function: check if caller is super admin
CREATE OR REPLACE FUNCTION public.is_super_admin()
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid()
      AND role::text = 'super_admin'
  );
$$;

-- 5. Super Admin RLS Policies

-- Allow Super Admin full read & write over all organizations
CREATE POLICY "super_admin_manage_organizations" ON public.organizations
  FOR ALL TO authenticated
  USING (public.is_super_admin())
  WITH CHECK (public.is_super_admin());

-- Allow Super Admin full read & write over organization staff verification
CREATE POLICY "super_admin_manage_staff" ON public.organization_staff
  FOR ALL TO authenticated
  USING (public.is_super_admin())
  WITH CHECK (public.is_super_admin());

-- Allow Super Admin to view profiles for auditing
CREATE POLICY "super_admin_read_profiles" ON public.profiles
  FOR SELECT TO authenticated
  USING (public.is_super_admin());

-- Allow Super Admin to view all audit logs
CREATE POLICY "super_admin_read_audit_log" ON public.audit_log
  FOR SELECT TO authenticated
  USING (public.is_super_admin());
