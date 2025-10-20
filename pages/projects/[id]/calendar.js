import { useEffect, useState, useMemo } from 'react';
import Link from 'next/link';
import Layout from '@/components/Layout';
import { supabaseBrowser } from '@/lib/supabaseClient';
import MonthCalendar from '@/components/MonthCalendar';
import EditOnePostModal from '@/components/EditOnePostModal';
import PostModal from '@/components/PostModal';

export default function ProjectCalendar() {
  const [project, setProject] = useState(null);
  const [posts, setPosts] = useState([]);
  const [statusFilter, setStatusFilter] = useState({
    'A criar': true,
    'Em revisão': true,
    Aprovado: true,
    Ajustar: true,
  });
  const [reviewOpen, setReviewOpen] = useState(false);
  const [reviewPost, setReviewPost] = useState(null);
  const [openPost, setOpenPost] = useState(null);

  useEffect(() => {
    (async () => {
      const sb = supabaseBrowser();
      const id = window.location.pathname
        .split('/projects/')[1]
        .split('/calendar')[0];
      const { data: proj } = await sb
        .from('projects')
        .select('*')
        .eq('id', id)
        .maybeSingle();
      setProject(proj || null);
      await loadPosts(id);
    })();
  }, []);

  async function loadPosts(projectId) {
    const sb = supabaseBrowser();
    const { data, error } = await sb
      .from('posts')
      .select('id, date, title, arte, legenda, cta, status')
      .eq('project_id', projectId)
      .order('date', { ascending: true });
    if (!error) setPosts(data || []);
  }

  const filteredPosts = useMemo(
    () => posts.filter(p => statusFilter[p.status]),
    [posts, statusFilter]
  );

  function toggleStatus(key) {
    setStatusFilter(s => ({ ...s, [key]: !s[key] }));
  }

  async function handleDrop(postId, newDate) {
    try {
      const sb = supabaseBrowser();
      const { error } = await sb
        .from('posts')
        .update({ date: newDate })
        .eq('id', postId)
        .select('id');
      if (error) throw error;
      await loadPosts(project.id);
    } catch (e) {
      alert(e.message);
    }
  }

  function handleAdd(dateStr) {
    // cria um post manual via modal de revisão
    setReviewPost({
      date: dateStr,
      title: '',
      arte: 'Estático: ',
      legenda: '',
      cta: '',
      status: 'A criar',
      __origin: 'staged',
    });
    setReviewOpen(true);
  }

  const holidays = []; // opcional: integrar com sugestões/aprovados futuramente

  return (
    <Layout>
      <div className='flex items-center justify-between mb-3'>
        <div>
          <h1 className='text-xl font-semibold'>
            Calendário — {project?.name || ''}
          </h1>
          <div className='text-sm text-neutral-500'>{project?.month}</div>
        </div>
        <div className='flex items-center gap-2'>
          <Link
            href={`/projects/${project?.id}/kanban`}
            className='border rounded px-2 py-1 text-sm hover:bg-neutral-50'
          >
            Voltar ao Kanban
          </Link>
        </div>
      </div>

      <div className='mb-3 flex flex-wrap items-center gap-2 text-sm'>
        <span className='text-neutral-500 mr-2'>Filtros status:</span>
        {Object.keys(statusFilter).map(k => (
          <label key={k} className='inline-flex items-center gap-1'>
            <input
              type='checkbox'
              checked={!!statusFilter[k]}
              onChange={() => toggleStatus(k)}
            />{' '}
            {k}
          </label>
        ))}
      </div>

      <MonthCalendar
        month={project?.month || new Date().toISOString().slice(0, 7)}
        posts={filteredPosts}
        holidays={holidays}
        onDropPost={handleDrop}
        onAddPost={handleAdd}
        onOpenPost={p => setOpenPost(p)}
      />

      <EditOnePostModal
        open={reviewOpen}
        initialPost={reviewPost}
        onCancel={() => {
          setReviewOpen(false);
          setReviewPost(null);
        }}
        onInsert={async edited => {
          try {
            const sb = supabaseBrowser();
            const row = {
              project_id: project.id,
              date: edited.date,
              title: edited.title,
              arte: edited.arte,
              legenda: edited.legenda,
              cta: edited.cta || null,
              status: 'A criar',
            };
            const { error } = await sb.from('posts').insert(row);
            if (error) throw error;
            setReviewOpen(false);
            setReviewPost(null);
            await loadPosts(project.id);
            alert('Post inserido no calendário.');
          } catch (e) {
            alert(e.message);
          }
        }}
        onSavePreview={null}
      />

      {/* Modal de edição completa do post (existente) */}
      <PostModal
        project={project}
        openPost={openPost}
        onClose={() => {
          setOpenPost(null);
        }}
        onSaved={() => {
          if (project?.id) loadPosts(project.id);
        }}
      />
    </Layout>
  );
}
