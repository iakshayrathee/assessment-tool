'use client';

import { ReactNode } from 'react';
import { EducatorSidebar } from './EducatorSidebar';
import { cn } from '@/lib/utils';

interface EducatorLayoutProps {
  children: ReactNode;
  className?: string;
}

export function EducatorLayout({ children, className }: EducatorLayoutProps) {
  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar */}
      <EducatorSidebar />
      
      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <main className={cn("flex-1 overflow-auto", className)}>
          {children}
        </main>
      </div>
    </div>
  );
}
