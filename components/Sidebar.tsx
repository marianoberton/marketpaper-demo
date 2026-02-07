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
              'w-full flex items-center px-2 py-2 text-sm font-medium rounded-md group',
              level === 0 ? 'text-gray-600 hover:bg-gray-50 hover:text-gray-900' : 'text-gray-500 hover:text-gray-700',
              isParentActive && 'bg-gray-100 text-gray-900'
            )}
          >
            <item.icon
              className={cn(
                'mr-3 flex-shrink-0 h-5 w-5',
                isParentActive ? 'text-gray-500' : 'text-gray-400 group-hover:text-gray-500'
              )}
            />
            <span className="flex-1 text-left">{item.name}</span>
            {isExpanded ? (
              <ChevronDown className="h-4 w-4" />
            ) : (
              <ChevronRight className="h-4 w-4" />
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
          'group flex items-center px-2 py-2 text-sm font-medium rounded-md',
          level === 0 ? 'text-gray-600 hover:bg-gray-50 hover:text-gray-900' : 'text-gray-500 hover:text-gray-700',
          isActive && 'bg-gray-100 text-gray-900'
        )}
      >
        <item.icon
          className={cn(
            'mr-3 flex-shrink-0 h-5 w-5',
            isActive ? 'text-gray-500' : 'text-gray-400 group-hover:text-gray-500'
          )}
        />
        {item.name}
      </Link>
    )
  }

  return (
    <nav className="flex-1 px-2 py-4 space-y-1">
      {navigation.map(item => renderNavItem(item))}
    </nav>
  )
}