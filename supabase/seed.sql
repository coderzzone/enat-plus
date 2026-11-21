-- Enat Plus: Seed Data
-- Seed Organizations, Staff, Demo Mothers, Pregnancy Content (Weeks 1-40), and Sample Records

-- 1. Demo Organization
INSERT INTO public.organizations (id, name, city, phone, status)
VALUES (
  '11111111-1111-1111-1111-111111111111',
  'St. Paul Maternal & Child Health Clinic',
  'Addis Ababa',
  '+251-112-750125',
  'active'
) ON CONFLICT (id) DO NOTHING;

-- 2. Auth Users (For local Supabase or self-hosted Supabase instances using auth schema)
-- We insert users into auth.users with encrypted passwords (bcrypt of 'EnatDemo123!')
-- Password hash: $2a$10$wT8m9Z1g.R7vN5R.uR0nSe3uQ6K7F9n.fQG3XzJ1V.rC1l8YcE3tS (or standard Supabase auth helper)
-- Note: When running in Supabase cloud dashboard, users can register or be added via Auth UI.
-- Here we populate auth.users if auth schema is present:

DO $$
DECLARE
  v_admin_id UUID := '22222222-2222-2222-2222-222222222222';
  v_staff_id UUID := '33333333-3333-3333-3333-333333333333';
  v_mother1_id UUID := '44444444-4444-4444-4444-444444444444';
  v_mother2_id UUID := '55555555-5555-5555-5555-555555555555';
