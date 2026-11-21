import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createClient as createSupabaseAdmin } from '@supabase/supabase-js';

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (profile?.role !== 'super_admin') {
      return NextResponse.json({ error: 'Forbidden: Super Admin only' }, { status: 403 });
    }

    const body = await request.json();
    const { 
      organization_id, 
      full_name, 
      email, 
      password = 'EnatDemo123!', 
      staff_role = 'clinic_admin', 
      license_number = 'MED-ETH-2026', 
      phone = '+251911000000' 
    } = body;

    if (!organization_id || !full_name || !email) {
      return NextResponse.json(
        { error: 'Missing required fields (organization_id, full_name, email)' },
        { status: 400 }
      );
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://zetjjgxnmxmnvtajttea.supabase.co';
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

    const adminClient = createSupabaseAdmin(supabaseUrl, serviceRoleKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });

    const { data: userList } = await adminClient.auth.admin.listUsers();
    let targetUserId = null;
    const existing = userList?.users?.find((u) => u.email?.toLowerCase() === email.toLowerCase());

    if (existing) {
      targetUserId = existing.id;
    } else {
      const { data: newUser, error: createError } = await adminClient.auth.admin.createUser({
        email: email.trim(),
        password: password.trim(),
        email_confirm: true,
        user_metadata: {
          full_name: full_name.trim(),
          role: 'clinic_staff',
        },
      });

      if (createError) {
        return NextResponse.json({ error: createError.message }, { status: 400 });
      }
      targetUserId = newUser.user.id;
    }

    await adminClient.from('profiles').upsert({
      id: targetUserId,
      full_name: full_name.trim(),
      role: 'clinic_staff',
      phone: phone.trim(),
      language: 'en',
    });

    const { error: staffErr } = await adminClient.from('organization_staff').upsert({
      user_id: targetUserId,
      organization_id,
      staff_role,
      license_number: license_number.trim(),
      verified: true,
      verified_at: new Date().toISOString(),
    });

    if (staffErr) {
      return NextResponse.json({ error: staffErr.message }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      user_id: targetUserId,
      email,
      message: 'Successfully provisioned staff member for facility.',
    });
  } catch (err: any) {
    console.error('API Error provisioning staff:', err);
    return NextResponse.json(
      { error: err?.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
