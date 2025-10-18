'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { Loader2, GraduationCap, Users, BookOpen, Building2, Heart, Eye, Shield } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export default function HomePage() {
  const { user, isAuthenticated, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && isAuthenticated && user) {
      // Redirect to role-based dashboard if already authenticated
      const redirectPath = getRoleBasedRedirect(user.role);
      router.push(redirectPath);
    }
  }, [isAuthenticated, user, isLoading, router]);

  const getRoleBasedRedirect = (role: string): string => {
    switch (role) {
      case 'ADMIN':
        return '/admin/dashboard';
      case 'SUPER_SPECIAL_EDUCATOR':
        return '/super-special-educator/centers';
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

  const userTypes = [
    {
      title: 'Admin',
      description: 'Full system access and user management',
      icon: Shield,
      color: 'from-red-500 to-red-600',
      bgColor: 'bg-red-50',
      textColor: 'text-red-700',
      route: '/login/admin'
    },
    {
      title: 'Super Special Educator',
      description: 'Monitor and review multiple educators',
      icon: GraduationCap,
      color: 'from-green-500 to-green-600',
      bgColor: 'bg-green-50',
      textColor: 'text-green-700',
      route: '/login/super-special-educator'
    },
    {
      title: 'Special Educator',
      description: 'Conduct assessments and create IEPs',
      icon: BookOpen,
      color: 'from-purple-500 to-purple-600',
      bgColor: 'bg-purple-50',
      textColor: 'text-purple-700',
      route: '/login/special-educator'
    },
    {
      title: 'Center Manager',
      description: 'Manage center operations and educators',
      icon: Building2,
      color: 'from-blue-500 to-blue-600',
      bgColor: 'bg-blue-50',
      textColor: 'text-blue-700',
      route: '/login/center'
    },
    {
      title: 'Parent',
      description: 'View your child\'s progress and reports',
      icon: Heart,
      color: 'from-orange-500 to-orange-600',
      bgColor: 'bg-orange-50',
      textColor: 'text-orange-700',
      route: '/login/parent'
    },
    {
      title: 'School Viewer',
      description: 'Monitor students from your school',
      icon: Eye,
      color: 'from-indigo-500 to-indigo-600',
      bgColor: 'bg-indigo-50',
      textColor: 'text-indigo-700',
      route: '/login/school-viewer'
    }
  ];

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

  // Show login selector if not authenticated
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
      <div className="container mx-auto px-4 py-12">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-5xl font-bold text-gray-900 mb-4">
            Welcome to <span className="text-blue-600">Knowled</span>
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Empowering special education through comprehensive assessment and intervention tools
          </p>
        </div>

        {/* User Type Selection */}
        <div className="mb-8">
          <h2 className="text-2xl font-semibold text-center text-gray-800 mb-8">
            Choose Your Login Type
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
            {userTypes.map((userType, index) => {
              const IconComponent = userType.icon;
              return (
                <div key={userType.title}>
                  <Card 
                    className={`cursor-pointer transition-all duration-300 hover:shadow-lg border-2 hover:border-blue-300 ${userType.bgColor}`}
                    onClick={() => router.push(userType.route)}
                  >
                    <CardHeader className="text-center pb-4">
                      <div className={`w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-r ${userType.color} flex items-center justify-center`}>
                        <IconComponent className="w-8 h-8 text-white" />
                      </div>
                      <CardTitle className={`text-xl font-semibold ${userType.textColor}`}>
                        {userType.title}
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="text-center">
                      <CardDescription className="text-gray-600 text-sm">
                        {userType.description}
                      </CardDescription>
                    </CardContent>
                  </Card>
                </div>
              );
            })}
          </div>
        </div>

        {/* Footer */}
        <div className="text-center text-gray-500 text-sm">
          <p>© 2024 Knowled. Transforming special education through technology.</p>
        </div>
      </div>
    </div>
  );
}
