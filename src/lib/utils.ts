import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { format, parseISO } from 'date-fns';
import { ru } from 'date-fns/locale';
import type { OrderStatus, PaymentStatus } from '@/types';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/** Цены целые: копейки в рознице техники только зашумляют ценник. */
export function formatPrice(value: number | null | undefined): string {
  if (value == null) return '—';
  return new Intl.NumberFormat('ru-RU', {
    style: 'currency',
    currency: 'RUB',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
}

/** «от 109 990 ₽», если у товара варианты в разной цене. */
export function formatPriceRange(min: number | null, max: number | null): string {
  if (min == null) return '—';
  return min === max || max == null ? formatPrice(min) : `от ${formatPrice(min)}`;
}

export function formatDate(value: string | Date | null | undefined, pattern = 'd MMMM yyyy'): string {
  if (!value) return '—';
  const date = typeof value === 'string' ? parseISO(value) : value;
  if (isNaN(date.getTime())) return '—';
  return format(date, pattern, { locale: ru });
}

export function formatDateTime(value: string | Date | null | undefined): string {
  return formatDate(value, 'd MMM yyyy, HH:mm');
}

export const ORDER_STATUS_LABELS: Record<OrderStatus, string> = {
  new:        'Новый',
  paid:       'Оплачен',
  processing: 'Собирается',
  shipped:    'В пути',
  delivered:  'Доставлен',
  cancelled:  'Отменён',
};

export const PAYMENT_STATUS_LABELS: Record<PaymentStatus, string> = {
  pending:  'Ожидает оплаты',
  paid:     'Оплачен',
  failed:   'Ошибка оплаты',
  refunded: 'Возврат',
};

/** Цвета статусов: один и тот же заказ одинаково выглядит везде. */
export const ORDER_STATUS_TONE: Record<OrderStatus, string> = {
  new:        'bg-info-soft text-info',
  paid:       'bg-success-soft text-success',
  processing: 'bg-warning-soft text-warning',
  shipped:    'bg-warning-soft text-warning',
  delivered:  'bg-success-soft text-success',
  cancelled:  'bg-danger-soft text-danger',
};

/** Достаёт человекочитаемое сообщение из конверта ошибки бэкенда. */
export function apiErrorMessage(error: unknown, fallback = 'Что-то пошло не так'): string {
  const payload = (error as { response?: { data?: { error?: { message?: string; details?: string | null } } } })
    ?.response?.data?.error;
  return payload?.details || payload?.message || fallback;
}
