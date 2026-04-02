import * as React from "react";
import { motion, type Variants } from "motion/react";
import { cn } from "@/lib/utils";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { LucideIcon } from "lucide-react";

interface EnhancedCardProps extends React.HTMLAttributes<HTMLDivElement> {
  title?: string;
  description?: string;
  icon?: LucideIcon;
  iconColor?: string;
  iconBgColor?: string;
  value?: string | number;
  change?: string;
  changeType?: 'positive' | 'negative' | 'neutral';
  loading?: boolean;
  interactive?: boolean;
  children?: React.ReactNode;
}

const EnhancedCard = React.forwardRef<HTMLDivElement, EnhancedCardProps>(
  ({ 
    className, 
    title, 
    description, 
    icon: Icon, 
    iconColor = "text-primary", 
    iconBgColor = "bg-primary/10",
    value,
    change,
    changeType = 'neutral',
    loading = false,
    interactive = false,
    children,
    ...props 
  }, ref) => {
    const cardVariants: Variants = {
      initial: { opacity: 0, y: 20 },
      animate: { opacity: 1, y: 0 },
      hover: interactive ? { y: -4, transition: { duration: 0.2 } } : {}
    };

    const getChangeColor = () => {
      switch (changeType) {
        case 'positive': return 'text-success';
        case 'negative': return 'text-destructive';
        default: return 'text-muted-foreground';
      }
    };

    if (loading) {
      return (
        <Card className={cn("relative overflow-hidden", className)} ref={ref} {...props}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <div className="h-4 bg-muted rounded animate-pulse w-24"></div>
            <div className={cn("p-2 rounded-lg animate-pulse", iconBgColor)}>
              <div className="h-4 w-4 bg-muted rounded"></div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="h-8 bg-muted rounded animate-pulse w-16 mb-2"></div>
            <div className="h-3 bg-muted rounded animate-pulse w-32"></div>
          </CardContent>
        </Card>
      );
    }

    return (
      <motion.div
        variants={cardVariants}
        initial="initial"
        animate="animate"
        whileHover="hover"
        className={cn(interactive && "cursor-pointer")}
      >
        <Card 
          className={cn(
            "relative overflow-hidden transition-all duration-300",
            interactive && "hover:shadow-lg hover:border-primary/20",
            className
          )} 
          ref={ref} 
          {...props}
        >
          {children ? (
            children
          ) : (
            <>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  {title}
                </CardTitle>
                {Icon && (
                  <motion.div 
                    className={cn("p-2 rounded-lg", iconBgColor)}
                    whileHover={{ scale: 1.1 }}
                    transition={{ duration: 0.2 }}
                  >
                    <Icon className={cn("h-4 w-4", iconColor)} />
                  </motion.div>
                )}
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold mb-1">{value}</div>
                <div className="flex items-center justify-between">
                  <p className="text-xs text-muted-foreground">{description}</p>
                  {change && (
                    <span className={cn("text-xs font-medium", getChangeColor())}>
                      {change}
                    </span>
                  )}
                </div>
              </CardContent>
            </>
          )}
        </Card>
      </motion.div>
    );
  }
);

EnhancedCard.displayName = "EnhancedCard";

export { EnhancedCard };
