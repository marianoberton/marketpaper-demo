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
  Ticket, FolderOpen
} from "lucide-react";

const ICONS: { [key: string]: React.ElementType } = {
  LayoutDashboard, Users, TrendingUp, Megaphone, FileText, Calendar,
  Building2, BookOpen, Bot, Receipt, Settings, HandCoins, Target, BarChart3,
  MessageSquare, Zap, PieChart, Briefcase, Share2, MousePointer, Mail, Eye, Cpu,
  Package, Box, Database, Code, Layout, Info, Hammer, DollarSign, CreditCard,
  Ticket, FolderOpen
};


export function WorkspaceNav() {
  const pathname = usePathname();
  const { companyFeatures, companyId, isLoading, availableModules, userRole } = useWorkspace();
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

    const model = Object.keys(groupedByCategory).map(categoryName => ({
      name: categoryName,
      children: groupedByCategory[categoryName],
    }));

    // Manually inject 'Equipo' item for admins/owners
    // This allows access to user management / invitations
    if (['super_admin', 'company_owner', 'company_admin'].includes(userRole || '')) {
      const targetCategoryName = model.find(c => c.name === 'Workspace') ? 'Workspace' : model[0]?.name;
      const targetCategory = model.find(c => c.name === targetCategoryName);

      if (targetCategory) {
        // Check if already exists to avoid duplication
        if (!targetCategory.children.find((item: any) => item.route_path === '/workspace/settings/users')) {
          targetCategory.children.push({
            name: 'Equipo',
            description: 'Gestión de usuarios',
            icon: 'Users',
            route_path: '/workspace/settings/users',
            category: targetCategoryName,
            featureId: 'core' // Always available
          });
        }
      }
    }

    // Inject 'Temas' module - MANDATORY for ALL users
    // This module is the new core for project management
    const temasCategoryName = model.find(c => c.name === 'Workspace') ? 'Workspace' : model[0]?.name;
    let temasCategory = model.find(c => c.name === temasCategoryName);

    if (!temasCategory && model.length === 0) {
      model.push({ name: 'Workspace', children: [] });
      temasCategory = model[0];
    }

    if (temasCategory) {
      if (!temasCategory.children.find((item: any) => item.route_path === '/workspace/temas')) {
        temasCategory.children.push({
          name: 'Temas',
          description: 'Gestión de expedientes y trabajos',
          icon: 'FolderOpen',
          route_path: '/workspace/temas',
          category: temasCategoryName,
          featureId: undefined // Always available
        });
      }
      // Inject 'Tareas' module - shows user's assigned tasks across all temas
      if (!temasCategory.children.find((item: any) => item.route_path === '/workspace/tareas')) {
        temasCategory.children.push({
          name: 'Mis Tareas',
          description: 'Tus tareas asignadas',
          icon: 'ListTodo',
          route_path: '/workspace/tareas',
          category: temasCategoryName,
          featureId: undefined // Always available
        });
      }
      // Inject 'Cotizador' module - new empty module
      if (!temasCategory.children.find((item: any) => item.route_path === '/workspace/cotizador')) {
        temasCategory.children.push({
          name: 'Cotizador',
          description: 'Módulo de cotizaciones',
          icon: 'Calculator',
          route_path: '/workspace/cotizador',
          category: temasCategoryName,
          featureId: undefined // Always available
        });
      }
      // Inject 'Ventas' module - sales pipeline
      if (!temasCategory.children.find((item: any) => item.route_path === '/workspace/ventas')) {
        temasCategory.children.push({
          name: 'Ventas',
          description: 'Pipeline de ventas',
          icon: 'TrendingUp',
          route_path: '/workspace/ventas',
          category: temasCategoryName,
          featureId: undefined // Always available
        });
      }
    }

    // Inject 'Soporte' module - MANDATORY for ALL users
    // This module is always visible regardless of features or role
    const supportCategoryName = model.find(c => c.name === 'Workspace') ? 'Workspace' : model[0]?.name;
    let supportCategory = model.find(c => c.name === supportCategoryName);

    if (!supportCategory && model.length === 0) {
      model.push({ name: 'Workspace', children: [] });
      supportCategory = model[0];
    }

    if (supportCategory) {
      // Check if already exists to avoid duplication
      if (!supportCategory.children.find((item: any) => item.route_path === '/workspace/soporte')) {
        supportCategory.children.push({
          name: 'Soporte',
          description: 'Tickets de soporte técnico',
          icon: 'Ticket',
          route_path: '/workspace/soporte',
          category: supportCategoryName,
          featureId: undefined // Always available, no feature required
        });
      }
    }

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