import { ORDER_STATUS_LABELS, ORDER_STATUS_TONE, cn } from '@/lib/utils';
import type { OrderStatus } from '@/types';

export function StatusBadge({ status, className }: { status: OrderStatus; className?: string }) {
  return (
    <span className={cn('badge', ORDER_STATUS_TONE[status], className)}>
      {ORDER_STATUS_LABELS[status]}
    </span>
  );
}
