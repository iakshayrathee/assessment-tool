'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

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
  ChevronLeft,
  LayoutDashboard,
  GraduationCap,
  School,
  UserCheck,
  Calendar,
  Eye,
  Shield,
  Database,
  Activity,
  TrendingUp,
  AlertTriangle,
  Building2,
  MessageSquare,
  ClipboardList,
  Volume2,
  LogOut,
} from 'lucide-react';

interface SidebarProps {
  className?: string;
  userRole?: string;
  userName?: string;
  userEmail?: string;
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

interface NavigationGroup {
  label: string;
  items: NavigationItem[];
}

// Role-based navigation configurations (grouped)
const roleNavigations: Record<string, NavigationGroup[]> = {
  SPECIAL_EDUCATOR: [
    {
      label: 'Core',
      items: [
        { title: 'Dashboard', href: '/educator/dashboard', icon: Home },
        { title: 'My Profile', href: '/educator/profile', icon: User },
      ],
    },
    {
      label: 'Students',
      items: [
        { title: 'My Students', href: '/educator/students', icon: Users },
        { title: 'Intake Forms', href: '/educator/intake', icon: FileText },
      ],
    },
    {
      label: 'Learning',
      items: [
        { title: 'Assessments', href: '/educator/assessments', icon: Brain },
        { title: 'Remediation', href: '/educator/lesson-plans-new', icon: Calendar },
        { title: 'IEP Management', href: '/educator/iep-management', icon: BookOpen },
        { title: 'Homework', href: '/educator/homework', icon: ClipboardList },
      ],
    },
    {
      label: 'Resources',
      items: [
        { title: 'Data Bank', href: '/educator/data-bank', icon: Database },
        { title: 'Text-to-Speech', href: '/educator/text-to-speech', icon: Volume2 },
        { title: 'Reports', href: '/educator/reports', icon: BarChart3 },
        { title: 'AI Transparency', href: '/educator/ai-transparency', icon: Eye },
      ],
    },
  ],
  ADMIN: [
    {
      label: 'Overview',
      items: [
        { title: 'Overview', href: '/admin/overview', icon: TrendingUp },
      ],
    },
    {
      label: 'Management',
      items: [
        { title: 'User Management', href: '/admin/user-management', icon: Users },
        { title: 'Approvals', href: '/admin/approvals', icon: UserCheck },
      ],
    },
    {
      label: 'System',
      items: [
        { title: 'Reports', href: '/admin/reports', icon: FileText },
        { title: 'Audit Logs', href: '/admin/audit-logs', icon: Activity },
        { title: 'Settings', href: '/admin/settings', icon: Settings },
      ],
    },
  ],
  CENTER: [
    {
      label: 'Overview',
      items: [
        { title: 'Dashboard', href: '/center/dashboard', icon: LayoutDashboard },
      ],
    },
    {
      label: 'People',
      items: [
        { title: 'Schools', href: '/center/schools', icon: School },
        { title: 'Educators', href: '/center/educators', icon: GraduationCap },
        { title: 'Students', href: '/center/students', icon: Users },
      ],
    },
    {
      label: 'Insights',
      items: [
        { title: 'Reports', href: '/center/reports', icon: FileText },
        { title: 'Compliance', href: '/center/compliance', icon: Shield },
      ],
    },
  ],
  SUPER_SPECIAL_EDUCATOR: [
    {
      label: 'Overview',
      items: [
        { title: 'Dashboard', href: '/super-special-educator', icon: LayoutDashboard },
      ],
    },
    {
      label: 'Management',
      items: [
        { title: 'Centers', href: '/super-special-educator/centers', icon: Building2 },
        { title: 'Educators', href: '/super-special-educator/educators', icon: UserCheck },
        { title: 'Students', href: '/super-special-educator/students', icon: Users },
      ],
    },
    {
      label: 'Quality',
      items: [
        { title: 'Reviews', href: '/super-special-educator/reviews', icon: FileText },
        { title: 'Flagged Cases', href: '/super-special-educator/flagged-cases', icon: AlertTriangle },
        { title: 'Analytics', href: '/super-special-educator/analytics', icon: TrendingUp },
      ],
    },
  ],
  PARENT: [
    {
      label: 'Overview',
      items: [
        { title: 'Dashboard', href: '/parent/dashboard', icon: LayoutDashboard },
      ],
    },
    {
      label: 'My Children',
      items: [
        { title: 'My Children', href: '/parent/children', icon: Users },
        { title: 'Documents', href: '/parent/documents', icon: FileText },
        { title: 'Homework', href: '/parent/homework', icon: ClipboardList },
      ],
    },
    {
      label: 'Communication',
      items: [
        { title: 'Reports', href: '/parent/reports', icon: BarChart3 },
        { title: 'Concerns', href: '/parent/concerns', icon: MessageSquare },
        { title: 'Profile', href: '/parent/profile', icon: User },
      ],
    },
  ],
  SCHOOL_VIEWER: [
    {
      label: 'Overview',
      items: [
        { title: 'Dashboard', href: '/school-viewer/dashboard', icon: LayoutDashboard },
        { title: 'Students', href: '/school-viewer/students', icon: Users },
        { title: 'School Reports', href: '/school-viewer/school-reports', icon: BarChart3 },
      ],
    },
  ],
};

const roleDisplayNames: Record<string, string> = {
  SPECIAL_EDUCATOR: 'Special Educator',
  ADMIN: 'Administrator',
  CENTER: 'Center Manager',
  SUPER_SPECIAL_EDUCATOR: 'Super Educator',
  PARENT: 'Parent',
  SCHOOL_VIEWER: 'School Viewer',
};

function NavItem({
  item,
  isActive,
  isCollapsed,
}: {
  item: NavigationItem;
  isActive: boolean;
  isCollapsed: boolean;
}) {
  const Icon = item.icon;

  const content = (
    <Link
      href={item.href}
      className={cn(
        'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
        isActive
          ? 'bg-primary/10 text-primary'
          : 'text-muted-foreground hover:bg-muted hover:text-foreground',
        isCollapsed && 'justify-center px-2',
      )}
      aria-current={isActive ? 'page' : undefined}
    >
      <Icon
        className={cn(
          'h-4 w-4 shrink-0',
          isActive ? 'text-primary' : 'text-muted-foreground',
        )}
      />
      {!isCollapsed && <span className="truncate">{item.title}</span>}
    </Link>
  );

  if (isCollapsed) {
    return (
      <Tooltip>
        <TooltipTrigger asChild>{content}</TooltipTrigger>
        <TooltipContent side="right" sideOffset={8}>
          {item.title}
        </TooltipContent>
      </Tooltip>
    );
  }

  return content;
}

export function UnifiedSidebar({
  className,
  userRole = 'SPECIAL_EDUCATOR',
  userName = 'User',
  userEmail,
  isOpen = false,
  onClose,
  isCollapsed: controlledCollapsed,
  onCollapsedChange,
}: SidebarProps) {
  const [internalCollapsed, setInternalCollapsed] = useState(false);
  const pathname = usePathname();

  const isCollapsed = controlledCollapsed !== undefined ? controlledCollapsed : internalCollapsed;

  const handleToggleCollapse = () => {
    const next = !isCollapsed;
    if (onCollapsedChange) onCollapsedChange(next);
    else setInternalCollapsed(next);
  };

  const groups = roleNavigations[userRole] ?? roleNavigations.SPECIAL_EDUCATOR;
  const roleLabel = roleDisplayNames[userRole] ?? userRole;
  const initials = userName
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  return (
    <TooltipProvider delayDuration={0}>
      {/* Mobile overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/40 md:hidden"
          onClick={onClose}
          aria-hidden="true"
        />
      )}

      {/* Sidebar panel */}
      <aside
        className={cn(
          'flex h-screen flex-col border-r bg-sidebar border-sidebar-border transition-[width] duration-200',
          'fixed inset-y-0 left-0 z-50 md:relative',
          isCollapsed ? 'w-16' : 'w-64',
          isOpen ? 'flex' : 'hidden md:flex',
          className,
        )}
      >
        {/* Brand header */}
        <div className="flex h-14 items-center justify-between border-b border-sidebar-border px-3 shrink-0">
          {!isCollapsed && (
            <div className="flex items-center gap-2.5">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground font-bold text-sm shadow">
                K
              </div>
              <span className="font-display font-bold text-base text-foreground tracking-tight">
                Knowled
              </span>
            </div>
          )}
          {isCollapsed && (
            <div className="mx-auto flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground font-bold text-sm shadow">
              K
            </div>
          )}
          <div className={cn('hidden md:block', isCollapsed && 'hidden')}>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleToggleCollapse}
              className="h-7 w-7 p-0 text-muted-foreground"
              aria-label="Collapse sidebar"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
          </div>
          {isCollapsed && (
            <button
              onClick={handleToggleCollapse}
              className="absolute -right-3 top-4 hidden md:flex h-6 w-6 items-center justify-center rounded-full border border-border bg-background shadow-sm text-muted-foreground hover:text-foreground"
              aria-label="Expand sidebar"
            >
              <Menu className="h-3 w-3" />
            </button>
          )}
          <button
            className="md:hidden h-7 w-7 p-0 flex items-center justify-center text-muted-foreground hover:text-foreground"
            onClick={onClose}
            aria-label="Close sidebar"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto px-2 py-3 space-y-4" aria-label="Main navigation">
          {groups.map((group) => (
            <div key={group.label}>
              {!isCollapsed && (
                <p className="mb-1 px-3 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/60">
                  {group.label}
                </p>
              )}
              <div className="space-y-0.5">
                {group.items.map((item) => {
                  const isActive =
                    pathname === item.href || pathname.startsWith(item.href + '/');
                  return (
                    <NavItem
                      key={item.href}
                      item={item}
                      isActive={isActive}
                      isCollapsed={isCollapsed}
                    />
                  );
                })}
              </div>
            </div>
          ))}
        </nav>

        {/* User section */}
        <div className="shrink-0 border-t border-sidebar-border p-3">
          {isCollapsed ? (
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="flex h-8 w-8 mx-auto items-center justify-center rounded-full bg-primary/10 text-primary text-xs font-semibold cursor-default">
                  {initials}
                </div>
              </TooltipTrigger>
              <TooltipContent side="right" sideOffset={8}>
                <p className="font-medium">{userName}</p>
                <p className="text-xs text-muted-foreground">{roleLabel}</p>
              </TooltipContent>
            </Tooltip>
          ) : (
            <div className="flex items-center gap-3">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary text-xs font-semibold">
                {initials}
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-foreground">{userName}</p>
                <p className="truncate text-xs text-muted-foreground">{roleLabel}</p>
              </div>
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    className="shrink-0 text-muted-foreground hover:text-foreground"
                    aria-label="Sign out"
                  >
                    <LogOut className="h-4 w-4" />
                  </button>
                </TooltipTrigger>
                <TooltipContent side="top">Sign out</TooltipContent>
              </Tooltip>
            </div>
          )}
        </div>
      </aside>
    </TooltipProvider>
  );
}

