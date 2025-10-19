export default function SchedulePreview({ schedule, onInsertOne, onEditOne }) {
  if (!schedule) return null;

  const posts = schedule.posts || [];

  return (
    <div className='space-y-3'>
      <div className='flex items-center justify-between'>
        <div>
          <div className='text-sm text-neutral-600'>Cliente</div>
          <div className='text-base font-semibold'>{schedule.client}</div>
        </div>
        <div className='text-right'>
          <div className='text-sm text-neutral-600'>Mês</div>
          <div className='text-base font-semibold'>{schedule.month}</div>
        </div>
      </div>

      <div className='text-sm text-neutral-500'>
        Total de posts: {posts.length}
      </div>

      <div className='grid md:grid-cols-2 gap-3'>
        {posts.map((p, i) => (
          <article key={i} className='border rounded-lg bg-white p-3'>
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
            <div className='mt-3 flex items-center justify-between'>
              <div className='text-[11px] text-neutral-500'>
                Status: {p.status}
              </div>
              {onInsertOne && (
                <div className='flex gap-2'>
                  <button
                    onClick={() =>
                      onEditOne ? onEditOne(p, i) : onInsertOne(p, i)
                    }
                    className='border rounded px-2 py-1 text-xs hover:bg-neutral-50'
                  >
                    Revisar & inserir
                  </button>
                  <button
                    onClick={() => onInsertOne(p, i)}
                    className='border rounded px-2 py-1 text-xs hover:bg-neutral-50'
                  >
                    Inserir direto
                  </button>
                </div>
              )}
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}
