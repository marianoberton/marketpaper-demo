"use client";

import { WorkspaceNav } from "@/components/workspace-nav";
import { LayoutToggle } from "@/components/layout-toggle";
import { SidebarToggle } from "@/components/sidebar-toggle";
import { ThemeToggle } from "@/components/theme-toggle";
import { useLayout } from "@/components/layout-context";
import {
  Sheet,
  SheetContent,
  SheetTrigger,
  SheetTitle,
  SheetClose
} from "@/components/ui/sheet";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Menu, ArrowLeft, LogOut, User, LifeBuoy, Settings as SettingsIcon, ChevronDown } from "lucide-react";
import { NotificationBell } from "@/components/notification-bell";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { logout } from "@/lib/auth-client";
import { useWorkspace } from "@/components/workspace-context";
import Image from "next/image";
import { createClient } from "@/utils/supabase/client";

interface WorkspaceLayoutProps {
  children: React.ReactNode;
  showBackLink?: boolean;
}

export function WorkspaceLayout({ children, showBackLink = false }: WorkspaceLayoutProps) {
  const { view, isCollapsed } = useLayout();
  const router = useRouter();
  const { companyName, companyLogoUrl, userName } = useWorkspace();

  const handleLogout = async () => {
    await logout(router);
  };

  if (view === 'tabs') {
    return (
      <div className="min-h-screen w-full bg-background">
        {/* Workspace Header con navegación horizontal */}
        <div className="sticky top-0 z-50 w-full bg-card/90 backdrop-blur-sm border-b shadow-sm">
          <div className="flex items-center justify-between px-6 py-3">
            {/* Logo y navegación de vuelta */}
            <div className="flex items-center gap-4">
              {showBackLink && (
                <Link href="/admin" className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors">
                  <ArrowLeft className="h-4 w-4" />
                  <span className="text-sm">Admin</span>
                </Link>
              )}
              <div className="flex items-center gap-3">
                {companyLogoUrl ? (
                  <Image
                    src={companyLogoUrl}
                    alt={`Logo de ${companyName}`}
                    width={120}
                    height={40}
                    className="object-contain rounded max-h-10"
                  />
                ) : (
                  <div className="text-2xl font-bold text-foreground">
                    {companyName || 'Workspace'}
                  </div>
                )}
              </div>
            </div>

            {/* Controles */}
            <div className="flex items-center gap-2">
              <NotificationBell />
              <ThemeToggle />
              <LayoutToggle />
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon">
                    <User className="h-5 w-5" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-56" align="end">
                  <DropdownMenuLabel>
                    <div className="truncate">{userName || 'Usuario'}</div>
                    <div className="text-xs font-normal text-muted-foreground truncate">{companyName}</div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <Link href="/workspace/settings/profile" className="flex items-center cursor-pointer">
                      <User className="mr-2 h-4 w-4" />
                      Mi Perfil
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/workspace/settings" className="flex items-center cursor-pointer">
                      <SettingsIcon className="mr-2 h-4 w-4" />
                      Configuración
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/workspace/soporte" className="flex items-center cursor-pointer">
                      <LifeBuoy className="mr-2 h-4 w-4" />
                      Soporte
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={handleLogout}
                    className="text-destructive focus:text-destructive cursor-pointer"
                  >
                    <LogOut className="mr-2 h-4 w-4" />
                    Cerrar Sesión
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <main className="flex flex-1 flex-col min-h-screen">
          {children}
        </main>
      </div>
    );
  }

  // Vista Sidebar para Workspace
  const sidebarWidth = isCollapsed ? 'w-[80px]' : 'w-[280px]';
  const mainPadding = isCollapsed ? 'lg:pl-[80px]' : 'lg:pl-[280px]';

  return (
    <div className="min-h-screen w-full bg-background">
      {/* Desktop Sidebar */}
      <aside className={`hidden lg:block fixed left-0 top-0 z-40 ${sidebarWidth} h-screen border-r bg-sidebar backdrop-blur-sm shadow-xl transition-all duration-300`}>
        <div className="flex h-full max-h-screen flex-col">
          <div className={`flex h-20 items-center border-b ${isCollapsed ? 'flex-col justify-center px-2 gap-2' : 'justify-between px-6'
            }`}>
            {isCollapsed ? (
              <>
                {/* Logo/Icon when collapsed */}
                {companyLogoUrl ? (
                  <Image
                    src={companyLogoUrl}
                    alt={`Logo de ${companyName}`}
                    width={40}
                    height={40}
                    className="object-contain rounded max-h-10 max-w-[40px]"
                    title={companyName || 'Workspace'}
                  />
                ) : (
                  <div
                    className="text-lg font-bold text-foreground"
                    title={companyName || 'Workspace'}
                  >
                    {companyName ? companyName.charAt(0).toUpperCase() : 'W'}
                  </div>
                )}
                <SidebarToggle />
              </>
            ) : (
              <>
                <div className="flex items-center gap-3">
                  {showBackLink && (
                    <Link href="/admin" className="text-muted-foreground hover:text-foreground transition-colors">
                      <ArrowLeft className="h-4 w-4" />
                    </Link>
                  )}
                  {/* Company logo when expanded */}
                  {companyLogoUrl ? (
                    <Image
                      src={companyLogoUrl}
                      alt={`Logo de ${companyName}`}
                      width={140}
                      height={40}
                      className="object-contain rounded max-h-10"
                    />
                  ) : (
                    <div className="text-2xl font-bold text-foreground">
                      {companyName || 'Workspace'}
                    </div>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <SidebarToggle />
                  <LayoutToggle />
                </div>
              </>
            )}
          </div>
          <div className="flex-1 overflow-auto py-2">
            <WorkspaceNav />
          </div>

          {/* User Info & Logout en la parte inferior */}
          <div className={`border-t p-4 ${isCollapsed ? 'flex flex-col items-center gap-2' : ''
            }`}>
            {isCollapsed ? (
              <>
                <NotificationBell />
                <ThemeToggle />
                <div className="w-full h-px bg-border my-2" />
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" title="Mi Cuenta">
                      <User className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="w-56" align="end" side="right">
                    <DropdownMenuLabel>
                      <div className="truncate">{userName || 'Usuario'}</div>
                      <div className="text-xs font-normal text-muted-foreground truncate">{companyName}</div>
                    </DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem asChild>
                      <Link href="/workspace/settings/profile" className="flex items-center cursor-pointer">
                        <User className="mr-2 h-4 w-4" />
                        Mi Perfil
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link href="/workspace/settings" className="flex items-center cursor-pointer">
                        <SettingsIcon className="mr-2 h-4 w-4" />
                        Configuración
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link href="/workspace/soporte" className="flex items-center cursor-pointer">
                        <LifeBuoy className="mr-2 h-4 w-4" />
                        Soporte
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      onClick={handleLogout}
                      className="text-destructive focus:text-destructive cursor-pointer"
                    >
                      <LogOut className="mr-2 h-4 w-4" />
                      Cerrar Sesión
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </>
            ) : (
              <>
                <div className="flex items-center gap-2 mb-3">
                  <NotificationBell />
                  <ThemeToggle />
                </div>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" className="w-full justify-between h-auto py-2 px-3">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center flex-shrink-0">
                          <User className="h-4 w-4 text-primary-foreground" />
                        </div>
                        <div className="min-w-0 text-left">
                          <p className="text-sm font-medium text-foreground truncate max-w-[120px]">{userName || 'Usuario'}</p>
                          <p className="text-xs text-muted-foreground truncate max-w-[120px]">{companyName}</p>
                        </div>
                      </div>
                      <ChevronDown className="h-4 w-4 opacity-50 flex-shrink-0" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="w-56" align="end" side="top">
                    <DropdownMenuLabel>Mi Cuenta</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem asChild>
                      <Link href="/workspace/settings/profile" className="flex items-center cursor-pointer">
                        <User className="mr-2 h-4 w-4" />
                        Mi Perfil
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link href="/workspace/settings" className="flex items-center cursor-pointer">
                        <SettingsIcon className="mr-2 h-4 w-4" />
                        Configuración
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link href="/workspace/soporte" className="flex items-center cursor-pointer">
                        <LifeBuoy className="mr-2 h-4 w-4" />
                        Soporte
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      onClick={handleLogout}
                      className="text-destructive focus:text-destructive cursor-pointer"
                    >
                      <LogOut className="mr-2 h-4 w-4" />
                      Cerrar Sesión
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </>
            )}
          </div>
        </div>
      </aside>

      {/* Mobile Header */}
      <div className="lg:hidden sticky top-0 z-50 flex h-14 items-center justify-between border-b bg-card/90 backdrop-blur-sm px-3 shadow-sm">
        <Sheet>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon" className="hover:bg-primary/10 hover:text-primary transition-colors">
              <Menu className="h-5 w-5" />
              <span className="sr-only">Abrir menú</span>
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="flex flex-col bg-sidebar backdrop-blur-sm w-[280px]">
            <div className="flex h-16 items-center justify-center border-b">
              <div className="flex items-center gap-3">
                {companyLogoUrl ? (
                  <Image
                    src={companyLogoUrl}
                    alt={`Logo de ${companyName}`}
                    width={120}
                    height={40}
                    className="object-contain rounded max-h-10"
                  />
                ) : (
                  <div className="text-xl font-bold text-foreground">
                    {companyName || 'Workspace'}
                  </div>
                )}
              </div>
              <SheetTitle className="sr-only">Navegación Workspace</SheetTitle>
            </div>
            <div className="flex-1 overflow-auto py-2">
              <WorkspaceNav />
            </div>

            {/* User info y controles en mobile */}
            <div className="border-t p-4 space-y-3">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 bg-primary rounded-full flex items-center justify-center">
                  <User className="h-5 w-5 text-primary-foreground" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground truncate">{userName || 'Usuario'}</p>
                  <p className="text-xs text-muted-foreground truncate">{companyName}</p>
                </div>
                <ThemeToggle />
              </div>

              {/* Menu options */}
              <div className="space-y-1 pt-2 border-t">
                <SheetClose asChild>
                  <Link href="/workspace/settings/profile">
                    <Button variant="ghost" size="sm" className="w-full justify-start h-9">
                      <User className="h-4 w-4 mr-2" />
                      Mi Perfil
                    </Button>
                  </Link>
                </SheetClose>
                <SheetClose asChild>
                  <Link href="/workspace/settings">
                    <Button variant="ghost" size="sm" className="w-full justify-start h-9">
                      <SettingsIcon className="h-4 w-4 mr-2" />
                      Configuración
                    </Button>
                  </Link>
                </SheetClose>
                <SheetClose asChild>
                  <Link href="/workspace/soporte">
                    <Button variant="ghost" size="sm" className="w-full justify-start h-9">
                      <LifeBuoy className="h-4 w-4 mr-2" />
                      Soporte
                    </Button>
                  </Link>
                </SheetClose>
              </div>

              <Button
                variant="outline"
                size="sm"
                onClick={handleLogout}
                className="w-full flex items-center gap-2 hover:bg-destructive/10 hover:border-destructive hover:text-destructive mt-2"
              >
                <LogOut className="h-4 w-4" />
                Cerrar Sesión
              </Button>
            </div>
            <SheetClose />
          </SheetContent>
        </Sheet>

        {/* Logo central */}
        <div className="absolute left-1/2 transform -translate-x-1/2 flex items-center gap-2">
          {companyLogoUrl ? (
            <Image
              src={companyLogoUrl}
              alt={`Logo de ${companyName}`}
              width={90}
              height={36}
              className="object-contain rounded max-h-9"
            />
          ) : (
            <div className="text-xl font-bold text-foreground">
              {companyName || 'W'}
            </div>
          )}
        </div>

        {/* Notificaciones */}
        <NotificationBell />
      </div>

      {/* Main Content Area */}
      <main className={`flex flex-1 flex-col ${mainPadding} min-h-screen transition-all duration-300`}>
        {children}
      </main>
    </div>
  );
} 