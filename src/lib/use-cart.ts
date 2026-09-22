'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { cartApi } from './api';
import { apiErrorMessage } from './utils';
import type { Cart } from '@/types';

export const CART_QUERY_KEY = ['cart'];

/** Корзина нужна почти на каждом экране — общий ключ и один кеш. */
export function useCart() {
  return useQuery<Cart>({
    queryKey: CART_QUERY_KEY,
    queryFn:  cartApi.get,
  });
}

export function useAddToCart() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ variantId, qty }: { variantId: string; qty?: number }) =>
      cartApi.add(variantId, qty ?? 1),
    onSuccess: (cart) => {
      queryClient.setQueryData(CART_QUERY_KEY, cart);
      toast.success('Добавлено в корзину');
    },
    // Чаще всего сюда попадает «не хватает на складе» — показываем
    // текст бэкенда, он уже содержит доступное количество.
    onError: (error) => toast.error(apiErrorMessage(error, 'Не удалось добавить товар')),
  });
}

export function useUpdateCartItem() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ itemId, qty }: { itemId: string; qty: number }) => cartApi.update(itemId, qty),
    onSuccess: (cart) => queryClient.setQueryData(CART_QUERY_KEY, cart),
    onError:   (error) => toast.error(apiErrorMessage(error)),
  });
}

export function useRemoveCartItem() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (itemId: string) => cartApi.remove(itemId),
    onSuccess: (cart) => {
      queryClient.setQueryData(CART_QUERY_KEY, cart);
      toast.success('Удалено из корзины');
    },
    onError: (error) => toast.error(apiErrorMessage(error)),
  });
}
