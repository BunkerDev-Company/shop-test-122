'use client';

import { useRouter } from 'next/navigation';
import { ChevronLeft } from 'lucide-react';
import { cn } from '@/lib/utils';

interface TopBarProps {
  title?:      string;
  /** Кнопка «назад»: на вложенных экранах вместо логотипа. */
  showBack?:   boolean;
  right?:      React.ReactNode;
  className?:  string;
}

export function TopBar({ title, showBack = false, right, className }: TopBarProps) {
  const router = useRouter();

  return (
    <header
      className={cn(
        'sticky top-0 z-30 flex items-center gap-3 bg-surface/95 px-4 py-3 backdrop-blur',
        className,
      )}
    >
      {showBack && (
        <button
          type="button"
          onClick={() => router.back()}
          className="icon-btn h-10 w-10"
          aria-label="Назад"
        >
          <ChevronLeft className="h-5 w-5" />
        </button>
      )}

      {title && <h1 className="flex-1 truncate text-[19px] font-extrabold tracking-tight">{title}</h1>}

      {right && <div className="ml-auto flex items-center gap-2">{right}</div>}
    </header>
  );
}
