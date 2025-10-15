'use client';

import { ReactNode } from 'react';
import { UnifiedLayout } from '@/components/layout/UnifiedLayout';

interface CenterLayoutProps {
  children: ReactNode;
}

export default function CenterLayout({ children }: CenterLayoutProps) {
  return (
    <UnifiedLayout userRole="CENTER">
      {children}
    </UnifiedLayout>
  );
}
