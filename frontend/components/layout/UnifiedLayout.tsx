'use client';

import { ReactNode, useState, useEffect } from 'react';
import { UnifiedSidebar } from './UnifiedSidebar';
import { TopHeader } from './TopHeader';
import { cn } from '@/lib/utils';

interface UnifiedLayoutProps {
  children: ReactNode;
  className?: string;
  userRole?: string;
}

export function UnifiedLayout({ children, className, userRole }: UnifiedLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);

  // Close sidebar on mobile when clicking outside or navigating
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 768) { // md breakpoint
        setSidebarOpen(false); // Reset mobile sidebar state on desktop
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar */}
      <UnifiedSidebar 
        userRole={userRole} 
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        isCollapsed={isCollapsed}
        onCollapsedChange={setIsCollapsed}
      />
      
      {/* Main Content */}
      <div className={cn(
        "flex-1 flex flex-col overflow-hidden transition-all duration-300",
        // Adjust margin for desktop/tablet when sidebar is visible
        "md:ml-0" // Reset any margin on mobile
      )}>
        {/* Top Header */}
        <TopHeader 
          userRole={userRole} 
          onMenuClick={() => setSidebarOpen(!sidebarOpen)}
        />
        
        {/* Main Content Area */}
        <main className={cn("flex-1 overflow-auto", className)}>
          {children}
        </main>
      </div>
    </div>
  );
}