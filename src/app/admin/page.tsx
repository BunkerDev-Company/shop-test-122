'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Boxes, ChevronLeft, Search } from 'lucide-react';
import toast from 'react-hot-toast';
import { adminApi } from '@/lib/api';
import { useUser } from '@/lib/use-user';
import { StatusBadge } from '@/components/ui/status-badge';
import {
  ORDER_STATUS_LABELS,
  apiErrorMessage,
  cn,
  formatDateTime,
  formatPrice,
} from '@/lib/utils';
import type { Order, OrderStatus } from '@/types';

const STATUS_FILTERS: { value: string; label: string }[] = [
  { value: '',           label: 'Все' },
  { value: 'new',        label: 'Новые' },
  { value: 'paid',       label: 'Оплачены' },
  { value: 'processing', label: 'В сборке' },
  { value: 'shipped',    label: 'В пути' },
  { value: 'delivered',  label: 'Доставлены' },
  { value: 'cancelled',  label: 'Отменены' },
];

/** Разрешённые переходы дублируют серверные: кнопки не должны предлагать
 *  то, что бэкенд отклонит. Источник правды — OrderService на бэкенде. */
const NEXT_STATUSES: Record<OrderStatus, OrderStatus[]> = {
  new:        ['paid', 'processing', 'cancelled'],
  paid:       ['processing', 'cancelled'],
  processing: ['shipped', 'cancelled'],
  shipped:    ['delivered', 'cancelled'],
  delivered:  [],
  cancelled:  [],
};

export default function AdminOrdersPage() {
  const queryClient = useQueryClient();
  const { data: user, isLoading: userLoading } = useUser();

  const [status, setStatus] = useState('');
  const [search, setSearch] = useState('');
  const [expanded, setExpanded] = useState<string | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ['admin-orders', { status, search }],
    queryFn:  () => adminApi.orders({ status: status || undefined, q: search.trim() || undefined, perPage: 50 }),
    enabled:  !!user && (user.role === 'admin' || user.role === 'manager'),
  });

  const changeStatus = useMutation({
    mutationFn: ({ id, next }: { id: string; next: OrderStatus }) =>
      adminApi.changeOrderStatus(id, next),
    onSuccess: (order) => {
      queryClient.invalidateQueries({ queryKey: ['admin-orders'] });
      toast.success(`${order.number}: ${ORDER_STATUS_LABELS[order.status]}`);
    },
    onError: (error) => toast.error(apiErrorMessage(error)),
  });

  if (userLoading) {
    return <div className="screen space-y-3 pt-6"><div className="skeleton h-20 w-full" /></div>;
  }

  if (!user || (user.role !== 'admin' && user.role !== 'manager')) {
    return (
      <div className="screen pt-10 text-center">
        <p className="text-[15px] font-semibold">Доступ только для сотрудников</p>
        <Link href="/" className="btn-primary mt-5 inline-flex px-8">На витрину</Link>
      </div>
    );
  }

  return (
    <>
      <header className="sticky top-0 z-30 bg-surface/95 px-4 pb-2 pt-4 backdrop-blur">
        <div className="flex items-center gap-2">
          <Link href="/profile" className="icon-btn h-10 w-10" aria-label="Назад">
            <ChevronLeft className="h-5 w-5" />
          </Link>
          <h1 className="flex-1 text-[19px] font-extrabold tracking-tight">Заказы</h1>
          {user.role === 'admin' && (
            <Link href="/admin/products" className="icon-btn h-10 w-10" aria-label="Товары">
              <Boxes className="h-[18px] w-[18px]" />
            </Link>
          )}
        </div>

        <div className="relative mt-3">
          <Search className="pointer-events-none absolute left-4 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-muted" />
          <input
            className="field py-3 pl-11"
            placeholder="Номер, имя или email"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <div className="scroll-row mt-3">
          {STATUS_FILTERS.map((filter) => (
            <button
              key={filter.value}
              type="button"
              onClick={() => setStatus(filter.value)}
              className={cn('chip', status === filter.value && 'chip-active')}
            >
              {filter.label}
            </button>
          ))}
        </div>
      </header>

      <div className="screen space-y-3 pt-2">
        {isLoading ? (
          [0, 1, 2].map((i) => <div key={i} className="skeleton h-28 w-full" />)
        ) : data && data.items.length > 0 ? (
          data.items.map((order: Order) => {
            const isOpen = expanded === order.id;
            const nextStatuses = NEXT_STATUSES[order.status];

            return (
              <div key={order.id} className="card p-4">
                <button
                  type="button"
                  onClick={() => setExpanded(isOpen ? null : order.id)}
                  className="flex w-full items-center justify-between gap-2 text-left"
                >
                  <div className="min-w-0">
                    <p className="text-[15px] font-bold">{order.number}</p>
                    <p className="truncate text-[12px] text-muted">
                      {order.customerName} · {formatDateTime(order.createdAt)}
                    </p>
                  </div>
                  <div className="flex shrink-0 flex-col items-end gap-1">
                    <StatusBadge status={order.status} />
                    <span className="text-[14px] font-extrabold">{formatPrice(order.totalAmount)}</span>
                  </div>
                </button>

                {isOpen && (
                  <div className="mt-3 space-y-3 border-t border-line pt-3 animate-fade-up">
                    <div className="space-y-1.5">
                      {order.items.map((item) => (
                        <div key={item.id} className="flex justify-between gap-3 text-[13px]">
                          <span className="min-w-0 truncate text-ink-2">
                            {item.productTitle} · {item.variantTitle} × {item.qty}
                          </span>
                          <span className="shrink-0 font-medium">{formatPrice(item.lineTotal)}</span>
                        </div>
                      ))}
                    </div>

                    <div className="text-[13px] text-ink-2">
                      <p>{order.customerEmail}{order.customerPhone ? ` · ${order.customerPhone}` : ''}</p>
                      <p className="mt-0.5">
                        {order.deliveryMethod === 'pickup' ? 'Самовывоз' : order.deliveryAddress}
                      </p>
                      {order.comment && <p className="mt-0.5 italic">«{order.comment}»</p>}
                    </div>

                    {nextStatuses.length > 0 ? (
                      <div className="flex flex-wrap gap-2">
                        {nextStatuses.map((next) => (
                          <button
                            key={next}
                            type="button"
                            disabled={changeStatus.isPending}
                            onClick={() => changeStatus.mutate({ id: order.id, next })}
                            className={cn(
                              'chip btn-sm',
                              next === 'cancelled' ? 'border-danger text-danger' : 'border-ink text-ink',
                            )}
                          >
                            → {ORDER_STATUS_LABELS[next]}
                          </button>
                        ))}
                      </div>
                    ) : (
                      <p className="text-[12px] text-muted">Заказ закрыт, смена статуса недоступна.</p>
                    )}
                  </div>
                )}
              </div>
            );
          })
        ) : (
          <p className="py-16 text-center text-[14px] text-ink-2">Заказов не найдено</p>
        )}
      </div>
    </>
  );
}
