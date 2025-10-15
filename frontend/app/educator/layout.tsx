'use client';

import { ReactNode } from 'react';
import { UnifiedLayout } from '@/components/layout/UnifiedLayout';

interface EducatorLayoutProps {
  children: ReactNode;
}

export default function EducatorLayout({ children }: EducatorLayoutProps) {
  return (
    <UnifiedLayout userRole="SPECIAL_EDUCATOR">
      {children}
    </UnifiedLayout>
  );
}