"use client";

import { useLayout } from "@/components/layout-context";
import { Button } from "@/components/ui/button";
import { PanelLeft, Menu } from "lucide-react";

export function LayoutToggle() {
  const { view, toggleView } = useLayout();

  return (
    <Button
      variant="outline"
      size="icon"
      onClick={toggleView}
      className="hover:bg-signal-yellow hover:text-slate-900 transition-colors"
      title={view === 'sidebar' ? 'Cambiar a vista de tabs' : 'Cambiar a vista sidebar'}
    >
      {view === 'sidebar' ? (
        <Menu className="h-4 w-4" />
      ) : (
        <PanelLeft className="h-4 w-4" />
      )}
      <span className="sr-only">
        {view === 'sidebar' ? 'Cambiar a vista de tabs' : 'Cambiar a vista sidebar'}
      </span>
    </Button>
  );
} 