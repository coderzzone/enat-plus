-- Enat Plus: Maternal Health Companion (Ethiopia)
-- Migration: 001_initial_schema_and_rls.sql

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Types & Enums
DO $$ BEGIN
  CREATE TYPE user_role AS ENUM ('mother', 'clinic_staff');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  CREATE TYPE staff_role_type AS ENUM ('clinic_admin', 'clinic_staff');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  CREATE TYPE enrollment_status AS ENUM ('invited', 'active', 'revoked');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  CREATE TYPE consent_scope AS ENUM ('pregnancy_summary', 'appointments', 'health_records');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  CREATE TYPE health_record_type AS ENUM ('blood_pressure', 'weight', 'symptom', 'note');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  CREATE TYPE appointment_status AS ENUM ('scheduled', 'attended', 'missed', 'cancelled');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  CREATE TYPE reminder_kind AS ENUM ('appointment', 'medication');
EXCEPTION WHEN duplicate_object THEN null; END $$;

-- 1. Organizations
CREATE TABLE IF NOT EXISTS public.organizations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  city TEXT NOT NULL DEFAULT 'Addis Ababa',
  phone TEXT,
  status TEXT NOT NULL DEFAULT 'active',
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 2. Profiles (matches auth.users.id)
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  role user_role NOT NULL DEFAULT 'mother',
  full_name TEXT NOT NULL,
  phone TEXT,
  language TEXT NOT NULL DEFAULT 'en' CHECK (language IN ('en', 'am')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 3. Organization Staff
CREATE TABLE IF NOT EXISTS public.organization_staff (
  user_id UUID PRIMARY KEY REFERENCES public.profiles(id) ON DELETE CASCADE,
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  staff_role staff_role_type NOT NULL DEFAULT 'clinic_staff',
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 4. Pregnancies
CREATE TABLE IF NOT EXISTS public.pregnancies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  mother_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  lmp_date DATE NOT NULL,
  cycle_length INT NOT NULL DEFAULT 28 CHECK (cycle_length BETWEEN 20 AND 45),
  clinician_confirmed_edd DATE,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 5. Patient Enrollments
CREATE TABLE IF NOT EXISTS public.patient_enrollments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  mother_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  status enrollment_status NOT NULL DEFAULT 'active',
  invited_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  joined_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()),
  UNIQUE(mother_id, organization_id)
);

-- 6. Invitations
CREATE TABLE IF NOT EXISTS public.invitations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  token TEXT NOT NULL UNIQUE,
  invitee_name TEXT NOT NULL,
  invitee_phone TEXT NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL DEFAULT (now() + interval '7 days'),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'expired', 'revoked')),
  used_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 7. Consent Records
CREATE TABLE IF NOT EXISTS public.consent_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  mother_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  scope consent_scope NOT NULL,
  granted_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  revoked_at TIMESTAMPTZ,
  UNIQUE(mother_id, organization_id, scope)
);

-- 8. Health Records
CREATE TABLE IF NOT EXISTS public.health_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  mother_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  recorded_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  type health_record_type NOT NULL,
  systolic INT,
  diastolic INT,
  weight_kg NUMERIC(5,2),
  text TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 9. Appointments
CREATE TABLE IF NOT EXISTS public.appointments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  mother_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  organization_id UUID REFERENCES public.organizations(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  scheduled_at TIMESTAMPTZ NOT NULL,
  status appointment_status NOT NULL DEFAULT 'scheduled',
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 10. Reminders
CREATE TABLE IF NOT EXISTS public.reminders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  mother_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  kind reminder_kind NOT NULL,
  title TEXT NOT NULL,
  remind_at TIMESTAMPTZ NOT NULL,
  notes TEXT,
  done BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 11. Pregnancy Content (Weeks 1-40)
CREATE TABLE IF NOT EXISTS public.pregnancy_content (
  week INT PRIMARY KEY CHECK (week BETWEEN 1 AND 40),
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  reviewed BOOLEAN NOT NULL DEFAULT false,
  reviewed_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  reviewed_at TIMESTAMPTZ
);

-- 12. Audit Log (non-negotiable safety & consent auditing)
CREATE TABLE IF NOT EXISTS public.audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  organization_id UUID REFERENCES public.organizations(id) ON DELETE SET NULL,
  target_user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  action TEXT NOT NULL,
  details JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- ============================================================================
-- HELPER FUNCTIONS FOR RLS (Security Definer to prevent circular policy recursion)
-- ============================================================================

-- Check if current user is staff of a given organization
CREATE OR REPLACE FUNCTION public.is_staff_of_org(target_org_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.organization_staff
    WHERE user_id = auth.uid()
      AND organization_id = target_org_id
  );
$$;

-- Get current user's organization id (if staff)
CREATE OR REPLACE FUNCTION public.get_staff_org_id()
RETURNS UUID
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT organization_id FROM public.organization_staff
  WHERE user_id = auth.uid()
  LIMIT 1;
$$;

-- Check if current user is staff at an org where mother is actively enrolled
CREATE OR REPLACE FUNCTION public.is_clinic_staff_enrolled_mother(target_mother_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.organization_staff os
    JOIN public.patient_enrollments pe ON pe.organization_id = os.organization_id
    WHERE os.user_id = auth.uid()
      AND pe.mother_id = target_mother_id
      AND pe.status = 'active'
  );
$$;

-- Check if current user is staff at an org where mother is actively enrolled AND has granted active (un-revoked) consent for scope
CREATE OR REPLACE FUNCTION public.is_clinic_staff_with_consent(target_mother_id UUID, required_scope consent_scope)
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.organization_staff os
    JOIN public.patient_enrollments pe ON pe.organization_id = os.organization_id
    JOIN public.consent_records cr ON cr.organization_id = os.organization_id AND cr.mother_id = pe.mother_id
    WHERE os.user_id = auth.uid()
      AND pe.mother_id = target_mother_id
      AND pe.status = 'active'
      AND cr.scope = required_scope
      AND cr.revoked_at IS NULL
  );
