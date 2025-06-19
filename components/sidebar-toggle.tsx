"use client";

import { useLayout } from "@/components/layout-context";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";

export function SidebarToggle() {
  const { isCollapsed, toggleCollapsed } = useLayout();

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={toggleCollapsed}
      className="hover:bg-signal-yellow hover:text-slate-900 transition-colors h-8 w-8"
      title={isCollapsed ? 'Expandir sidebar' : 'Colapsar sidebar'}
    >
      {isCollapsed ? (
        <ChevronRight className="h-4 w-4" />
      ) : (
        <ChevronLeft className="h-4 w-4" />
      )}
      <span className="sr-only">
        {isCollapsed ? 'Expandir sidebar' : 'Colapsar sidebar'}
      </span>
    </Button>
  );
} 