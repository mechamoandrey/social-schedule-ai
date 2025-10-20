import { useEffect, useState } from 'react';
import Layout from '@/components/Layout';
import { supabaseBrowser } from '@/lib/supabaseClient';
import { useRequireAuth } from '@/lib/auth';

export default function Agencies() {
  const { user, loading } = useRequireAuth();
  const [list, setList] = useState([]);
  const [name, setName] = useState('');
  const [err, setErr] = useState('');

  useEffect(() => {
    if (!loading && user) {
      load();
    }
  }, [loading, user]);

  async function load() {
    const sb = supabaseBrowser();
    const { data, error } = await sb
      .from('agencies')
      .select('*')
      .order('created_at', { ascending: false });
    if (error) setErr(error.message);
    else setList(data || []);
  }

  async function createAgency(e) {
    e.preventDefault();
    setErr('');
    const sb = supabaseBrowser();
    const { data: me } = await sb.auth.getUser();
    const { error } = await sb
      .from('agencies')
      .insert({ name, created_by: me.user.id });
    if (error) setErr(error.message);
    else {
      setName('');
      await load();
    }
  }

  if (loading) return <main className='p-6'>Carregando…</main>;

  return (
    <Layout>
      <h1 className='text-2xl font-bold mb-4'>Agências</h1>

      <form onSubmit={createAgency} className='flex gap-2 mb-4'>
        <input
          className='border rounded px-3 py-2 flex-1'
          placeholder='Nome da agência'
          value={name}
          onChange={e => setName(e.target.value)}
        />
        <button className='border rounded px-3 py-2'>Criar</button>
      </form>

      {err && <p className='text-red-600 text-sm mb-2'>{err}</p>}

      <ul className='space-y-2'>
        {list.map(a => (
          <li key={a.id} className='border rounded p-3 bg-white'>
            <div className='font-medium'>{a.name}</div>
            <div className='text-xs text-neutral-500'>id: {a.id}</div>
          </li>
        ))}
      </ul>
    </Layout>
  );
}
