'use client';

import { ReactNode } from 'react';
import { UnifiedLayout } from '@/components/layout/UnifiedLayout';

interface ParentLayoutProps {
  children: ReactNode;
}

export default function ParentLayout({ children }: ParentLayoutProps) {
  return (
    <UnifiedLayout userRole="PARENT">
      {children}
    </UnifiedLayout>
  );
}