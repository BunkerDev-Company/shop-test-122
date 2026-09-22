'use client';

import { Minus, Plus, Trash2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface QtyStepperProps {
  value:     number;
  onChange:  (next: number) => void;
  max?:      number;
  disabled?: boolean;
  /** На единице минус превращается в корзину: удалить — частое действие. */
  removable?: boolean;
  className?: string;
}

export function QtyStepper({
  value,
  onChange,
  max,
  disabled = false,
  removable = true,
  className,
}: QtyStepperProps) {
  const canIncrease = max === undefined || value < max;
  const showRemove  = removable && value <= 1;

  return (
    <div className={cn('inline-flex items-center gap-1 rounded-full border border-line p-1', className)}>
      <button
        type="button"
        onClick={() => onChange(value - 1)}
        disabled={disabled}
        className="flex h-8 w-8 items-center justify-center rounded-full text-ink transition-colors hover:bg-surface-2 active:scale-90 disabled:opacity-30"
        aria-label={showRemove ? 'Удалить' : 'Меньше'}
      >
        {showRemove ? <Trash2 className="h-4 w-4 text-danger" /> : <Minus className="h-4 w-4" />}
      </button>

      <span className="min-w-[24px] text-center text-[15px] font-bold tabular-nums">{value}</span>

      <button
        type="button"
        onClick={() => onChange(value + 1)}
        disabled={disabled || !canIncrease}
        className="flex h-8 w-8 items-center justify-center rounded-full text-ink transition-colors hover:bg-surface-2 active:scale-90 disabled:opacity-30"
        aria-label="Больше"
      >
        <Plus className="h-4 w-4" />
      </button>
    </div>
  );
}