$$;

-- ============================================================================
-- ENABLE ROW LEVEL SECURITY ON ALL TABLES
-- ============================================================================
ALTER TABLE public.organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.organization_staff ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pregnancies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.patient_enrollments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invitations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.consent_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.health_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reminders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pregnancy_content ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_log ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- RLS POLICIES
-- ============================================================================

-- 1. ORGANIZATIONS
-- Authenticated users can view active organizations (needed for enrolling/viewing clinic info)
CREATE POLICY "org_select_policy" ON public.organizations
  FOR SELECT TO authenticated
  USING (status = 'active' OR id = public.get_staff_org_id());

-- 2. PROFILES
-- Users can read and update their own profile
CREATE POLICY "profiles_self_read" ON public.profiles
  FOR SELECT TO authenticated
  USING (id = auth.uid());

CREATE POLICY "profiles_self_insert" ON public.profiles
  FOR INSERT TO authenticated
  WITH CHECK (id = auth.uid());

CREATE POLICY "profiles_self_update" ON public.profiles
  FOR UPDATE TO authenticated
  USING (id = auth.uid())
  WITH CHECK (id = auth.uid());

-- Clinic staff can read basic profiles of enrolled mothers in their org
CREATE POLICY "profiles_staff_read_enrolled_patients" ON public.profiles
  FOR SELECT TO authenticated
  USING (public.is_clinic_staff_enrolled_mother(id));

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

-- 3. ORGANIZATION_STAFF
-- Staff members can read their own organization's staff list
CREATE POLICY "org_staff_read" ON public.organization_staff
  FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR public.is_staff_of_org(organization_id));

CREATE POLICY "org_admin_manage_staff" ON public.organization_staff
  FOR ALL TO authenticated
  USING (public.is_clinic_admin_of_org(organization_id))
  WITH CHECK (public.is_clinic_admin_of_org(organization_id));

-- 4. PREGNANCIES
-- Mother owns her pregnancy records completely
CREATE POLICY "pregnancies_mother_all" ON public.pregnancies
  FOR ALL TO authenticated
  USING (mother_id = auth.uid())
  WITH CHECK (mother_id = auth.uid());

-- Clinic staff can ONLY read pregnancy records IF mother is enrolled AND consent for 'pregnancy_summary' is active
CREATE POLICY "pregnancies_staff_read_consented" ON public.pregnancies
  FOR SELECT TO authenticated
  USING (public.is_clinic_staff_with_consent(mother_id, 'pregnancy_summary'::consent_scope));

-- 5. PATIENT_ENROLLMENTS
-- Mother can read and manage her enrollments
CREATE POLICY "enrollments_mother_read" ON public.patient_enrollments
  FOR SELECT TO authenticated
  USING (mother_id = auth.uid());

CREATE POLICY "enrollments_mother_update" ON public.patient_enrollments
  FOR UPDATE TO authenticated
  USING (mother_id = auth.uid())
  WITH CHECK (mother_id = auth.uid());

-- Clinic staff can read and manage enrollments in their own org
CREATE POLICY "enrollments_staff_read" ON public.patient_enrollments
  FOR SELECT TO authenticated
  USING (organization_id = public.get_staff_org_id());

CREATE POLICY "enrollments_staff_write" ON public.patient_enrollments
  FOR INSERT TO authenticated
  WITH CHECK (organization_id = public.get_staff_org_id());

CREATE POLICY "enrollments_staff_update" ON public.patient_enrollments
  FOR UPDATE TO authenticated
  USING (organization_id = public.get_staff_org_id())
  WITH CHECK (organization_id = public.get_staff_org_id());

