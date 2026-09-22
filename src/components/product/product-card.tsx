'use client';

import Link from 'next/link';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Heart, Plus, Star } from 'lucide-react';
import toast from 'react-hot-toast';
import { wishlistApi } from '@/lib/api';
import { authStorage } from '@/lib/auth';
import { useAddToCart } from '@/lib/use-cart';
import { catalogApi } from '@/lib/api';
import { cn, formatPriceRange } from '@/lib/utils';
import type { ProductListItem } from '@/types';

interface ProductCardProps {
  product:   ProductListItem;
  /** Жёлтая кнопка покупки — акцент на первой карточке подборки. */
  highlight?: boolean;
}

export function ProductCard({ product, highlight = false }: ProductCardProps) {
  const queryClient = useQueryClient();
  const addToCart   = useAddToCart();

  const toggleFavourite = useMutation({
    mutationFn: () => wishlistApi.toggle(product.id),
    onSuccess: (result) => {
      // Обновляем все списки товаров разом: один и тот же товар может
      // лежать и в подборке на главной, и в каталоге, и в избранном.
      queryClient.invalidateQueries({ queryKey: ['products'] });
      queryClient.invalidateQueries({ queryKey: ['wishlist'] });
      toast.success(result.isFavourite ? 'В избранном' : 'Убрано из избранного');
    },
    onError: () => toast.error('Не удалось изменить избранное'),
  });

  const handleFavourite = (event: React.MouseEvent) => {
    event.preventDefault();
    if (!authStorage.isAuthenticated()) {
      toast('Войдите, чтобы сохранять избранное', { icon: '🔒' });
      return;
    }
    toggleFavourite.mutate();
  };

  /**
   * Кнопка «+» на карточке кладёт товар в корзину не уходя со списка.
   * У товара может быть несколько SKU — берём первый доступный; если
   * вариантов несколько, увести на карточку честнее, чем выбрать за
   * покупателя, поэтому туда и уводим.
   */
  const handleQuickAdd = async (event: React.MouseEvent) => {
    event.preventDefault();
    if (!product.inStock) return;

    const detail = await queryClient.fetchQuery({
      queryKey: ['product', product.slug],
      queryFn:  () => catalogApi.product(product.slug),
    });

    const available = detail.variants.filter((v) => v.stockQty > 0);
    if (available.length !== 1) {
      window.location.href = `/product/${product.slug}`;
      return;
    }

    addToCart.mutate({ variantId: available[0].id, qty: 1 });
  };

  return (
    <Link href={`/product/${product.slug}`} className="group flex flex-col">
      <div className="relative">
        <div className="tile relative aspect-square overflow-hidden">
          {product.imageUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={product.imageUrl}
              alt={product.title}
              className="h-full w-full object-contain p-3 transition-transform duration-300 group-active:scale-95"
              loading="lazy"
            />
          ) : (
            <div className="flex h-full items-center justify-center text-[12px] text-muted">
              нет фото
            </div>
          )}

          {!product.inStock && (
            <span className="absolute left-2 top-2 badge bg-ink/85 text-white">Нет в наличии</span>
          )}
        </div>

        <button
          type="button"
          onClick={handleFavourite}
          className="absolute right-2 top-2 flex h-9 w-9 items-center justify-center rounded-full bg-surface/90 shadow-card backdrop-blur transition-transform active:scale-90"
          aria-label={product.isFavourite ? 'Убрать из избранного' : 'В избранное'}
        >
          <Heart
            className={cn('h-[18px] w-[18px]', product.isFavourite ? 'text-like' : 'text-ink')}
            fill={product.isFavourite ? 'currentColor' : 'none'}
            strokeWidth={2}
          />
        </button>
      </div>

      <div className="mt-2.5 flex flex-1 flex-col px-0.5">
        {product.brand && (
          <span className="text-[11px] font-semibold uppercase tracking-wide text-muted">
            {product.brand.title}
          </span>
        )}

        <h3 className="mt-0.5 line-clamp-2 text-[14px] font-semibold leading-tight text-ink">
          {product.title}
        </h3>

        <div className="mt-1 flex items-center gap-1">
          <Star className="h-3.5 w-3.5 fill-accent text-accent" />
          <span className="text-[12px] font-semibold text-ink">{product.rating.toFixed(1)}</span>
          <span className="text-[12px] text-muted">({product.ratingCount})</span>
        </div>

        <div className="mt-auto flex items-end justify-between gap-2 pt-2">
          <span className="text-[15px] font-extrabold tracking-tight text-ink">
            {formatPriceRange(product.priceMin, product.priceMax)}
          </span>

          <button
            type="button"
            onClick={handleQuickAdd}
            disabled={!product.inStock || addToCart.isPending}
            className={cn(
              'flex h-9 w-9 shrink-0 items-center justify-center rounded-full border transition-all active:scale-90 disabled:opacity-30',
              highlight ? 'border-accent bg-accent text-ink' : 'border-line bg-surface text-ink',
            )}
            aria-label="В корзину"
          >
            <Plus className="h-4 w-4" strokeWidth={2.5} />
          </button>
        </div>
      </div>
    </Link>
  );
}

/** Сетка карточек: две колонки — столько помещается на телефоне. */
export function ProductGrid({ products }: { products: ProductListItem[] }) {
  return (
    <div className="grid grid-cols-2 gap-x-3 gap-y-5">
      {products.map((product, index) => (
        <ProductCard key={product.id} product={product} highlight={index === 0} />
      ))}
    </div>
  );
}

export function ProductCardSkeleton() {
  return (
    <div className="flex flex-col">
      <div className="skeleton aspect-square" />
      <div className="skeleton mt-2.5 h-3 w-1/3 rounded-full" />
      <div className="skeleton mt-2 h-4 w-full rounded-full" />
      <div className="skeleton mt-2 h-4 w-1/2 rounded-full" />
    </div>
  );
}

export function ProductGridSkeleton({ count = 4 }: { count?: number }) {
  return (
    <div className="grid grid-cols-2 gap-x-3 gap-y-5">
      {Array.from({ length: count }).map((_, index) => (
        <ProductCardSkeleton key={index} />
      ))}
    </div>
  );
}
