// pages/dev/index.js
import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import Layout from '@/components/Layout';
import { supabaseBrowser } from '@/lib/supabaseClient';
import { useAiUsage } from '@/hooks/useAiUsage';
import AiUsageBanner from '@/components/AiUsageBanner';

const DEMO = [
  { role: 'agency_admin',  email: 'admin@demo.local',   password: 'demo1234', label: 'Admin' },
  { role: 'social_media',  email: 'sm@demo.local',      password: 'demo1234', label: 'Social Media' },
  { role: 'client_viewer', email: 'cliente@demo.local', password: 'demo1234', label: 'Cliente' },
];

export default function DevHub() {
  const [me, setMe] = useState(null);
  const [projects, setProjects] = useState([]);
  const [selected, setSelected] = useState('');
  const [reviewLinks, setReviewLinks] = useState([]);
const selectedProject = useMemo(() => projects.find(p => p.id === selected) || null, [projects, selected]);
const usage = useAiUsage(selectedProject?.agency_id);
  const [creating, setCreating] = useState(false);
  const [err, setErr] = useState('');

  const sb = useMemo(() => supabaseBrowser(), []);
  const latestReviewPath = useMemo(
    () => (reviewLinks?.[0]?.token ? `/review/${reviewLinks[0].token}` : null),
    [reviewLinks]
  );

  useEffect(() => {
    (async () => {
      try {
        const { data: u } = await sb.auth.getUser();
        setMe(u?.user || null);

        const { data: ps, error: eP } = await sb
          .from('projects')
          .select('id, name, month, agency_id, client_id, clients(name)')
          .order('created_at', { ascending: false });
        if (eP) throw eP;
        setProjects(ps || []);
        if (ps?.length && !selected) setSelected(ps[0].id);
      } catch (e) {
        setErr(e.message);
      }
    })();
  }, [sb]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!selected) return;
    (async () => {
      try {
        // Carrega últimos links (somente se o usuário tem permissão — admin na agência)
        const { data, error } = await sb
          .from('review_links')
          .select('id, token, expires_at, disabled, created_at')
          .eq('project_id', selected)
          .order('created_at', { ascending: false })
          .limit(5);
        if (error) {
          // Se não for admin, silencie
          setReviewLinks([]);
          return;
        }
        setReviewLinks(data || []);
      } catch {
        setReviewLinks([]);
      }
    })();
  }, [sb, selected]);

  async function quickLogin(email, password) {
    try {
      await sb.auth.signOut();
      const { error } = await sb.auth.signInWithPassword({ email, password });
      if (error) throw error;
      const { data: u } = await sb.auth.getUser();
      setMe(u?.user || null);
      alert('Logado como ' + email);

      // recarrega projetos sob esse usuário
      const { data: ps } = await sb
        .from('projects')
        .select('id, name, month, agency_id, client_id, clients(name)')
        .order('created_at', { ascending: false });
      setProjects(ps || []);
      if (ps?.length) setSelected(ps[0].id);

      // recarrega links do projeto selecionado (se houver)
      if (ps?.[0]?.id) {
        const { data } = await sb
          .from('review_links')
          .select('id, token, expires_at, disabled, created_at')
          .eq('project_id', ps[0].id)
          .order('created_at', { ascending: false })
          .limit(5);
        setReviewLinks(data || []);
      } else {
        setReviewLinks([]);
      }
    } catch (e) {
      alert(e.message);
    }
  }

  async function signOut() {
    await sb.auth.signOut();
    setMe(null);
    setProjects([]);
    setSelected('');
    setReviewLinks([]);
  }

  async function createReviewLink() {
    if (!selected) return;
    try {
      setCreating(true);
      const { data, error } = await sb.rpc('create_review_link', {
        p_project_id: selected,
        p_days: 14,
      });
      if (error) throw error;
      const row = Array.isArray(data) ? data[0] : data;
      const url = `${window.location.origin}/review/${row.link_token}`;
      await navigator.clipboard.writeText(url);
      alert('Link criado e copiado!');

      const { data: list } = await sb
        .from('review_links')
        .select('id, token, expires_at, disabled, created_at')
        .eq('project_id', selected)
        .order('created_at', { ascending: false })
        .limit(5);
      setReviewLinks(list || []);
    } catch (e) {
      alert(e.message);
    } finally {
      setCreating(false);
    }
  }

  return (
    <Layout>
      <div className="mb-4 rounded border p-3 bg-amber-50 text-amber-900 text-sm">
        <div className="font-medium">Ambiente de desenvolvimento</div>
        <div>Use apenas localmente. Em produção, desabilite esta página.</div>
      </div>

      <h1 className="text-xl font-semibold mb-3">DEV Hub</h1>
      {err && <div className="text-red-600 text-sm mb-3">{err}</div>}

      <div className="grid md:grid-cols-3 gap-4">
        {/* Coluna 1: Login rápido / Sessão */}
        <section className="border rounded p-3 bg-white">
          <div className="text-sm font-medium mb-2">Sessão atual</div>
          <div className="text-xs text-neutral-600 break-all">
            {me ? (
              <>
                <div>
                  <b>Email:</b> {me.email}
                </div>
                <div>
                  <b>User ID:</b> {me.id}
                </div>
              </>
            ) : (
              'Não logado'
            )}
          </div>

          <div className="mt-3 text-sm font-medium mb-2">Login rápido (DEV)</div>
          <div className="flex flex-col gap-2">
            {DEMO.map((d) => (
              <button
                key={d.email}
                onClick={() => quickLogin(d.email, d.password)}
                className="text-xs border rounded px-2 py-1"
              >
                Entrar como {d.label}
              </button>
            ))}
            <button onClick={signOut} className="text-xs border rounded px-2 py-1">
              Sair
            </button>
          </div>
        </section>

        {/* Coluna 2: Projetos & ações */}
        <section className="border rounded p-3 bg-white">
          <div className="text-sm font-medium mb-2">Projetos acessíveis</div>
          <select
            className="border rounded px-2 py-1 text-sm w-full"
            value={selected}
            onChange={(e) => setSelected(e.target.value)}
          >
            {!projects?.length && <option value="">Nenhum projeto</option>}
            {projects.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name} — {p.clients?.name || 'Cliente'} ({p.month})
              </option>
            ))}
          </select>

          <div className="mt-2 text-xs text-neutral-700">
  {selectedProject ? (
    <>Plano IA: <b>{usage?.data?.plan_name || '—'}</b> • Uso: <b>{usage?.used ?? 0}/{usage?.quota ?? 0}</b> {usage?.level === 'warn' ? '(atenção)' : usage?.level === 'block' ? '(bloqueado)' : ''}</>
  ) : (
    <>Selecione um projeto para ver a cota de IA.</>
  )}
