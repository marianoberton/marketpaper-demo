'use client'

import { useState } from 'react'
import { Check, ChevronsUpDown, Building2, Plus } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
} from '@/components/ui/command'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { Badge } from '@/components/ui/badge'
import { useCompany } from '@/app/providers/CompanyProvider'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'

export default function TenantSwitcher() {
  const [open, setOpen] = useState(false)
  const { 
    currentCompany, 
    companies, 
    switchCompany, 
    isLoading,
    userProfile 
  } = useCompany()

  const handleCompanySelect = async (companyId: string) => {
    if (companyId === currentCompany?.id) {
      setOpen(false)
      return
    }

    try {
      await switchCompany(companyId)
      setOpen(false)
    } catch (error) {
      console.error('Error switching company:', error)
      // Aquí podrías mostrar un toast de error
    }
  }

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

  if (!currentCompany) {
    return (
      <Button variant="outline" size="sm">
        <Building2 className="w-4 h-4 mr-2" />
        Seleccionar empresa
      </Button>
    )
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-[280px] justify-between"
        >
          <div className="flex items-center space-x-2 min-w-0">
            <Avatar className="w-6 h-6">
              <AvatarImage src={currentCompany.logo_url} />
              <AvatarFallback className="text-xs">
                {currentCompany.name.substring(0, 2).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div className="flex flex-col items-start min-w-0">
              <span className="text-sm font-medium truncate">
                {currentCompany.name}
              </span>
              <div className="flex items-center space-x-1">
                <Badge 
                  variant="outline" 
                  className={cn("text-xs", getPlanBadgeColor(currentCompany.plan))}
                >
                  {currentCompany.plan}
                </Badge>
                {userProfile && (
                  <span className={cn("text-xs", getRoleColor(userProfile.role))}>
                    {userProfile.role}
                  </span>
                )}
              </div>
            </div>
          </div>
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[280px] p-0">
        <Command>
          <CommandInput placeholder="Buscar empresa..." />
          <CommandEmpty>No se encontraron empresas.</CommandEmpty>
          <CommandGroup heading="Empresas">
            {companies.map((company) => (
              <CommandItem
                key={company.id}
                value={company.name}
                onSelect={() => handleCompanySelect(company.id)}
                className="flex items-center space-x-2"
              >
                <Avatar className="w-6 h-6">
                  <AvatarImage src={company.logo_url} />
                  <AvatarFallback className="text-xs">
                    {company.name.substring(0, 2).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium truncate">
                      {company.name}
                    </span>
                    <Check
                      className={cn(
                        "ml-2 h-4 w-4",
                        currentCompany?.id === company.id ? "opacity-100" : "opacity-0"
                      )}
                    />
                  </div>
                  <div className="flex items-center space-x-1 mt-1">
                    <Badge 
                      variant="outline" 
                      className={cn("text-xs", getPlanBadgeColor(company.plan))}
                    >
                      {company.plan}
                    </Badge>
                    <span className="text-xs text-gray-500">
                      {company.status}
                    </span>
                  </div>
                </div>
              </CommandItem>
            ))}
          </CommandGroup>
          <CommandGroup>
            <CommandItem
              onSelect={() => {
                setOpen(false)
                // Aquí podrías abrir un modal para crear nueva empresa
                console.log('Create new company')
              }}
              className="flex items-center space-x-2 text-blue-600"
            >
              <Plus className="w-4 h-4" />
              <span className="text-sm">Crear nueva empresa</span>
            </CommandItem>
          </CommandGroup>
        </Command>
      </PopoverContent>
    </Popover>
  )
}

// Componente simplificado para usar en el header
export function TenantSwitcherCompact() {
  const { currentCompany, isLoading } = useCompany()

  if (isLoading) {
    return <div className="w-8 h-8 bg-gray-200 rounded animate-pulse" />
  }

  if (!currentCompany) {
    return (
      <Avatar className="w-8 h-8">
        <AvatarFallback>
          <Building2 className="w-4 h-4" />
        </AvatarFallback>
      </Avatar>
    )
  }

  return (
    <Avatar className="w-8 h-8">
      <AvatarImage src={currentCompany.logo_url} />
      <AvatarFallback className="text-xs">
        {currentCompany.name.substring(0, 2).toUpperCase()}
      </AvatarFallback>
    </Avatar>
  )
}