BEGIN
  -- Insert into auth.users if running in Supabase local/postgres environment with auth schema
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'auth' AND table_name = 'users') THEN
    
    INSERT INTO auth.users (id, instance_id, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at, role, aud)
    VALUES
    (
      v_admin_id,
      '00000000-0000-0000-0000-000000000000',
      'admin@stpaulclinic.et',
      crypt('EnatDemo123!', gen_salt('bf')),
      now(),
      '{"provider":"email","providers":["email"]}',
      '{"full_name":"Dr. Abebech Gobena","role":"clinic_staff"}',
      now(), now(), 'authenticated', 'authenticated'
    ) ON CONFLICT (id) DO NOTHING;

    INSERT INTO auth.users (id, instance_id, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at, role, aud)
    VALUES
    (
      v_staff_id,
      '00000000-0000-0000-0000-000000000000',
      'nurse.tigist@stpaulclinic.et',
      crypt('EnatDemo123!', gen_salt('bf')),
      now(),
      '{"provider":"email","providers":["email"]}',
      '{"full_name":"Nurse Tigist Mengistu","role":"clinic_staff"}',
      now(), now(), 'authenticated', 'authenticated'
    ) ON CONFLICT (id) DO NOTHING;

    INSERT INTO auth.users (id, instance_id, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at, role, aud)
    VALUES
    (
      v_mother1_id,
      '00000000-0000-0000-0000-000000000000',
      'mother.chaltu@example.com',
      crypt('EnatDemo123!', gen_salt('bf')),
      now(),
      '{"provider":"email","providers":["email"]}',
      '{"full_name":"Chaltu Desta","role":"mother"}',
      now(), now(), 'authenticated', 'authenticated'
    ) ON CONFLICT (id) DO NOTHING;

    INSERT INTO auth.users (id, instance_id, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at, role, aud)
    VALUES
    (
      v_mother2_id,
      '00000000-0000-0000-0000-000000000000',
      'mother.leman@example.com',
      crypt('EnatDemo123!', gen_salt('bf')),
      now(),
      '{"provider":"email","providers":["email"]}',
      '{"full_name":"Leman Kedir","role":"mother"}',
      now(), now(), 'authenticated', 'authenticated'
    ) ON CONFLICT (id) DO NOTHING;

  END IF;

  -- 3. Profiles
  INSERT INTO public.profiles (id, role, full_name, phone, language)
  VALUES
    (v_admin_id, 'clinic_staff', 'Dr. Abebech Gobena', '+251911223344', 'en'),
    (v_staff_id, 'clinic_staff', 'Nurse Tigist Mengistu', '+251911556677', 'en'),
    (v_mother1_id, 'mother', 'Chaltu Desta', '+251922334455', 'en'),
    (v_mother2_id, 'mother', 'Leman Kedir', '+251933445566', 'am')
  ON CONFLICT (id) DO UPDATE SET
    full_name = EXCLUDED.full_name,
    role = EXCLUDED.role,
    phone = EXCLUDED.phone;

  -- 4. Organization Staff
  INSERT INTO public.organization_staff (user_id, organization_id, staff_role)
  VALUES
    (v_admin_id, '11111111-1111-1111-1111-111111111111', 'clinic_admin'),
    (v_staff_id, '11111111-1111-1111-1111-111111111111', 'clinic_staff')
  ON CONFLICT (user_id) DO UPDATE SET staff_role = EXCLUDED.staff_role;

  -- 5. Pregnancies
  -- Mother 1 (Chaltu): LMP ~24 weeks ago (approx 168 days ago)
  INSERT INTO public.pregnancies (id, mother_id, lmp_date, cycle_length, clinician_confirmed_edd, is_active)
  VALUES (
    'a1111111-1111-1111-1111-111111111111',
    v_mother1_id,
    CURRENT_DATE - INTERVAL '168 days',
    28,
    CURRENT_DATE + INTERVAL '112 days',
    true
  ) ON CONFLICT (id) DO NOTHING;

  -- Mother 2 (Leman): LMP ~12 weeks ago (approx 84 days ago)
  INSERT INTO public.pregnancies (id, mother_id, lmp_date, cycle_length, clinician_confirmed_edd, is_active)
  VALUES (
    'a2222222-2222-2222-2222-222222222222',
    v_mother2_id,
    CURRENT_DATE - INTERVAL '84 days',
    30,
    NULL,
    true
  ) ON CONFLICT (id) DO NOTHING;

  -- 6. Enrollments: Mother 1 enrolled with St. Paul
  INSERT INTO public.patient_enrollments (id, mother_id, organization_id, status, invited_at, joined_at)
  VALUES (
    'b1111111-1111-1111-1111-111111111111',
    v_mother1_id,
    '11111111-1111-1111-1111-111111111111',
    'active',
    now() - INTERVAL '30 days',
    now() - INTERVAL '30 days'
  ) ON CONFLICT (mother_id, organization_id) DO NOTHING;

  -- 7. Consent Records: Mother 1 shares pregnancy summary and appointments, but NOT health records
  INSERT INTO public.consent_records (id, mother_id, organization_id, scope, granted_at, revoked_at)
  VALUES
    ('c1111111-1111-1111-1111-111111111111', v_mother1_id, '11111111-1111-1111-1111-111111111111', 'pregnancy_summary', now() - INTERVAL '30 days', NULL),
    ('c2222222-2222-2222-2222-222222222222', v_mother1_id, '11111111-1111-1111-1111-111111111111', 'appointments', now() - INTERVAL '30 days', NULL)
  ON CONFLICT (mother_id, organization_id, scope) DO UPDATE SET revoked_at = EXCLUDED.revoked_at;

  -- 8. Health Records for Mother 1 (Personal data)
  INSERT INTO public.health_records (id, mother_id, recorded_at, type, systolic, diastolic, weight_kg, text)
  VALUES
    ('d1111111-1111-1111-1111-111111111111', v_mother1_id, now() - INTERVAL '7 days', 'blood_pressure', 115, 75, NULL, 'Resting BP normal'),
    ('d2222222-2222-2222-2222-222222222222', v_mother1_id, now() - INTERVAL '7 days', 'weight', NULL, NULL, 64.5, 'Normal weight gain'),
    ('d3333333-3333-3333-3333-333333333333', v_mother1_id, now() - INTERVAL '2 days', 'symptom', NULL, NULL, NULL, 'Mild lower back soreness in evenings')
  ON CONFLICT (id) DO NOTHING;

  -- 9. Appointments
  -- Upcoming appointment for Mother 1
  INSERT INTO public.appointments (id, mother_id, organization_id, title, scheduled_at, status, created_by)
  VALUES
    ('e1111111-1111-1111-1111-111111111111', v_mother1_id, '11111111-1111-1111-1111-111111111111', '24-Week Antenatal Checkup', now() + INTERVAL '3 days', 'scheduled', v_staff_id),
    ('e2222222-2222-2222-2222-222222222222', v_mother1_id, '11111111-1111-1111-1111-111111111111', 'Initial Booking Visit', now() - INTERVAL '30 days', 'attended', v_staff_id)
  ON CONFLICT (id) DO NOTHING;

  -- Reminders for Mother 1
  INSERT INTO public.reminders (id, mother_id, kind, title, remind_at, notes, done)
  VALUES
    ('f1111111-1111-1111-1111-111111111111', v_mother1_id, 'medication', 'Daily Iron & Folic Acid Supplement', now() + INTERVAL '4 hours', 'Take after food as prescribed by clinic', false),
    ('f2222222-2222-2222-2222-222222222222', v_mother1_id, 'appointment', 'Bring yellow antenatal card to checkup', now() + INTERVAL '3 days', 'Keep in handbag', false)
  ON CONFLICT (id) DO NOTHING;

  -- Active Invitation for demo linking
  INSERT INTO public.invitations (id, organization_id, token, invitee_name, invitee_phone, expires_at, status)
  VALUES (
    '99999999-9999-9999-9999-999999999999',
    '11111111-1111-1111-1111-111111111111',
    'ENAT-DEMO-2026',
    'Bethlehem Tadesse',
    '+251944556677',
    now() + INTERVAL '7 days',
    'pending'
  ) ON CONFLICT (id) DO NOTHING;

