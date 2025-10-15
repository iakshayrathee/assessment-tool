'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { Loader2 } from 'lucide-react';

export default function HomePage() {
  const { user, isAuthenticated, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading) {
      if (isAuthenticated && user) {
        // Redirect to role-based dashboard
        const redirectPath = getRoleBasedRedirect(user.role);
        router.push(redirectPath);
      } else {
        // Redirect to login
        router.push('/login');
      }
    }
  }, [isAuthenticated, user, isLoading, router]);

  const getRoleBasedRedirect = (role: string): string => {
    switch (role) {
      case 'ADMIN':
        return '/admin/dashboard';
      case 'SUPER_SPECIAL_EDUCATOR':
        return '/super-educator/dashboard';
      case 'SPECIAL_EDUCATOR':
        return '/educator/dashboard';
      case 'CENTER':
        return '/center/dashboard';
      case 'PARENT':
        return '/parent/dashboard';
      case 'SCHOOL_VIEWER':
        return '/school-viewer/dashboard';
      default:
        return '/dashboard';
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-blue-600 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Loading Knowled</h2>
          <p className="text-gray-600">Please wait while we prepare your dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="text-center">
        <div className="animate-pulse">
          <div className="h-16 w-16 bg-blue-200 rounded-full mx-auto mb-4"></div>
          <div className="h-4 bg-blue-200 rounded w-48 mx-auto mb-2"></div>
          <div className="h-3 bg-blue-100 rounded w-32 mx-auto"></div>
        </div>
      </div>
    </div>
  );
}
