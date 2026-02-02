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
  Package, Box, Database, Code, Layout, Info, Hammer, DollarSign, CreditCard,
  Ticket, FolderOpen, ListTodo, Calculator
} from "lucide-react";

const ICONS: { [key: string]: React.ElementType } = {
  LayoutDashboard, Users, TrendingUp, Megaphone, FileText, Calendar,
  Building2, BookOpen, Bot, Receipt, Settings, HandCoins, Target, BarChart3,
  MessageSquare, Zap, PieChart, Briefcase, Share2, MousePointer, Mail, Eye, Cpu,
  Package, Box, Database, Code, Layout, Info, Hammer, DollarSign, CreditCard,
  Ticket, FolderOpen, ListTodo, Calculator
};


export function WorkspaceNav() {
  const pathname = usePathname();
  const { companyFeatures, companyId, isLoading, availableModules, userRole } = useWorkspace();
  const { isCollapsed } = useLayout();

  const features = Array.isArray(companyFeatures) ? companyFeatures : [];

  const navigationModel = useMemo(() => {
    // Filtrar módulos por roles permitidos
    const filteredModules = availableModules.filter(module => {
      // Si el módulo no tiene allowed_roles, es accesible para todos
      if (!module.allowed_roles || module.allowed_roles.length === 0) {
        return true;
      }
      // Verificar que el usuario tenga un rol permitido
      return module.allowed_roles.includes(userRole || '');
    });

    // Filtrar por integración requerida (TODO: verificar integraciones activas)
    const modulesWithIntegration = filteredModules.filter(module => {
      // Si el módulo no requiere integración, está disponible
      if (!module.requires_integration) {
        return true;
      }
      // Por ahora, permitir todos (la lógica de integración se agregará después)
      return true;
    });

    // Agrupar por categoría
    const regroupedByCategory = modulesWithIntegration.reduce((acc, module) => {
      const category = module.category || 'Workspace';
      if (!acc[category]) {
        acc[category] = [];
      }
      acc[category].push(module);
      return acc;
    }, {} as Record<string, any[]>);

    // Ordenar módulos dentro de cada categoría por display_order
    Object.keys(regroupedByCategory).forEach(category => {
      regroupedByCategory[category].sort((a: any, b: any) => {
        const orderA = a.display_order ?? 100;
        const orderB = b.display_order ?? 100;
        return orderA - orderB;
      });
    });

    // Convertir a modelo de navegación
    const model = Object.keys(regroupedByCategory).map(categoryName => ({
      name: categoryName,
      children: regroupedByCategory[categoryName],
    }));

    // Ordenar categorías: Dashboard primero, luego Analytics, luego Workspace, luego el resto
    model.sort((a, b) => {
      const orderMap: Record<string, number> = {
        'Dashboard': 1,
        'Analytics': 2,
        'Workspace': 3,
        'Tools': 4,
        'Admin': 5
      };
      const orderA = orderMap[a.name] || 99;
      const orderB = orderMap[b.name] || 99;
      return orderA - orderB;
    });

    return model;
  }, [availableModules, features, userRole]);

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
                  key={item.id}
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