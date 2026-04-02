'use client';

import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { UnifiedSidebar } from '@/components/layout/UnifiedSidebar';
import { TopHeader } from '@/components/layout/TopHeader';
import { redirect } from 'next/navigation';

export default function SchoolViewerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, isAuthenticated } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  // Redirect if not authenticated or not a school viewer
  if (!isAuthenticated || user?.role !== 'SCHOOL_VIEWER') {
    redirect('/login/school-viewer');
  }

  return (
    <div className="flex h-screen bg-muted/40">
      {/* Sidebar */}
      <UnifiedSidebar
        userRole="SCHOOL_VIEWER"
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        isCollapsed={sidebarCollapsed}
        onCollapsedChange={setSidebarCollapsed}
      />

      {/* Main content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top Header */}
        <TopHeader
          userRole="SCHOOL_VIEWER"
          onMenuClick={() => setSidebarOpen(true)}
        />

        {/* Page content */}
        <main className="flex-1 overflow-auto bg-muted/40 p-4 md:p-6">
          <div className="max-w-7xl mx-auto">
            {children}
          </div>
        </main>
      </div>

      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-gray-600 bg-opacity-75 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}
    </div>
  );
}
