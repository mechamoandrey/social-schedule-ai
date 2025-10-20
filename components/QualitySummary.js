import { computeQuality } from '@/lib/quality/computeQuality';

export default function QualitySummary({
  schedule,
  clientWebsite,
  approvedHolidays,
  freqPerWeek,
}) {
  if (!schedule) return null;

  const q = computeQuality({
    schedule,
    clientWebsite,
    approvedHolidays,
    freqPerWeek,
  });

  return (
    <div className='border rounded-lg p-4 bg-white space-y-3'>
      <div className='flex items-center justify-between'>
        <div className='text-base font-semibold'>Resumo de qualidade</div>
        <div className='text-sm'>
          <span className='font-semibold'>{q.score}/100</span>
          <span
            className={`ml-2 text-xs px-2 py-0.5 rounded ${
              q.score >= 85
                ? 'bg-green-100 text-green-800'
                : q.score >= 70
                  ? 'bg-blue-100 text-blue-800'
                  : q.score >= 50
                    ? 'bg-yellow-100 text-yellow-800'
                    : 'bg-red-100 text-red-800'
            }`}
          >
            {q.grade}
          </span>
        </div>
      </div>

      <div className='grid md:grid-cols-4 gap-3 text-sm'>
        <Bucket label='Regras' value={q.buckets.rules} />
        <Bucket label='Variedade' value={q.buckets.variety} />
        <Bucket label='Distribuição' value={q.buckets.distribution} />
        <Bucket label='Feriados' value={q.buckets.holidays} />
      </div>

      <div className='grid md:grid-cols-3 gap-3 text-sm'>
        <Card title='Formatos'>
          Carrossel {q.stats.formatMix.carrossel} · Estático{' '}
          {q.stats.formatMix.estatico}
        </Card>
        <Card title='CTAs'>
          Únicos {(q.stats.ctaUniqueRate * 100).toFixed(0)}% · Repetições
          consecutivas {q.stats.consecutiveCtaRepeats}
        </Card>
        <Card title='Títulos'>
          Únicos {(q.stats.titleUniqueRate * 100).toFixed(0)}%
        </Card>
      </div>

      <div className='grid md:grid-cols-3 gap-3 text-sm'>
        <Card title='Posts por semana'>
          W1:{q.stats.byWeek[0]} · W2:{q.stats.byWeek[1]} · W3:
          {q.stats.byWeek[2]} · W4:{q.stats.byWeek[3]} · W5:{q.stats.byWeek[4]}
        </Card>
        <Card title='Menor gap'>
          {q.stats.minGapDays == null ? '—' : `${q.stats.minGapDays} dias`}
        </Card>
        <Card title='Clusters'>
          {q.stats.clusters.length
            ? q.stats.clusters
                .map(c => `${c.start}–${c.end} (${c.count})`)
                .join(', ')
            : 'Nenhum'}
        </Card>
      </div>

      <div className='text-sm'>
        <div className='font-medium mb-1'>Feriados</div>
        <div className='text-neutral-700'>
          Sugeridos: {q.holidays.suggested.length} · Aprovados:{' '}
          {q.holidays.approved.length} · Usados em posts:{' '}
          {q.holidays.usedInPosts.length}
        </div>
      </div>

      <div className='text-sm'>
        <div className='font-medium mb-1'>Issues priorizadas</div>
        {q.issues.length === 0 ? (
          <div className='text-green-600'>✓ Sem issues — ótimo!</div>
        ) : (
          <ul className='list-disc ml-5 space-y-1'>
            {q.issues.slice(0, 12).map((it, idx) => (
              <li key={idx} className='text-neutral-800'>
                Post #{it.postIndex + 1}: {it.message}
              </li>
            ))}
            {q.issues.length > 12 && (
              <li className='text-neutral-500'>
                + {q.issues.length - 12} mais…
              </li>
            )}
          </ul>
        )}
      </div>
    </div>
  );
}

function Bucket({ label, value }) {
  const getColor = value => {
    if (value >= 85) return 'text-green-600';
    if (value >= 70) return 'text-blue-600';
    if (value >= 50) return 'text-yellow-600';
    return 'text-red-600';
  };

  return (
    <div className='border rounded p-3'>
      <div className='text-xs text-neutral-500'>{label}</div>
      <div className={`text-lg font-semibold ${getColor(value)}`}>{value}</div>
    </div>
  );
}

function Card({ title, children }) {
  return (
    <div className='border rounded p-3'>
      <div className='text-xs text-neutral-500 mb-1'>{title}</div>
      <div>{children}</div>
    </div>
  );
}
