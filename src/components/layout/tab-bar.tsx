'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Heart, Home, ShoppingBag, ShoppingCart, User } from 'lucide-react';
import { useCart } from '@/lib/use-cart';
import { cn } from '@/lib/utils';

const TABS = [
  { href: '/',         label: 'Главная',   icon: Home },
  { href: '/shop',     label: 'Каталог',   icon: ShoppingBag },
  { href: '/wishlist', label: 'Избранное', icon: Heart },
  { href: '/cart',     label: 'Корзина',   icon: ShoppingCart },
  { href: '/profile',  label: 'Профиль',   icon: User },
];

export function TabBar() {
  const pathname = usePathname();
  const { data: cart } = useCart();

  // Админка — рабочий экран сотрудника, ему покупательская навигация мешает.
  if (pathname.startsWith('/admin')) return null;

  return (
    <nav className="fixed bottom-0 left-1/2 z-40 w-full max-w-[440px] -translate-x-1/2 border-t border-line bg-surface/95 pb-[env(safe-area-inset-bottom,0px)] shadow-tab backdrop-blur">
      <div className="flex items-stretch justify-around px-2 py-2">
        {TABS.map(({ href, label, icon: Icon }) => {
          const isActive = href === '/' ? pathname === '/' : pathname.startsWith(href);
          const showBadge = href === '/cart' && (cart?.itemsCount ?? 0) > 0;

          return (
            <Link
              key={href}
              href={href}
              className={cn(
                'relative flex flex-1 flex-col items-center gap-1 rounded-2xl py-1.5 transition-colors',
                isActive ? 'text-ink' : 'text-muted',
              )}
            >
              <span className="relative">
                <Icon
                  className="h-[22px] w-[22px]"
                  strokeWidth={isActive ? 2.4 : 1.8}
                  // Активная вкладка «Избранное» и «Корзина» читаются лучше
                  // залитыми — так же, как в макете.
                  fill={isActive && (href === '/wishlist') ? 'currentColor' : 'none'}
                />
                {showBadge && (
                  <span className="absolute -right-2 -top-1.5 flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-accent px-1 text-[10px] font-bold text-ink">
                    {cart!.itemsCount}
                  </span>
                )}
              </span>
              <span className={cn('text-[10px]', isActive ? 'font-semibold' : 'font-medium')}>
                {label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
