import { useEffect, useState } from 'react';
import { supabaseBrowser } from '@/lib/supabaseClient';

export default function DebugRLS() {
  const [data, setData] = useState({
    user: null,
    agencies: [],
    clients: [],
    projects: [],
    posts: [],
  });
  const [err, setErr] = useState(null);

  useEffect(() => {
    (async () => {
      const sb = supabaseBrowser();
      if (!sb) {
        setErr('Supabase não configurado');
        return;
      }

      const { data: u } = await sb.auth.getUser();
      const user = u?.user || null;

      try {
        const { data: agencies, error: e1 } = await sb
          .from('agencies')
          .select('*')
          .order('created_at', { ascending: false });
        if (e1) throw e1;

        const { data: clients, error: e2 } = await sb
          .from('clients')
          .select('*')
          .order('created_at', { ascending: false });
        if (e2) throw e2;

        const { data: projects, error: e3 } = await sb
          .from('projects')
          .select('*')
          .order('created_at', { ascending: false });
        if (e3) throw e3;

        const { data: posts, error: e4 } = await sb
          .from('posts')
          .select('id, project_id, date, title, status')
          .order('date');
        if (e4) throw e4;

        setData({ user, agencies, clients, projects, posts });
      } catch (e) {
        setErr(e.message);
      }
    })();
  }, []);

  if (err)
    return (
      <main className='p-6'>
        <p className='text-red-600'>Erro: {err}</p>
      </main>
    );

  if (!data.user) return <main className='p-6'>Carregando sessão…</main>;

  return (
    <main className='p-6 space-y-6'>
      <h1 className='text-2xl font-bold'>Debug RLS</h1>

      <section>
        <h2 className='text-lg font-semibold'>User</h2>
        <pre className='bg-neutral-100 p-3 rounded'>
          {JSON.stringify(
            {
              id: data.user.id,
              email: data.user.email,
            },
            null,
            2
          )}
        </pre>
      </section>

      <section>
        <h2 className='text-lg font-semibold'>Agencies</h2>
        <pre className='bg-neutral-100 p-3 rounded'>
          {JSON.stringify(data.agencies, null, 2)}
        </pre>
      </section>

      <section>
        <h2 className='text-lg font-semibold'>Clients</h2>
        <pre className='bg-neutral-100 p-3 rounded'>
          {JSON.stringify(data.clients, null, 2)}
        </pre>
      </section>

      <section>
        <h2 className='text-lg font-semibold'>Projects</h2>
        <pre className='bg-neutral-100 p-3 rounded'>
          {JSON.stringify(data.projects, null, 2)}
        </pre>
      </section>

      <section>
        <h2 className='text-lg font-semibold'>Posts</h2>
        <pre className='bg-neutral-100 p-3 rounded'>
          {JSON.stringify(data.posts, null, 2)}
        </pre>
      </section>
    </main>
  );
}
