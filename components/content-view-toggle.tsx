"use client";

import { useLayout } from "@/components/layout-context";
import { Button } from "@/components/ui/button";
import { LayoutGrid, Layers } from "lucide-react";

export function ContentViewToggle() {
  const { contentView, toggleContentView } = useLayout();

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={toggleContentView}
      className="hover:bg-signal-yellow hover:text-slate-900 transition-colors"
      title={contentView === 'full' ? 'Cambiar a vista con tabs' : 'Cambiar a vista completa'}
    >
      {contentView === 'full' ? (
        <Layers className="h-4 w-4 mr-2" />
      ) : (
        <LayoutGrid className="h-4 w-4 mr-2" />
      )}
      <span className="hidden sm:inline">
        {contentView === 'full' ? 'Vista Tabs' : 'Vista Completa'}
      </span>
      <span className="sr-only">
        {contentView === 'full' ? 'Cambiar a vista con tabs' : 'Cambiar a vista completa'}
      </span>
    </Button>
  );
} 