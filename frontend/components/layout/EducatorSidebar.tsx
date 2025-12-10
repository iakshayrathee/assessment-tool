'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
// import { ScrollArea } from '@/components/ui/scroll-area';
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
} from 'lucide-react';

interface SidebarProps {
  className?: string;
}

const navigationItems = [
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
    title: 'IEP Management',
    href: '/educator/iep-management',
    icon: BookOpen,
    description: 'Individual education programs and management'
  },
  {
    title: 'Homework',
    href: '/educator/homework',
    icon: FileText,
    description: 'Assign and track student homework'
  },
  {
    title: 'Reports',
    href: '/educator/reports',
    icon: BarChart3,
    description: 'Generate and view reports'
  },
  {
    title: 'Settings',
    href: '/educator/settings',
    icon: Settings,
    description: 'Application preferences'
  },
];

export function EducatorSidebar({ className }: SidebarProps) {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const pathname = usePathname();
  const { user, logout } = useAuth();

  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <div className={cn(
      "flex flex-col h-full bg-white border-r border-gray-200 transition-all duration-300",
      isCollapsed ? "w-16" : "w-72",
      className
    )}>
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200">
        {!isCollapsed && (
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">K</span>
            </div>
            <span className="font-semibold text-gray-900">Knowled</span>
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
            <Button
              variant="ghost"
              className={cn(
                "w-full justify-start p-2 h-auto",
                isCollapsed && "justify-center"
              )}
            >
              <div className="flex items-center space-x-3">
                <Avatar className="h-8 w-8">
                  <AvatarImage src="" alt={user?.specialEducatorProfile?.fullName || user?.superSpecialEducatorProfile?.fullName} />
                  <AvatarFallback className="bg-blue-100 text-blue-600">
                    {(user?.specialEducatorProfile?.fullName || user?.superSpecialEducatorProfile?.fullName) ? getInitials(user?.specialEducatorProfile?.fullName || user?.superSpecialEducatorProfile?.fullName || '') : 'SE'}
                  </AvatarFallback>
                </Avatar>
                {!isCollapsed && (
                  <div className="flex-1 text-left">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {user?.specialEducatorProfile?.fullName || user?.superSpecialEducatorProfile?.fullName || 'Special Educator'}
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
              <Link href="/educator/profile">
                <User className="mr-2 h-4 w-4" />
                Profile Settings
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link href="/educator/settings">
                <Settings className="mr-2 h-4 w-4" />
                Preferences
              </Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleLogout} className="text-red-600">
              <LogOut className="mr-2 h-4 w-4" />
              Sign Out
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
                      {!isActive && (
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
