"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ThemeToggle } from "@/components/theme-toggle";
import { LayoutToggle } from "@/components/layout-toggle";
import { 
  BarChart3,
  LineChart,
  UserIcon,
  LayoutDashboard,
  Settings,
  ShoppingCart,
  Users,
  LineChartIcon,
  Zap,
  MessageSquare,
  MailIcon,
  TrendingUp,
  Clock,
  Server,
  BookUser,
  Linkedin
} from "lucide-react";
const links = [
  { name: "Dashboard", href: "/", icon: LayoutDashboard },
  { name: "Ventas", href: "/sales", icon: ShoppingCart },
  { name: "Conversión", href: "/conversion", icon: TrendingUp },
  { name: "Marketing", href: "/marketing", icon: LineChart },
  { name: "Redes Sociales", href: "/social", icon: Linkedin },
  { name: "Comportamiento", href: "/behavior", icon: Users },
  { name: "CRM", href: "/crm", icon: BookUser },
  { name: "Chat", href: "/chat", icon: MessageSquare },
  { name: "Email", href: "/email", icon: MailIcon },
  { name: "Proveedores", href: "/providers", icon: Users },
  { name: "Técnico", href: "/technical", icon: Server },
  { name: "Demo Content", href: "/demo-content", icon: Zap },
];

export function TabsNav() {
  const pathname = usePathname();

  return (
    <div className="w-full bg-white/90 dark:bg-gray-900/90 backdrop-blur-sm border-b shadow-sm">
      <div className="flex items-center px-4 py-3 gap-4">
        {/* Logo */}
        <div className="flex items-center gap-2 flex-shrink-0">
          <div className="font-logo text-2xl font-bold text-slate-900 dark:text-white">
            FOMO
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex-1 overflow-x-auto scrollbar-hide relative">
          <div className="flex items-center gap-2 py-1 min-w-max px-2">
            {links.map((link) => {
              const LinkIcon = link.icon;
              const isActive = pathname === link.href;

              return (
                <Link
                  key={link.name}
                  href={link.href}
                  className={`flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-all duration-200 whitespace-nowrap ${
                    isActive 
                      ? "bg-signal-yellow text-slate-900 shadow-md" 
                      : "transparent hover:bg-brilliant-blue hover:text-white hover:shadow-sm"
                  }`}
                >
                  <LinkIcon className="h-4 w-4" />
                  <span className="hidden sm:inline">{link.name}</span>
                </Link>
              );
            })}
          </div>
          {/* Scroll indicators */}
          <div className="absolute left-0 top-0 bottom-0 w-6 bg-gradient-to-r from-white/90 to-transparent dark:from-gray-900/90 pointer-events-none sm:hidden"></div>
          <div className="absolute right-0 top-0 bottom-0 w-6 bg-gradient-to-l from-white/90 to-transparent dark:from-gray-900/90 pointer-events-none sm:hidden"></div>
        </div>

        {/* Controls */}
        <div className="flex items-center gap-2 flex-shrink-0">
          <LayoutToggle />
          <ThemeToggle />
        </div>
      </div>
    </div>
  );
} 