"use client";

import { WorkspaceNav } from "@/components/workspace-nav";
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
import { Menu, ArrowLeft } from "lucide-react";
import Link from "next/link";

interface WorkspaceLayoutProps {
  children: React.ReactNode;
  showBackLink?: boolean;
}

export function WorkspaceLayout({ children, showBackLink = false }: WorkspaceLayoutProps) {
  const { view, isCollapsed } = useLayout();

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
              <div className="font-logo text-2xl font-bold text-brilliant-blue">
                Workspace
              </div>
            </div>

            {/* Controles */}
            <div className="flex items-center gap-2">
              <LayoutToggle />
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
        <div className="flex h-full max-h-screen flex-col gap-2">
          <div className={`flex h-20 items-center border-b bg-gradient-to-r from-white/50 to-gray-50/30 dark:from-gray-900/50 dark:to-gray-800/30 ${
            isCollapsed ? 'flex-col justify-center px-2 gap-2' : 'justify-between px-6'
          }`}>
            {isCollapsed ? (
              <>
                <div 
                  className="font-logo text-lg font-bold text-brilliant-blue"
                  title="FOMO Workspace"
                >
                  W
                </div>
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
                  <div className="font-logo text-2xl font-bold text-brilliant-blue">
                    Workspace
                  </div>
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
               <div className="font-logo text-2xl font-bold text-brilliant-blue">
                 Workspace
               </div>
               <SheetTitle className="sr-only">Navegación Workspace</SheetTitle>
             </div>
             <WorkspaceNav />
             <SheetClose />
          </SheetContent>
        </Sheet>
        <div className="flex items-center gap-2">
           {showBackLink && (
             <Link href="/admin" className="text-muted-foreground hover:text-foreground transition-colors">
               <ArrowLeft className="h-4 w-4" />
             </Link>
           )}
           <div className="font-logo text-xl font-bold text-brilliant-blue">
             Workspace
           </div>
           <LayoutToggle />
        </div>
      </div>

      {/* Main Content Area */}
      <main className={`flex flex-1 flex-col ${mainPadding} min-h-screen transition-all duration-300`}>
        {children}
      </main>
    </div>
  );
} 