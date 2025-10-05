import { useState, useEffect } from 'react';

export default function EditOnePostModal({ open, initialPost, onCancel, onInsert, onSavePreview }) {
  const [post, setPost] = useState(initialPost || null);
  const [error, setError] = useState('');

  // mantém metadados de origem/índice, se existirem
  useEffect(() => { 
    setPost(initialPost || null); 
    setError(''); 
  }, [initialPost, open]);
  
  if (!open || !post) return null;

  function setField(k, v) { 
    setPost(p => ({ ...p, [k]: v })); 
  }

  function validate() {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(post.date || '')) return 'Data deve ser YYYY-MM-DD';
    if (!post.title || post.title.length < 5 || post.title.length > 90) return 'Título deve ter 5–90 caracteres';
    if (!post.arte || post.arte.length > 200) return 'Arte é obrigatória e ≤ 200 caracteres';
    if (!/^\s*(Carrossel:|Estático:)\s*/i.test(post.arte)) return 'Arte deve começar com "Carrossel:" ou "Estático:"';
    if (!post.legenda || post.legenda.length > 500) return 'Legenda é obrigatória e ≤ 500 caracteres';
    if (post.cta && post.cta.length > 150) return 'CTA deve ter ≤ 150 caracteres';
    return '';
  }

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/40 p-4">
      <div className="bg-white w-full max-w-2xl rounded-xl shadow-lg overflow-hidden">
        <div className="px-4 py-3 border-b flex items-center justify-between">
          <h3 className="font-semibold">Revisar post antes de inserir</h3>
          <button onClick={onCancel} className="text-sm px-2 py-1 rounded border hover:bg-neutral-50">
            Fechar
          </button>
        </div>
        <div className="p-4 space-y-3">
          {error && <p className="text-red-600 text-sm">{error}</p>}
          
          <div className="grid md:grid-cols-2 gap-3">
            <label className="text-sm">
              <span className="block text-sm font-medium mb-1">Data do post (YYYY-MM-DD)</span>
              <input 
                className="border rounded px-3 py-2 w-full" 
                value={post.date || ''} 
                onChange={e => setField('date', e.target.value)} 
              />
            </label>
            <label className="text-sm md:col-span-2">
              <span className="block text-sm font-medium mb-1">Título (5–90)</span>
              <input 
                className="border rounded px-3 py-2 w-full" 
                value={post.title || ''} 
                onChange={e => setField('title', e.target.value)} 
              />
            </label>
            <label className="text-sm md:col-span-2">
              <span className="block text-sm font-medium mb-1">Arte (comece com "Carrossel:" ou "Estático:", ≤ 200)</span>
              <input 
                className="border rounded px-3 py-2 w-full" 
                value={post.arte || ''} 
                onChange={e => setField('arte', e.target.value)} 
              />
            </label>
            <label className="text-sm md:col-span-2">
              <span className="block text-sm font-medium mb-1">Legenda (≤ 500)</span>
              <textarea 
                className="border rounded px-3 py-2 w-full" 
                rows="4" 
                value={post.legenda || ''} 
                onChange={e => setField('legenda', e.target.value)} 
              />
            </label>
            <label className="text-sm md:col-span-2">
              <span className="block text-sm font-medium mb-1">CTA (opcional, ≤ 150)</span>
              <input 
                className="border rounded px-3 py-2 w-full" 
                value={post.cta || ''} 
                onChange={e => setField('cta', e.target.value)} 
              />
            </label>
          </div>
          
          <div className="flex gap-2">
            <button 
              onClick={() => { 
                const err = validate(); 
                if (err) return setError(err); 
                onSavePreview && onSavePreview(post); 
              }} 
              className="border rounded px-3 py-2 hover:bg-neutral-50"
            >
              Salvar no preview
            </button>
            <button 
              onClick={() => { 
                const err = validate(); 
                if (err) return setError(err); 
                onInsert && onInsert(post); 
              }} 
              className="border rounded px-3 py-2 hover:bg-neutral-50"
            >
              Inserir post
            </button>
            <button 
              onClick={onCancel} 
              className="border rounded px-3 py-2 hover:bg-neutral-50"
            >
              Cancelar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
