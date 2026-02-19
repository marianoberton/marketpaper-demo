'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import {
  FolderOpen,
  FolderKanban,
  FileCode2,
  UserCheck,
  BarChart3,
} from 'lucide-react'

const NAV_ITEMS = [
  { label: 'Temas', href: '/workspace/temas', icon: FolderOpen, exact: true },
  { label: 'Proyectos', href: '/workspace/temas/projects', icon: FolderKanban },
  { label: 'Templates', href: '/workspace/temas/templates', icon: FileCode2 },
  { label: 'Pendiente Cliente', href: '/workspace/temas/pendiente-cliente', icon: UserCheck },
  { label: 'Dashboard', href: '/workspace/temas/dashboard', icon: BarChart3 },
]

export function TemasNav() {
  const pathname = usePathname()

  const isActive = (item: typeof NAV_ITEMS[0]) => {
    if (item.exact) {
      return pathname === item.href || pathname === item.href + '/'
    }
    return pathname.startsWith(item.href)
  }

  return (
    <nav className="flex items-center gap-1 border-b border-border mb-6 pb-0 overflow-x-auto">
      {NAV_ITEMS.map((item) => {
        const Icon = item.icon
        const active = isActive(item)
        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              'flex items-center gap-1.5 px-3 py-2.5 text-sm font-medium whitespace-nowrap border-b-2 -mb-[1px] transition-colors',
              active
                ? 'border-primary text-primary'
                : 'border-transparent text-muted-foreground hover:text-foreground hover:border-muted-foreground/30'
            )}
          >
            <Icon className="h-4 w-4" />
            {item.label}
          </Link>
        )
      })}
    </nav>
  )
}
