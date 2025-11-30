'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

import {
  Home,
  Users,
  FileText,
  Brain,
  BookOpen,
  BarChart3,
  Settings,
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
  isOpen?: boolean;
  onClose?: () => void;
  isCollapsed?: boolean;
  onCollapsedChange?: (collapsed: boolean) => void;
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
      title: 'Remediation',
      href: '/educator/lesson-plans-new',
      icon: Calendar,
      description: 'Create and manage lesson plans'
    },
    {
      title: 'IEP Management',
      href: '/educator/iep-management',
      icon: BookOpen,
      description: 'Individual education programs and management'
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
      title: 'User Management',
      href: '/admin/user-management',
      icon: Users,
      description: 'Manage all user accounts and roles'
    },
    {
      title: 'Child Records',
      href: '/admin/child-records',
      icon: ClipboardList,
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

export function UnifiedSidebar({ 
  className, 
  userRole = 'SPECIAL_EDUCATOR', 
  isOpen = false, 
  onClose,
  isCollapsed: controlledCollapsed,
  onCollapsedChange 
}: SidebarProps) {
  const [internalCollapsed, setInternalCollapsed] = useState(false);
  const pathname = usePathname();

  // Use controlled state if provided, otherwise use internal state
  const isCollapsed = controlledCollapsed !== undefined ? controlledCollapsed : internalCollapsed;
  
  const handleToggleCollapse = () => {
    const newCollapsed = !isCollapsed;
    if (onCollapsedChange) {
      onCollapsedChange(newCollapsed);
    } else {
      setInternalCollapsed(newCollapsed);
    }
  };

  const navigationItems = roleNavigations[userRole] || roleNavigations.SPECIAL_EDUCATOR;

  return (
    <>
      {/* Mobile Overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-40 md:hidden"
          onClick={onClose}
        />
      )}
      
      {/* Sidebar */}
      <div className={cn(
        "flex flex-col h-screen bg-white border-r border-gray-200 transition-all duration-300",
        // Desktop and tablet behavior (md and up)
        "hidden md:flex",
        isCollapsed ? "w-16" : "w-72",
        // Mobile behavior (below md)
        "md:relative fixed inset-y-0 left-0 z-50",
        isOpen ? "flex" : "hidden md:flex",
        // Responsive width: fixed on mobile, responsive on tablet/desktop
        isOpen ? "w-72" : "", // Mobile width when open
        className
      )}>
      {/* Header */}
      <div className="flex items-center justify-between p-3 border-b border-gray-200 bg-gradient-to-r from-primary/5 to-blue-50">
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
        
        {/* Desktop/Tablet Collapse Button */}
        <div className="hidden md:block">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleToggleCollapse}
            className="h-8 w-8 p-0"
            title={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            {isCollapsed ? <Menu className="h-4 w-4" /> : <ChevronDown className="h-4 w-4 rotate-90" />}
          </Button>
        </div>
        
        {/* Mobile Close Button */}
        <div className="md:hidden">
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="h-8 w-8 p-0"
            title="Close sidebar"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>



      {/* Navigation */}
      <div className="flex-1 px-2 overflow-y-auto">
        <nav className="space-y-1 py-3"> {/* Reduced padding from py-4 to py-3 */}
          {navigationItems.map((item) => {
            const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
            const Icon = item.icon;

            return (
              <Link key={item.href} href={item.href}>
                <Button
                  variant={isActive ? "secondary" : "ghost"}
                  className={cn(
                    "w-full justify-start h-auto min-h-[2.5rem] px-3 py-2 rounded-lg", // Changed to h-auto with min-h and added py-2 for better content-based sizing
                    isCollapsed && "justify-center px-2",
                    isActive && "bg-blue-50 text-blue-700 border-blue-200",
                    !isActive && "hover:bg-gray-50" // Better hover state
                  )}
                  title={isCollapsed ? item.title : undefined}
                >
                  <Icon className={cn(
                    "h-4 w-4 shrink-0", // Added shrink-0
                    !isCollapsed && "mr-3",
                    isActive && "text-blue-600"
                  )} />
                  {!isCollapsed && (
                    <div className="flex-1 text-left min-w-0"> {/* Added min-w-0 to prevent overflow */}
                      <div className="text-sm font-medium leading-tight">{item.title}</div> {/* Added leading-tight */}
                      {!isActive && item.description && (
                        <div className="text-xs text-gray-500 mt-0.5 leading-tight"> {/* Added leading-tight */}
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
      <div className="p-3 border-t border-gray-200"> {/* Reduced padding from p-4 to p-3 */}
        {!isCollapsed && (
          <div className="text-xs text-gray-500 text-center">
            <p>Knowled AI Platform</p>
            <p>Special Education Management</p>
          </div>
        )}
      </div>
    </div>
    </>
  );
}