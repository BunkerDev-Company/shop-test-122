'use client';

import { Suspense, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { authApi } from '@/lib/api';
import { authStorage, cartSession } from '@/lib/auth';
import { CART_QUERY_KEY } from '@/lib/use-cart';
import { USER_QUERY_KEY } from '@/lib/use-user';
import { TopBar } from '@/components/layout/top-bar';
import { apiErrorMessage } from '@/lib/utils';

function LoginScreen() {
  const router = useRouter();
  const params = useSearchParams();
  const queryClient = useQueryClient();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const login = useMutation({
    mutationFn: () => authApi.login(email.trim(), password),
    onSuccess: (user) => {
      authStorage.setToken(user.access_token);
      authStorage.setRole(user.role);
      // Гостевую корзину сервер уже перенёс в аккаунт — токен больше не нужен.
      cartSession.clear();
      queryClient.setQueryData(USER_QUERY_KEY, user);
      queryClient.invalidateQueries({ queryKey: CART_QUERY_KEY });
      toast.success(`Привет, ${user.firstName || 'рады видеть'}!`);
      router.push(params.get('from') || '/profile');
    },
    onError: (error) => toast.error(apiErrorMessage(error, 'Неверный email или пароль')),
  });

  const canSubmit = email.trim() && password.length >= 1;

  return (
    <>
      <TopBar showBack />

      <div className="screen pt-2">
        <h1 className="text-[28px] font-extrabold leading-tight tracking-tight">Вход</h1>
        <p className="mt-1.5 text-[14px] text-ink-2">
          Заказы, избранное и быстрое оформление — в одном аккаунте.
        </p>

        <form
          className="mt-6 space-y-3"
          onSubmit={(e) => {
            e.preventDefault();
            if (canSubmit) login.mutate();
          }}
        >
          <div>
            <label className="field-label" htmlFor="email">Email</label>
            <input
              id="email"
              type="email"
              inputMode="email"
              autoComplete="email"
              className="field-box"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
            />
          </div>

          <div>
            <label className="field-label" htmlFor="password">Пароль</label>
            <input
              id="password"
              type="password"
              autoComplete="current-password"
              className="field-box"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
            />
          </div>

          <button type="submit" disabled={!canSubmit || login.isPending} className="btn-primary w-full">
            {login.isPending ? 'Входим…' : 'Войти'}
          </button>
        </form>

        <p className="mt-5 text-center text-[14px] text-ink-2">
          Нет аккаунта?{' '}
          <Link href="/register" className="font-semibold text-ink underline">
            Зарегистрироваться
          </Link>
        </p>

        {/* Демо-стенд: без подсказки не войти — учётки нигде больше не показаны. */}
        <div className="card mt-8 space-y-1 p-4 text-[12px] text-ink-2">
          <p className="font-semibold text-ink">Демо-доступы</p>
          <p>Покупатель — demo@shop.local / demo123</p>
          <p>Админ — admin@shop.local / admin123</p>
          <p>Менеджер — manager@shop.local / manager123</p>
        </div>
      </div>
    </>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="screen" />}>
      <LoginScreen />
    </Suspense>
  );
}