</div>
<div className="mt-3 flex flex-wrap gap-2">
            {selected && (
              <>
                <Link href={`/projects/${selected}/kanban`} className="text-xs border rounded px-2 py-1">
                  Abrir Kanban
                </Link>
                <Link href={`/projects/${selected}/calendar`} className="text-xs border rounded px-2 py-1">
                  Calendário
                </Link>
              </>
            )}
            <Link href="/projects" className="text-xs border rounded px-2 py-1">
              Listar Projetos
            </Link>
            <Link href="/agency/members" className="text-xs border rounded px-2 py-1">
              Membros & Convites
            </Link>
          </div>

          {!usage?.loading && usage?.data ? (
  <div className="mt-4">
    <AiUsageBanner usage={usage} />
  </div>
) : null}

<div className="mt-4 text-sm font-medium mb-1">Link público de revisão</div>
          <div className="flex items-center gap-2">
            <button
              disabled={!selected || creating}
              onClick={createReviewLink}
              className="text-xs border rounded px-2 py-1"
            >
              Gerar link (14 dias)
            </button>
            {latestReviewPath && (
              <a
                href={latestReviewPath}
                target="_blank"
                rel="noreferrer"
                className="text-xs border rounded px-2 py-1"
              >
                Abrir último link
              </a>
            )}
          </div>

          <div className="mt-2 text-xs text-neutral-600">
            Últimos links do projeto selecionado (5):
          </div>
          <ul className="mt-1 space-y-2 text-xs">
            {reviewLinks?.map((rl) => (
              <li key={rl.id} className="border rounded p-2">
                <div className="flex justify-between gap-2">
                  <div>Expira: {new Date(rl.expires_at).toLocaleString()}</div>
                  <div>{rl.disabled ? 'DESATIVADO' : 'Ativo'}</div>
                </div>
                <div className="mt-1 break-all">/review/{rl.token}</div>
                <div className="mt-2 flex gap-2">
                  <a
                    className="text-xs border rounded px-2 py-1"
                    href={`/review/${rl.token}`}
                    target="_blank"
                    rel="noreferrer"
                  >
                    Abrir
                  </a>
                  <button
                    className="text-xs border rounded px-2 py-1"
                    onClick={async () => {
                      await navigator.clipboard.writeText(
                        `${window.location.origin}/review/${rl.token}`
                      );
                      alert('Copiado');
                    }}
                  >
                    Copiar
                  </button>
                </div>
              </li>
            ))}
            {!reviewLinks?.length && (
              <li className="text-neutral-500">Nenhum link recente (gere um acima).</li>
            )}
          </ul>
        </section>

        {/* Coluna 3: Manuais por perfil */}
        <section className="border rounded p-3 bg-white">
          <div className="text-sm font-medium mb-2">Manuais rápidos (atalhos)</div>

          <details className="mb-2">
            <summary className="cursor-pointer font-medium text-sm">
              Admin (agency_admin)
            </summary>
            <ul className="list-disc ml-5 text-xs mt-1 space-y-1">
              <li>
                <Link className="underline" href="/projects">
                  Abrir lista de projetos
                </Link>{' '}
                e entrar no projeto → Kanban.
              </li>
              {selected && (
                <li>
                  <Link className="underline" href={`/projects/${selected}/kanban`}>
                    Abrir Kanban do projeto selecionado
                  </Link>
                </li>
              )}
              <li>
                <Link className="underline" href="/agency/members">
                  Membros & Convites
                </Link>{' '}
                para convidar usuários.
              </li>
              <li>
                Gerar link de revisão aqui no DEV Hub ou no Kanban (botão “Gerar link de
                revisão”).
              </li>
              {latestReviewPath ? (
                <li>
                  <a className="underline" href={latestReviewPath} target="_blank" rel="noreferrer">
                    Abrir último link público do projeto
                  </a>{' '}
                  (vista do cliente)
                </li>
              ) : (
                <li className="text-neutral-500">
                  Sem link público ainda — gere um com o botão acima.
                </li>
              )}
            </ul>
          </details>

          <details className="mb-2">
            <summary className="cursor-pointer font-medium text-sm">Social Media</summary>
            <ul className="list-disc ml-5 text-xs mt-1 space-y-1">
              {selected && (
                <li>
                  <Link className="underline" href={`/projects/${selected}/kanban`}>
                    Abrir Kanban do projeto
                  </Link>{' '}
                  para criar/editar posts
                </li>
              )}
              <li>
                <Link className="underline" href="/help/cronogramas">
                  Ajuda: como gerar cronogramas
                </Link>
              </li>
              <li>Gerar conteúdo com IA no modal, revisar e inserir; usar Calendário para distribuir.</li>
            </ul>
          </details>

          <details>
            <summary className="cursor-pointer font-medium text-sm">
              Cliente (review público)
            </summary>
            <ul className="list-disc ml-5 text-xs mt-1 space-y-1">
              {latestReviewPath ? (
                <li>
                  <a className="underline" href={latestReviewPath} target="_blank" rel="noreferrer">
                    Abrir página pública de aprovação (todos os posts do projeto)
                  </a>
                </li>
              ) : (
                <li className="text-neutral-500">
                  Ainda não há link público — peça para o Admin gerar.
                </li>
              )}
              <li>Aprovar ou pedir ajustes post a post (comentário obrigatório ao pedir ajustes).</li>
              <li>As decisões refletem no Kanban da agência.</li>
            </ul>
          </details>
        </section>
      </div>
    </Layout>
  );
}
