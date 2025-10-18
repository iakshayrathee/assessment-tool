'use client';

import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useRouter } from 'next/navigation';
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
import { Badge } from '@/components/ui/badge';
import { 
  Bell, 
  Search, 
  LogOut,
  Menu,
  Building,
  ChevronDown
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface TopHeaderProps {
  className?: string;
  userRole?: string;
  onMenuClick?: () => void;
}

const roleDisplayNames: Record<string, string> = {
  CENTER: 'Center Administrator',
  SPECIAL_EDUCATOR: 'Special Educator',
  ADMIN: 'System Administrator',
  SUPER_SPECIAL_EDUCATOR: 'Super Special Educator',
  PARENT: 'Parent',
  SCHOOL_VIEWER: 'School Viewer'
};

export function TopHeader({ className, userRole, onMenuClick }: TopHeaderProps) {
  const { user, logout } = useAuth();
  const router = useRouter();
  const [notifications] = useState(3); // Mock notification count

  const handleLogout = async () => {
    await logout();
    router.push('/login');
  };

  const getUserInitials = (name?: string) => {
    if (!name) return 'U';
    return name
      .split(' ')
      .map(word => word[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const getUserDisplayName = () => {
    if (user?.profile?.centerProfile?.centerName) {
      return user.profile.centerProfile.centerName;
    }
    if (user?.profile?.fullName) {
      return user.profile.fullName;
    }
    return user?.email || 'User';
  };

  return (
    <header className={cn(
      "bg-white border-b border-gray-200 shadow-sm sticky top-0 z-50",
      className
    )}>
      <div className="flex items-center justify-between h-16 px-4 sm:px-6 lg:px-8">
        {/* Left Section - Menu Button (Mobile) + Logo/Title */}
        <div className="flex items-center gap-4">
          {onMenuClick && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onMenuClick}
              className="lg:hidden"
            >
              <Menu className="h-5 w-5" />
            </Button>
          )}
          
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <Building className="h-6 w-6 text-blue-600" />
              <span className="font-semibold text-gray-900 hidden sm:block">
                Assessment Tool
              </span>
            </div>
            {userRole && (
              <Badge variant="secondary" className="hidden md:flex">
                {roleDisplayNames[userRole] || userRole}
              </Badge>
            )}
          </div>
        </div>

        {/* Center Section - Search (Optional) */}
        <div className="flex-1 max-w-md mx-4 hidden lg:block">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search..."
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
            />
          </div>
        </div>

        {/* Right Section - Notifications + User Menu */}
        <div className="flex items-center gap-3">
          {/* Notifications */}
          <Button variant="ghost" size="sm" className="relative">
            <Bell className="h-5 w-5" />
            {notifications > 0 && (
              <Badge 
                variant="destructive" 
                className="absolute -top-1 -right-1 h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs"
              >
                {notifications}
              </Badge>
            )}
          </Button>

          {/* User Menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="flex items-center gap-2 h-10">
                <Avatar className="h-8 w-8">
                  <AvatarImage src={user?.profile?.avatar} />
                  <AvatarFallback className="bg-blue-100 text-blue-600">
                    {getUserInitials(getUserDisplayName())}
                  </AvatarFallback>
                </Avatar>
                <div className="hidden md:flex flex-col items-start">
                  <span className="text-sm font-medium text-gray-900 truncate max-w-32">
                    {getUserDisplayName()}
                  </span>
                  <span className="text-xs text-gray-500">
                    {roleDisplayNames[userRole || ''] || 'User'}
                  </span>
                </div>
                <ChevronDown className="h-4 w-4 text-gray-500 hidden md:block" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel>My Account</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleLogout} className="text-red-600">
                <LogOut className="mr-2 h-4 w-4" />
                Sign out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
}