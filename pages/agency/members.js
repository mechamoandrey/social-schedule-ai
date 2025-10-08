import { useEffect, useState } from 'react';
import Layout from '@/components/Layout';
import { supabaseBrowser } from '@/lib/supabaseClient';

export default function Members() {
  const [user, setUser] = useState(null);
  const [agencies, setAgencies] = useState([]);
  const [selectedAid, setSelectedAid] = useState('');
  const [agency, setAgency] = useState(null);
  const [members, setMembers] = useState([]);
  const [invites, setInvites] = useState([]);
  const [formInvite, setFormInvite] = useState({ email: '', role: 'social_media', days: 14 });
  const [newAgencyName, setNewAgencyName] = useState('Minha Agência');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      setLoading(true);
      const sb = supabaseBrowser();
      const { data: u } = await sb.auth.getUser();
      setUser(u?.user || null);
      if (!u?.user) { 
        setLoading(false); 
        return; 
      }

      // Liste apenas agências onde você é membro (RLS já filtra)
      const { data: ags, error: eAgs } = await sb
        .from('agencies')
        .select('id, name, created_at')
        .order('created_at');
      if (!eAgs) { 
        setAgencies(ags || []); 
      }

      // Se existir pelo menos uma, selecione a primeira
      const aid = (ags && ags[0]?.id) || '';
      setSelectedAid(aid);
      if (aid) await loadAgencyData(sb, aid);

      setLoading(false);
    })();
  }, []);

  async function loadAgencyData(sb, aid) {
    try {
      // Agência
      const { data: a, error: eA } = await sb
        .from('agencies')
        .select('*')
        .eq('id', aid)
        .maybeSingle();
      if (eA) console.error('agencies error:', eA);
      setAgency(a || null);
  
      // Membros (via RPC security definer)
      const { data: ms, error: eM } = await sb.rpc('list_agency_members', { p_agency_id: aid });
      if (eM) console.error('list_agency_members error:', eM);
      const membersSorted = (Array.isArray(ms) ? ms : []).sort(
        (x, y) => new Date(x.created_at) - new Date(y.created_at)
      );
      setMembers(membersSorted);
  
      // Convites (via RPC security definer)
      const { data: iv, error: eI } = await sb.rpc('list_invitations', { p_agency_id: aid });
      if (eI) console.error('list_invitations error:', eI);
      const invitesSorted = (Array.isArray(iv) ? iv : []).sort(
        (x, y) => new Date(y.created_at) - new Date(x.created_at)
      );
      setInvites(invitesSorted);
    } catch (err) {
      console.error('loadAgencyData fatal:', err);
      // opcional: feedback ao usuário
      // alert('Não foi possível carregar os dados da agência.');
    }
  }
  
  async function handleSelectAid(aid) {
    setSelectedAid(aid);
    const sb = supabaseBrowser();
    await loadAgencyData(sb, aid);
  }

  async function createAgency(ev) {
    ev.preventDefault();
    try {
      const sb = supabaseBrowser();
      if (!user) { 
        alert('Faça login.'); 
        return; 
      }
      const name = newAgencyName?.trim();
      if (!name) { 
        alert('Informe um nome.'); 
        return; 
      }
      const { data, error } = await sb
        .from('agencies')
        .insert({ name })
        .select('id, name')
        .single();
      if (error) throw error;
      
      // Trigger adiciona você como admin em agency_members
      const aid = data.id;
      
      // Recarrega lista de agências
      const { data: ags } = await sb
        .from('agencies')
        .select('id, name, created_at')
        .order('created_at');
      setAgencies(ags || []);
      setSelectedAid(aid);
      await loadAgencyData(sb, aid);
    } catch (e) { 
      alert(e.message); 
    }
  }

  async function createInvite(ev) {
    ev.preventDefault();
    if (!selectedAid) {
      alert('Selecione uma agência.');
      return;
    }
    if (!formInvite.email?.trim()) {
      alert('Informe um e-mail válido.');
      return;
    }
  
    try {
      setLoading(true); // opcional se você tiver um state de loading
      const sb = supabaseBrowser();
  
      const { data, error } = await sb.rpc('create_invitation', {
        p_agency_id: selectedAid,
        p_email: formInvite.email.trim(),
        p_role: formInvite.role,
        p_days: Number(formInvite.days || 14),
      });
      if (error) throw error;
  
      const row = Array.isArray(data) ? data[0] : data;
      if (!row?.invite_token) {
        console.error('Resposta inesperada da RPC create_invitation:', data);
        alert('Não foi possível gerar o link do convite. Tente novamente.');
        return;
      }
  
      // recarrega a lista (convites + membros)
      await loadAgencyData(sb, selectedAid);
  
      // monta e copia o link
      const url = `${window.location.origin}/invite/${row.invite_token}`;
      await navigator.clipboard.writeText(url);
  
      // feedback ao usuário
      alert('Convite criado! Link copiado para a área de transferência.');
  
      // limpa o form
      setFormInvite({ email: '', role: 'social_media', days: 14 });
    } catch (e) {
      alert(e.message || 'Erro ao criar convite');
    } finally {
      setLoading?.(false); // opcional
    }
  }
  
  if (loading) {
    return (
      <Layout>
        <div>Carregando…</div>
      </Layout>
    );
  }

  if (!user) {
    return (
      <Layout>
        <h1 className="text-xl font-semibold mb-2">Membros da agência</h1>
        <p className="text-sm text-neutral-600">
          Você precisa estar autenticado para acessar esta página.
        </p>
      </Layout>
    );
  }

  return (
    <Layout>
      <h1 className="text-xl font-semibold mb-2">Membros da agência</h1>

      {/* Se não houver agência, mostre criador */}
      {!agencies?.length ? (
        <section className="border rounded p-3 bg-white">
          <h2 className="font-semibold text-sm mb-2">Criar sua primeira agência</h2>
          <form onSubmit={createAgency} className="flex items-center gap-2">
            <input 
              className="border rounded px-3 py-2 text-sm w-64" 
              value={newAgencyName} 
              onChange={e => setNewAgencyName(e.target.value)} 
              placeholder="Nome da agência" 
            />
            <button className="border rounded px-3 py-2 text-sm hover:bg-neutral-50">
              Criar
            </button>
          </form>
        </section>
      ) : (
        <>
          {/* seletor de agência (se houver mais de uma) */}
          <div className="mb-3 flex items-center gap-2">
            <label className="text-sm">Agência:</label>
            <select 
              className="border rounded px-2 py-1 text-sm" 
              value={selectedAid} 
              onChange={e => handleSelectAid(e.target.value)}
            >
              {agencies.map(a => (
                <option key={a.id} value={a.id}>{a.name}</option>
              ))}
            </select>
          </div>

          <div className="text-sm text-neutral-600 mb-4">{agency?.name}</div>

          <div className="grid md:grid-cols-2 gap-4">
            <section className="border rounded p-3 bg-white">
              <h2 className="font-semibold mb-2 text-sm">Convidar novo membro</h2>
              <form onSubmit={createInvite} className="space-y-2">
                <label className="text-sm block">
                  <span className="block text-sm font-medium mb-1">E-mail</span>
                  <input 
                    required 
                    type="email" 
                    className="border rounded px-3 py-2 w-full" 
                    value={formInvite.email} 
                    onChange={e => setFormInvite(f => ({ ...f, email: e.target.value }))} 
                  />
                </label>
                <label className="text-sm block">
                  <span className="block text-sm font-medium mb-1">Papel</span>
                  <select 
                    className="border rounded px-3 py-2 w-full" 
                    value={formInvite.role} 
                    onChange={e => setFormInvite(f => ({ ...f, role: e.target.value }))}
                  >
                    <option value="social_media">Social media</option>
                    <option value="client_viewer">Cliente (apenas aprovação)</option>
                    <option value="agency_admin">Administrador</option>
                  </select>
                </label>
                <label className="text-sm block">
                  <span className="block text-sm font-medium mb-1">Validade do convite (dias)</span>
                  <input 
                    type="number" 
                    min="1" 
                    className="border rounded px-3 py-2 w-full" 
                    value={formInvite.days} 
                    onChange={e => setFormInvite(f => ({ ...f, days: e.target.value }))} 
                  />
                </label>
                <button className="border rounded px-3 py-2 text-sm hover:bg-neutral-50">
                  Gerar convite
                </button>
              </form>
            </section>

            <section className="border rounded p-3 bg-white">
              <h2 className="font-semibold mb-2 text-sm">Convites</h2>
              {!invites?.length && (
                <div className="text-sm text-neutral-500">Nenhum convite.</div>
              )}
              <ul className="space-y-2">
                {(invites || []).map(iv => { 
                  const status = iv.accepted_at ? 'accepted' : 
                    (new Date() > new Date(iv.expires_at) ? 'expired' : 'pending'); 
                  return (
                    <li key={iv.id} className="border rounded p-2 text-sm flex items-center justify-between">
                      <div>
                        <div className="font-medium">{iv.email}</div>
                        <div className="text-xs text-neutral-600">
                          Papel: {iv.role} · Expira: {new Date(iv.expires_at).toLocaleDateString()} · Status: {status}
                        </div>
                      </div>
                      <button 
                        className="text-xs border rounded px-2 py-1 hover:bg-neutral-50" 
                        onClick={async () => { 
                          const url = `${window.location.origin}/invite/${iv.token}`; 
                          await navigator.clipboard.writeText(url); 
                          alert('Link copiado'); 
                        }}
                      >
                        Copiar link
                      </button>
                    </li>
                  ); 
                })}
              </ul>
            </section>
          </div>

          <section className="border rounded p-3 bg-white mt-4">
            <h2 className="font-semibold mb-2 text-sm">Membros</h2>
            {!members?.length && (
              <div className="text-sm text-neutral-500">Sem membros.</div>
            )}
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-neutral-500">
                  <th className="py-1">Usuário</th>
                  <th className="py-1">Papel</th>
                  <th className="py-1">Entrou em</th>
                </tr>
              </thead>
              <tbody>
                {members?.map((m, i) => (
                  <tr key={i} className="border-t">
                    <td className="py-1">{m.user_id}</td>
                    <td className="py-1">{m.role}</td>
                    <td className="py-1">{new Date(m.created_at).toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>
        </>
      )}
    </Layout>
  );
}