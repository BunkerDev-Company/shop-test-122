'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Heart, ShieldCheck, ShoppingCart, Star, Truck } from 'lucide-react';
import toast from 'react-hot-toast';
import { catalogApi, wishlistApi } from '@/lib/api';
import { authStorage } from '@/lib/auth';
import { useAddToCart, useCart } from '@/lib/use-cart';
import { TopBar } from '@/components/layout/top-bar';
import { QtyStepper } from '@/components/ui/qty-stepper';
import { cn, formatPrice } from '@/lib/utils';

export default function ProductPage() {
  const params = useParams<{ slug: string }>();
  const queryClient = useQueryClient();
  const addToCart = useAddToCart();
  const { data: cart } = useCart();

  const [variantId, setVariantId] = useState<string | null>(null);
  const [qty, setQty] = useState(1);
  const [imageIndex, setImageIndex] = useState(0);

  const { data: product, isLoading } = useQuery({
    queryKey: ['product', params.slug],
    queryFn:  () => catalogApi.product(params.slug),
  });

  // Пока покупатель не выбрал вариант, показываем первый доступный —
  // экран не должен открываться с пустой ценой.
  const selected = useMemo(() => {
    if (!product) return null;
    if (variantId) return product.variants.find((v) => v.id === variantId) ?? null;
    return product.variants.find((v) => v.stockQty > 0) ?? product.variants[0] ?? null;
  }, [product, variantId]);

  const toggleFavourite = useMutation({
    mutationFn: () => wishlistApi.toggle(product!.id),
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ['product', params.slug] });
      queryClient.invalidateQueries({ queryKey: ['wishlist'] });
      toast.success(result.isFavourite ? 'В избранном' : 'Убрано из избранного');
    },
  });

  if (isLoading || !product) {
    return (
      <>
        <TopBar showBack />
        <div className="screen">
          <div className="skeleton aspect-square w-full" />
          <div className="skeleton mt-4 h-5 w-2/3 rounded-full" />
          <div className="skeleton mt-3 h-4 w-1/3 rounded-full" />
        </div>
      </>
    );
  }

  const outOfStock = !selected || selected.stockQty === 0;

  const handleAdd = () => {
    if (!selected || outOfStock) return;
    addToCart.mutate({ variantId: selected.id, qty });
  };

  return (
    <>
      <TopBar
        showBack
        right={
          <Link href="/cart" className="icon-btn h-10 w-10 relative" aria-label="Корзина">
            <ShoppingCart className="h-[18px] w-[18px]" />
            {(cart?.itemsCount ?? 0) > 0 && (
              <span className="absolute -right-1 -top-1 flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-accent px-1 text-[10px] font-bold">
                {cart!.itemsCount}
              </span>
            )}
          </Link>
        }
      />

      <div className="screen pb-40 pt-0">
        {/* ── Галерея ──────────────────────────────────────────── */}
        <div className="tile relative aspect-square overflow-hidden">
          {product.images.length > 0 ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={product.images[imageIndex]?.url}
              alt={product.images[imageIndex]?.alt ?? product.title}
              className="h-full w-full object-contain p-6"
            />
          ) : (
            <div className="flex h-full items-center justify-center text-[13px] text-muted">
              нет фото
            </div>
          )}

          <button
            type="button"
            onClick={() => {
              if (!authStorage.isAuthenticated()) {
                toast('Войдите, чтобы сохранять избранное', { icon: '🔒' });
                return;
              }
              toggleFavourite.mutate();
            }}
            className="absolute right-3 top-3 flex h-11 w-11 items-center justify-center rounded-full bg-surface/90 shadow-card backdrop-blur active:scale-90"
            aria-label="В избранное"
          >
            <Heart
              className={cn('h-5 w-5', product.isFavourite ? 'text-like' : 'text-ink')}
              fill={product.isFavourite ? 'currentColor' : 'none'}
            />
          </button>
        </div>

        {product.images.length > 1 && (
          <div className="scroll-row mt-3">
            {product.images.map((image, index) => (
              <button
                key={image.url}
                type="button"
                onClick={() => setImageIndex(index)}
                className={cn(
                  'tile h-16 w-16 shrink-0 overflow-hidden border-2',
                  index === imageIndex ? 'border-ink' : 'border-transparent',
                )}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={image.url} alt="" className="h-full w-full object-contain p-1.5" />
              </button>
            ))}
          </div>
        )}

        {/* ── Заголовок и цена ─────────────────────────────────── */}
        <div className="mt-4">
          {product.brand && (
            <span className="text-[12px] font-semibold uppercase tracking-wide text-muted">
              {product.brand.title}
            </span>
          )}
          <h1 className="mt-1 text-[22px] font-extrabold leading-tight tracking-tight">
            {product.title}
          </h1>
          {product.subtitle && <p className="mt-1 text-[14px] text-ink-2">{product.subtitle}</p>}

          <div className="mt-2 flex items-center gap-1.5">
            <Star className="h-4 w-4 fill-accent text-accent" />
            <span className="text-[14px] font-bold">{product.rating.toFixed(1)}</span>
            <span className="text-[13px] text-muted">· {product.ratingCount} отзывов</span>
          </div>

          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-[26px] font-extrabold tracking-tight">
              {formatPrice(selected?.price ?? product.priceMin)}
            </span>
            {selected?.oldPrice && (
              <>
                <span className="text-[15px] text-muted line-through">
                  {formatPrice(selected.oldPrice)}
                </span>
                <span className="badge bg-accent-soft text-warning">
                  −{Math.round((1 - selected.price / selected.oldPrice) * 100)}%
                </span>
              </>
            )}
          </div>
        </div>

        {/* ── Выбор варианта ───────────────────────────────────── */}
        {product.variants.length > 1 && (
          <div className="mt-5">
            <h2 className="section-title text-[15px]">Комплектация</h2>
            <div className="mt-2.5 flex flex-wrap gap-2">
              {product.variants.map((variant) => {
                const isSelected = selected?.id === variant.id;
                const isEmpty = variant.stockQty === 0;

                return (
                  <button
                    key={variant.id}
                    type="button"
                    disabled={isEmpty}
                    onClick={() => {
                      setVariantId(variant.id);
                      setQty(1);
                    }}
                    className={cn(
                      'chip',
                      isSelected && 'chip-active',
                      // Распроданный SKU видно, но выбрать нельзя: так
                      // понятно, что комплектация существует.
                      isEmpty && 'opacity-40 line-through',
                    )}
                  >
                    {variant.title}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {selected && (
          <p className={cn('mt-3 text-[13px] font-medium', outOfStock ? 'text-danger' : 'text-success')}>
            {outOfStock
              ? 'Нет в наличии'
              : selected.stockQty <= 3
                ? `Осталось ${selected.stockQty} шт.`
                : 'В наличии'}
          </p>
        )}

        {/* ── Доставка ─────────────────────────────────────────── */}
        <div className="card mt-5 divide-y divide-line">
          <div className="flex items-center gap-3 p-4">
            <Truck className="h-5 w-5 shrink-0 text-ink-2" />
            <div>
              <p className="text-[14px] font-semibold">Доставка завтра</p>
              <p className="text-[13px] text-ink-2">Бесплатно при заказе от 30 000 ₽</p>
            </div>
          </div>
          <div className="flex items-center gap-3 p-4">
            <ShieldCheck className="h-5 w-5 shrink-0 text-ink-2" />
            <div>
              <p className="text-[14px] font-semibold">Гарантия 12 месяцев</p>
              <p className="text-[13px] text-ink-2">Официальная гарантия производителя</p>
            </div>
          </div>
        </div>

        {product.description && (
          <div className="mt-6">
            <h2 className="section-title text-[15px]">Описание</h2>
            <p className="mt-2 text-[14px] leading-relaxed text-ink-2">{product.description}</p>
          </div>
        )}

        {product.attributes.length > 0 && (
          <div className="mt-6">
            <h2 className="section-title text-[15px]">Характеристики</h2>
            <dl className="mt-2 divide-y divide-line">
              {product.attributes.map((attribute) => (
                <div key={attribute.name} className="flex items-start justify-between gap-4 py-2.5">
                  <dt className="text-[13px] text-muted">{attribute.name}</dt>
                  <dd className="text-right text-[13px] font-medium text-ink">{attribute.value}</dd>
                </div>
              ))}
            </dl>
          </div>
        )}
      </div>

      {/* ── Панель покупки ──────────────────────────────────────
          Липнет над таб-баром: цена и кнопка всегда под большим пальцем. */}
      <div className="fixed bottom-[68px] left-1/2 z-30 w-full max-w-[440px] -translate-x-1/2 border-t border-line bg-surface/95 px-4 py-3 backdrop-blur">
        <div className="flex items-center gap-3">
          <QtyStepper
            value={qty}
            onChange={(next) => setQty(Math.max(1, next))}
            max={selected?.stockQty}
            disabled={outOfStock}
            removable={false}
          />

          <button
            type="button"
            onClick={handleAdd}
            disabled={outOfStock || addToCart.isPending}
            className="btn-accent flex-1"
          >
            {outOfStock ? 'Нет в наличии' : `В корзину · ${formatPrice((selected?.price ?? 0) * qty)}`}
          </button>
        </div>
      </div>
    </>
  );
}
