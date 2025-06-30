'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import { 
  LayoutDashboard, 
  Building2, 
  Users, 
  Key, 
  BarChart3, 
  Settings,
  BookTemplate,
  DollarSign,
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
  Plus,
  UserPlus
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'

interface SidebarProps {
  collapsed: boolean
  onToggle: () => void
}

const navigation = [
  {
    name: 'Dashboard',
    href: '/admin',
    icon: LayoutDashboard,
    badge: null
  },
  {
    name: 'Empresas',
    href: '/admin/companies',
    icon: Building2,
    badge: null,
    quickAction: {
      href: '/admin/companies/create',
      icon: Plus,
      label: 'Nueva empresa'
    }
  },
  {
    name: 'Plantillas',
    href: '/admin/templates',
    icon: BookTemplate,
    badge: null
  },
  {
    name: 'Usuarios',
    href: '/admin/users',
    icon: Users,
    badge: null
  },
  {
    name: 'Solicitudes',
    href: '/admin/registration-requests',
    icon: UserPlus,
    badge: null
  },
  {
    name: 'API Keys',
    href: '/admin/api-keys',
    icon: Key,
    badge: { count: 12, color: 'blue' }
  },
  {
    name: 'Analytics',
    href: '/admin/analytics',
    icon: BarChart3,
    badge: { count: 3, color: 'red' }
  },
  {
    name: 'Configuración',
    href: '/admin/settings',
    icon: Settings,
    badge: null
  }
]

export function Sidebar({ collapsed, onToggle }: SidebarProps) {
  const pathname = usePathname()

  const renderNavItem = (item: any) => {
    const isActive = pathname === item.href || pathname.startsWith(item.href + '/')

    return (
      <div key={item.name} className="relative group">
        <div className="flex items-center">
          <Link
            href={item.href}
            className={cn(
              'flex items-center gap-3 px-3 py-2.5 text-sm font-medium rounded-lg transition-all duration-200 flex-1',
              'hover:bg-white/80 hover:shadow-sm',
              isActive 
                ? 'bg-blue-50 text-blue-700 shadow-sm border border-blue-100' 
                : 'text-gray-600 hover:text-gray-900',
              collapsed && 'justify-center px-2'
            )}
          >
            <item.icon
              className={cn(
                'h-5 w-5 flex-shrink-0',
                isActive ? 'text-blue-600' : 'text-gray-400'
              )}
            />
            {!collapsed && (
              <>
                <span className="flex-1 truncate">{item.name}</span>
                {item.badge && (
                  <Badge 
                    variant={item.badge.color === 'red' ? 'destructive' : 'default'}
                    className="h-5 px-1.5 text-xs"
                  >
                    {item.badge.count}
                  </Badge>
                )}
              </>
            )}
          </Link>
          
          {/* Quick Action Button - Outside the main link */}
          {!collapsed && item.quickAction && (
            <Link
              href={item.quickAction.href}
              className="ml-1 opacity-0 group-hover:opacity-100 transition-opacity p-2 hover:bg-gray-100 rounded-lg"
            >
              <item.quickAction.icon className="h-3 w-3 text-gray-400 hover:text-gray-600" />
            </Link>
          )}
        </div>
        
        {/* Tooltip for collapsed state */}
        {collapsed && (
          <div className="absolute left-full top-1/2 -translate-y-1/2 ml-2 px-2 py-1 bg-gray-900 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-50">
            {item.name}
            {item.badge && (
              <span className="ml-1 px-1 bg-red-500 rounded text-xs">
                {item.badge.count}
              </span>
            )}
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="h-full bg-white border-r border-gray-200/60 flex flex-col shadow-sm">
      {/* Header */}
      <div className="p-4 border-b border-gray-100">
        <div className="flex items-center justify-between">
          {!collapsed && (
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">SA</span>
              </div>
              <div>
                <h2 className="font-semibold text-gray-900 text-sm">Super Admin</h2>
                <p className="text-xs text-gray-500">Panel de Control</p>
              </div>
            </div>
          )}
          <Button
            variant="ghost"
            size="sm"
            onClick={onToggle}
            className={cn(
              "h-8 w-8 p-0 hover:bg-gray-100",
              collapsed && "mx-auto"
            )}
          >
            {collapsed ? (
              <ChevronRight className="h-4 w-4" />
            ) : (
              <ChevronLeft className="h-4 w-4" />
            )}
          </Button>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
        {navigation.map(item => renderNavItem(item))}
      </nav>

      {/* Footer */}
      <div className="p-3 border-t border-gray-100">
        {!collapsed ? (
          <div className="text-xs text-gray-500 text-center">
            <p>FOMO CRM v2.0</p>
            <p className="mt-1">© 2024 Market Paper</p>
          </div>
        ) : (
          <div className="w-8 h-8 bg-gray-100 rounded-lg mx-auto flex items-center justify-center">
            <span className="text-gray-400 text-xs font-bold">F</span>
          </div>
        )}
      </div>
    </div>
  )
}