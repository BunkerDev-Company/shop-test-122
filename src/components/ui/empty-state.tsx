import Link from 'next/link';
import { cn } from '@/lib/utils';

interface EmptyStateProps {
  icon?:        React.ReactNode;
  title:        string;
  description?: string;
  action?:      { label: string; href: string };
  className?:   string;
}

export function EmptyState({ icon, title, description, action, className }: EmptyStateProps) {
  return (
    <div className={cn('flex flex-col items-center px-6 py-16 text-center', className)}>
      {icon && (
        <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-surface-2 text-ink-2">
          {icon}
        </div>
      )}
      <h2 className="text-[17px] font-bold text-ink">{title}</h2>
      {description && <p className="mt-1.5 max-w-[260px] text-[14px] text-ink-2">{description}</p>}
      {action && (
        <Link href={action.href} className="btn-primary mt-6 px-8">
          {action.label}
        </Link>
      )}
    </div>
  );
}
