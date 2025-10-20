export default function UsageBanner({ usage, onManage }) {
  if (!usage) return null;

  const used = Number(usage.used || 0);
  const quota = Number(usage.quota || 0);
  const pct = quota > 0 ? Math.min(100, Math.round((used / quota) * 100)) : 0;
  const low = pct >= 80 && pct < 100;
  const out =
    pct >= 100 &&
    !usage.overage_enabled &&
    !(usage.trial_end_at && new Date(usage.trial_end_at) > new Date());
  const color = out
    ? 'bg-rose-100 text-rose-800 border-rose-200'
    : low
      ? 'bg-amber-50 text-amber-800 border-amber-200'
      : 'bg-neutral-50 text-neutral-700 border-neutral-200';

  return (
    <div className={`border rounded-md px-3 py-2 ${color}`}>
      <div className='flex items-center justify-between gap-2'>
        <div className='text-sm'>
          <span className='font-medium'>Uso de IA ({usage.yyyymm}):</span>
          <span className='ml-1'>
            {used}/{quota}
          </span>
          {usage.trial_end_at && (
            <span className='ml-2 text-xs'>
              · Trial até {new Date(usage.trial_end_at).toLocaleDateString()}
            </span>
          )}
          {usage.overage_enabled && (
            <span className='ml-2 text-xs'>· Overage ativado</span>
          )}
        </div>
        <button
          onClick={onManage}
          className='text-xs border rounded px-2 py-1 hover:bg-white/60'
        >
          Gerenciar plano
        </button>
      </div>
      <div className='mt-2 h-2 w-full bg-white/60 rounded'>
        <div
          className='h-2 rounded'
          style={{
            width: `${pct}%`,
            background: out ? '#f43f5e' : low ? '#f59e0b' : '#0ea5e9',
          }}
        />
      </div>
      {low && (
        <div className='mt-1 text-xs'>Você usou {pct}% da sua cota mensal.</div>
      )}
      {out && (
        <div className='mt-1 text-xs'>
          Cota esgotada. Ative overage, aguarde renovação mensal ou faça
          upgrade.
        </div>
      )}
    </div>
  );
}
