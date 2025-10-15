'use client';

import { ReactNode } from 'react';
import { UnifiedLayout } from '@/components/layout/UnifiedLayout';

interface AdminLayoutProps {
  children: ReactNode;
}

export default function AdminLayout({ children }: AdminLayoutProps) {
  return (
    <UnifiedLayout userRole="ADMIN">
      {children}
    </UnifiedLayout>
  );
}
