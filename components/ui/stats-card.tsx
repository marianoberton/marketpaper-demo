"use client";

import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { cva, type VariantProps } from "class-variance-authority";
import * as LucideIcons from "lucide-react";

const statsCardVariants = cva(
  "transition-all duration-300 hover:shadow-lg hover:-translate-y-1 group border-l-4",
  {
    variants: {
      status: {
        default: "border-l-primary bg-card",
        success: "border-l-primary bg-card",
        warning: "border-l-primary bg-card",
        danger: "border-l-destructive bg-card",
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
      <CardHeader className="flex flex-row items-center justify-between pb-3">
        <CardTitle className="text-sm font-medium text-muted-foreground group-hover:text-foreground transition-colors">
          {title}
          {tooltip && (
            <span
              className="ml-2 cursor-help text-muted-foreground/60 hover:text-primary transition-colors text-xs"
              title={tooltip}
            >
              💡
            </span>
          )}
        </CardTitle>
        {IconComponent && (
          <div className="p-2 rounded-lg bg-primary/10">
            <IconComponent className="h-5 w-5 text-primary transition-colors" />
          </div>
        )}
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="text-3xl font-bold text-primary transition-colors">
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
                  ? "text-primary bg-primary/10"
                  : "text-destructive bg-destructive/10"
              )}
            >
              {trend.isUpward ? "↗️" : "↘️"} {Math.abs(trend.value)}%
            </span>
            <span className="text-xs text-muted-foreground">vs anterior</span>
          </div>
        )}

        {benchmark && (
          <div className="pt-2 border-t border-border">
            <p className="text-xs text-primary font-medium">
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