-- 6. INVITATIONS
-- Clinic staff can create and read invitations for their org
CREATE POLICY "invitations_staff_all" ON public.invitations
  FOR ALL TO authenticated
  USING (organization_id = public.get_staff_org_id())
  WITH CHECK (organization_id = public.get_staff_org_id());

-- Authenticated mothers can view invitation details when joining via token
CREATE POLICY "invitations_token_lookup" ON public.invitations
  FOR SELECT TO authenticated
  USING (status = 'pending' AND expires_at > now());

CREATE POLICY "invitations_token_accept" ON public.invitations
  FOR UPDATE TO authenticated
  USING (status = 'pending' AND expires_at > now())
  WITH CHECK (used_by = auth.uid());

-- 7. CONSENT_RECORDS
-- Mother can read, insert, update her own consent records
CREATE POLICY "consent_mother_all" ON public.consent_records
  FOR ALL TO authenticated
  USING (mother_id = auth.uid())
  WITH CHECK (mother_id = auth.uid());

-- Clinic staff can view consent records for mothers enrolled in their org
CREATE POLICY "consent_staff_read" ON public.consent_records
  FOR SELECT TO authenticated
  USING (
    organization_id = public.get_staff_org_id()
    AND public.is_clinic_staff_enrolled_mother(mother_id)
  );

-- 8. HEALTH_RECORDS
-- Mother can read and write her own health records
CREATE POLICY "health_records_mother_all" ON public.health_records
  FOR ALL TO authenticated
  USING (mother_id = auth.uid())
  WITH CHECK (mother_id = auth.uid());

-- Clinic staff can view health records ONLY IF enrolled AND 'health_records' scope consent is active
CREATE POLICY "health_records_staff_read_consented" ON public.health_records
  FOR SELECT TO authenticated
  USING (public.is_clinic_staff_with_consent(mother_id, 'health_records'::consent_scope));

-- 9. APPOINTMENTS
-- Mother can read all appointments scheduled for her
CREATE POLICY "appointments_mother_read" ON public.appointments
  FOR SELECT TO authenticated
  USING (mother_id = auth.uid());

-- Mother can manage self-scheduled appointments
CREATE POLICY "appointments_mother_write" ON public.appointments
  FOR INSERT TO authenticated
  WITH CHECK (mother_id = auth.uid());

CREATE POLICY "appointments_mother_update" ON public.appointments
  FOR UPDATE TO authenticated
  USING (mother_id = auth.uid())
  WITH CHECK (mother_id = auth.uid());

-- Clinic staff can create/update appointments for actively enrolled mothers
CREATE POLICY "appointments_staff_create" ON public.appointments
  FOR INSERT TO authenticated
  WITH CHECK (
    organization_id = public.get_staff_org_id()
    AND public.is_clinic_staff_enrolled_mother(mother_id)
  );

CREATE POLICY "appointments_staff_update" ON public.appointments
  FOR UPDATE TO authenticated
  USING (
    organization_id = public.get_staff_org_id()
    AND public.is_clinic_staff_enrolled_mother(mother_id)
  )
  WITH CHECK (
    organization_id = public.get_staff_org_id()
    AND public.is_clinic_staff_enrolled_mother(mother_id)
  );

-- Clinic staff can view appointments for enrolled mothers ONLY IF consent is active for 'appointments'
CREATE POLICY "appointments_staff_read_consented" ON public.appointments
  FOR SELECT TO authenticated
  USING (
    organization_id = public.get_staff_org_id()
    AND public.is_clinic_staff_with_consent(mother_id, 'appointments'::consent_scope)
  );

-- 10. REMINDERS
-- Strictly mother only. Never exposed to clinics.
CREATE POLICY "reminders_mother_all" ON public.reminders
  FOR ALL TO authenticated
  USING (mother_id = auth.uid())
  WITH CHECK (mother_id = auth.uid());

-- 11. PREGNANCY_CONTENT
-- All authenticated users can read educational content
CREATE POLICY "content_all_auth_read" ON public.pregnancy_content
  FOR SELECT TO authenticated
  USING (true);

-- 12. AUDIT_LOG
-- Users can insert audit entries for themselves
CREATE POLICY "audit_log_insert" ON public.audit_log
  FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());

-- Clinic staff can view audit records relating to their organization
CREATE POLICY "audit_log_staff_read" ON public.audit_log
  FOR SELECT TO authenticated
  USING (organization_id = public.get_staff_org_id());

-- Mother can view audit records relating to her data
CREATE POLICY "audit_log_mother_read" ON public.audit_log
  FOR SELECT TO authenticated
  USING (target_user_id = auth.uid() OR user_id = auth.uid());
