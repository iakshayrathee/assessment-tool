import { cn } from '@/lib/utils';
import { ChevronRight, Home } from 'lucide-react';
import Link from 'next/link';

export interface BreadcrumbItem {
  label: string;
  href?: string;
}

interface PageWrapperProps {
  title: string;
  description?: string;
  breadcrumbs?: BreadcrumbItem[];
  actions?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}

export function PageWrapper({
  title,
  description,
  breadcrumbs,
  actions,
  children,
  className,
}: PageWrapperProps) {
  return (
    <div className={cn('flex flex-col gap-6 p-6', className)}>
      {/* Page header */}
      <div className="flex flex-col gap-1 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0 flex-1">
          {/* Breadcrumbs */}
          {breadcrumbs && breadcrumbs.length > 0 && (
            <nav aria-label="Breadcrumb" className="mb-2">
              <ol className="flex items-center gap-1 text-xs text-muted-foreground">
                <li>
                  <Link href="/" className="hover:text-foreground transition-colors">
                    <Home className="h-3 w-3" aria-label="Home" />
                  </Link>
                </li>
                {breadcrumbs.map((crumb, index) => (
                  <li key={index} className="flex items-center gap-1">
                    <ChevronRight className="h-3 w-3 shrink-0" aria-hidden="true" />
                    {crumb.href && index < breadcrumbs.length - 1 ? (
                      <Link
                        href={crumb.href}
                        className="hover:text-foreground transition-colors truncate max-w-[120px]"
                      >
                        {crumb.label}
                      </Link>
                    ) : (
                      <span
                        className="text-foreground font-medium truncate max-w-[200px]"
                        aria-current="page"
                      >
                        {crumb.label}
                      </span>
                    )}
                  </li>
                ))}
              </ol>
            </nav>
          )}

          {/* Title */}
          <h1 className="font-display text-2xl font-bold text-foreground tracking-tight">
            {title}
          </h1>

          {/* Description */}
          {description && (
            <p className="mt-1 text-sm text-muted-foreground">{description}</p>
          )}
        </div>

        {/* Actions */}
        {actions && (
          <div className="mt-3 flex shrink-0 items-center gap-2 sm:mt-0 sm:ml-4">
            {actions}
          </div>
        )}
      </div>

      {/* Page content */}
      <div className="flex-1">{children}</div>
    </div>
  );
}
