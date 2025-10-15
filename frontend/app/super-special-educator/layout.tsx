'use client';

import { ReactNode } from 'react';
import { UnifiedLayout } from '@/components/layout/UnifiedLayout';

interface SuperSpecialEducatorLayoutProps {
  children: ReactNode;
}

export default function SuperSpecialEducatorLayout({ children }: SuperSpecialEducatorLayoutProps) {
  return (
    <UnifiedLayout userRole="SUPER_SPECIAL_EDUCATOR">
      {children}
    </UnifiedLayout>
  );
}
