'use client';

import { useParams } from 'next/navigation';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { CheckCircle2, CreditCard, MapPin, XCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import { ordersApi } from '@/lib/api';
import { TopBar } from '@/components/layout/top-bar';
import { StatusBadge } from '@/components/ui/status-badge';
import {
  PAYMENT_STATUS_LABELS,
  apiErrorMessage,
  formatDateTime,
  formatPrice,
  ORDER_STATUS_LABELS,
} from '@/lib/utils';

export default function OrderPage() {
  const params = useParams<{ id: string }>();
  const queryClient = useQueryClient();

  const { data: order, isLoading } = useQuery({
    queryKey: ['order', params.id],
    queryFn:  () => ordersApi.get(params.id),
  });

  const refresh = () => {
    queryClient.invalidateQueries({ queryKey: ['order', params.id] });
    queryClient.invalidateQueries({ queryKey: ['orders'] });
  };

  const pay = useMutation({
    mutationFn: () => ordersApi.pay(params.id),
    onSuccess: () => {
      refresh();
      toast.success('Заказ оплачен');
    },
    onError: (error) => toast.error(apiErrorMessage(error, 'Не удалось провести оплату')),
  });

  const cancel = useMutation({
    mutationFn: () => ordersApi.cancel(params.id),
    onSuccess: () => {
      refresh();
      toast.success('Заказ отменён');
    },
    onError: (error) => toast.error(apiErrorMessage(error, 'Не удалось отменить заказ')),
  });

  if (isLoading || !order) {
    return (
      <>
        <TopBar title="Заказ" showBack />
        <div className="screen space-y-3">
          <div className="skeleton h-24 w-full" />
          <div className="skeleton h-40 w-full" />
        </div>
      </>
    );
  }

  const canPay    = order.paymentStatus === 'pending' && order.status !== 'cancelled';
  const canCancel = ['new', 'paid', 'processing'].includes(order.status);

  return (
    <>
      <TopBar title={order.number} showBack />

      <div className="screen pb-32 pt-1">
        <div className="card p-4">
          <div className="flex items-center justify-between gap-2">
            <StatusBadge status={order.status} />
            <span className="text-[12px] text-muted">{formatDateTime(order.createdAt)}</span>
          </div>

          <p className="mt-3 text-[13px] text-ink-2">
            Оплата: <span className="font-semibold text-ink">{PAYMENT_STATUS_LABELS[order.paymentStatus]}</span>
          </p>
        </div>

        {/* ── Состав ───────────────────────────────────────────── */}
        <h2 className="section-title mt-5 text-[15px]">Состав заказа</h2>
        <div className="card mt-2.5 divide-y divide-line">
          {order.items.map((item) => (
            <div key={item.id} className="flex gap-3 p-3.5">
              <div className="tile h-14 w-14 shrink-0 overflow-hidden">
                {item.imageUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={item.imageUrl} alt="" className="h-full w-full object-contain p-1.5" />
                ) : null}
              </div>
              <div className="min-w-0 flex-1">
                <p className="line-clamp-2 text-[14px] font-medium">{item.productTitle}</p>
                <p className="text-[12px] text-muted">{item.variantTitle} · {item.qty} шт.</p>
              </div>
              <span className="shrink-0 text-[14px] font-semibold">{formatPrice(item.lineTotal)}</span>
            </div>
          ))}

          <div className="space-y-2 p-3.5">
            <div className="flex justify-between text-[14px]">
              <span className="text-ink-2">Товары</span>
              <span>{formatPrice(order.itemsTotal)}</span>
            </div>
            <div className="flex justify-between text-[14px]">
              <span className="text-ink-2">Доставка</span>
              <span>{order.deliveryPrice === 0 ? 'Бесплатно' : formatPrice(order.deliveryPrice)}</span>
            </div>
            <div className="flex justify-between border-t border-line pt-2 text-[16px] font-extrabold">
              <span>Итого</span>
              <span>{formatPrice(order.totalAmount)}</span>
            </div>
          </div>
        </div>

        {/* ── Получатель ───────────────────────────────────────── */}
        <h2 className="section-title mt-5 text-[15px]">Получатель</h2>
        <div className="card mt-2.5 space-y-2 p-4 text-[14px]">
          <p className="font-semibold">{order.customerName}</p>
          <p className="text-ink-2">{order.customerEmail}</p>
          {order.customerPhone && <p className="text-ink-2">{order.customerPhone}</p>}
          <div className="flex items-start gap-2 pt-1 text-ink-2">
            <MapPin className="mt-0.5 h-4 w-4 shrink-0" />
            <span>
              {order.deliveryMethod === 'pickup'
                ? 'Самовывоз из магазина'
                : order.deliveryAddress}
            </span>
          </div>
          {order.comment && <p className="pt-1 text-[13px] text-muted">«{order.comment}»</p>}
        </div>

        {/* ── История ──────────────────────────────────────────── */}
        {order.history.length > 0 && (
          <>
            <h2 className="section-title mt-5 text-[15px]">История</h2>
            <ol className="card mt-2.5 divide-y divide-line">
              {order.history.map((entry, index) => (
                <li key={index} className="flex items-start gap-3 p-3.5">
                  <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-success" />
                  <div className="min-w-0 flex-1">
                    <p className="text-[14px] font-medium">{ORDER_STATUS_LABELS[entry.status]}</p>
                    {entry.comment && <p className="text-[13px] text-ink-2">{entry.comment}</p>}
                  </div>
                  <span className="shrink-0 text-[12px] text-muted">
                    {formatDateTime(entry.createdAt)}
                  </span>
                </li>
              ))}
            </ol>
          </>
        )}
      </div>

      {(canPay || canCancel) && (
        <div className="fixed bottom-[68px] left-1/2 z-30 flex w-full max-w-[440px] -translate-x-1/2 gap-2 border-t border-line bg-surface/95 px-4 py-3 backdrop-blur">
          {canCancel && (
            <button
              type="button"
              onClick={() => cancel.mutate()}
              disabled={cancel.isPending}
              className="btn-ghost flex-1 text-danger"
            >
              <XCircle className="h-4 w-4" /> Отменить
            </button>
          )}
          {canPay && (
            <button
              type="button"
              onClick={() => pay.mutate()}
              disabled={pay.isPending}
              className="btn-accent flex-[2]"
            >
              <CreditCard className="h-4 w-4" />
              {pay.isPending ? 'Оплата…' : `Оплатить ${formatPrice(order.totalAmount)}`}
            </button>
          )}
        </div>
      )}
    </>
  );
}
