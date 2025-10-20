export default function StagedDrafts({
  items = [],
  onEdit,
  onInsert,
  onRemove,
}) {
  if (!items || items.length === 0) return null;

  return (
    <div className='border rounded-lg p-3 bg-white space-y-2'>
      <div className='font-semibold text-sm'>Rascunhos (não inseridos)</div>
      <div className='grid md:grid-cols-2 gap-3'>
        {items.map((p, i) => (
          <article key={i} className='border rounded p-3'>
            <div className='flex items-center justify-between gap-2'>
              <h4 className='font-semibold text-sm line-clamp-2'>{p.title}</h4>
              <span className='text-xs px-2 py-0.5 rounded bg-neutral-100 whitespace-nowrap'>
                {p.date}
              </span>
            </div>
            <div className='mt-2 text-xs text-neutral-600'>
              <strong>Arte:</strong> {p.arte}
            </div>
            <p className='mt-2 text-sm whitespace-pre-wrap'>{p.legenda}</p>
            {p.cta ? (
              <div className='mt-2 text-xs'>
                <strong>CTA:</strong> {p.cta}
              </div>
            ) : null}
            <div className='mt-3 flex gap-2'>
              <button
                onClick={() => onEdit && onEdit(i)}
                className='border rounded px-2 py-1 text-xs hover:bg-neutral-50'
              >
                Editar
              </button>
              <button
                onClick={() => onInsert && onInsert(i)}
                className='border rounded px-2 py-1 text-xs hover:bg-neutral-50'
              >
                Inserir
              </button>
              <button
                onClick={() => onRemove && onRemove(i)}
                className='border rounded px-2 py-1 text-xs text-red-600 border-red-300 hover:bg-red-50'
              >
                Remover
              </button>
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}
