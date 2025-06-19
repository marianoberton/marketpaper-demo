"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ThemeToggle } from "@/components/theme-toggle";
import { useLayout } from "@/components/layout-context";
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
  Linkedin,
  Briefcase
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
  { name: "Workspace", href: "/workspace", icon: Briefcase },
  { name: "Demo Content", href: "/demo-content", icon: Zap },
];

export function Nav() {
  const pathname = usePathname();
  const { isCollapsed } = useLayout();

  return (
    <div className="group flex h-full flex-col gap-4 py-2">
      <nav className="grid flex-1 gap-1 px-2">
        {links.map((link) => {
          const LinkIcon = link.icon;
          const isActive = pathname === link.href;

          return (
            <Link
              key={link.name}
              href={link.href}
              className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-all duration-200 ${
                isActive 
                  ? "bg-signal-yellow text-slate-900 shadow-md" 
                  : "transparent hover:bg-brilliant-blue hover:text-white hover:shadow-sm"
              } ${isCollapsed ? "justify-center" : ""}`}
              title={isCollapsed ? link.name : undefined}
            >
              <LinkIcon className="h-5 w-5 flex-shrink-0" />
              {!isCollapsed && <span>{link.name}</span>}
            </Link>
          );
        })}
      </nav>
      <div className={`mt-auto border-t ${isCollapsed ? "p-2" : "p-4"}`}>
        <div className={isCollapsed ? "flex justify-center" : ""}>
          <ThemeToggle />
        </div>
      </div>
    </div>
  );
} 