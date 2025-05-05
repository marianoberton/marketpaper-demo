"use client";

import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { cva, type VariantProps } from "class-variance-authority";
import * as LucideIcons from "lucide-react";

const statsCardVariants = cva(
  "transition-all",
  {
    variants: {
      status: {
        default: "",
        success: "border-green-500 dark:border-green-500",
        warning: "border-yellow-500 dark:border-yellow-500",
        danger: "border-red-500 dark:border-red-500",
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

  return (
    <Card className={cn(statsCardVariants({ status }), className)}>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm font-medium break-words">
          {title}
          {tooltip && (
            <span 
              className="ml-1 cursor-help text-muted-foreground" 
              title={tooltip}
            >
              ℹ️
            </span>
          )}
        </CardTitle>
        {IconComponent && <IconComponent className="h-4 w-4 text-muted-foreground" />}
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        {description && (
          <p className="text-xs text-muted-foreground">{description}</p>
        )}
        {trend && (
          <div className="mt-1 flex items-center">
            <span
              className={cn(
                "mr-1 text-xs",
                trend.isUpward ? "text-green-500" : "text-red-500"
              )}
            >
              {trend.isUpward ? "↑" : "↓"} {Math.abs(trend.value)}%
            </span>
            <span className="text-xs text-muted-foreground">vs anterior</span>
          </div>
        )}
        {benchmark && (
          <p className="mt-1 text-xs text-muted-foreground">Meta: {benchmark}</p>
        )}
      </CardContent>
      {footer && (
        <CardFooter className="pt-0">
          <p className="text-xs text-muted-foreground">{footer}</p>
        </CardFooter>
      )}
    </Card>
  );
} 