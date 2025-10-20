import { useMemo } from 'react';

function daysInMonth(yyyyMM) {
  const [y, m] = yyyyMM.split('-').map(Number); // m = 1..12
  const year = y,
    monthIdx = m - 1;
  const first = new Date(year, monthIdx, 1);
  const last = new Date(year, monthIdx + 1, 0);
  const startWeekday = first.getDay(); // 0=Sun
  const totalDays = last.getDate();
  const cells = [];
  for (let i = 0; i < startWeekday; i++) cells.push(null);
  for (let d = 1; d <= totalDays; d++) cells.push(new Date(year, monthIdx, d));
  // pad to full weeks (multiple of 7)
  while (cells.length % 7 !== 0) cells.push(null);
  return cells;
}

const WEEKDAYS = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

export default function MonthCalendar({
  month, // 'YYYY-MM'
  posts = [], // {id,date,title,arte,status}
  holidays = [], // [{date,name, approved?:boolean}]
  onDropPost, // (postId, newDate) => void
  onAddPost, // (date) => void
  onOpenPost, // (post) => void
}) {
  const cells = useMemo(() => daysInMonth(month), [month]);
  const postByDate = useMemo(() => {
    const map = new Map();
    posts.forEach(p => {
      if (!p?.date) return;
      const arr = map.get(p.date) || [];
      arr.push(p);
      map.set(p.date, arr);
    });
    return map;
  }, [posts]);
  const holidayByDate = useMemo(() => {
    const map = new Map();
    holidays.forEach(h => {
      if (h?.date) map.set(h.date, h);
    });
    return map;
  }, [holidays]);

  function onDragStart(ev, post) {
    ev.dataTransfer.setData('text/plain', post.id);
  }
  function onDrop(ev, dateStr) {
    ev.preventDefault();
    const id = ev.dataTransfer.getData('text/plain');
    if (id && onDropPost) onDropPost(id, dateStr);
  }

  return (
    <div className='w-full'>
      {/* Cabeçalho dias da semana */}
      <div className='grid grid-cols-7 gap-[1px] bg-neutral-200 text-xs'>
        {WEEKDAYS.map(d => (
          <div
            key={d}
            className='bg-neutral-50 px-2 py-2 font-medium text-center'
          >
            {d}
          </div>
        ))}
      </div>
      {/* Células do mês */}
      <div className='grid grid-cols-7 gap-[1px] bg-neutral-200'>
        {cells.map((d, idx) => {
          const dateStr = d ? d.toISOString().slice(0, 10) : null;
          const dayPosts = dateStr ? postByDate.get(dateStr) || [] : [];
          const hol = dateStr ? holidayByDate.get(dateStr) : null;
          const conflict = dayPosts.length >= 3;
          return (
            <div
              key={idx}
              onDragOver={ev => ev.preventDefault()}
              onDrop={ev => {
                if (dateStr) onDrop(ev, dateStr);
              }}
              className={
                'min-h-[115px] bg-white p-2 flex flex-col ' +
                (hol ? 'ring-1 ring-rose-300' : '')
              }
            >
              <div className='flex items-center justify-between'>
                <div className='text-xs text-neutral-500'>
                  {d ? d.getDate() : ''}
                </div>
                <div className='flex items-center gap-1'>
                  {hol && (
                    <span className='text-[10px] px-1 py-0.5 rounded bg-rose-50 text-rose-700'>
                      {hol.approved ? 'Feriado (aprovado)' : 'Feriado'}
                    </span>
                  )}
                  {conflict && (
                    <span className='text-[10px] px-1 py-0.5 rounded bg-amber-50 text-amber-700'>
                      +{dayPosts.length}
                    </span>
                  )}
                  {dateStr && (
                    <button
                      onClick={() => onAddPost && onAddPost(dateStr)}
                      className='text-xs border rounded px-1.5 py-0.5 hover:bg-neutral-50'
                    >
                      + Post
                    </button>
                  )}
                </div>
              </div>
              <div className='mt-1 space-y-1'>
                {dayPosts.map(p => (
                  <div
                    key={p.id}
                    draggable
                    onDragStart={ev => onDragStart(ev, p)}
                    onDoubleClick={() => onOpenPost && onOpenPost(p)}
                    title={p.title}
                    className='text-[11px] border rounded px-2 py-1 flex items-center justify-between gap-2 hover:bg-neutral-50 cursor-grab'
                  >
                    <span className='truncate'>{p.title}</span>
                    <span
                      className={
                        'text-[10px] px-1 rounded ' + badgeForStatus(p.status)
                      }
                    >
                      {p.status}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function badgeForStatus(s) {
  switch ((s || '').toLowerCase()) {
    case 'a criar':
      return 'bg-neutral-100';
    case 'em revisão':
      return 'bg-blue-100';
    case 'aprovado':
      return 'bg-emerald-100';
    case 'ajustar':
      return 'bg-amber-100';
    default:
      return 'bg-neutral-100';
  }
}
