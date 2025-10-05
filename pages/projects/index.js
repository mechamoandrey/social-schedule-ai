import { useEffect, useMemo, useState } from 'react';
import Layout from '@/components/Layout';
import { supabaseBrowser } from '@/lib/supabaseClient';
import { useRequireAuth } from '@/lib/auth';

export default function Projects() {
  const { user, loading } = useRequireAuth();
  const [agencies, setAgencies] = useState([]);
  const [clients, setClients] = useState([]);
  const [list, setList] = useState([]);
  const [form, setForm] = useState({ 
    agency_id: '', 
    client_id: '', 
    name: '', 
    month: '', 
    starts_on: '', 
    ends_on: '' 
  });
  const [err, setErr] = useState('');

  useEffect(() => {
    if (!loading && user) { 
      loadAgencies(); 
      loadProjects(); 
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
      const aid = data[0].id; 
      setForm(f => ({ ...f, agency_id: aid })); 
      loadClients(aid); 
    }
  }

  async function loadClients(aid) {
    const sb = supabaseBrowser();
    const { data } = await sb
      .from('clients')
      .select('id,name')
      .eq('agency_id', aid)
      .order('created_at', { ascending: false });
    setClients(data || []);
    if (data?.length && !form.client_id) { 
      setForm(f => ({ ...f, client_id: data[0].id })); 
    }
  }

  async function loadProjects() {
    const sb = supabaseBrowser();
    const { data, error } = await sb
      .from('projects')
      .select('*')
      .order('created_at', { ascending: false });
    if (error) setErr(error.message);
    else setList(data || []);
  }

  async function createProject(e) {
    e.preventDefault();
    setErr('');
    const { agency_id, client_id, name, month, starts_on, ends_on } = form;
    if (!agency_id || !client_id || !name || !month) { 
      setErr('Preencha agência, cliente, nome e mês (YYYY-MM)'); 
      return; 
    }
    const sb = supabaseBrowser();
    const payload = { 
      agency_id, 
      client_id, 
      name, 
      month, 
      starts_on: starts_on || null, 
      ends_on: ends_on || null 
    };
    const { error } = await sb.from('projects').insert(payload);
    if (error) setErr(error.message);
    else { 
      setForm(f => ({ 
        ...f, 
        name: '', 
        month: '', 
        starts_on: '', 
        ends_on: '' 
      })); 
      await loadProjects(); 
    }
  }

  const monthPlaceholder = useMemo(() => 
    new Date().toISOString().slice(0, 7), 
    []
  );

  if (loading) return <main className="p-6">Carregando…</main>;

  return (
    <Layout>
      <h1 className="text-2xl font-bold mb-4">Projetos</h1>
      
      <form onSubmit={createProject} className="grid md:grid-cols-6 gap-2 mb-4">
        <select 
          className="border rounded px-3 py-2" 
          value={form.agency_id} 
          onChange={e => { 
            const v = e.target.value; 
            setForm(f => ({ ...f, agency_id: v })); 
            loadClients(v); 
          }}
        >
          <option value="">Agência…</option>
          {agencies.map(a => (
            <option key={a.id} value={a.id}>
              {a.name}
            </option>
          ))}
        </select>
        
        <select 
          className="border rounded px-3 py-2" 
          value={form.client_id} 
          onChange={e => setForm(f => ({ ...f, client_id: e.target.value }))}
        >
          <option value="">Cliente…</option>
          {clients.map(c => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
        
        <input 
          className="border rounded px-3 py-2" 
          placeholder="Nome do projeto" 
          value={form.name} 
          onChange={e => setForm(f => ({ ...f, name: e.target.value }))} 
        />
        
        <input 
          className="border rounded px-3 py-2" 
          placeholder={monthPlaceholder} 
          value={form.month} 
          onChange={e => setForm(f => ({ ...f, month: e.target.value }))} 
        />
        
        <input 
          className="border rounded px-3 py-2" 
          type="date" 
          value={form.starts_on} 
          onChange={e => setForm(f => ({ ...f, starts_on: e.target.value }))} 
        />
        
        <input 
          className="border rounded px-3 py-2" 
          type="date" 
          value={form.ends_on} 
          onChange={e => setForm(f => ({ ...f, ends_on: e.target.value }))} 
        />
        
        <button className="border rounded px-3 py-2 md:col-span-6">
          Criar projeto
        </button>
      </form>

      {err && <p className="text-red-600 text-sm mb-2">{err}</p>}

      <ul className="space-y-2">
        {list.map(p => (
          <li key={p.id} className="border rounded p-3 bg-white">
            <div className="font-medium">{p.name}</div>
            <div className="text-xs text-neutral-500">
              cliente: {p.client_id} • mês: {p.month} • id: {p.id}
            </div>
          </li>
        ))}
      </ul>
    </Layout>
  );
}
