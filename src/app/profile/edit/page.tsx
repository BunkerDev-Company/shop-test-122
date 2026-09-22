'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { authApi } from '@/lib/api';
import { USER_QUERY_KEY, useUser } from '@/lib/use-user';
import { TopBar } from '@/components/layout/top-bar';
import { apiErrorMessage } from '@/lib/utils';

export default function ProfileEditPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { data: user } = useUser();

  const [form, setForm] = useState({ firstName: '', lastName: '', phone: '' });

  useEffect(() => {
    if (!user) return;
    setForm({
      firstName: user.firstName ?? '',
      lastName:  user.lastName ?? '',
      phone:     user.phone ?? '',
    });
  }, [user]);

  const save = useMutation({
    mutationFn: () => authApi.updateMe(form),
    onSuccess: (updated) => {
      queryClient.setQueryData(USER_QUERY_KEY, updated);
      toast.success('Сохранено');
      router.push('/profile');
    },
    onError: (error) => toast.error(apiErrorMessage(error)),
  });

  return (
    <>
      <TopBar title="Личные данные" showBack />

      <div className="screen space-y-3 pt-1">
        <div>
          <label className="field-label" htmlFor="firstName">Имя</label>
          <input
            id="firstName"
            className="field-box"
            value={form.firstName}
            onChange={(e) => setForm({ ...form, firstName: e.target.value })}
          />
        </div>

        <div>
          <label className="field-label" htmlFor="lastName">Фамилия</label>
          <input
            id="lastName"
            className="field-box"
            value={form.lastName}
            onChange={(e) => setForm({ ...form, lastName: e.target.value })}
          />
        </div>

        <div>
          <label className="field-label" htmlFor="phone">Телефон</label>
          <input
            id="phone"
            type="tel"
            inputMode="tel"
            className="field-box"
            value={form.phone}
            onChange={(e) => setForm({ ...form, phone: e.target.value })}
          />
        </div>

        <p className="pt-1 text-[12px] text-muted">
          Email менять нельзя — он используется для входа.
        </p>

        <button
          type="button"
          onClick={() => save.mutate()}
          disabled={save.isPending}
          className="btn-primary w-full"
        >
          {save.isPending ? 'Сохраняем…' : 'Сохранить'}
        </button>
      </div>
    </>
  );
}
