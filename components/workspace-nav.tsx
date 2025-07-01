"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useMemo } from "react";
import { cn } from "@/lib/utils";
import { useWorkspace } from "@/components/workspace-context";
import { useLayout } from "@/components/layout-context";
import { 
  LayoutDashboard, Users, TrendingUp, Megaphone, FileText, Calendar, 
  Building2, BookOpen, Bot, Receipt, Settings, HandCoins, Target, BarChart3,
  MessageSquare, Zap, PieChart, Briefcase, Share2, MousePointer, Mail, Eye, Cpu,
  Package, Box, Database, Code, Layout, Info, Hammer, DollarSign, CreditCard
} from "lucide-react";

const ICONS: { [key: string]: React.ElementType } = {
  LayoutDashboard, Users, TrendingUp, Megaphone, FileText, Calendar, 
  Building2, BookOpen, Bot, Receipt, Settings, HandCoins, Target, BarChart3,
  MessageSquare, Zap, PieChart, Briefcase, Share2, MousePointer, Mail, Eye, Cpu,
  Package, Box, Database, Code, Layout, Info, Hammer, DollarSign, CreditCard
};

export function WorkspaceNav() {
  const pathname = usePathname();
  const { companyFeatures, companyId, isLoading, availableModules } = useWorkspace();
  const { isCollapsed } = useLayout();
  
  const features = Array.isArray(companyFeatures) ? companyFeatures : [];

  const navigationModel = useMemo(() => {
    const hasFeature = (featureId?: string) => {
      if (!featureId) return true;
      return features.includes(featureId);
    };

    const filteredModules = availableModules.filter(module => hasFeature(module.featureId));

    const groupedByCategory = filteredModules.reduce((acc, module) => {
      const category = module.category || 'Workspace';
      if (!acc[category]) {
        acc[category] = [];
      }
      acc[category].push(module);
      return acc;
    }, {} as Record<string, any[]>);

    return Object.keys(groupedByCategory).map(categoryName => ({
      name: categoryName,
      children: groupedByCategory[categoryName],
    }));
  }, [availableModules, features]);

  const getHrefWithParams = (href: string) => {
    if (!href) return '#';
    
    // Defensive fix for inconsistent `route_path` data from the database.
    // This ensures that relative paths like '/construccion' are correctly routed 
    // within the workspace as '/workspace/construccion'.
    let finalHref = href;
    if (finalHref.startsWith('/') && !finalHref.startsWith('/workspace')) {
      finalHref = `/workspace${finalHref}`;
    }

    const url = new URL(finalHref, "http://dummybase.com");
    if (companyId) {
      url.searchParams.set("company_id", companyId);
    }
    return `${url.pathname}${url.search}`;
  };

  if (isLoading) {
    return (
      <div className="flex flex-col gap-2 p-2">
        {[...Array(8)].map((_, i) => (
          <div key={i} className="h-8 w-full animate-pulse rounded-lg bg-gray-200 dark:bg-gray-800" />
        ))}
      </div>
    );
  }

  return (
    <nav className="grid items-start gap-4 px-2 text-sm font-medium">
      {navigationModel.map(category => (
        <div key={category.name}>
          {!isCollapsed && (
            <h3 className="px-2 text-xs font-semibold uppercase tracking-wider text-gray-500">
              {category.name}
            </h3>
          )}
          <div className="grid gap-1">
            {category.children.map((item: any) => {
              const Icon = item.icon ? ICONS[item.icon] || LayoutDashboard : LayoutDashboard;
              const isActive = item.route_path ? pathname.startsWith(item.route_path) : false;
              return (
                <Link
                  key={item.name}
                  href={getHrefWithParams(item.route_path)}
                  className={cn(
                    "flex items-center gap-3 rounded-lg px-3 py-2 text-gray-500 transition-all hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-50",
                    isCollapsed && "justify-center",
                    isActive && "bg-gray-100 text-gray-900 dark:bg-gray-800 dark:text-gray-50"
                  )}
                  title={isCollapsed ? item.name : undefined}
                >
                  <Icon className="h-4 w-4" />
                  {!isCollapsed && <span className="truncate">{item.name}</span>}
                </Link>
              );
            })}
          </div>
        </div>
      ))}
    </nav>
  );
} 