'use client'

import { Building2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { useWorkspace } from '@/components/workspace-context'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'

export default function TenantSwitcher() {
  const { 
    companyName, 
    companyId,
    companyLogoUrl,
    isLoading,
    userRole 
  } = useWorkspace()

  const getPlanBadgeColor = (plan: string) => {
    switch (plan) {
      case 'enterprise':
        return 'bg-purple-100 text-purple-800 border-purple-200'
      case 'professional':
        return 'bg-blue-100 text-blue-800 border-blue-200'
      case 'starter':
        return 'bg-green-100 text-green-800 border-green-200'
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'owner':
        return 'text-purple-600'
      case 'admin':
        return 'text-blue-600'
      case 'manager':
        return 'text-green-600'
      default:
        return 'text-gray-600'
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center space-x-2">
        <div className="w-8 h-8 bg-gray-200 rounded animate-pulse" />
        <div className="w-32 h-4 bg-gray-200 rounded animate-pulse" />
      </div>
    )
  }

  if (!companyName) {
    return (
      <Button variant="outline" size="sm">
        <Building2 className="w-4 h-4 mr-2" />
        Seleccionar empresa
      </Button>
    )
  }

  return (
    <div className="flex items-center space-x-2 min-w-0">
      <Avatar className="w-6 h-6">
        <AvatarImage src={companyLogoUrl} />
        <AvatarFallback className="text-xs">
          {companyName.substring(0, 2).toUpperCase()}
        </AvatarFallback>
      </Avatar>
      <div className="flex flex-col items-start min-w-0">
        <span className="text-sm font-medium truncate">
          {companyName}
        </span>
        <div className="flex items-center space-x-1">
          <Badge 
            variant="outline" 
            className="text-xs bg-blue-100 text-blue-800 border-blue-200"
          >
            professional
          </Badge>
          {userRole && (
            <span className={`text-xs ${getRoleColor(userRole)}`}>
              {userRole}
            </span>
          )}
        </div>
      </div>
    </div>
  )
}

// Componente simplificado para usar en el header
export function TenantSwitcherCompact() {
  const { companyName, isLoading } = useWorkspace()

  if (isLoading) {
    return <div className="w-8 h-8 bg-gray-200 rounded animate-pulse" />
  }

  if (!companyName) {
    return (
      <Button variant="outline" size="sm">
        <Building2 className="w-4 h-4" />
      </Button>
    )
  }

  return (
    <Button variant="outline" size="sm" className="max-w-[200px]">
      <Building2 className="w-4 h-4 mr-2" />
      <span className="truncate">{companyName}</span>
    </Button>
  )
}