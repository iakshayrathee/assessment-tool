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
  Search,
  LogOut,
  Menu,
  ChevronDown
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { NotificationDropdown } from './NotificationDropdown';

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

  const handleLogout = async () => {
    await logout();
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
      "bg-background border-b border-border sticky top-0 z-50",
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
              aria-label="Open navigation menu"
            >
              <Menu className="h-5 w-5" />
            </Button>
          )}

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary text-primary-foreground font-bold text-sm">
                K
              </div>
              <span className="font-display font-bold text-foreground hidden sm:block">
                Knowled
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
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" aria-hidden="true" />
            <input
              type="search"
              placeholder="Search..."
              aria-label="Search"
              className="w-full pl-10 pr-4 py-2 border border-input rounded-lg bg-background text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>
        </div>

        {/* Right Section - Notifications + User Menu */}
        <div className="flex items-center gap-3">
          {/* Notifications */}
          <NotificationDropdown />

          {/* User Menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="flex items-center gap-2 h-10">
                <Avatar className="h-8 w-8">
                  <AvatarImage src={user?.profile?.avatar} />
                  <AvatarFallback className="bg-primary/10 text-primary">
                    {getUserInitials(getUserDisplayName())}
                  </AvatarFallback>
                </Avatar>
                <div className="hidden md:flex flex-col items-start">
                  <span className="text-sm font-medium text-foreground truncate max-w-32">
                    {getUserDisplayName()}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {roleDisplayNames[userRole || ''] || 'User'}
                  </span>
                </div>
                <ChevronDown className="h-4 w-4 text-muted-foreground hidden md:block" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel>My Account</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleLogout} className="text-destructive">
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