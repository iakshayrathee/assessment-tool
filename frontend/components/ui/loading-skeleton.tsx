import * as React from "react";
import { motion } from "motion/react";
import { cn } from "@/lib/utils";

interface LoadingSkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'card' | 'table' | 'list' | 'stats' | 'custom';
  count?: number;
  animated?: boolean;
}

const LoadingSkeleton = React.forwardRef<HTMLDivElement, LoadingSkeletonProps>(
  ({ className, variant = 'custom', count = 1, animated = true, ...props }, ref) => {
    const skeletonClass = cn(
      "bg-muted rounded",
      animated && "animate-pulse",
      className
    );

    const renderSkeleton = () => {
      switch (variant) {
        case 'card':
          return (
            <div className="bg-background border rounded-lg p-6 space-y-4">
              <div className="flex items-center justify-between">
                <div className={cn(skeletonClass, "h-4 w-24")}></div>
                <div className={cn(skeletonClass, "h-8 w-8 rounded-lg")}></div>
              </div>
              <div className={cn(skeletonClass, "h-8 w-16")}></div>
              <div className={cn(skeletonClass, "h-3 w-32")}></div>
            </div>
          );
        
        case 'table':
          return (
            <div className="bg-background border rounded-lg overflow-hidden">
              <div className="p-4 border-b">
                <div className={cn(skeletonClass, "h-5 w-32")}></div>
              </div>
              <div className="divide-y">
                {Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className="p-4 flex items-center space-x-4">
                    <div className={cn(skeletonClass, "h-10 w-10 rounded-full")}></div>
                    <div className="flex-1 space-y-2">
                      <div className={cn(skeletonClass, "h-4 w-48")}></div>
                      <div className={cn(skeletonClass, "h-3 w-32")}></div>
                    </div>
                    <div className={cn(skeletonClass, "h-6 w-16 rounded-full")}></div>
                    <div className="flex space-x-2">
                      <div className={cn(skeletonClass, "h-8 w-8 rounded")}></div>
                      <div className={cn(skeletonClass, "h-8 w-8 rounded")}></div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        
        case 'list':
          return (
            <div className="space-y-3">
              {Array.from({ length: count }).map((_, i) => (
                <div key={i} className="flex items-center space-x-4 p-4 bg-background border rounded-lg">
                  <div className={cn(skeletonClass, "h-12 w-12 rounded-full")}></div>
                  <div className="flex-1 space-y-2">
                    <div className={cn(skeletonClass, "h-4 w-40")}></div>
                    <div className={cn(skeletonClass, "h-3 w-24")}></div>
                  </div>
                  <div className={cn(skeletonClass, "h-6 w-20 rounded-full")}></div>
                </div>
              ))}
            </div>
          );
        
        case 'stats':
          return (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="bg-background border rounded-lg p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className={cn(skeletonClass, "h-4 w-24")}></div>
                    <div className={cn(skeletonClass, "h-8 w-8 rounded-lg")}></div>
                  </div>
                  <div className={cn(skeletonClass, "h-8 w-16 mb-2")}></div>
                  <div className={cn(skeletonClass, "h-3 w-32")}></div>
                </div>
              ))}
            </div>
          );
        
        default:
          return <div className={skeletonClass} {...props}></div>;
      }
    };

    if (variant === 'custom') {
      return <div className={skeletonClass} ref={ref} {...props}></div>;
    }

    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="space-y-4"
        ref={ref}
      >
        {renderSkeleton()}
      </motion.div>
    );
  }
);

LoadingSkeleton.displayName = "LoadingSkeleton";

export { LoadingSkeleton };
