"use client";

import { Nav } from "@/components/nav";
import { 
  Sheet, 
  SheetContent, 
  SheetTrigger, 
  SheetTitle,
  SheetDescription,
  SheetClose
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Menu } from "lucide-react";

interface DashboardLayoutProps {
  children: React.ReactNode;
}

export function DashboardLayout({ children }: DashboardLayoutProps) {
  return (
    <div className="min-h-screen w-full bg-muted/40">
      {/* Desktop Sidebar - Make fixed */}
      <aside className="hidden lg:block fixed left-0 top-0 z-40 w-[280px] h-screen border-r bg-background">
        <div className="flex h-full max-h-screen flex-col gap-2">
          <div className="flex h-20 items-center justify-center border-b px-6">
            <img src="/market-paper-logo.png" alt="Market Paper" className="h-12 w-auto" />
          </div>
          <div className="flex-1 overflow-auto py-2"> {/* Nav content scrolls if needed */}
            <Nav />
          </div>
        </div>
      </aside>

      {/* Mobile Header - Keep sticky */}
      <div className="lg:hidden sticky top-0 z-50 flex h-16 items-center justify-between border-b bg-background px-4">
        <Sheet>
          <SheetTrigger asChild>
            <Button variant="outline" size="icon">
              <Menu className="h-5 w-5" />
              <span className="sr-only">Abrir menú</span>
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="flex flex-col">
             {/* Logo inside mobile sheet */}
             <div className="flex h-20 items-center justify-center border-b">
               <img src="/market-paper-logo.png" alt="Market Paper" className="h-10 w-auto" />
               <SheetTitle className="sr-only">Navegación Principal</SheetTitle>
             </div>
             <Nav />
             <SheetClose />
          </SheetContent>
        </Sheet>
        {/* Logo in mobile header */}
        <div className="flex items-center gap-2">
           <img src="/market-paper-logo.png" alt="Market Paper" className="h-8 w-auto" />
        </div>
      </div>

      {/* Main Content Area - Add left padding on lg screens */}
      <main className="flex flex-1 flex-col lg:pl-[280px]">
        {children}
      </main>
    </div>
  );
} 