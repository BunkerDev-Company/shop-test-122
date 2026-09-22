'use client';

import { useQuery } from '@tanstack/react-query';
import { Heart } from 'lucide-react';
import { wishlistApi } from '@/lib/api';
import { authStorage } from '@/lib/auth';
import { TopBar } from '@/components/layout/top-bar';
import { EmptyState } from '@/components/ui/empty-state';
import { ProductGrid, ProductGridSkeleton } from '@/components/product/product-card';

export default function WishlistPage() {
  const isAuthenticated = typeof window !== 'undefined' && authStorage.isAuthenticated();

  const { data: products, isLoading } = useQuery({
    queryKey: ['wishlist'],
    queryFn:  wishlistApi.list,
    enabled:  isAuthenticated,
  });

  if (!isAuthenticated) {
    return (
      <>
        <TopBar title="Избранное" />
        <EmptyState
          icon={<Heart className="h-7 w-7" />}
          title="Нужен аккаунт"
          description="Избранное сохраняется в профиле — войдите, чтобы собирать список."
          action={{ label: 'Войти', href: '/login?from=/wishlist' }}
        />
      </>
    );
  }

  return (
    <>
      <TopBar title="Избранное" />

      <div className="screen pt-1">
        {isLoading ? (
          <ProductGridSkeleton count={4} />
        ) : products && products.length > 0 ? (
          <ProductGrid products={products} />
        ) : (
          <EmptyState
            icon={<Heart className="h-7 w-7" />}
            title="Пока пусто"
            description="Нажимайте на сердечко в каталоге, чтобы сохранить товар."
            action={{ label: 'В каталог', href: '/shop' }}
          />
        )}
      </div>
    </>
  );
}
