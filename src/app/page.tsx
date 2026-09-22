'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { ArrowRight, Bell, ChevronRight, User } from 'lucide-react';
import { catalogApi } from '@/lib/api';
import { useUser } from '@/lib/use-user';
import { SearchField } from '@/components/ui/search-field';
import { ProductGrid, ProductGridSkeleton } from '@/components/product/product-card';

export default function HomePage() {
  const router = useRouter();
  const [search, setSearch] = useState('');
  const { data: user } = useUser();

  const { data: categories } = useQuery({
    queryKey: ['categories'],
    queryFn:  catalogApi.categories,
  });

  const { data: featured, isLoading } = useQuery({
    queryKey: ['products', { featured: true }],
    queryFn:  () => catalogApi.products({ featured: true, perPage: 6 }),
  });

  const { data: newest } = useQuery({
    queryKey: ['products', { sort: 'new' }],
    queryFn:  () => catalogApi.products({ sort: 'new', perPage: 4 }),
  });

  const goSearch = () => {
    const term = search.trim();
    router.push(term ? `/shop?q=${encodeURIComponent(term)}` : '/shop');
  };

  return (
    <>
      <header className="flex items-center justify-between px-4 pb-1 pt-4">
        <Link href="/" className="text-[22px] font-extrabold tracking-tight">
          {process.env.NEXT_PUBLIC_APP_NAME || 'VOLTA'}
        </Link>

        <div className="flex items-center gap-2">
          <Link href="/orders" className="icon-btn h-10 w-10 relative" aria-label="Мои заказы">
            <Bell className="h-[18px] w-[18px]" />
            {(user?.ordersCount ?? 0) > 0 && (
              <span className="absolute -right-0.5 -top-0.5 flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-accent px-1 text-[10px] font-bold">
                {user!.ordersCount}
              </span>
            )}
          </Link>

          <Link
            href="/profile"
            className="flex h-10 w-10 items-center justify-center overflow-hidden rounded-full bg-ink text-white"
            aria-label="Профиль"
          >
            {user?.firstName ? (
              <span className="text-[14px] font-bold">{user.firstName[0].toUpperCase()}</span>
            ) : (
              <User className="h-[18px] w-[18px]" />
            )}
          </Link>
        </div>
      </header>

      <div className="screen pt-3">
        <SearchField value={search} onChange={setSearch} onSubmit={goSearch} />

        {/* ── Промо-баннер ──────────────────────────────────────────
            Единственное жёлтое пятно на экране: держит внимание на
            акции, не конкурируя с карточками товаров. */}
        <Link
          href="/shop?sort=price_asc"
          className="mt-4 block overflow-hidden rounded-[22px] bg-accent p-5 active:scale-[0.99]"
        >
          <p className="text-[13px] font-semibold uppercase tracking-wider text-ink/70">
            Скидки недели
          </p>
          <h2 className="mt-1.5 text-[30px] font-extrabold leading-[1.05] tracking-tight text-ink">
            До 25%
            <br />
            на технику
          </h2>
          <span className="mt-4 inline-flex items-center gap-2 rounded-full bg-ink px-5 py-2.5 text-[14px] font-semibold text-white">
            Выбрать <ArrowRight className="h-4 w-4" />
          </span>
        </Link>

        {/* ── Категории ─────────────────────────────────────────── */}
        {categories && categories.length > 0 && (
          <div className="scroll-row mt-5">
            {categories.map((category) => (
              <Link key={category.id} href={`/shop?category=${category.slug}`} className="chip">
                {category.title}
                <span className="text-[12px] text-muted">{category.productCount}</span>
              </Link>
            ))}
          </div>
        )}

        {/* ── Подборка ──────────────────────────────────────────── */}
        <div className="mt-6 flex items-center justify-between">
          <h2 className="section-title">Рекомендуем</h2>
          <Link href="/shop" className="link-more">
            Всё <ChevronRight className="h-4 w-4" />
          </Link>
        </div>

        <div className="mt-3">
          {isLoading ? (
            <ProductGridSkeleton />
          ) : (
            <ProductGrid products={featured?.items ?? []} />
          )}
        </div>

        {newest && newest.items.length > 0 && (
          <>
            <div className="mt-8 flex items-center justify-between">
              <h2 className="section-title">Новинки</h2>
              <Link href="/shop?sort=new" className="link-more">
                Всё <ChevronRight className="h-4 w-4" />
              </Link>
            </div>
            <div className="mt-3">
              <ProductGrid products={newest.items} />
            </div>
          </>
        )}
      </div>
    </>
  );
}
