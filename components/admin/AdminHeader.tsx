'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { Bell, Search, LogOut, User, Settings, Command } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'

export function Header() {
  const [user, setUser] = useState<any>(null)
  const router = useRouter()

  useEffect(() => {
    getCurrentUser()
  }, [])

  const getCurrentUser = async () => {
    const { data: { session } } = await supabase.auth.getSession()
    if (session?.user) {
      setUser(session.user)
    }
  }

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    router.push('/login')
  }

  const getInitials = (email: string) => {
    return email.split('@')[0].slice(0, 2).toUpperCase()
  }

  return (
    <header className="bg-white/80 backdrop-blur-sm border-b border-gray-200/60 sticky top-0 z-40">
      <div className="px-6 py-3">
        <div className="flex justify-between items-center">
          {/* Left side - Search */}
          <div className="flex items-center flex-1 max-w-lg">
            <div className="relative w-full">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="h-4 w-4 text-gray-400" />
              </div>
              <input
                type="text"
                placeholder="Buscar clientes, usuarios..."
                className="block w-full pl-10 pr-4 py-2 text-sm border border-gray-200 rounded-lg bg-gray-50/50 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-300 transition-colors"
              />
              <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                <div className="flex items-center gap-1 text-xs text-gray-400">
                  <Command className="h-3 w-3" />
                  <span>K</span>
                </div>
              </div>
            </div>
          </div>

          {/* Right side - Actions and user menu */}
          <div className="flex items-center gap-3">
            {/* Quick Stats */}
            <div className="hidden lg:flex items-center gap-4 px-4 py-2 bg-gray-50/80 rounded-lg">
              <div className="text-center">
                <div className="text-lg font-semibold text-blue-600">1</div>
                <div className="text-xs text-gray-500">Empresas</div>
              </div>
              <div className="w-px h-8 bg-gray-200"></div>
              <div className="text-center">
                <div className="text-lg font-semibold text-green-600">€29</div>
                <div className="text-xs text-gray-500">MRR</div>
              </div>
            </div>

            {/* Notifications */}
            <Button
              variant="ghost"
              size="sm"
              className="relative h-9 w-9 rounded-lg hover:bg-gray-100"
            >
              <Bell className="h-4 w-4" />
              <Badge className="absolute -top-1 -right-1 h-5 w-5 p-0 text-xs bg-red-500 hover:bg-red-500">
                3
              </Badge>
            </Button>

            {/* User menu */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="h-9 px-2 rounded-lg hover:bg-gray-100">
                  <Avatar className="h-7 w-7">
                    <AvatarImage src={user?.user_metadata?.avatar_url} alt={user?.email} />
                    <AvatarFallback className="text-xs bg-gradient-to-br from-blue-500 to-blue-600 text-white">
                      {user?.email ? getInitials(user.email) : 'SA'}
                    </AvatarFallback>
                  </Avatar>
                  <div className="hidden md:block ml-2 text-left">
                    <div className="text-sm font-medium text-gray-900">Super Admin</div>
                    <div className="text-xs text-gray-500 truncate max-w-32">
                      {user?.email}
                    </div>
                  </div>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56" align="end" forceMount>
                <DropdownMenuLabel className="font-normal">
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-medium leading-none">Super Admin</p>
                    <p className="text-xs leading-none text-muted-foreground">
                      {user?.email}
                    </p>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem>
                  <User className="mr-2 h-4 w-4" />
                  <span>Perfil</span>
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <Settings className="mr-2 h-4 w-4" />
                  <span>Configuración</span>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleSignOut} className="text-red-600">
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>Cerrar Sesión</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>
    </header>
  )
}