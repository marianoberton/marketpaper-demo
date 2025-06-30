"use client";

import { WorkspaceNav } from "@/components/workspace-nav";
import { ContentViewToggle } from "@/components/content-view-toggle";
import { LayoutToggle } from "@/components/layout-toggle";
import { SidebarToggle } from "@/components/sidebar-toggle";
import { useLayout } from "@/components/layout-context";
import { 
  Sheet, 
  SheetContent, 
  SheetTrigger, 
  SheetTitle,
  SheetClose
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Menu, ArrowLeft, LogOut, User } from "lucide-react";
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
      <div className="min-h-screen w-full bg-gradient-to-br from-white to-gray-50/50 dark:from-gray-950 dark:to-gray-900/50">
        {/* Workspace Header con navegación horizontal */}
        <div className="sticky top-0 z-50 w-full bg-white/90 dark:bg-gray-900/90 backdrop-blur-sm border-b shadow-sm">
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
                    height={120}
                    className="object-contain rounded"
                  />
                ) : (
                  <div className="font-logo text-2xl font-bold text-brilliant-blue">
                    {companyName || 'Workspace'}
                  </div>
                )}
              </div>
            </div>

            {/* Controles */}
            <div className="flex items-center gap-2">
              <LayoutToggle />
              <Button
                variant="outline"
                size="sm"
                onClick={handleLogout}
                className="flex items-center gap-2 hover:bg-red-50 hover:border-red-300 hover:text-red-600"
              >
                <LogOut className="h-4 w-4" />
                <span className="hidden sm:inline">Cerrar Sesión</span>
              </Button>
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
    <div className="min-h-screen w-full bg-gradient-to-br from-white to-gray-50/50 dark:from-gray-950 dark:to-gray-900/50">
      {/* Desktop Sidebar */}
      <aside className={`hidden lg:block fixed left-0 top-0 z-40 ${sidebarWidth} h-screen border-r bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm shadow-xl transition-all duration-300`}>
        <div className="flex h-full max-h-screen flex-col">
          <div className={`flex h-20 items-center border-b bg-gradient-to-r from-white/50 to-gray-50/30 dark:from-gray-900/50 dark:to-gray-800/30 ${
            isCollapsed ? 'flex-col justify-center px-2 gap-2' : 'justify-between px-6'
          }`}>
            {isCollapsed ? (
              <>
                {/* Logo/Icon when collapsed */}
                {companyLogoUrl ? (
                  <Image
                    src={companyLogoUrl}
                    alt={`Logo de ${companyName}`}
                    width={64}
                    height={64}
                    className="object-contain rounded"
                    title={companyName || 'Workspace'}
                  />
                ) : (
                  <div 
                    className="font-logo text-lg font-bold text-brilliant-blue"
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
                      width={100}
                      height={100}
                      className="object-contain rounded"
                    />
                  ) : (
                    <div className="font-logo text-2xl font-bold text-brilliant-blue">
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
          
          {/* Vista Tabs Toggle */}
          <div className={`border-t p-3 ${isCollapsed ? 'flex justify-center' : ''}`}>
            <ContentViewToggle />
          </div>
          
          {/* User Info & Logout en la parte inferior */}
          <div className={`border-t bg-gradient-to-r from-white/50 to-gray-50/30 dark:from-gray-900/50 dark:to-gray-800/30 p-4 ${
            isCollapsed ? 'flex flex-col items-center gap-2' : ''
          }`}>
            {isCollapsed ? (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleLogout}
                className="w-full flex items-center justify-center hover:bg-red-50 hover:text-red-600"
                title="Cerrar Sesión"
              >
                <LogOut className="h-4 w-4" />
              </Button>
            ) : (
              <>
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-8 h-8 bg-gradient-to-br from-brilliant-blue to-plum rounded-full flex items-center justify-center">
                    <User className="h-4 w-4 text-white" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">{userName || 'Usuario'}</p>
                    <p className="text-xs text-gray-500 truncate">{companyName || 'Manager'}</p>
                  </div>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleLogout}
                  className="w-full flex items-center gap-2 hover:bg-red-50 hover:border-red-300 hover:text-red-600"
                >
                  <LogOut className="h-4 w-4" />
                  Cerrar Sesión
                </Button>
              </>
            )}
          </div>
        </div>
      </aside>

      {/* Mobile Header */}
      <div className="lg:hidden sticky top-0 z-50 flex h-16 items-center justify-between border-b bg-white/90 dark:bg-gray-900/90 backdrop-blur-sm px-4 shadow-sm">
        <Sheet>
          <SheetTrigger asChild>
            <Button variant="outline" size="icon" className="hover:bg-brilliant-blue hover:text-white transition-colors">
              <Menu className="h-5 w-5" />
              <span className="sr-only">Abrir menú</span>
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="flex flex-col bg-white/95 dark:bg-gray-900/95 backdrop-blur-sm">
             <div className="flex h-20 items-center justify-center border-b bg-gradient-to-r from-white/50 to-gray-50/30 dark:from-gray-900/50 dark:to-gray-800/30">
               <div className="flex items-center gap-3">
                 {companyLogoUrl ? (
                   <Image
                     src={companyLogoUrl}
                     alt={`Logo de ${companyName}`}
                     width={64}
                     height={64}
                     className="object-contain rounded"
                   />
                 ) : (
                   <div className="font-logo text-2xl font-bold text-brilliant-blue">
                     {companyName || 'Workspace'}
                   </div>
                 )}
               </div>
               <SheetTitle className="sr-only">Navegación Workspace</SheetTitle>
             </div>
             <div className="flex-1 overflow-auto py-2">
               <WorkspaceNav />
             </div>
             
             {/* Vista Tabs Toggle en Mobile */}
             <div className="border-t p-3">
               <ContentViewToggle />
             </div>
             
             {/* User info y logout en mobile */}
             <div className="border-t p-4 bg-gradient-to-r from-white/50 to-gray-50/30">
               <div className="flex items-center gap-3 mb-3">
                 <div className="w-8 h-8 bg-gradient-to-br from-brilliant-blue to-plum rounded-full flex items-center justify-center">
                   <User className="h-4 w-4 text-white" />
                 </div>
                 <div className="flex-1">
                   <p className="text-sm font-medium text-gray-900">{userName || 'Usuario'}</p>
                   <p className="text-xs text-gray-500">{companyName || 'Manager'}</p>
                 </div>
               </div>
               <Button
                 variant="outline"
                 size="sm"
                 onClick={handleLogout}
                 className="w-full flex items-center gap-2 hover:bg-red-50 hover:border-red-300 hover:text-red-600"
               >
                 <LogOut className="h-4 w-4" />
                 Cerrar Sesión
               </Button>
             </div>
             <SheetClose />
          </SheetContent>
        </Sheet>
        <div className="flex items-center gap-2">
           {showBackLink && (
             <Link href="/admin" className="text-muted-foreground hover:text-foreground transition-colors">
               <ArrowLeft className="h-4 w-4" />
             </Link>
           )}
           <div className="flex items-center gap-2">
             {companyLogoUrl ? (
               <Image
                 src={companyLogoUrl}
                 alt={`Logo de ${companyName}`}
                 width={24}
                 height={24}
                 className="object-contain rounded"
               />
             ) : (
               <div className="font-logo text-xl font-bold text-brilliant-blue">
                 {companyName || 'Workspace'}
               </div>
             )}
           </div>
           <div className="flex items-center gap-2">
             <LayoutToggle />
             <Button
               variant="outline"
               size="sm"
               onClick={handleLogout}
               className="hover:bg-red-50 hover:border-red-300 hover:text-red-600"
             >
               <LogOut className="h-4 w-4" />
             </Button>
           </div>
        </div>
      </div>

      {/* Main Content Area */}
      <main className={`flex flex-1 flex-col ${mainPadding} min-h-screen transition-all duration-300`}>
        {children}
      </main>
    </div>
  );
} 