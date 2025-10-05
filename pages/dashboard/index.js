import { useEffect, useState } from 'react';
import { supabaseBrowser } from '@/lib/supabaseClient';
import Link from 'next/link';

export default function Dashboard() {
  const [user, setUser] = useState(null);

  useEffect(() => {
    const sb = supabaseBrowser();
    if (!sb) return; // sem envs ainda
    sb.auth.getUser().then(({ data }) => setUser(data.user));
  }, []);

  if (!user) return <main className="p-6">Carregando...</main>;

  async function signOut() { 
    const sb = supabaseBrowser(); 
    if (sb) await sb.auth.signOut(); 
    window.location.href = '/login'; 
  }

  return (
    <main className="p-6 space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <button onClick={signOut} className="border rounded px-3 py-2">
          Sair
        </button>
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        <Link className="border rounded p-4 block" href="/clients">
          Clientes
        </Link>
        <Link className="border rounded p-4 block" href="/projects">
          Projetos
        </Link>
      </div>
    </main>
  );
}
