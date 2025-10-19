import * as React from 'react';
import { AlertCircle, CheckCircle, XCircle } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/Alert';
import { cn } from '@/lib/utils';

export default function AiUsageBanner({ usage }) {
  if (!usage || usage.loading || !usage.data) return null;

  const { plan, used, quota, remaining, trialEnd, overage, level } = usage;

  // mapeia o level antigo -> variantes visuais
  const levelToVariant = {
    ok: 'success',
    warn: 'warning',
    block: 'error',
  };

  const variant = levelToVariant[level] || 'success';
  const Icon =
    variant === 'error'
      ? XCircle
      : variant === 'warning'
        ? AlertCircle
        : CheckCircle;

  return (
    <Alert
      className={cn(
        'border-l-4',
        // cores com tokens HSL (usa apenas a borda esquerda)
        variant === 'success' &&
          '[border-left-color:hsl(var(--success))] bg-success-light/20',
        variant === 'warning' &&
          '[border-left-color:hsl(var(--warning))] bg-warning-light/20',
        variant === 'error' &&
          '[border-left-color:hsl(var(--error))] bg-error-light/20'
      )}
    >
      <Icon
        className={cn(
          'h-4 w-4',
          variant === 'success' && 'text-success',
          variant === 'warning' && 'text-warning',
          variant === 'error' && 'text-error'
        )}
      />

      <div>
        <div className='text-sm font-medium'>
          <b>Plano:</b> {plan || '—'} • <b>Uso IA:</b> {used}/{quota || 0} posts
        </div>

        <AlertDescription className='text-xs mt-1'>
          {trialEnd ? (
            <>
              Período de teste até <b>{trialEnd.toLocaleDateString()}</b>.
            </>
          ) : null}

          {!overage && !trialEnd && remaining <= 0 ? (
            <> Sem cota restante — ative excedente ou suba de plano.</>
          ) : null}

          {remaining > 0 &&
          quota &&
          remaining <= Math.max(10, Math.ceil(quota * 0.1)) ? (
            <>
              {' '}
              Restam <b>{remaining}</b> geração(ões) neste mês.
            </>
          ) : null}
        </AlertDescription>
      </div>
    </Alert>
  );
}
