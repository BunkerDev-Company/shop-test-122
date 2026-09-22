'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Store, Truck } from 'lucide-react';
import toast from 'react-hot-toast';
import { ordersApi } from '@/lib/api';
import { useCart, CART_QUERY_KEY } from '@/lib/use-cart';
import { useUser } from '@/lib/use-user';
import { TopBar } from '@/components/layout/top-bar';
import { apiErrorMessage, cn, formatPrice } from '@/lib/utils';
import type { DeliveryMethod } from '@/types';

const FREE_DELIVERY_FROM = 30000;
const COURIER_PRICE = 490;

export default function CheckoutPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { data: cart } = useCart();
  const { data: user } = useUser();

  const [form, setForm] = useState({
    customerName:    '',
    customerEmail:   '',
    customerPhone:   '',
    deliveryAddress: '',
    comment:         '',
  });
  const [deliveryMethod, setDeliveryMethod] = useState<DeliveryMethod>('courier');

  // Авторизованному подставляем его данные: перепечатывать их вручную
  // на телефоне — лишний шаг к отказу от покупки.
  useEffect(() => {
    if (!user) return;
    setForm((prev) => ({
      ...prev,
      customerName:  prev.customerName  || [user.firstName, user.lastName].filter(Boolean).join(' '),
      customerEmail: prev.customerEmail || user.email || '',
      customerPhone: prev.customerPhone || user.phone || '',
    }));
  }, [user]);

  const createOrder = useMutation({
    mutationFn: () =>
      ordersApi.create({
        customerName:    form.customerName,
        customerEmail:   form.customerEmail,
        customerPhone:   form.customerPhone || undefined,
        deliveryMethod,
        deliveryAddress: deliveryMethod === 'courier' ? form.deliveryAddress : undefined,
        comment:         form.comment || undefined,
      }),
    onSuccess: (order) => {
      queryClient.invalidateQueries({ queryKey: CART_QUERY_KEY });
      toast.success(`Заказ ${order.number} оформлен`);
      router.push(`/orders/${order.id}`);
    },
    onError: (error) => toast.error(apiErrorMessage(error, 'Не удалось оформить заказ')),
  });

  if (!cart || cart.items.length === 0) {
    return (
      <>
        <TopBar title="Оформление" showBack />
        <div className="screen">
          <p className="py-16 text-center text-[14px] text-ink-2">Корзина пуста</p>
        </div>
      </>
    );
  }

  const delivery = deliveryMethod === 'pickup'
    ? 0
    : cart.itemsTotal >= FREE_DELIVERY_FROM ? 0 : COURIER_PRICE;

  const canSubmit =
    form.customerName.trim() &&
    form.customerEmail.trim() &&
    (deliveryMethod === 'pickup' || form.deliveryAddress.trim());

  return (
    <>
      <TopBar title="Оформление" showBack />

      <div className="screen pb-36 pt-1">
        {/* ── Способ доставки ──────────────────────────────────── */}
        <h2 className="section-title text-[15px]">Доставка</h2>
        <div className="mt-2.5 grid grid-cols-2 gap-2">
          {([
            { value: 'courier', label: 'Курьер',    hint: delivery === 0 ? 'Бесплатно' : formatPrice(COURIER_PRICE), icon: Truck },
            { value: 'pickup',  label: 'Самовывоз', hint: 'Бесплатно', icon: Store },
          ] as const).map(({ value, label, hint, icon: Icon }) => (
            <button
              key={value}
              type="button"
              onClick={() => setDeliveryMethod(value)}
              className={cn(
                'card flex flex-col items-start gap-1 p-3.5 text-left transition-colors',
                deliveryMethod === value && 'border-accent bg-accent-soft',
              )}
            >
              <Icon className="h-5 w-5 text-ink" />
              <span className="mt-1 text-[14px] font-semibold">{label}</span>
              <span className="text-[12px] text-ink-2">{hint}</span>
            </button>
          ))}
        </div>

        {/* ── Контакты ─────────────────────────────────────────── */}
        <h2 className="section-title mt-6 text-[15px]">Контакты</h2>
        <div className="mt-2.5 space-y-3">
          <div>
            <label className="field-label" htmlFor="name">Имя и фамилия</label>
            <input
              id="name"
              className="field-box"
              value={form.customerName}
              onChange={(e) => setForm({ ...form, customerName: e.target.value })}
              placeholder="Иван Петров"
              autoComplete="name"
            />
          </div>

          <div>
            <label className="field-label" htmlFor="email">Email</label>
            <input
              id="email"
              type="email"
              inputMode="email"
              className="field-box"
              value={form.customerEmail}
              onChange={(e) => setForm({ ...form, customerEmail: e.target.value })}
              placeholder="ivan@example.com"
              autoComplete="email"
            />
          </div>

          <div>
            <label className="field-label" htmlFor="phone">Телефон</label>
            <input
              id="phone"
              type="tel"
              inputMode="tel"
              className="field-box"
              value={form.customerPhone}
              onChange={(e) => setForm({ ...form, customerPhone: e.target.value })}
              placeholder="+7 999 000-00-00"
              autoComplete="tel"
            />
          </div>

          {deliveryMethod === 'courier' && (
            <div>
              <label className="field-label" htmlFor="address">Адрес доставки</label>
              <input
                id="address"
                className="field-box"
                value={form.deliveryAddress}
                onChange={(e) => setForm({ ...form, deliveryAddress: e.target.value })}
                placeholder="Город, улица, дом, квартира"
                autoComplete="street-address"
              />
            </div>
          )}

          <div>
            <label className="field-label" htmlFor="comment">Комментарий</label>
            <textarea
              id="comment"
              rows={2}
              className="field-box resize-none"
              value={form.comment}
              onChange={(e) => setForm({ ...form, comment: e.target.value })}
              placeholder="Например, позвонить за час"
            />
          </div>
        </div>

        {/* ── Состав заказа ────────────────────────────────────── */}
        <h2 className="section-title mt-6 text-[15px]">Заказ</h2>
        <div className="card mt-2.5 divide-y divide-line">
          {cart.items.map((item) => (
            <div key={item.id} className="flex items-center justify-between gap-3 p-3.5">
              <div className="min-w-0">
                <p className="truncate text-[14px] font-medium">{item.productTitle}</p>
                <p className="text-[12px] text-muted">{item.variantTitle} · {item.qty} шт.</p>
              </div>
              <span className="shrink-0 text-[14px] font-semibold">{formatPrice(item.lineTotal)}</span>
            </div>
          ))}

          <div className="space-y-2 p-3.5">
            <div className="flex justify-between text-[14px]">
              <span className="text-ink-2">Доставка</span>
              <span className="font-semibold">{delivery === 0 ? 'Бесплатно' : formatPrice(delivery)}</span>
            </div>
            <div className="flex justify-between text-[16px] font-extrabold">
              <span>Итого</span>
              <span>{formatPrice(cart.itemsTotal + delivery)}</span>
            </div>
          </div>
        </div>

        <p className="mt-3 text-center text-[12px] text-muted">
          Оплата картой на следующем шаге. Это демо-режим: платёж имитируется.
        </p>
      </div>

      <div className="fixed bottom-[68px] left-1/2 z-30 w-full max-w-[440px] -translate-x-1/2 border-t border-line bg-surface/95 px-4 py-3 backdrop-blur">
        <button
          type="button"
          onClick={() => createOrder.mutate()}
          disabled={!canSubmit || createOrder.isPending}
          className="btn-accent w-full"
        >
          {createOrder.isPending ? 'Оформляем…' : `Подтвердить · ${formatPrice(cart.itemsTotal + delivery)}`}
        </button>
      </div>
    </>
  );
}
