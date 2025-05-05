"use client";

import { Nav } from "@/components/nav";
import { 
  Sheet, 
  SheetContent, 
  SheetTrigger, 
  SheetTitle,
  SheetDescription
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Menu } from "lucide-react";

interface DashboardLayoutProps {
  children: React.ReactNode;
}

export function DashboardLayout({ children }: DashboardLayoutProps) {
  return (
    <div className="grid min-h-screen w-full lg:grid-cols-[280px_1fr]">
      <div className="hidden border-r bg-muted/40 lg:block">
        <div className="flex h-full max-h-screen flex-col gap-2">
          <div className="flex h-20 items-center justify-center border-b px-6">
            <img src="/market-paper-logo.png" alt="Market Paper" className="h-12 w-auto" /> 
          </div>
          <div className="flex-1 overflow-auto py-2">
             <Nav />
          </div>
        </div>
      </div>
      <div className="flex flex-col">
        <header className="flex h-16 items-center justify-between border-b bg-background px-4 lg:hidden">
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="outline" size="icon">
                <Menu className="h-5 w-5" />
                <span className="sr-only">Abrir menú</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="flex flex-col p-0 w-[280px]">
              <SheetTitle className="sr-only">Navegación Principal</SheetTitle>
              <SheetDescription className="sr-only">
                Menú de navegación principal del dashboard.
              </SheetDescription>
               <div className="flex h-20 items-center justify-center border-b px-6">
                 <img src="/market-paper-logo.png" alt="Market Paper" className="h-12 w-auto" /> 
               </div>
               <div className="flex-1 overflow-auto py-2">
                  <Nav />
               </div>
            </SheetContent>
          </Sheet>
          
          <div>
             <img src="/market-paper-logo.png" alt="Market Paper" className="h-8 w-auto" /> 
          </div>
        </header>
         <main className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-6">
          {children}
        </main>
      </div>
    </div>
  );
} 