'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { authApi } from '@/lib/api';
import { authStorage, cartSession } from '@/lib/auth';
import { CART_QUERY_KEY } from '@/lib/use-cart';
import { USER_QUERY_KEY } from '@/lib/use-user';
import { TopBar } from '@/components/layout/top-bar';
import { apiErrorMessage } from '@/lib/utils';

export default function RegisterPage() {
  const router = useRouter();
  const queryClient = useQueryClient();

  const [form, setForm] = useState({ firstName: '', lastName: '', email: '', password: '' });

  const register = useMutation({
    mutationFn: () =>
      authApi.register({
        email:     form.email.trim(),
        password:  form.password,
        firstName: form.firstName.trim() || undefined,
        lastName:  form.lastName.trim() || undefined,
      }),
    onSuccess: (user) => {
      authStorage.setToken(user.access_token);
      authStorage.setRole(user.role);
      // Товары, собранные до регистрации, бэкенд уже перенёс в аккаунт.
      cartSession.clear();
      queryClient.setQueryData(USER_QUERY_KEY, user);
      queryClient.invalidateQueries({ queryKey: CART_QUERY_KEY });
      toast.success('Аккаунт создан');
      router.push('/profile');
    },
    onError: (error) => toast.error(apiErrorMessage(error, 'Не удалось создать аккаунт')),
  });

  const canSubmit = form.email.trim().includes('@') && form.password.length >= 6;

  return (
    <>
      <TopBar showBack />

      <div className="screen pt-2">
        <h1 className="text-[28px] font-extrabold leading-tight tracking-tight">Регистрация</h1>
        <p className="mt-1.5 text-[14px] text-ink-2">
          Пара полей — и корзина останется с вами на всех устройствах.
        </p>

        <form
          className="mt-6 space-y-3"
          onSubmit={(e) => {
            e.preventDefault();
            if (canSubmit) register.mutate();
          }}
        >
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="field-label" htmlFor="firstName">Имя</label>
              <input
                id="firstName"
                className="field-box"
                value={form.firstName}
                onChange={(e) => setForm({ ...form, firstName: e.target.value })}
                autoComplete="given-name"
              />
            </div>
            <div>
              <label className="field-label" htmlFor="lastName">Фамилия</label>
              <input
                id="lastName"
                className="field-box"
                value={form.lastName}
                onChange={(e) => setForm({ ...form, lastName: e.target.value })}
                autoComplete="family-name"
              />
            </div>
          </div>

          <div>
            <label className="field-label" htmlFor="email">Email</label>
            <input
              id="email"
              type="email"
              inputMode="email"
              autoComplete="email"
              className="field-box"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              placeholder="you@example.com"
            />
          </div>

          <div>
            <label className="field-label" htmlFor="password">Пароль</label>
            <input
              id="password"
              type="password"
              autoComplete="new-password"
              className="field-box"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              placeholder="Минимум 6 символов"
            />
            {form.password.length > 0 && form.password.length < 6 && (
              <p className="mt-1.5 text-[12px] text-danger">Пароль короче 6 символов</p>
            )}
          </div>

          <button type="submit" disabled={!canSubmit || register.isPending} className="btn-primary w-full">
            {register.isPending ? 'Создаём…' : 'Создать аккаунт'}
          </button>
        </form>

        <p className="mt-5 text-center text-[14px] text-ink-2">
          Уже есть аккаунт?{' '}
          <Link href="/login" className="font-semibold text-ink underline">
            Войти
          </Link>
        </p>
      </div>
    </>
  );
}
