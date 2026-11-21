import { createClient } from './supabase/client';

export type AuditAction = 
  | 'view_patient_detail'
  | 'grant_consent'
  | 'revoke_consent'
  | 'create_appointment'
  | 'update_appointment'
  | 'create_invitation'
  | 'accept_invitation';

export async function logAuditEvent({
  action,
  targetUserId,
  organizationId,
  details = {},
}: {
  action: AuditAction;
  targetUserId?: string | null;
  organizationId?: string | null;
  details?: Record<string, any>;
}) {
  try {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) return;

    await supabase.from('audit_log').insert({
      user_id: user.id,
      target_user_id: targetUserId || null,
      organization_id: organizationId || null,
      action,
      details,
    });
  } catch (err) {
    console.error('Failed to write audit log entry:', err);
  }
}
