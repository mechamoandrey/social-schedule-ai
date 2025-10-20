import { useEffect, useState } from 'react';
import Link from 'next/link';
import Layout from '@/components/Layout';
import { supabaseBrowser } from '@/lib/supabaseClient';

export default function Projects() {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState('');

  useEffect(() => {
    (async () => {
      try {
        const sb = supabaseBrowser();
        // pega projetos das agências onde o usuário é membro (RLS já filtra)
        const { data, error } = await sb
          .from('projects')
          .select('id, name, month, clients(name), agencies(name)')
          .order('created_at', { ascending: false });
        if (error) throw error;
        setProjects(data || []);
      } catch (e) {
        setErr(e.message);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  return (
    <Layout>
      <h1 className='text-xl font-semibold mb-3'>Projetos</h1>
      {loading && <div>Carregando…</div>}
      {err && <div className='text-red-600 text-sm'>{err}</div>}
      {!loading && !projects?.length && (
        <div className='text-sm text-neutral-600'>
          Nenhum projeto disponível.
        </div>
      )}
      <ul className='grid md:grid-cols-2 gap-3'>
        {projects.map(p => (
          <li key={p.id} className='border rounded p-3 bg-white'>
            <div className='text-sm font-medium'>{p.name}</div>
            <div className='text-xs text-neutral-600'>Mês: {p.month}</div>
            <div className='text-xs text-neutral-500'>
              Cliente: {p.clients?.name || '—'}
            </div>
            <div className='text-xs text-neutral-500'>
              Agência: {p.agencies?.name || '—'}
            </div>
            <div className='mt-2'>
              <Link
                href={`/projects/${p.id}/kanban`}
                className='text-xs border rounded px-2 py-1 hover:bg-neutral-50'
              >
                Abrir Kanban
              </Link>
            </div>
          </li>
        ))}
      </ul>
    </Layout>
  );
}
