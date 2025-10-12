export default function AiUsageBanner({ usage }) {
  if (!usage || usage.loading || !usage.data) return null;
  const { plan, used, quota, remaining, trialEnd, overage, level } = usage;
  const base = 'rounded border p-2 text-sm';
  const styles = {
    ok:   base + ' bg-emerald-50 border-emerald-300 text-emerald-900',
    warn: base + ' bg-amber-50 border-amber-300 text-amber-900',
    block:base + ' bg-rose-50 border-rose-300 text-rose-900'
  };
  return (
    <div className={styles[level]}>
      <div><b>Plano:</b> {plan || '—'} • <b>Uso IA:</b> {used}/{quota || 0} posts</div>
      <div className="text-xs mt-1">
        {trialEnd ? <>Período de teste até <b>{trialEnd.toLocaleDateString()}</b>.</> : null}
        {!overage && !trialEnd && remaining <= 0 ? <> Sem cota restante — ative excedente ou suba de plano.</> : null}
        {remaining > 0 && quota && remaining <= Math.max(10, Math.ceil(quota * 0.1)) ? <> Restam <b>{remaining}</b> geração(ões) neste mês.</> : null}
      </div>
    </div>
  );
}
