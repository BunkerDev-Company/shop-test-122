'use client';

import { Search, SlidersHorizontal, X } from 'lucide-react';
import { cn } from '@/lib/utils';

interface SearchFieldProps {
  value:        string;
  onChange:     (value: string) => void;
  onSubmit?:    () => void;
  placeholder?: string;
  /** Кнопка фильтров справа от поля — как на экране каталога в макете. */
  onFilters?:   () => void;
  filtersActive?: boolean;
  className?:   string;
}

export function SearchField({
  value,
  onChange,
  onSubmit,
  placeholder = 'Поиск по каталогу',
  onFilters,
  filtersActive = false,
  className,
}: SearchFieldProps) {
  return (
    <div className={cn('flex items-center gap-2', className)}>
      <div className="relative flex-1">
        <Search className="pointer-events-none absolute left-4 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-muted" />
        <input
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') onSubmit?.();
          }}
          placeholder={placeholder}
          className="field py-3.5 pl-11 pr-11"
          type="search"
          enterKeyHint="search"
        />
        {value && (
          <button
            type="button"
            onClick={() => onChange('')}
            className="absolute right-3 top-1/2 flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-full bg-surface-2 text-ink-2"
            aria-label="Очистить"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        )}
      </div>

      {onFilters && (
        <button
          type="button"
          onClick={onFilters}
          className={cn('icon-btn', filtersActive && 'border-accent bg-accent')}
          aria-label="Фильтры"
        >
          <SlidersHorizontal className="h-[18px] w-[18px]" />
        </button>
      )}
    </div>
  );
}
