import { useEffect, useState } from 'react';
import { supabaseBrowser } from '@/lib/supabaseClient';

export function useAiUsage(agencyId) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(!!agencyId);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!agencyId) return;
    const sb = supabaseBrowser();
    let mounted = true;
    (async () => {
      try {
        setLoading(true);
        const { data: s, error: e } = await sb.rpc('ai_usage_summary', {
          p_agency_id: agencyId,
        });
        if (e) throw e;
        if (!mounted) return;
        const row = Array.isArray(s) ? s[0] : s;
        setData(row || null);
      } catch (err) {
        if (!mounted) return;
        setError(err.message);
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, [agencyId]);

  const remaining = data?.remaining ?? 0;
  const quota = data?.quota ?? 0;
  const used = data?.used ?? 0;
  const plan = data?.plan_name ?? '';
  const trialEnd = data?.trial_end_at ? new Date(data.trial_end_at) : null;
  const overage = !!data?.overage_enabled;

  let level = 'ok';
  if (quota && remaining / quota <= 0.1) level = 'warn';
  if (!overage && !trialEnd && remaining <= 0) level = 'block';

  return {
    data,
    loading,
    error,
    plan,
    quota,
    used,
    remaining,
    trialEnd,
    overage,
    level,
  };
}
