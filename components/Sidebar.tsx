'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import {
  LayoutDashboard,
  Users,
  UserPlus,
  Activity,
  BarChart3,
  Settings,
  ChevronDown,
  ChevronRight,
  Building2,
  Hammer
} from 'lucide-react'

const navigation = [
  {
    name: 'Dashboard',
    href: '/workspace/dashboard',
    icon: LayoutDashboard,
  },
  {
    name: 'CRM-FOMO',
    icon: Users,
    children: [
      {
        name: 'Leads',
        href: '/workspace/crm-fomo/leads',
        icon: UserPlus,
      },
      {
        name: 'Contactos',
        href: '/workspace/crm-fomo/contacts',
        icon: Users,
      },
      {
        name: 'Pipeline',
        href: '/workspace/crm-fomo/pipeline',
        icon: BarChart3,
      },
      {
        name: 'Actividades',
        href: '/workspace/crm-fomo/activities',
        icon: Activity,
      }
    ]
  },
  {
    name: 'Construcción',
    href: '/workspace/construccion',
    icon: Hammer,
  },
  {
    name: 'Configuración',
    icon: Settings,
    children: [
      {
        name: 'General',
        href: '/workspace/settings',
        icon: Settings,
      },
      {
        name: 'Equipo',
        href: '/workspace/settings/users',
        icon: Users,
      }
    ]
  }
]

export function Sidebar() {
  const pathname = usePathname()
  const [expandedItems, setExpandedItems] = useState<string[]>(['CRM', 'Configuración'])

  const toggleExpanded = (name: string) => {
    setExpandedItems(prev =>
      prev.includes(name)
        ? prev.filter(item => item !== name)
        : [...prev, name]
    )
  }

  const renderNavItem = (item: any, level = 0) => {
    const isExpanded = expandedItems.includes(item.name)
    const hasChildren = item.children && item.children.length > 0
    const isActive = item.href ? pathname === item.href : false
    const isParentActive = item.children?.some((child: any) => pathname === child.href)

    if (hasChildren) {
      return (
        <div key={item.name}>
          <button
            onClick={() => toggleExpanded(item.name)}
            className={cn(
              'w-full flex items-center px-3 py-2.5 text-sm font-medium rounded-lg group transition-colors',
              level === 0 ? 'text-muted-foreground hover:bg-accent hover:text-foreground' : 'text-muted-foreground hover:text-foreground',
              isParentActive && 'bg-accent text-foreground'
            )}
          >
            <item.icon
              className={cn(
                'mr-3 flex-shrink-0 h-5 w-5 transition-colors',
                isParentActive ? 'text-primary' : 'text-muted-foreground group-hover:text-foreground'
              )}
            />
            <span className="flex-1 text-left">{item.name}</span>
            {isExpanded ? (
              <ChevronDown className="h-4 w-4 text-muted-foreground" />
            ) : (
              <ChevronRight className="h-4 w-4 text-muted-foreground" />
            )}
          </button>
          {isExpanded && (
            <div className="ml-6 mt-1 space-y-1">
              {item.children.map((child: any) => renderNavItem(child, level + 1))}
            </div>
          )}
        </div>
      )
    }

    return (
      <Link
        key={item.name}
        href={item.href}
        className={cn(
          'group flex items-center px-3 py-2.5 text-sm font-medium rounded-lg transition-colors',
          level === 0 ? 'text-muted-foreground hover:bg-accent hover:text-foreground' : 'text-muted-foreground hover:text-foreground',
          isActive && 'bg-primary/10 text-primary border-l-2 border-primary'
        )}
      >
        <item.icon
          className={cn(
            'mr-3 flex-shrink-0 h-5 w-5 transition-colors',
            isActive ? 'text-primary' : 'text-muted-foreground group-hover:text-foreground'
          )}
        />
        {item.name}
      </Link>
    )
  }

  return (
    <nav className="flex-1 px-3 py-4 space-y-1">
      {navigation.map(item => renderNavItem(item))}
    </nav>
  )
}