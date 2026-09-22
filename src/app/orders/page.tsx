'use client';

import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { ChevronRight, Package } from 'lucide-react';
import { ordersApi } from '@/lib/api';
import { authStorage } from '@/lib/auth';
import { TopBar } from '@/components/layout/top-bar';
import { EmptyState } from '@/components/ui/empty-state';
import { StatusBadge } from '@/components/ui/status-badge';
import { formatDate, formatPrice } from '@/lib/utils';

export default function OrdersPage() {
  const isAuthenticated = typeof window !== 'undefined' && authStorage.isAuthenticated();

  const { data: orders, isLoading } = useQuery({
    queryKey: ['orders'],
    queryFn:  ordersApi.list,
    enabled:  isAuthenticated,
  });

  if (!isAuthenticated) {
    return (
      <>
        <TopBar title="Заказы" />
        <EmptyState
          icon={<Package className="h-7 w-7" />}
          title="Нужен аккаунт"
          description="История заказов хранится в профиле — войдите, чтобы её увидеть."
          action={{ label: 'Войти', href: '/login?from=/orders' }}
        />
      </>
    );
  }

  if (isLoading) {
    return (
      <>
        <TopBar title="Заказы" />
        <div className="screen space-y-3">
          {[0, 1].map((i) => <div key={i} className="skeleton h-28 w-full" />)}
        </div>
      </>
    );
  }

  if (!orders || orders.length === 0) {
    return (
      <>
        <TopBar title="Заказы" />
        <EmptyState
          icon={<Package className="h-7 w-7" />}
          title="Заказов пока нет"
          description="Как только оформите первый — он появится здесь."
          action={{ label: 'В каталог', href: '/shop' }}
        />
      </>
    );
  }

  return (
    <>
      <TopBar title="Заказы" />

      <div className="screen space-y-3 pt-1">
        {orders.map((order) => (
          <Link key={order.id} href={`/orders/${order.id}`} className="card block p-4 active:scale-[0.99]">
            <div className="flex items-center justify-between gap-2">
              <span className="text-[15px] font-bold">{order.number}</span>
              <StatusBadge status={order.status} />
            </div>

            <p className="mt-1 text-[12px] text-muted">{formatDate(order.createdAt)}</p>

            {/* Обложки первых позиций: заказ узнаётся по товарам быстрее,
                чем по номеру. */}
            <div className="mt-3 flex items-center gap-2">
              {order.items.slice(0, 3).map((item) => (
                <div key={item.id} className="tile h-12 w-12 overflow-hidden">
                  {item.imageUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={item.imageUrl} alt="" className="h-full w-full object-contain p-1" />
                  ) : null}
                </div>
              ))}
              {order.items.length > 3 && (
                <span className="text-[12px] text-muted">+{order.items.length - 3}</span>
              )}

              <div className="ml-auto flex items-center gap-1">
                <span className="text-[15px] font-extrabold">{formatPrice(order.totalAmount)}</span>
                <ChevronRight className="h-4 w-4 text-muted" />
              </div>
            </div>
          </Link>
        ))}
      </div>
    </>
  );
}
