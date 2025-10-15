'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Home,
  Users,
  FileText,
  Brain,
  BookOpen,
  BarChart3,
  Settings,
  LogOut,
  Menu,
  X,
  User,
  ChevronDown,
  LayoutDashboard,
  GraduationCap,
  School,
  Building,
  UserCheck,
  Calendar,
  Award,
  Eye,
  Shield,
  Database,
  Activity,
  Bell,
  Search,
  Plus,
  TrendingUp,
  Zap,
  Star,
  AlertTriangle,
  Building2,
  MessageSquare,
  ClipboardList
} from 'lucide-react';

interface SidebarProps {
  className?: string;
  userRole?: string;
}

interface NavigationItem {
  title: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  description?: string;
}

// Role-based navigation configurations
const roleNavigations: Record<string, NavigationItem[]> = {
  SPECIAL_EDUCATOR: [
    {
      title: 'Dashboard',
      href: '/educator/dashboard',
      icon: Home,
      description: 'Overview and quick stats'
    },
    {
      title: 'My Profile',
      href: '/educator/profile',
      icon: User,
      description: 'Manage your profile information'
    },
    {
      title: 'My Students',
      href: '/educator/students',
      icon: Users,
      description: 'View and manage assigned students'
    },
    {
      title: 'Intake Forms',
      href: '/educator/intake',
      icon: FileText,
      description: 'Student intake and background forms'
    },
    {
      title: 'Assessments',
      href: '/educator/assessments',
      icon: Brain,
      description: 'Conduct and manage assessments'
    },
    {
      title: 'IEP & Lesson Plans',
      href: '/educator/lesson-plans',
      icon: BookOpen,
      description: 'Individual education plans and goals'
    },
    {
      title: 'Reports',
      href: '/educator/reports',
      icon: BarChart3,
      description: 'Generate and view reports'
    }
  ],
  ADMIN: [
    {
      title: 'Dashboard',
      href: '/admin/dashboard',
      icon: LayoutDashboard,
      description: 'System overview and analytics'
    },
    {
      title: 'Overview',
      href: '/admin/overview',
      icon: TrendingUp,
      description: 'Platform performance metrics'
    },
    {
      title: 'Centers & Schools',
      href: '/admin/centers-schools',
      icon: Building,
      description: 'Manage educational institutions'
    },
    {
      title: 'Educators',
      href: '/admin/educators',
      icon: GraduationCap,
      description: 'Manage educator accounts'
    },
    {
      title: 'Child Records',
      href: '/admin/child-records',
      icon: Users,
      description: 'Student information management'
    },
    {
      title: 'Approvals',
      href: '/admin/approvals',
      icon: UserCheck,
      description: 'Pending approvals and reviews'
    },
    {
      title: 'Reports',
      href: '/admin/reports',
      icon: FileText,
      description: 'System and compliance reports'
    },
    {
      title: 'Audit Logs',
      href: '/admin/audit-logs',
      icon: Activity,
      description: 'System activity tracking'
    },
    {
      title: 'Settings',
      href: '/admin/settings',
      icon: Settings,
      description: 'System configuration'
    }
  ],
  CENTER: [
    {
      title: 'Dashboard',
      href: '/center/dashboard',
      icon: LayoutDashboard,
      description: 'Center overview and metrics'
    },
    {
      title: 'Schools',
      href: '/center/schools',
      icon: School,
      description: 'Manage affiliated schools'
    },
    {
      title: 'Educators',
      href: '/center/educators',
      icon: GraduationCap,
      description: 'Manage center educators'
    },
    {
      title: 'Students',
      href: '/center/students',
      icon: Users,
      description: 'Student enrollment and management'
    },
    {
      title: 'Reports',
      href: '/center/reports',
      icon: FileText,
      description: 'Center performance reports'
    },
    {
      title: 'Compliance',
      href: '/center/compliance',
      icon: Shield,
      description: 'Regulatory compliance tracking'
    }
  ],
  SUPER_SPECIAL_EDUCATOR: [
    {
      title: 'Dashboard',
      href: '/super-special-educator',
      icon: LayoutDashboard,
      description: 'System oversight dashboard'
    },
    {
      title: 'Centers',
      href: '/super-special-educator/centers',
      icon: Building2,
      description: 'Manage education centers'
    },
    {
      title: 'Educators',
      href: '/super-special-educator/educators',
      icon: UserCheck,
      description: 'Educator quality management'
    },
    {
      title: 'Students',
      href: '/super-special-educator/students',
      icon: Users,
      description: 'Student progress oversight'
    },
    {
      title: 'Reviews',
      href: '/super-special-educator/reviews',
      icon: FileText,
      description: 'Quality assurance reviews'
    },
    {
      title: 'Flagged Cases',
      href: '/super-special-educator/flagged-cases',
      icon: AlertTriangle,
      description: 'Cases requiring attention'
    },
    {
      title: 'Analytics',
      href: '/super-special-educator/analytics',
      icon: TrendingUp,
      description: 'System-wide analytics'
    }
  ],
  PARENT: [
    {
      title: 'Dashboard',
      href: '/parent/dashboard',
      icon: LayoutDashboard,
      description: 'Your child\'s overview'
    },
    {
      title: 'My Children',
      href: '/parent/children',
      icon: Users,
      description: 'View your children\'s progress'
    },
    {
      title: 'Documents',
      href: '/parent/documents',
      icon: FileText,
      description: 'Important documents and forms'
    },
    {
      title: 'Concerns',
      href: '/parent/concerns',
      icon: MessageSquare,
      description: 'Submit concerns or questions'
    },
    {
      title: 'Profile',
      href: '/parent/profile',
      icon: User,
      description: 'Manage your account'
    }
  ],
  SCHOOL_VIEWER: [
    {
      title: 'Dashboard',
      href: '/school-viewer/dashboard',
      icon: LayoutDashboard,
      description: 'School overview'
    },
    {
      title: 'Students',
      href: '/school-viewer/students',
      icon: Users,
      description: 'View student information'
    },
    {
      title: 'Reports',
      href: '/school-viewer/reports',
      icon: FileText,
      description: 'School reports and analytics'
    }
  ]
};

