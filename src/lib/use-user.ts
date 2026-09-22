'use client';

import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { authApi } from './api';
import { authStorage, cartSession } from './auth';
import { CART_QUERY_KEY } from './use-cart';
import type { CurrentUser } from '@/types';

export const USER_QUERY_KEY = ['me'];

/**
 * Текущий пользователь. Запрос идёт только при наличии токена: гость —
 * обычный посетитель витрины, а не ошибка, и дёргать /me ему незачем.
 */
export function useUser() {
  const enabled = typeof window !== 'undefined' && authStorage.isAuthenticated();

  return useQuery<CurrentUser | null>({
    queryKey: USER_QUERY_KEY,
    queryFn:  () => authApi.me(),
    enabled,
    retry: false,
  });
}

export function useLogout() {
  const queryClient = useQueryClient();
  const router = useRouter();

  return () => {
    authStorage.clear();
    // Гостевую сессию тоже сбрасываем: иначе следующий посетитель этого
    // браузера увидел бы корзину предыдущего.
    cartSession.clear();
    queryClient.setQueryData(USER_QUERY_KEY, null);
    queryClient.invalidateQueries({ queryKey: CART_QUERY_KEY });
    router.push('/');
  };
}
