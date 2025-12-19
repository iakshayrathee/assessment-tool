'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LayoutDashboard,
  Users,
  GraduationCap,
  School,
  FileText,
  BarChart3,
  Settings,
  ChevronRight,
  ChevronDown,
  Building,
  UserCheck,
  BookOpen,
  Calendar,
  Award,
  Eye,
  Shield,
  Database,
  Activity,
  Home,
  Bell,
  Search,
  Plus,
  TrendingUp,
  Zap,
  Star
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { colors, getRoleColor } from '@/lib/design-system';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
  userRole?: string;
}

interface MenuItem {
  title: string;
  href?: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: string;
  children?: MenuItem[];
}

const roleMenus: Record<string, MenuItem[]> = {
  ADMIN: [
    {
      title: 'Dashboard',
      href: '/admin/overview',
      icon: LayoutDashboard,
    },
    {
      title: 'User Management',
      icon: Users,
      children: [
        { title: 'All Users', href: '/admin/users', icon: Users },
        { title: 'Create User', href: '/admin/users/create', icon: Plus },
        { title: 'Role Management', href: '/admin/roles', icon: Shield },
      ],
    },
    {
      title: 'Centers',
      icon: Building,
      children: [
        { title: 'All Centers', href: '/admin/centers', icon: Building },
        { title: 'Create Center', href: '/admin/centers/create', icon: Plus },
      ],
    },
    {
      title: 'Schools',
      icon: School,
      children: [
        { title: 'All Schools', href: '/admin/schools', icon: School },
        { title: 'Partnerships', href: '/admin/schools/partnerships', icon: Star },
      ],
    },
    {
      title: 'Analytics & Reports',
      icon: BarChart3,
      children: [
        { title: 'System Analytics', href: '/admin/analytics', icon: TrendingUp },
        { title: 'User Reports', href: '/admin/reports/users', icon: FileText },
        { title: 'Performance', href: '/admin/reports/performance', icon: Zap },
      ],
    },
    {
      title: 'System',
      icon: Settings,
      children: [
        { title: 'Audit Logs', href: '/admin/audit-logs', icon: Activity },
        { title: 'System Settings', href: '/admin/settings', icon: Settings },
        { title: 'Notifications', href: '/admin/notifications', icon: Bell },
      ],
    },
  ],
  SPECIAL_EDUCATOR: [
    {
      title: 'Dashboard',
      href: '/educator/dashboard',
      icon: LayoutDashboard,
    },
    {
      title: 'My Students',
      href: '/educator/students',
      icon: Users,
    },
    {
      title: 'Assessments',
      href: '/educator/assessments',
      icon: FileText,
    },
    {
      title: 'IEP Plans',
      href: '/educator/iep',
      icon: BookOpen,
    },
    {
      title: 'Worksheets',
      href: '/educator/worksheets',
      icon: Calendar,
    },
    {
      title: 'Reports',
      href: '/educator/reports',
      icon: Award,
    },
  ],
  SUPER_SPECIAL_EDUCATOR: [
    {
      title: 'Dashboard',
      href: '/super-educator/dashboard',
      icon: LayoutDashboard,
    },
    {
      title: 'Educators',
      href: '/super-educator/educators',
      icon: GraduationCap,
    },
    {
      title: 'Quality Review',
      href: '/super-educator/quality',
      icon: Shield,
    },
    {
      title: 'Centers',
      href: '/super-educator/centers',
      icon: Building,
    },
    {
      title: 'Analytics',
      href: '/super-educator/analytics',
      icon: BarChart3,
    },
  ],
  PARENT: [
    {
      title: 'Dashboard',
      href: '/parent/dashboard',
      icon: LayoutDashboard,
    },
    {
      title: 'My Child',
      href: '/parent/child',
      icon: Users,
    },
    {
      title: 'Progress Reports',
      href: '/parent/reports',
      icon: FileText,
    },
    {
      title: 'Communications',
      href: '/parent/messages',
      icon: Activity,
    },
    {
      title: 'Documents',
      href: '/parent/documents',
      icon: Database,
    },
  ],
  SCHOOL_VIEWER: [
    {
      title: 'Dashboard',
      href: '/school-viewer/dashboard',
      icon: LayoutDashboard,
    },
    {
      title: 'Students',
      href: '/school-viewer/students',
      icon: Users,
    },
    {
      title: 'Reports',
      href: '/school-viewer/school-reports',
      icon: FileText,
    },
  ],
};

