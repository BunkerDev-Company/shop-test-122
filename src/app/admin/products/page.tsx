'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ChevronLeft, Pencil, Plus, Search, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { adminApi, catalogApi } from '@/lib/api';
import { useUser } from '@/lib/use-user';
import { ProductFormSheet } from '@/components/admin/product-form-sheet';
import { apiErrorMessage, cn, formatPrice } from '@/lib/utils';
import type { AdminProduct } from '@/types';

export default function AdminProductsPage() {
  const queryClient = useQueryClient();
  const { data: user, isLoading: userLoading } = useUser();

  const [search, setSearch] = useState('');
  const [editing, setEditing] = useState<AdminProduct | null>(null);
  const [creating, setCreating] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ['admin-products', { search }],
    queryFn:  () => adminApi.products({ q: search.trim() || undefined, perPage: 50 }),
    enabled:  user?.role === 'admin',
  });

  const { data: categories } = useQuery({
    queryKey: ['categories'],
    queryFn:  catalogApi.categories,
  });

  const { data: brands } = useQuery({
    queryKey: ['brands'],
    queryFn:  catalogApi.brands,
  });

  const removeProduct = useMutation({
    mutationFn: (id: string) => adminApi.deleteProduct(id),
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ['admin-products'] });
      queryClient.invalidateQueries({ queryKey: ['products'] });
      toast.success(
        result.deactivated
          ? 'Товар снят с публикации — он есть в заказах'
          : 'Товар удалён',
      );
    },
    onError: (error) => toast.error(apiErrorMessage(error)),
  });

  if (userLoading) {
    return <div className="screen pt-6"><div className="skeleton h-20 w-full" /></div>;
  }

  if (user?.role !== 'admin') {
    return (
      <div className="screen pt-10 text-center">
        <p className="text-[15px] font-semibold">Каталогом управляет администратор</p>
        <Link href="/admin" className="btn-primary mt-5 inline-flex px-8">К заказам</Link>
      </div>
    );
  }

  return (
    <>
      <header className="sticky top-0 z-30 bg-surface/95 px-4 pb-2 pt-4 backdrop-blur">
        <div className="flex items-center gap-2">
          <Link href="/admin" className="icon-btn h-10 w-10" aria-label="Назад">
            <ChevronLeft className="h-5 w-5" />
          </Link>
          <h1 className="flex-1 text-[19px] font-extrabold tracking-tight">Товары</h1>
          <button
            type="button"
            onClick={() => setCreating(true)}
            className="icon-btn border-accent bg-accent"
            aria-label="Добавить товар"
          >
            <Plus className="h-5 w-5" />
          </button>
        </div>

        <div className="relative mt-3">
          <Search className="pointer-events-none absolute left-4 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-muted" />
          <input
            className="field py-3 pl-11"
            placeholder="Название или ссылка"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </header>

      <div className="screen space-y-3 pt-2">
        {isLoading ? (
          [0, 1, 2].map((i) => <div key={i} className="skeleton h-24 w-full" />)
        ) : data && data.items.length > 0 ? (
          data.items.map((product) => (
            <div key={product.id} className="card flex gap-3 p-3">
              <div className="tile h-[72px] w-[72px] shrink-0 overflow-hidden">
                {product.imageUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={product.imageUrl} alt="" className="h-full w-full object-contain p-2" />
                ) : null}
              </div>

              <div className="min-w-0 flex-1">
                <div className="flex items-start justify-between gap-2">
                  <p className="line-clamp-2 text-[14px] font-semibold leading-tight">{product.title}</p>
                  {!product.isActive && <span className="badge shrink-0 bg-surface-2 text-muted">скрыт</span>}
                </div>

                <p className="mt-0.5 text-[12px] text-muted">
                  {product.category?.title ?? 'без категории'} · {product.variants.length} SKU · остаток {product.stockTotal}
                </p>

                <div className="mt-1.5 flex items-center justify-between gap-2">
                  <span className="text-[14px] font-extrabold">{formatPrice(product.priceMin)}</span>

                  <div className="flex gap-1.5">
                    <button
                      type="button"
                      onClick={() => setEditing(product)}
                      className="flex h-8 w-8 items-center justify-center rounded-full border border-line active:scale-90"
                      aria-label="Изменить"
                    >
                      <Pencil className="h-3.5 w-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        if (confirm(`Удалить «${product.title}»?`)) removeProduct.mutate(product.id);
                      }}
                      className="flex h-8 w-8 items-center justify-center rounded-full border border-line text-danger active:scale-90"
                      aria-label="Удалить"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))
        ) : (
          <p className="py-16 text-center text-[14px] text-ink-2">Товаров не найдено</p>
        )}
      </div>

      {(creating || editing) && (
        <ProductFormSheet
          product={editing}
          categories={categories ?? []}
          brands={brands ?? []}
          onClose={() => {
            setCreating(false);
            setEditing(null);
          }}
        />
      )}
    </>
  );
}