END $$;

-- 11. Pregnancy Content for all 40 Weeks (Reviewed = false, General milestones only, conservative)
INSERT INTO public.pregnancy_content (week, title, body, reviewed) VALUES
(1, 'Week 1: New Beginning', 'Your pregnancy journey begins from the first day of your last menstrual period. Your body is preparing for ovulation.', false),
(2, 'Week 2: Preparation and Conception', 'Your uterine lining thickens in preparation for a fertilised egg. Staying hydrated and eating balanced meals supports your wellbeing.', false),
(3, 'Week 3: Fertilisation', 'A single cell begins rapidly dividing. It travels towards the uterus where it will implant.', false),
(4, 'Week 4: Implantation', 'The blastocyst implants in the uterine wall. The placenta and amniotic sac begin developing. Size comparison: poppy seed.', false),
(5, 'Week 5: Early Neural Tube Formation', 'The foundation for the brain and spinal cord begins to take shape. Size comparison: apple seed.', false),
(6, 'Week 6: Heartbeat Begins', 'Early heart tube begins rhythmically pulsing. Facial features start to subtly form. Size comparison: sweet pea.', false),
(7, 'Week 7: Tiny Arm and Leg Buds', 'Arm and leg buds emerge and lengthen. Morning nausea may be common at this stage. Size comparison: blueberry.', false),
(8, 'Week 8: Little Movements', 'Webbed fingers and toes start developing. The embryo moves gently, though too small to feel. Size comparison: raspberry.', false),
(9, 'Week 9: Fetal Stage Begins', 'Now officially referred to as a fetus. Essential organs are in place and continue maturing. Size comparison: green olive.', false),
(10, 'Week 10: Vital Organs Developing', 'Bones and cartilage are forming. Tiny fingernails begin appearing. Size comparison: prune.', false),
(11, 'Week 11: Breathing Movements Practice', 'The diaphragm starts practicing breathing motions with amniotic fluid. Size comparison: lime.', false),
(12, 'Week 12: Reflexes Emerging', 'Fingers can open and close. The placenta is taking over hormone production. Size comparison: plum.', false),
(13, 'Week 13: Wrapping Up the First Trimester', 'Vocal cords develop and fingerprints are formed. You are entering the second trimester. Size comparison: lemon.', false),
(14, 'Week 14: Welcome to Second Trimester', 'Energy levels often begin to return as early morning sickness lessens. Size comparison: peach.', false),
(15, 'Week 15: Light and Sound Awareness', 'The baby can perceive bright light through the abdomen. Bones are storing calcium. Size comparison: apple.', false),
(16, 'Week 16: Coordinated Eye Movements', 'Eyes make slow movements. Facial muscles allow small expressions. Size comparison: avocado.', false),
(17, 'Week 17: Vernix Caseosa Coating', 'A protective creamy coating called vernix starts covering the delicate skin. Size comparison: pomegranate.', false),
(18, 'Week 18: Hearing Sounds', 'The inner ear bones harden. Baby can hear the mother’s heartbeat and voice. Size comparison: sweet potato.', false),
(19, 'Week 19: Hair and Lanugo', 'Soft fine hair called lanugo covers the body to help keep baby warm. Size comparison: mango.', false),
(20, 'Week 20: Halfway Milestone', 'You have reached the 20-week halfway mark. Quickening (fluttering kicks) is often felt around now. Size comparison: banana.', false),
(21, 'Week 21: Steady Kicks', 'Swallowing amniotic fluid helps mature the digestive tract. Kicks become more distinct. Size comparison: carrot.', false),
(22, 'Week 22: Sense of Touch', 'Grip reflex develops and baby may touch their face or umbilical cord. Size comparison: papaya.', false),
(23, 'Week 23: Rapid Brain Growth', 'The brain and nerve cells are connecting at a brisk pace. Size comparison: grapefruit.', false),
(24, 'Week 24: Lung Surfactant Production', 'Cells in the lungs begin producing surfactant to prepare for breathing outside the womb. Size comparison: ear of corn.', false),
(25, 'Week 25: Responding to Familiar Voices', 'The baby turns towards soothing sounds. Restful sleep cycles are establishing. Size comparison: rutabaga.', false),
(26, 'Week 26: Eyes Begin Opening', 'Eyelids begin to unseal and blink. Air sacs in the lungs multiply. Size comparison: zucchini.', false),
(27, 'Week 27: Transitioning to Third Trimester', 'Regular sleep and wake cycles are noticeable. Size comparison: cauliflower.', false),
(28, 'Week 28: Third Trimester Begins', 'Welcome to the third trimester. Eyebrows and eyelashes are fully grown. Size comparison: eggplant.', false),
(29, 'Week 29: Storing Nutrients and Iron', 'Baby absorbs iron, calcium, and protein from mom to prepare for growth. Size comparison: butternut squash.', false),
(30, 'Week 30: Temperature Regulation', 'Fat deposits accumulate beneath the skin to help regulate body temperature after birth. Size comparison: cabbage.', false),
(31, 'Week 31: Rhythmic Kicking Patterns', 'Space is getting cozier inside. Movement patterns become predictable throughout the day. Size comparison: coconut.', false),
(32, 'Week 32: Practice Breathing Continues', 'Toenails and fingernails are completely formed. Size comparison: jicama.', false),
(33, 'Week 33: Immune Antibodies Transfer', 'Maternal antibodies transfer through the placenta to provide early newborn protection. Size comparison: pineapple.', false),
(34, 'Week 34: Central Nervous System Maturity', 'Lungs and nervous system are nearly fully developed. Size comparison: cantaloupe.', false),
(35, 'Week 35: Rapid Weight Increase', 'Baby gains significant weight each week now, filling out remaining skin folds. Size comparison: honeydew melon.', false),
(36, 'Week 36: Settling into Position', 'Most babies turn head-down in preparation for birth. Size comparison: romaine lettuce.', false),
(37, 'Week 37: Early Term Milestone', 'Baby is considered early term. Organs are ready for life outside. Size comparison: Swiss chard.', false),
(38, 'Week 38: Firm Grasp and Shedding Lanugo', 'Baby sheds most of the fine lanugo hair. Reflexes are well-coordinated. Size comparison: leek.', false),
(39, 'Week 39: Full Term Ready', 'Physical development is complete. Baby waits for the natural onset of labor. Size comparison: mini watermelon.', false),
(40, 'Week 40: Due Date Week', 'Your expected due date arrives. Remember normal births naturally happen between 37 and 42 weeks. Size comparison: small pumpkin.', false)
ON CONFLICT (week) DO UPDATE SET
  title = EXCLUDED.title,
  body = EXCLUDED.body,
  reviewed = EXCLUDED.reviewed;
