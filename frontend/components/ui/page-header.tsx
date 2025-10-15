import * as React from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { LucideIcon, ArrowLeft } from "lucide-react";
import Link from "next/link";

interface PageHeaderAction {
  label: string;
  href?: string;
  onClick?: () => void;
  icon?: LucideIcon;
  variant?: 'default' | 'outline' | 'secondary' | 'ghost';
  disabled?: boolean;
}

interface PageHeaderProps {
  title: string;
  description?: string;
  badge?: {
    text: string;
    variant?: 'default' | 'secondary' | 'outline' | 'destructive';
  };
  backLink?: {
    href: string;
    label?: string;
  };
  actions?: PageHeaderAction[];
  className?: string;
  children?: React.ReactNode;
}

const PageHeader = React.forwardRef<HTMLDivElement, PageHeaderProps>(
  ({ 
    title, 
    description, 
    badge,
    backLink, 
    actions = [], 
    className,
    children,
    ...props 
  }, ref) => {
    return (
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className={cn(
          "bg-white border-b border-gray-200 sticky top-16 z-30",
          className
        )}
        ref={ref}
        {...props}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="py-6">
            {/* Back Link */}
            {backLink && (
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.1 }}
                className="mb-4"
              >
                <Link href={backLink.href}>
                  <Button variant="ghost" size="sm" className="group">
                    <ArrowLeft className="h-4 w-4 mr-2 group-hover:-translate-x-1 transition-transform" />
                    {backLink.label || 'Back'}
                  </Button>
                </Link>
              </motion.div>
            )}

            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              {/* Title Section */}
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.2 }}
                className="flex-1 min-w-0"
              >
                <div className="flex items-center gap-3 mb-2">
                  <h1 className="text-2xl font-bold text-gray-900 truncate">
                    {title}
                  </h1>
                  {badge && (
                    <Badge variant={badge.variant || 'default'}>
                      {badge.text}
                    </Badge>
                  )}
                </div>
                {description && (
                  <p className="text-gray-600 text-sm sm:text-base">
                    {description}
                  </p>
                )}
              </motion.div>

              {/* Actions */}
              {actions.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.3 }}
                  className="flex flex-wrap gap-3"
                >
                  {actions.map((action, index) => {
                    const ActionButton = (
                      <Button
                        key={index}
                        variant={action.variant || 'default'}
                        onClick={action.onClick}
                        disabled={action.disabled}
                        className="group"
                      >
                        {action.icon && (
                          <action.icon className="h-4 w-4 mr-2 group-hover:scale-110 transition-transform" />
                        )}
                        {action.label}
                      </Button>
                    );

                    return action.href ? (
                      <Link key={index} href={action.href}>
                        {ActionButton}
                      </Link>
                    ) : (
                      ActionButton
                    );
                  })}
                </motion.div>
              )}
            </div>

            {/* Custom Children */}
            {children && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="mt-6"
              >
                {children}
              </motion.div>
            )}
          </div>
        </div>
      </motion.div>
    );
  }
);

PageHeader.displayName = "PageHeader";

export { PageHeader, type PageHeaderAction };