export function Sidebar({ isOpen, onClose, userRole = 'ADMIN' }: SidebarProps) {
  const pathname = usePathname();
  const [expandedItems, setExpandedItems] = useState<string[]>([]);

  const menuItems = roleMenus[userRole] || roleMenus.ADMIN;

  const toggleExpanded = (title: string) => {
    setExpandedItems(prev =>
      prev.includes(title)
        ? prev.filter(item => item !== title)
        : [...prev, title]
    );
  };

  const isActive = (href?: string) => {
    if (!href) return false;
    return pathname === href || pathname.startsWith(href + '/');
  };

  const isParentActive = (children?: MenuItem[]) => {
    if (!children) return false;
    return children.some(child => isActive(child.href));
  };

  const renderMenuItem = (item: MenuItem, level = 0) => {
    const hasChildren = item.children && item.children.length > 0;
    const isExpanded = expandedItems.includes(item.title);
    const itemIsActive = isActive(item.href) || isParentActive(item.children);

    if (hasChildren) {
      return (
        <div key={item.title}>
          <Button
            variant="ghost"
            className={cn(
              "w-full justify-start h-11 px-3 mb-1 group transition-all duration-200",
              level > 0 && "ml-4 w-[calc(100%-1rem)] h-9",
              itemIsActive && "bg-primary/10 text-primary font-medium shadow-sm border border-primary/20",
              !itemIsActive && "hover:bg-gray-50 hover:text-gray-900"
            )}
            onClick={() => toggleExpanded(item.title)}
          >
            <div className={cn(
              "p-1.5 rounded-md mr-3 transition-colors",
              itemIsActive ? "bg-primary/20" : "bg-gray-100 group-hover:bg-gray-200"
            )}>
              <item.icon className={cn(
                "h-4 w-4 shrink-0 transition-colors",
                itemIsActive ? "text-primary" : "text-gray-600 group-hover:text-gray-900"
              )} />
            </div>
            <span className="truncate font-medium">{item.title}</span>
            <motion.div
              animate={{ rotate: isExpanded ? 90 : 0 }}
              transition={{ duration: 0.2 }}
              className="ml-auto"
            >
              <ChevronRight className={cn(
                "h-4 w-4 transition-colors",
                itemIsActive ? "text-primary" : "text-gray-400 group-hover:text-gray-600"
              )} />
            </motion.div>
          </Button>

          <AnimatePresence>
            {isExpanded && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="overflow-hidden"
              >
                {item.children?.map(child => renderMenuItem(child, level + 1))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      );
    }

    return (
      <Link key={item.title} href={item.href || '#'}>
        <Button
          variant="ghost"
          className={cn(
            "w-full justify-start h-11 px-3 mb-1 group transition-all duration-200",
            level > 0 && "ml-4 w-[calc(100%-1rem)] h-9",
            itemIsActive && "bg-primary/10 text-primary font-medium shadow-sm border border-primary/20",
            !itemIsActive && "hover:bg-gray-50 hover:text-gray-900"
          )}
          onClick={() => {
            if (window.innerWidth < 1024) {
              onClose();
            }
          }}
        >
          <div className={cn(
            "p-1.5 rounded-md mr-3 transition-colors",
            itemIsActive ? "bg-primary/20" : "bg-gray-100 group-hover:bg-gray-200"
          )}>
            <item.icon className={cn(
              "h-4 w-4 shrink-0 transition-colors",
              itemIsActive ? "text-primary" : "text-gray-600 group-hover:text-gray-900"
            )} />
          </div>
          <span className="truncate font-medium">{item.title}</span>
          {item.badge && (
            <Badge
              variant={itemIsActive ? "default" : "secondary"}
              className={cn(
                "ml-auto h-5 px-1.5 text-xs transition-colors",
                itemIsActive && "bg-primary text-primary-foreground"
              )}
            >
              {item.badge}
            </Badge>
          )}
        </Button>
      </Link>
    );
  };

  return (
    <>
      {/* Desktop Sidebar */}
      <motion.aside
        initial={false}
        animate={{
          width: isOpen ? 256 : 64,
          x: 0
        }}
        transition={{ duration: 0.3, ease: "easeInOut" }}
        className="fixed left-0 top-0 z-50 h-full bg-card border-r border-border hidden lg:block"
      >
        <div className="flex h-16 items-center border-b border-border px-4 bg-gradient-to-r from-primary/5 to-blue-50">
          <motion.div
            animate={{ opacity: isOpen ? 1 : 0 }}
            transition={{ duration: 0.2 }}
            className="flex items-center space-x-3"
          >
            <motion.div
              className="w-10 h-10 bg-gradient-to-br from-primary to-blue-600 rounded-xl flex items-center justify-center shadow-lg"
              whileHover={{ scale: 1.05 }}
              transition={{ duration: 0.2 }}
            >
              <span className="text-white font-bold text-lg">K</span>
            </motion.div>
            {isOpen && (
              <motion.div
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.1 }}
              >
                <h1 className="font-bold text-xl bg-gradient-to-r from-primary to-blue-600 bg-clip-text text-transparent">
                  Knowled
                </h1>
                <p className="text-xs text-muted-foreground font-medium">
                  Special Education Platform
                </p>
              </motion.div>
            )}
          </motion.div>
        </div>

        <nav className="flex-1 p-4 space-y-1 overflow-y-auto custom-scrollbar bg-gradient-to-b from-gray-50/50 to-white">
          <AnimatePresence>
            {isOpen ? (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2, delay: 0.1 }}
              >
                {menuItems.map(item => renderMenuItem(item))}
              </motion.div>
            ) : (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="space-y-2"
              >
                {menuItems.map(item => (
                  <Link key={item.title} href={item.href || '#'}>
                    <Button
                      variant="ghost"
                      size="sm"
                      className={cn(
                        "w-12 h-12 p-0",
                        isActive(item.href) && "bg-primary/10 text-primary"
                      )}
                      title={item.title}
                    >
                      <item.icon className="h-5 w-5" />
                    </Button>
                  </Link>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </nav>
      </motion.aside>

      {/* Mobile Sidebar */}
      <AnimatePresence>
        {isOpen && (
          <motion.aside
            initial={{ x: -300 }}
            animate={{ x: 0 }}
            exit={{ x: -300 }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
            className="fixed left-0 top-0 z-50 h-full w-64 bg-card border-r border-border lg:hidden"
          >
            <div className="flex h-16 items-center justify-between border-b border-border px-4 bg-gradient-to-r from-primary/5 to-blue-50">
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
              <Button variant="ghost" size="sm" onClick={onClose}>
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>

            <nav className="flex-1 p-4 space-y-1 overflow-y-auto custom-scrollbar bg-gradient-to-b from-gray-50/50 to-white">
              {menuItems.map(item => renderMenuItem(item))}
            </nav>
          </motion.aside>
        )}
      </AnimatePresence>
    </>
  );
}
