import { useEffect, useState } from 'react';
import Layout from '@/components/Layout';
import { supabaseBrowser } from '@/lib/supabaseClient';
import { useRequireAuth } from '@/lib/auth';

const DEFAULT_TZ =
  process.env.NEXT_PUBLIC_APP_DEFAULT_TIMEZONE || 'America/Sao_Paulo';

export default function Clients() {
  const { user, loading } = useRequireAuth();
  const [agencies, setAgencies] = useState([]);
  const [list, setList] = useState([]);
  const [form, setForm] = useState({
    agency_id: '',
    name: '',
    website: '',
    timezone: DEFAULT_TZ,
  });
  const [err, setErr] = useState('');

  useEffect(() => {
    if (!loading && user) {
      loadAgencies();
      load();
    }
  }, [loading, user]);

  async function loadAgencies() {
    const sb = supabaseBrowser();
    const { data } = await sb
      .from('agencies')
      .select('id,name')
      .order('created_at', { ascending: false });
    setAgencies(data || []);
    if (data?.length && !form.agency_id) {
      setForm(f => ({ ...f, agency_id: data[0].id }));
    }
  }

  async function load() {
    const sb = supabaseBrowser();
    const { data, error } = await sb
      .from('clients')
      .select('*')
      .order('created_at', { ascending: false });
    if (error) setErr(error.message);
    else setList(data || []);
  }

  async function createClient(e) {
    e.preventDefault();
    setErr('');
    const sb = supabaseBrowser();
    const payload = { ...form };
    if (!payload.agency_id || !payload.name) {
      setErr('Selecione uma agência e informe o nome');
      return;
    }
    const { error } = await sb.from('clients').insert(payload);
    if (error) setErr(error.message);
    else {
      setForm(f => ({ ...f, name: '', website: '' }));
      await load();
    }
  }

  if (loading) return <main className='p-6'>Carregando…</main>;

  return (
    <Layout>
      <h1 className='text-2xl font-bold mb-4'>Clientes</h1>

      <form onSubmit={createClient} className='grid md:grid-cols-4 gap-2 mb-4'>
        <select
          className='border rounded px-3 py-2'
          value={form.agency_id}
          onChange={e => setForm(f => ({ ...f, agency_id: e.target.value }))}
        >
          <option value=''>Selecione a agência…</option>
          {agencies.map(a => (
            <option key={a.id} value={a.id}>
              {a.name}
            </option>
          ))}
        </select>

        <input
          className='border rounded px-3 py-2'
          placeholder='Nome do cliente'
          value={form.name}
          onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
        />

        <input
          className='border rounded px-3 py-2'
          placeholder='Website (opcional)'
          value={form.website}
          onChange={e => setForm(f => ({ ...f, website: e.target.value }))}
        />

        <input
          className='border rounded px-3 py-2'
          placeholder='Timezone'
          value={form.timezone}
          onChange={e => setForm(f => ({ ...f, timezone: e.target.value }))}
        />

        <button className='border rounded px-3 py-2 md:col-span-4'>
          Criar cliente
        </button>
      </form>

      {err && <p className='text-red-600 text-sm mb-2'>{err}</p>}

      <ul className='space-y-2'>
        {list.map(c => (
          <li key={c.id} className='border rounded p-3 bg-white'>
            <div className='font-medium'>{c.name}</div>
            <div className='text-xs text-neutral-500'>
              agency: {c.agency_id} • tz: {c.timezone} • id: {c.id}
            </div>
          </li>
        ))}
      </ul>
    </Layout>
  );
}
