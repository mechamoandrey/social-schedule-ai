export async function loadUsageSummary(sb, agencyId) {
  const { data, error } = await sb.rpc('ai_usage_summary', {
    p_agency_id: agencyId,
  });
  if (error) throw error;
  return Array.isArray(data) ? data[0] : data;
}

export async function canUseAI(sb, agencyId, amount) {
  const { data, error } = await sb.rpc('can_use_ai_posts', {
    amount,
    p_agency_id: agencyId,
  });
  if (error) throw error;
  const row = Array.isArray(data) ? data[0] : data;
  return row || { allowed: true, remaining: 999999, reason: 'N/A' };
}

export async function incAI(sb, agencyId, amount) {
  const { data, error } = await sb.rpc('inc_ai_posts', {
    amount,
    p_agency_id: agencyId,
  });
  if (error) throw error;
  return data;
}
