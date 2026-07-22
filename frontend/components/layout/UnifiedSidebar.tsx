'use client';

import { useState, useEffect, Suspense } from 'react';
import { useTranslation } from 'react-i18next';
import Link from 'next/link';
import { usePathname, useSearchParams } from 'next/navigation';
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
  ChevronDown,
  ChevronRight,
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

interface NavigationSubItem {
  title: string;
  href: string;
}

interface NavigationItem {
  title: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  description?: string;
  items?: NavigationSubItem[];
}

interface NavigationGroup {
  label: string;
  items: NavigationItem[];
}

// Role-based navigation configurations (grouped) — built at render time with translations
function getRoleNavigations(t: (key: string) => string): Record<string, NavigationGroup[]> {
  return {
    SPECIAL_EDUCATOR: [
      {
        label: t('navGroups.core'),
        items: [
          { title: t('nav.dashboard'), href: '/educator/dashboard', icon: Home },
          { title: t('nav.myProfile'), href: '/educator/profile', icon: User },
        ],
      },
      {
        label: t('navGroups.students'),
        items: [
          { title: t('nav.myStudents'), href: '/educator/students', icon: Users },
          { title: t('nav.intakeForms'), href: '/educator/intake', icon: FileText },
        ],
      },
      {
        label: t('navGroups.learning'),
        items: [
          {
            title: t('nav.assessments'),
            href: '/educator/assessments',
            icon: Brain,
            items: [
              { title: t('nav.assessmentsFormal'), href: '/educator/assessments?tab=formal' },
              { title: t('nav.assessmentsReading'), href: '/educator/assessments?tab=skill&skill=reading' },
              { title: t('nav.assessmentsComprehension'), href: '/educator/assessments?tab=skill&skill=comprehension' },
              { title: t('nav.assessmentsWriting'), href: '/educator/assessments?tab=skill&skill=writing' },
              { title: t('nav.assessmentsMath'), href: '/educator/assessments?tab=skill&skill=math' },
            ],
          },
          {
            title: t('nav.remediation'),
            href: '/educator/lesson-plans-new',
            icon: Calendar,
            items: [
              { title: t('nav.remediationLtp'), href: '/educator/lesson-plans-new?tab=ltp' },
              { title: t('nav.remediationStp'), href: '/educator/lesson-plans-new?tab=stp' },
              { title: t('nav.remediationWp'), href: '/educator/lesson-plans-new?tab=wlp' },
            ],
          },
          { title: t('nav.iepManagement'), href: '/educator/iep-management', icon: BookOpen },
          { title: t('nav.homework'), href: '/educator/homework', icon: ClipboardList },
        ],
      },
      {
        label: t('navGroups.resources'),
        items: [
          { title: t('nav.dataBank'), href: '/educator/data-bank', icon: Database },
          { title: t('nav.textToSpeech'), href: '/educator/text-to-speech', icon: Volume2 },
          { title: t('nav.reports'), href: '/educator/reports', icon: BarChart3 },
          { title: t('nav.aiTransparency'), href: '/educator/ai-transparency', icon: Eye },
        ],
      },
    ],
    ADMIN: [
      {
        label: t('navGroups.overview'),
        items: [
          { title: t('nav.overview'), href: '/admin/overview', icon: TrendingUp },
        ],
      },
      {
        label: t('navGroups.management'),
        items: [
          { title: t('nav.userManagement'), href: '/admin/user-management', icon: Users },
          { title: t('nav.approvals'), href: '/admin/approvals', icon: UserCheck },
        ],
      },
      {
        label: t('navGroups.system'),
        items: [
          { title: t('nav.reports'), href: '/admin/reports', icon: FileText },
          { title: t('nav.auditLogs'), href: '/admin/audit-logs', icon: Activity },
          { title: t('nav.settings'), href: '/admin/settings', icon: Settings },
        ],
      },
    ],
    CENTER: [
      {
        label: t('navGroups.overview'),
        items: [
          { title: t('nav.dashboard'), href: '/center/dashboard', icon: LayoutDashboard },
        ],
      },
      {
        label: t('navGroups.people'),
        items: [
          { title: t('nav.schools'), href: '/center/schools', icon: School },
          { title: t('nav.educators'), href: '/center/educators', icon: GraduationCap },
          { title: t('nav.students'), href: '/center/students', icon: Users },
        ],
      },
      {
        label: t('navGroups.insights'),
        items: [
          { title: t('nav.reports'), href: '/center/reports', icon: FileText },
          { title: t('nav.compliance'), href: '/center/compliance', icon: Shield },
        ],
      },
    ],
    SUPER_SPECIAL_EDUCATOR: [
      {
        label: t('navGroups.overview'),
        items: [
          { title: t('nav.dashboard'), href: '/super-special-educator', icon: LayoutDashboard },
        ],
      },
      {
        label: t('navGroups.management'),
        items: [
          { title: t('nav.centers'), href: '/super-special-educator/centers', icon: Building2 },
          { title: t('nav.educators'), href: '/super-special-educator/educators', icon: UserCheck },
          { title: t('nav.students'), href: '/super-special-educator/students', icon: Users },
        ],
      },
      {
        label: t('navGroups.quality'),
        items: [
          { title: t('nav.reviews'), href: '/super-special-educator/reviews', icon: FileText },
          { title: t('nav.flaggedCases'), href: '/super-special-educator/flagged-cases', icon: AlertTriangle },
          { title: t('nav.analytics'), href: '/super-special-educator/analytics', icon: TrendingUp },
        ],
      },
    ],
    PARENT: [
      {
        label: t('navGroups.overview'),
        items: [
          { title: t('nav.dashboard'), href: '/parent/dashboard', icon: LayoutDashboard },
        ],
      },
      {
        label: t('navGroups.myChildren'),
        items: [
          { title: t('nav.children'), href: '/parent/children', icon: Users },
          { title: t('nav.documents'), href: '/parent/documents', icon: FileText },
          { title: t('nav.homework'), href: '/parent/homework', icon: ClipboardList },
        ],
      },
      {
        label: t('navGroups.communication'),
        items: [
          { title: t('nav.reports'), href: '/parent/reports', icon: BarChart3 },
          { title: t('nav.concerns'), href: '/parent/concerns', icon: MessageSquare },
          { title: t('nav.profile'), href: '/parent/profile', icon: User },
        ],
      },
    ],
    SCHOOL_VIEWER: [
      {
        label: t('navGroups.overview'),
        items: [
          { title: t('nav.dashboard'), href: '/school-viewer/dashboard', icon: LayoutDashboard },
          { title: t('nav.students'), href: '/school-viewer/students', icon: Users },
          { title: t('nav.schoolReports'), href: '/school-viewer/school-reports', icon: BarChart3 },
        ],
      },
    ],
  };
}function NavItem({
  item,
  isActive,
  isCollapsed,
}: {
  item: NavigationItem;
  isActive: boolean;
  isCollapsed: boolean;
}) {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // Helper to determine if a sub-item is active based on path and search params
  const isSubItemActive = (subHref: string) => {
    const [subPath, subQuery] = subHref.split('?');
    if (pathname !== subPath) return false;
    if (!subQuery) return true;

    const subParams = new URLSearchParams(subQuery);
    for (const [key, val] of subParams.entries()) {
      if (searchParams.get(key) !== val) return false;
    }
    return true;
  };

  const hasSubItems = item.items && item.items.length > 0;
  const isChildActive = hasSubItems && item.items!.some(sub => isSubItemActive(sub.href));

  // Keep track of expansion state
  const [isExpanded, setIsExpanded] = useState(isActive || isChildActive);

  // Auto-expand when a child or the parent page becomes active
  useEffect(() => {
    if (isActive || isChildActive) {
      setIsExpanded(true);
    }
  }, [isActive, isChildActive]);

  const Icon = item.icon;

  const content = (
    <div className="flex flex-col w-full">
      <div className="flex items-center justify-between w-full group/nav">
        <Link
          href={item.href}
          className={cn(
            'flex-1 flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
            (isActive && !isChildActive)
              ? 'bg-primary/10 text-primary'
              : 'text-muted-foreground hover:bg-muted hover:text-foreground',
            isCollapsed && 'justify-center px-2',
          )}
          aria-current={(isActive && !isChildActive) ? 'page' : undefined}
        >
          <Icon
            className={cn(
              'h-4 w-4 shrink-0',
              (isActive || isChildActive) ? 'text-primary' : 'text-muted-foreground',
            )}
          />
          {!isCollapsed && <span className="truncate">{item.title}</span>}
        </Link>

        {hasSubItems && !isCollapsed && (
          <button
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              setIsExpanded(!isExpanded);
            }}
            className="p-1 mr-1 rounded-md text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
            aria-label={isExpanded ? 'Collapse section' : 'Expand section'}
          >
            {isExpanded ? (
              <ChevronDown className="h-3.5 w-3.5" />
            ) : (
              <ChevronRight className="h-3.5 w-3.5" />
            )}
          </button>
        )}
      </div>

      {hasSubItems && !isCollapsed && isExpanded && (
        <div className="mt-1 ml-4 pl-3 border-l border-sidebar-border space-y-1">
          {item.items!.map((subItem) => {
            const isSubActive = isSubItemActive(subItem.href);
            return (
              <Link
                key={subItem.href}
                href={subItem.href}
                className={cn(
                  'flex items-center rounded-md px-3 py-1.5 text-xs font-medium transition-colors',
                  isSubActive
                    ? 'bg-primary/10 text-primary font-semibold'
                    : 'text-muted-foreground hover:bg-muted hover:text-foreground',
                )}
              >
                {subItem.title}
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );

  if (isCollapsed) {
    return (
      <Tooltip>
        <TooltipTrigger asChild>
          <Link
            href={item.href}
            className={cn(
              'flex items-center justify-center gap-3 rounded-lg px-2 py-2 text-sm font-medium transition-colors',
              (isActive || isChildActive)
                ? 'bg-primary/10 text-primary'
                : 'text-muted-foreground hover:bg-muted hover:text-foreground',
            )}
          >
            <Icon
              className={cn(
                'h-4 w-4 shrink-0',
                (isActive || isChildActive) ? 'text-primary' : 'text-muted-foreground',
              )}
            />
          </Link>
        </TooltipTrigger>
        <TooltipContent side="right" sideOffset={8} className="flex flex-col gap-1 p-2">
          <p className="font-semibold text-xs">{item.title}</p>
          {hasSubItems && (
            <div className="border-t border-border mt-1 pt-1 space-y-1">
              {item.items!.map((subItem) => (
                <p key={subItem.href} className="text-[10px] text-muted-foreground whitespace-nowrap">
                  {subItem.title}
                </p>
              ))}
            </div>
          )}
        </TooltipContent>
      </Tooltip>
    );
  }

  return content;
}

function NavigationList({
  groups,
  isCollapsed,
  pathname,
}: {
  groups: NavigationGroup[];
  isCollapsed: boolean;
  pathname: string;
}) {
  return (
    <>
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
    </>
  );
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
  const { t } = useTranslation('layout');

  const isCollapsed = controlledCollapsed !== undefined ? controlledCollapsed : internalCollapsed;

  const handleToggleCollapse = () => {
    const next = !isCollapsed;
    if (onCollapsedChange) onCollapsedChange(next);
    else setInternalCollapsed(next);
  };

  const roleNavigations = getRoleNavigations(t);
  const groups = roleNavigations[userRole] ?? roleNavigations.SPECIAL_EDUCATOR;
  const roleLabel = t(`roles.${userRole}`, { defaultValue: userRole });
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
              aria-label={t('sidebar.collapseSidebar')}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
          </div>
          {isCollapsed && (
            <button
              onClick={handleToggleCollapse}
              className="absolute -right-3 top-4 hidden md:flex h-6 w-6 items-center justify-center rounded-full border border-border bg-background shadow-sm text-muted-foreground hover:text-foreground"
              aria-label={t('sidebar.expandSidebar')}
            >
              <Menu className="h-3 w-3" />
            </button>
          )}
          <button
            className="md:hidden h-7 w-7 p-0 flex items-center justify-center text-muted-foreground hover:text-foreground"
            onClick={onClose}
            aria-label={t('sidebar.closeSidebar')}
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto px-2 py-3 space-y-4" aria-label="Main navigation">
          <Suspense fallback={
            <div className="flex flex-col gap-2 p-2">
              <div className="h-8 bg-muted/40 animate-pulse rounded" />
              <div className="h-8 bg-muted/40 animate-pulse rounded" />
              <div className="h-8 bg-muted/40 animate-pulse rounded" />
            </div>
          }>
            <NavigationList groups={groups} isCollapsed={isCollapsed} pathname={pathname} />
          </Suspense>
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
                    aria-label={t('header.signOut')}
                  >
                    <LogOut className="h-4 w-4" />
                  </button>
                </TooltipTrigger>
                <TooltipContent side="top">{t('header.signOut')}</TooltipContent>
              </Tooltip>
            </div>
          )}
        </div>
      </aside>
    </TooltipProvider>
  );
}