// Helper function to get user initials
const getInitials = (name: string): string => {
  return name
    .split(' ')
    .map(word => word.charAt(0))
    .join('')
    .toUpperCase()
    .slice(0, 2);
};

// Helper function to get role display name
const getRoleDisplayName = (role: string): string => {
  const roleNames: Record<string, string> = {
    SPECIAL_EDUCATOR: 'Special Educator',
    ADMIN: 'Administrator',
    CENTER: 'Center Manager',
    SUPER_SPECIAL_EDUCATOR: 'Super Special Educator',
    PARENT: 'Parent',
    SCHOOL_VIEWER: 'School Viewer'
  };
  return roleNames[role] || role;
};

export function UnifiedSidebar({ className, userRole = 'SPECIAL_EDUCATOR' }: SidebarProps) {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout } = useAuth();

  const navigationItems = roleNavigations[userRole] || roleNavigations.SPECIAL_EDUCATOR;

  const handleLogout = async () => {
    try {
      await logout();
      router.push('/login');
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  return (
    <div className={cn(
      "flex flex-col h-screen bg-white border-r border-gray-200 transition-all duration-300",
      isCollapsed ? "w-16" : "w-64",
      className
    )}>
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-gradient-to-r from-primary/5 to-blue-50">
        {!isCollapsed && (
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-to-br from-primary to-blue-600 rounded-xl flex items-center justify-center shadow-lg">
              <span className="text-white font-bold text-lg">K</span>
            </div>
            <div>
              <h1 className="font-bold text-xl bg-gradient-to-r from-primary to-blue-600 bg-clip-text text-transparent">
                Knowled
              </h1>
              <p className="text-xs text-muted-foreground font-medium">
                Special Education Platform
              </p>
            </div>
          </div>
        )}
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="h-8 w-8 p-0"
        >
          {isCollapsed ? <Menu className="h-4 w-4" /> : <X className="h-4 w-4" />}
        </Button>
      </div>

      {/* User Profile Section */}
      <div className="p-4 border-b border-gray-200">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className={cn(
              "w-full p-2 h-auto justify-start hover:bg-gray-50",
              isCollapsed && "justify-center"
            )}>
              <div className={cn(
                "flex items-center gap-3",
                isCollapsed && "justify-center"
              )}>
                <Avatar className="h-8 w-8 shrink-0">
                  <AvatarImage src={user?.profile?.avatar} />
                  <AvatarFallback className="bg-blue-100 text-blue-600">
                    {user?.profile?.fullName ? getInitials(user.profile.fullName) : 'U'}
                  </AvatarFallback>
                </Avatar>
                {!isCollapsed && (
                  <div className="flex-1 text-left">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {user?.profile?.fullName || getRoleDisplayName(userRole)}
                    </p>
                    <p className="text-xs text-gray-500 truncate">
                      {user?.email}
                    </p>
                  </div>
                )}
                {!isCollapsed && <ChevronDown className="h-4 w-4 text-gray-400" />}
              </div>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-56">
            <DropdownMenuLabel>My Account</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <Link href={`/${userRole.toLowerCase().replace('_', '-')}/profile`}>
                <User className="mr-2 h-4 w-4" />
                Profile Settings
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link href={`/${userRole.toLowerCase().replace('_', '-')}/settings`}>
                <Settings className="mr-2 h-4 w-4" />
                Preferences
              </Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleLogout} className="text-red-600">
              <LogOut className="mr-2 h-4 w-4" />
              🚪 Logout
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Navigation */}
      <div className="flex-1 px-2 overflow-y-auto">
        <nav className="space-y-1 py-4">
          {navigationItems.map((item) => {
            const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
            const Icon = item.icon;

            return (
              <Link key={item.href} href={item.href}>
                <Button
                  variant={isActive ? "secondary" : "ghost"}
                  className={cn(
                    "w-full justify-start h-10 px-3",
                    isCollapsed && "justify-center px-2",
                    isActive && "bg-blue-50 text-blue-700 border-blue-200"
                  )}
                  title={isCollapsed ? item.title : undefined}
                >
                  <Icon className={cn(
                    "h-4 w-4",
                    !isCollapsed && "mr-3",
                    isActive && "text-blue-600"
                  )} />
                  {!isCollapsed && (
                    <div className="flex-1 text-left">
                      <div className="text-sm font-medium">{item.title}</div>
                      {!isActive && item.description && (
                        <div className="text-xs text-gray-500 mt-0.5">
                          {item.description}
                        </div>
                      )}
                    </div>
                  )}
                </Button>
              </Link>
            );
          })}
        </nav>
      </div>

      {/* Footer */}
      <div className="p-4 border-t border-gray-200">
        {!isCollapsed && (
          <div className="text-xs text-gray-500 text-center">
            <p>Knowled AI Platform</p>
            <p>Special Education Management</p>
          </div>
        )}
      </div>
    </div>
  );
}