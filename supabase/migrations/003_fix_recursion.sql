-- Migration: 003_fix_recursion.sql
-- Fixes infinite recursion in organization_staff RLS policies by using SECURITY DEFINER helper functions

-- 1. Create Security Definer helper for clinic admin check
CREATE OR REPLACE FUNCTION public.is_clinic_admin_of_org(target_org_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.organization_staff
    WHERE user_id = auth.uid()
      AND organization_id = target_org_id
      AND staff_role = 'clinic_admin'
  );
$$;

-- 2. Drop existing recursive policies on organization_staff
DROP POLICY IF EXISTS "org_staff_read" ON public.organization_staff;
DROP POLICY IF EXISTS "org_admin_manage_staff" ON public.organization_staff;
DROP POLICY IF EXISTS "super_admin_manage_staff" ON public.organization_staff;

-- 3. Re-create non-recursive policies on organization_staff

-- Super Admin can manage all staff
CREATE POLICY "super_admin_manage_staff" ON public.organization_staff
  FOR ALL TO authenticated
  USING (public.is_super_admin())
  WITH CHECK (public.is_super_admin());

-- Staff can read their own or co-workers' records
CREATE POLICY "org_staff_read" ON public.organization_staff
  FOR SELECT TO authenticated
  USING (
    user_id = auth.uid() 
    OR public.is_super_admin()
    OR public.is_staff_of_org(organization_id)
  );

-- Clinic Admin can manage their facility's staff via Security Definer function
CREATE POLICY "org_admin_manage_staff" ON public.organization_staff
  FOR ALL TO authenticated
  USING (public.is_clinic_admin_of_org(organization_id))
  WITH CHECK (public.is_clinic_admin_of_org(organization_id));
