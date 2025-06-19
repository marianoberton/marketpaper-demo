"use client";

import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { cva, type VariantProps } from "class-variance-authority";
import * as LucideIcons from "lucide-react";

const statsCardVariants = cva(
  "transition-all duration-300 hover:shadow-lg hover:-translate-y-1 group",
  {
    variants: {
      status: {
        default: "border-l-4 border-l-muted-foreground/20 bg-gradient-to-r from-white to-gray-50/50 dark:from-gray-900 dark:to-gray-800/50",
        success: "border-l-4 border-l-emerald-500 bg-gradient-to-r from-emerald-50/30 to-white dark:from-emerald-950/20 dark:to-gray-900",
        warning: "border-l-4 border-l-amber-500 bg-gradient-to-r from-amber-50/30 to-white dark:from-amber-950/20 dark:to-gray-900",
        danger: "border-l-4 border-l-red-500 bg-gradient-to-r from-red-50/30 to-white dark:from-red-950/20 dark:to-gray-900",
      },
    },
    defaultVariants: {
      status: "default",
    },
  }
);

interface StatsCardProps extends VariantProps<typeof statsCardVariants> {
  title: string;
  value: string | number;
  description?: string;
  iconName?: string;
  trend?: {
    value: number;
    isUpward: boolean;
  };
  footer?: string;
  tooltip?: string;
  benchmark?: string;
  className?: string;
}

export function StatsCard({
  title,
  value,
  description,
  iconName,
  trend,
  footer,
  tooltip,
  benchmark,
  status,
  className,
}: StatsCardProps) {
  // Dynamically render the icon if iconName is provided
  const IconComponent = iconName ? (LucideIcons as any)[iconName] : null;

  const getIconColor = () => {
    switch (status) {
      case "success": return "text-emerald-500 group-hover:text-emerald-600";
      case "warning": return "text-amber-500 group-hover:text-amber-600";
      case "danger": return "text-red-500 group-hover:text-red-600";
      default: return "text-brilliant-blue group-hover:text-brilliant-blue/80";
    }
  };

  return (
    <Card className={cn(statsCardVariants({ status }), className)}>
      <CardHeader className="flex flex-row items-center justify-between pb-3">
        <CardTitle className="text-sm font-medium text-muted-foreground group-hover:text-foreground transition-colors">
          {title}
          {tooltip && (
            <span 
              className="ml-2 cursor-help text-muted-foreground/60 hover:text-brilliant-blue transition-colors text-xs" 
              title={tooltip}
            >
              💡
            </span>
          )}
        </CardTitle>
        {IconComponent && (
          <div className="p-2 rounded-lg bg-white/50 dark:bg-gray-800/50 border border-gray-200/50 dark:border-gray-700/50">
            <IconComponent className={cn("h-5 w-5 transition-colors", getIconColor())} />
          </div>
        )}
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="text-3xl font-bold text-foreground group-hover:text-brilliant-blue transition-colors">
          {value}
        </div>
        
        {description && (
          <p className="text-sm text-muted-foreground leading-relaxed">{description}</p>
        )}
        
        {trend && (
          <div className="flex items-center space-x-2">
            <span
              className={cn(
                "inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium transition-all",
                trend.isUpward 
                  ? "text-emerald-700 bg-emerald-100 dark:text-emerald-300 dark:bg-emerald-900/30 shadow-sm" 
                  : "text-red-700 bg-red-100 dark:text-red-300 dark:bg-red-900/30 shadow-sm"
              )}
            >
              {trend.isUpward ? "↗️" : "↘️"} {Math.abs(trend.value)}%
            </span>
            <span className="text-xs text-muted-foreground">vs anterior</span>
          </div>
        )}
        
        {benchmark && (
          <div className="pt-2 border-t border-gray-200/50 dark:border-gray-700/50">
            <p className="text-xs text-brilliant-blue font-medium">
              🎯 Meta: {benchmark}
            </p>
          </div>
        )}
      </CardContent>
      
      {footer && (
        <CardFooter className="pt-0">
          <p className="text-xs text-muted-foreground italic">{footer}</p>
        </CardFooter>
      )}
    </Card>
  );
} 