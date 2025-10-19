import { useEffect, useState } from 'react';
import { supabaseBrowser } from '@/lib/supabaseClient';
import { useRouter } from 'next/router';

export function useRequireAuth() {
  const r = useRouter();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const sb = supabaseBrowser();
      if (!sb) {
        setLoading(false);
        return;
      }
      const { data } = await sb.auth.getSession();
      if (!data.session) {
        r.replace('/login');
        return;
      }
      setUser(data.session.user);
      setLoading(false);
    })();
  }, [r]);

  return { user, loading };
}
