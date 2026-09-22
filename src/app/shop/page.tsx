'use client';

import { Suspense, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { PackageSearch, ShoppingCart } from 'lucide-react';
import { catalogApi, type ProductsQuery } from '@/lib/api';
import { useCart } from '@/lib/use-cart';
import { SearchField } from '@/components/ui/search-field';
import { EmptyState } from '@/components/ui/empty-state';
import { ProductGrid, ProductGridSkeleton } from '@/components/product/product-card';
import { cn } from '@/lib/utils';

const SORTS: { value: NonNullable<ProductsQuery['sort']>; label: string }[] = [
  { value: 'popular',    label: 'Популярные' },
  { value: 'price_asc',  label: 'Сначала дешевле' },
  { value: 'price_desc', label: 'Сначала дороже' },
  { value: 'new',        label: 'Новинки' },
];

function ShopScreen() {
  const router = useRouter();
  const params = useSearchParams();

  const categoryParam = params.get('category') ?? '';
  const sortParam     = (params.get('sort') as ProductsQuery['sort']) ?? 'popular';
  const queryParam    = params.get('q') ?? '';

  const [search, setSearch] = useState(queryParam);
  const [sortOpen, setSortOpen] = useState(false);

  const { data: categories } = useQuery({
    queryKey: ['categories'],
    queryFn:  catalogApi.categories,
  });

  const { data, isLoading } = useQuery({
    queryKey: ['products', { category: categoryParam, sort: sortParam, q: queryParam }],
    queryFn:  () => catalogApi.products({
      category: categoryParam || undefined,
      sort:     sortParam,
      q:        queryParam || undefined,
      perPage:  40,
    }),
  });

  const { data: cart } = useCart();

  /** Фильтры живут в URL: экран можно переслать ссылкой и вернуться назад. */
  const applyParam = (key: string, value: string | null) => {
    const next = new URLSearchParams(params.toString());
    if (value) next.set(key, value);
    else next.delete(key);
    router.push(`/shop${next.toString() ? `?${next}` : ''}`);
  };

  return (
    <>
      <header className="sticky top-0 z-30 bg-surface/95 px-4 pb-2 pt-4 backdrop-blur">
        <div className="flex items-center gap-2">
          <SearchField
            value={search}
            onChange={setSearch}
            onSubmit={() => applyParam('q', search.trim() || null)}
            onFilters={() => setSortOpen((open) => !open)}
            filtersActive={sortParam !== 'popular'}
            className="flex-1"
          />

          <Link href="/cart" className="icon-btn relative" aria-label="Корзина">
            <ShoppingCart className="h-[18px] w-[18px]" />
            {(cart?.itemsCount ?? 0) > 0 && (
              <span className="absolute -right-1 -top-1 flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-accent px-1 text-[10px] font-bold">
                {cart!.itemsCount}
              </span>
            )}
          </Link>
        </div>

        {sortOpen && (
          <div className="mt-2 flex flex-wrap gap-2 animate-fade-up">
            {SORTS.map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() => {
                  applyParam('sort', option.value === 'popular' ? null : option.value);
                  setSortOpen(false);
                }}
                className={cn('chip', sortParam === option.value && 'chip-active')}
              >
                {option.label}
              </button>
            ))}
          </div>
        )}

        <div className="scroll-row mt-3">
          <button
            type="button"
            onClick={() => applyParam('category', null)}
            className={cn('chip', !categoryParam && 'chip-active')}
          >
            Всё
          </button>
          {categories?.map((category) => (
            <button
              key={category.id}
              type="button"
              onClick={() => applyParam('category', category.slug)}
              className={cn('chip', categoryParam === category.slug && 'chip-active')}
            >
              {category.title}
            </button>
          ))}
        </div>
      </header>

      <div className="screen pt-3">
        {queryParam && (
          <p className="mb-3 text-[13px] text-ink-2">
            Поиск «{queryParam}» — найдено {data?.total ?? 0}
          </p>
        )}

        {isLoading ? (
          <ProductGridSkeleton count={6} />
        ) : data && data.items.length > 0 ? (
          <ProductGrid products={data.items} />
        ) : (
          <EmptyState
            icon={<PackageSearch className="h-7 w-7" />}
            title="Ничего не нашлось"
            description="Попробуйте изменить запрос или выбрать другую категорию."
            action={{ label: 'Показать всё', href: '/shop' }}
          />
        )}
      </div>
    </>
  );
}

export default function ShopPage() {
  // useSearchParams требует Suspense-границы при статической генерации.
  return (
    <Suspense fallback={<div className="screen pt-6"><ProductGridSkeleton count={6} /></div>}>
      <ShopScreen />
    </Suspense>
  );
}
