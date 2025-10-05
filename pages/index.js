import { useEffect } from 'react';
import { supabaseBrowser } from '@/lib/supabaseClient';
import { useRouter } from 'next/router';

export default function Home() {
  const r = useRouter();
  
  useEffect(() => {
    const sb = supabaseBrowser();
    if (!sb) { 
      r.replace('/login'); 
      return; 
    }
    sb.auth.getSession().then(({ data }) => { 
      r.replace(data.session ? '/dashboard' : '/login'); 
    });
  }, [r]);

  return null;
}