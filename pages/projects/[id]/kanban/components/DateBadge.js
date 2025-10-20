import * as React from 'react';
import { Badge } from '@/components/ui/Badge';
import { Calendar as CalendarIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

// Parse seguro para "YYYY-MM-DD" como data local (evita off-by-one por timezone)
function parseLocalDate(value) {
  if (!value) return null;
  if (value instanceof Date) return value;
  if (typeof value === 'string') {
    const m = value.match(/^(\d{4})-(\d{2})-(\d{2})$/);
    if (m) {
      const y = Number(m[1]);
      const mo = Number(m[2]) - 1;
      const d = Number(m[3]);
      return new Date(y, mo, d, 0, 0, 0, 0);
    }
    const dt = new Date(value);
    return isNaN(dt.getTime()) ? null : dt;
  }
  return null;
}

function startOfDay(dt) {
  return new Date(dt.getFullYear(), dt.getMonth(), dt.getDate());
}

function formatBR(dt) {
  try {
    return dt.toLocaleDateString();
  } catch {
    return '';
  }
}

/**
 * Mostra a data dentro de um Badge:
 * - Verde (success) se a data é hoje ou futura
 * - Vermelho (error) se já passou
 */
export default function DateBadge({ date, className, showIcon = true }) {
  const dt = parseLocalDate(date);
  const today = startOfDay(new Date());
  const isPast = dt ? startOfDay(dt) < today : false;

  const toneClass = dt
    ? isPast
      ? 'status-error'
      : 'status-success'
    : 'bg-neutral-200 text-neutral-700 border-neutral-300';

  const label = dt ? formatBR(dt) : 'Sem data';

  return (
    <Badge
      variant='outline'
      className={cn(
        'text-[11px] font-medium flex items-center gap-1.5 px-2 py-0.5',
        toneClass,
        className
      )}
      title={label}
    >
      {showIcon && <CalendarIcon className='h-3.5 w-3.5' />}
      <span>{label}</span>
    </Badge>
  );
}
