import { supabaseBrowser } from '@/lib/supabaseClient';

export async function getMyRoleForAgency(agencyId) {
  const sb = supabaseBrowser();
  if (!sb) return null;
  
  const { data: me } = await sb.auth.getUser();
  if (!me?.user) return null;
  
  const { data } = await sb
    .from('agency_members')
    .select('role')
    .eq('agency_id', agencyId)
    .eq('user_id', me.user.id)
    .maybeSingle();
    
  return data?.role || null;
}
