-- Enat Plus: RLS Verification Tests & Checklist
-- Execute this script in Supabase SQL Editor to verify that Row Level Security strictly enforces all privacy gates.

-- ==============================================================================
-- TEST SETUP: Verify Role & Scope Isolation
-- ==============================================================================

-- 1. Test: All authenticated users can read pregnancy content
SET LOCAL ROLE authenticated;
SET LOCAL request.jwt.claim.sub = '44444444-4444-4444-4444-444444444444'; -- Mother Chaltu
SELECT count(*) AS mother_content_count FROM public.pregnancy_content;
-- Expected: 40 rows

-- 2. Test: Mother can read her own pregnancy and health records
SELECT count(*) AS mother_health_records FROM public.health_records WHERE mother_id = '44444444-4444-4444-4444-444444444444';
-- Expected: 3 rows

-- 3. Test: Mother CANNOT read another mother's health records
SELECT count(*) AS leak_check FROM public.health_records WHERE mother_id = '55555555-5555-5555-5555-555555555555';
-- Expected: 0 rows (RLS blocks access)

-- 4. Test: Clinic Staff access with ACTIVE 'pregnancy_summary' and 'appointments' consent
SET LOCAL request.jwt.claim.sub = '33333333-3333-3333-3333-333333333333'; -- Nurse Tigist (St. Paul Clinic)
-- Should see Chaltu's pregnancy summary
SELECT count(*) AS staff_pregnancy_summary_count FROM public.pregnancies WHERE mother_id = '44444444-4444-4444-4444-444444444444';
-- Expected: 1 row

-- Should see Chaltu's appointments (consented)
SELECT count(*) AS staff_appointments_count FROM public.appointments WHERE mother_id = '44444444-4444-4444-4444-444444444444';
-- Expected: 2 rows

-- 5. Test: Clinic Staff CANNOT see health records because 'health_records' scope was NOT granted in seed
SELECT count(*) AS staff_unconsented_health_records FROM public.health_records WHERE mother_id = '44444444-4444-4444-4444-444444444444';
-- Expected: 0 rows (RLS blocks access because scope is missing!)

-- 6. Test: Clinic Staff CANNOT see independent Mother 2 (Leman) who is not enrolled with St. Paul
SELECT count(*) AS unlinked_mother_check FROM public.pregnancies WHERE mother_id = '55555555-5555-5555-5555-555555555555';
-- Expected: 0 rows

SELECT count(*) AS unlinked_mother_health_check FROM public.health_records WHERE mother_id = '55555555-5555-5555-5555-555555555555';
-- Expected: 0 rows

-- 7. Test: Clinic Staff CANNOT see Mother's personal reminders under any circumstances
SELECT count(*) AS staff_reminders_check FROM public.reminders WHERE mother_id = '44444444-4444-4444-4444-444444444444';
-- Expected: 0 rows

-- 8. Test: Dynamic Revocation Test
-- If mother revokes 'pregnancy_summary' consent:
SET LOCAL ROLE postgres; -- elevated role to simulate mother update
UPDATE public.consent_records
SET revoked_at = now()
WHERE mother_id = '44444444-4444-4444-4444-444444444444' AND scope = 'pregnancy_summary';

-- Re-test as Clinic Staff
SET LOCAL ROLE authenticated;
SET LOCAL request.jwt.claim.sub = '33333333-3333-3333-3333-333333333333';
SELECT count(*) AS staff_revoked_summary_count FROM public.pregnancies WHERE mother_id = '44444444-4444-4444-4444-444444444444';
-- Expected: 0 rows (Immediately blocked!)

-- Clean up test revocation back to un-revoked
SET LOCAL ROLE postgres;
UPDATE public.consent_records
SET revoked_at = NULL
WHERE mother_id = '44444444-4444-4444-4444-444444444444' AND scope = 'pregnancy_summary';

RESET ROLE;
