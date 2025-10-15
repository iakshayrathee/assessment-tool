'use client';

import { ReactNode } from 'react';
import { UnifiedSidebar } from './UnifiedSidebar';
import { cn } from '@/lib/utils';

interface UnifiedLayoutProps {
  children: ReactNode;
  className?: string;
  userRole?: string;
}

export function UnifiedLayout({ children, className, userRole }: UnifiedLayoutProps) {
  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar */}
      <UnifiedSidebar userRole={userRole} />
      
      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <main className={cn("flex-1 overflow-auto", className)}>
          {children}
        </main>
      </div>
    </div>
  );
}