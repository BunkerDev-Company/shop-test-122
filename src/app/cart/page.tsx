'use client';

import Link from 'next/link';
import { ShoppingCart } from 'lucide-react';
import { useCart, useRemoveCartItem, useUpdateCartItem } from '@/lib/use-cart';
import { TopBar } from '@/components/layout/top-bar';
import { EmptyState } from '@/components/ui/empty-state';
import { QtyStepper } from '@/components/ui/qty-stepper';
import { formatPrice } from '@/lib/utils';

const FREE_DELIVERY_FROM = 30000;
const COURIER_PRICE = 490;

export default function CartPage() {
  const { data: cart, isLoading } = useCart();
  const updateItem = useUpdateCartItem();
  const removeItem = useRemoveCartItem();

  if (isLoading) {
    return (
      <>
        <TopBar title="Корзина" />
        <div className="screen space-y-3">
          {[0, 1, 2].map((i) => (
            <div key={i} className="skeleton h-24 w-full" />
          ))}
        </div>
      </>
    );
  }

  if (!cart || cart.items.length === 0) {
    return (
      <>
        <TopBar title="Корзина" />
        <EmptyState
          icon={<ShoppingCart className="h-7 w-7" />}
          title="Корзина пуста"
          description="Загляните в каталог — там есть что выбрать."
          action={{ label: 'В каталог', href: '/shop' }}
        />
      </>
    );
  }

  // Считаем доставку так же, как бэкенд: покупатель должен видеть ту же
  // сумму до перехода к оформлению.
  const delivery = cart.itemsTotal >= FREE_DELIVERY_FROM ? 0 : COURIER_PRICE;
  const hasUnavailable = cart.items.some((item) => !item.isAvailable);

  return (
    <>
      <TopBar title="Корзина" />

      <div className="screen pb-44 pt-1">
        <div className="space-y-3">
          {cart.items.map((item) => (
            <div key={item.id} className="card flex gap-3 p-3">
              <Link href={`/product/${item.productSlug}`} className="tile h-[84px] w-[84px] shrink-0 overflow-hidden">
                {item.imageUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={item.imageUrl} alt={item.productTitle} className="h-full w-full object-contain p-2" />
                ) : null}
              </Link>

              <div className="flex min-w-0 flex-1 flex-col">
                <Link href={`/product/${item.productSlug}`} className="line-clamp-2 text-[14px] font-semibold leading-tight">
                  {item.productTitle}
                </Link>
                <p className="mt-0.5 text-[12px] text-muted">{item.variantTitle}</p>

                {!item.isAvailable && (
                  <p className="mt-1 text-[12px] font-medium text-danger">
                    {item.stockQty === 0 ? 'Закончился' : `Осталось ${item.stockQty} шт.`}
                  </p>
                )}

                <div className="mt-auto flex items-center justify-between gap-2 pt-2">
                  <span className="text-[15px] font-extrabold tracking-tight">
                    {formatPrice(item.lineTotal)}
                  </span>

                  <QtyStepper
                    value={item.qty}
                    max={item.stockQty}
                    disabled={updateItem.isPending || removeItem.isPending}
                    onChange={(next) => {
                      if (next <= 0) removeItem.mutate(item.id);
                      else updateItem.mutate({ itemId: item.id, qty: next });
                    }}
                  />
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="card mt-4 space-y-2.5 p-4">
          <div className="flex justify-between text-[14px]">
            <span className="text-ink-2">Товары ({cart.itemsCount})</span>
            <span className="font-semibold">{formatPrice(cart.itemsTotal)}</span>
          </div>
          <div className="flex justify-between text-[14px]">
            <span className="text-ink-2">Доставка</span>
            <span className="font-semibold">
              {delivery === 0 ? 'Бесплатно' : formatPrice(delivery)}
            </span>
          </div>
          {delivery > 0 && (
            <p className="text-[12px] text-muted">
              До бесплатной доставки {formatPrice(FREE_DELIVERY_FROM - cart.itemsTotal)}
            </p>
          )}
          <div className="flex justify-between border-t border-line pt-2.5 text-[16px] font-extrabold">
            <span>Итого</span>
            <span>{formatPrice(cart.itemsTotal + delivery)}</span>
          </div>
        </div>
      </div>

      <div className="fixed bottom-[68px] left-1/2 z-30 w-full max-w-[440px] -translate-x-1/2 border-t border-line bg-surface/95 px-4 py-3 backdrop-blur">
        {hasUnavailable ? (
          <p className="mb-2 text-center text-[12px] font-medium text-danger">
            Уберите недоступные позиции, чтобы продолжить
          </p>
        ) : null}
        <Link
          href="/checkout"
          className={`btn-accent w-full ${hasUnavailable ? 'pointer-events-none opacity-40' : ''}`}
        >
          Оформить · {formatPrice(cart.itemsTotal + delivery)}
        </Link>
      </div>
    </>
  );
}
