'use client';

import Link from 'next/link';
import { useQueryClient } from '@tanstack/react-query';
import {
  ChevronRight,
  Heart,
  LogOut,
  Package,
  Settings2,
  ShieldCheck,
  User as UserIcon,
} from 'lucide-react';
import { useLogout, useUser } from '@/lib/use-user';
import { authStorage } from '@/lib/auth';
import { TopBar } from '@/components/layout/top-bar';
import { EmptyState } from '@/components/ui/empty-state';

export default function ProfilePage() {
  const { data: user, isLoading } = useUser();
  const logout = useLogout();
  const queryClient = useQueryClient();
  const isAuthenticated = typeof window !== 'undefined' && authStorage.isAuthenticated();

  if (!isAuthenticated) {
    return (
      <>
        <TopBar title="Профиль" />
        <EmptyState
          icon={<UserIcon className="h-7 w-7" />}
          title="Вы не вошли"
          description="Войдите, чтобы видеть заказы, избранное и оформлять покупки быстрее."
          action={{ label: 'Войти', href: '/login' }}
        />
        <div className="px-4 pb-8 text-center">
          <Link href="/register" className="text-[14px] font-semibold text-ink underline">
            Создать аккаунт
          </Link>
        </div>
      </>
    );
  }

  if (isLoading || !user) {
    return (
      <>
        <TopBar title="Профиль" />
        <div className="screen space-y-3">
          <div className="skeleton h-24 w-full" />
          <div className="skeleton h-40 w-full" />
        </div>
      </>
    );
  }

  const isStaff = user.role === 'admin' || user.role === 'manager';

  const MENU = [
    { href: '/orders',   label: 'Мои заказы', icon: Package, badge: user.ordersCount },
    { href: '/wishlist', label: 'Избранное',  icon: Heart,   badge: user.wishlistCount },
  ];

  return (
    <>
      <TopBar title="Профиль" />

      <div className="screen pt-1">
        {/* ── Шапка профиля ────────────────────────────────────── */}
        <div className="card flex items-center gap-3.5 p-4">
          <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-ink text-[20px] font-bold text-white">
            {(user.firstName?.[0] ?? user.email?.[0] ?? '?').toUpperCase()}
          </div>
          <div className="min-w-0">
            <p className="truncate text-[17px] font-bold">{user.name || 'Покупатель'}</p>
            <p className="truncate text-[13px] text-ink-2">{user.email}</p>
          </div>
        </div>

        {/* ── Меню ─────────────────────────────────────────────── */}
        <div className="card mt-4 divide-y divide-line">
          {MENU.map(({ href, label, icon: Icon, badge }) => (
            <Link key={href} href={href} className="flex items-center gap-3 p-4 active:bg-surface-2">
              <Icon className="h-5 w-5 shrink-0 text-ink-2" />
              <span className="flex-1 text-[15px] font-medium">{label}</span>
              {typeof badge === 'number' && badge > 0 && (
                <span className="badge bg-surface-2 text-ink-2">{badge}</span>
              )}
              <ChevronRight className="h-4 w-4 text-muted" />
            </Link>
          ))}

          <Link href="/profile/edit" className="flex items-center gap-3 p-4 active:bg-surface-2">
            <Settings2 className="h-5 w-5 shrink-0 text-ink-2" />
            <span className="flex-1 text-[15px] font-medium">Личные данные</span>
            <ChevronRight className="h-4 w-4 text-muted" />
          </Link>
        </div>

        {/* Сотруднику — вход в админку прямо из профиля. */}
        {isStaff && (
          <Link href="/admin" className="card mt-4 flex items-center gap-3 p-4 active:bg-surface-2">
            <ShieldCheck className="h-5 w-5 shrink-0 text-ink" />
            <div className="flex-1">
              <p className="text-[15px] font-semibold">Админ-панель</p>
              <p className="text-[12px] text-ink-2">
                {user.role === 'admin' ? 'Товары и заказы' : 'Обработка заказов'}
              </p>
            </div>
            <ChevronRight className="h-4 w-4 text-muted" />
          </Link>
        )}

        <button
          type="button"
          onClick={() => {
            queryClient.clear();
            logout();
          }}
          className="btn-ghost mt-4 w-full text-danger"
        >
          <LogOut className="h-4 w-4" /> Выйти
        </button>
      </div>
    </>
  );
}
