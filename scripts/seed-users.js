const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://zetjjgxnmxmnvtajttea.supabase.co';
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

const supabase = createClient(supabaseUrl, serviceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

const DEMO_USERS = [
  {
    email: 'admin@stpaulclinic.et',
    password: 'EnatDemo123!',
    fullName: 'Dr. Abebech Gobena',
    role: 'clinic_staff',
    staffRole: 'clinic_admin',
    phone: '+251911223344',
  },
  {
    email: 'nurse.tigist@stpaulclinic.et',
    password: 'EnatDemo123!',
    fullName: 'Nurse Tigist Mengistu',
    role: 'clinic_staff',
    staffRole: 'clinic_staff',
    phone: '+251911556677',
  },
  {
    email: 'mother.chaltu@example.com',
    password: 'EnatDemo123!',
    fullName: 'Chaltu Desta',
    role: 'mother',
    phone: '+251922334455',
    lmpDaysAgo: 168, // ~24 weeks
  },
  {
    email: 'superadmin@enatplus.et',
    password: 'EnatDemo123!',
    fullName: 'MOH Platform Director',
    role: 'super_admin',
    phone: '+251911001122',
  },
  {
    email: 'mother.leman@example.com',
    password: 'EnatDemo123!',
    fullName: 'Leman Kedir',
    role: 'mother',
    phone: '+251933445566',
    lmpDaysAgo: 84, // ~12 weeks
  },
];

async function seed() {
  console.log('Seeding demo users through official Supabase Auth Admin API...');

  // 1. Get or create demo org
  let orgId = '11111111-1111-1111-1111-111111111111';
  const { data: orgData, error: orgErr } = await supabase
    .from('organizations')
    .upsert({
      id: orgId,
      name: 'St. Paul Maternal & Child Health Clinic',
      city: 'Addis Ababa',
      phone: '+251-112-750125',
      status: 'active',
    })
    .select()
    .single();

  if (orgErr) {
    console.error('Org error:', orgErr);
  } else {
    console.log('Organization ready:', orgData.name);
  }

  for (const u of DEMO_USERS) {
    console.log(`Processing user: ${u.email}`);
    // Check if user already exists
    const { data: listData } = await supabase.auth.admin.listUsers();
    let existing = listData?.users?.find((x) => x.email === u.email);

    let userId = existing?.id;
    if (!existing) {
      const { data: created, error: createErr } = await supabase.auth.admin.createUser({
        email: u.email,
        password: u.password,
        email_confirm: true,
        user_metadata: {
          full_name: u.fullName,
          role: u.role,
        },
      });

      if (createErr) {
        console.error(`Failed to create ${u.email}:`, createErr.message);
        continue;
      }
      userId = created.user.id;
      console.log(`Created auth user ${u.email} -> ID: ${userId}`);
    } else {
      console.log(`User ${u.email} already exists with ID: ${userId}`);
    }

    // Upsert profile
    await supabase.from('profiles').upsert({
      id: userId,
      role: u.role,
      full_name: u.fullName,
      phone: u.phone,
      language: u.email.includes('leman') ? 'am' : 'en',
    });

    // If staff, link to organization_staff
    if (u.role === 'clinic_staff') {
      await supabase.from('organization_staff').upsert({
        user_id: userId,
        organization_id: orgId,
        staff_role: u.staffRole,
      });
      console.log(`Staff role linked: ${u.staffRole}`);
    }

    // If mother, link pregnancy and demo consent
    if (u.role === 'mother') {
      const lmp = new Date(Date.now() - u.lmpDaysAgo * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
      const { data: preg } = await supabase.from('pregnancies').insert({
        mother_id: userId,
        lmp_date: lmp,
        cycle_length: 28,
        is_active: true,
      }).select().maybeSingle();

      if (u.email === 'mother.chaltu@example.com') {
        // Active enrollment
        await supabase.from('patient_enrollments').upsert({
          mother_id: userId,
          organization_id: orgId,
          status: 'active',
        }, { onConflict: 'mother_id,organization_id' });

        // Consent records for summary and appointments
        await supabase.from('consent_records').upsert([
          { mother_id: userId, organization_id: orgId, scope: 'pregnancy_summary' },
          { mother_id: userId, organization_id: orgId, scope: 'appointments' },
        ], { onConflict: 'mother_id,organization_id,scope' });

        // Health record
        await supabase.from('health_records').insert([
          { mother_id: userId, type: 'blood_pressure', systolic: 115, diastolic: 75, text: 'Normal resting' },
          { mother_id: userId, type: 'weight', weight_kg: 64.5, text: 'Normal second trimester weight' },
        ]);

        // Appointment
        await supabase.from('appointments').insert({
          mother_id: userId,
          organization_id: orgId,
          title: '24-Week Antenatal Care Checkup',
          scheduled_at: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(),
          status: 'scheduled',
        });
      }
    }
  }

  // Active Invitation
  await supabase.from('invitations').upsert({
    organization_id: orgId,
    token: 'ENAT-DEMO-2026',
    invitee_name: 'Bethlehem Tadesse',
    invitee_phone: '+251944556677',
    expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
    status: 'pending',
  }, { onConflict: 'token' });

  console.log('Seeding completed successfully!');
}

seed().catch(console.error);
