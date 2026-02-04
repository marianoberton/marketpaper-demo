"use client";

import React, { createContext, useContext, useState, useEffect } from 'react';

type LayoutView = 'sidebar' | 'tabs';

interface LayoutContextType {
  view: LayoutView;
  setView: (view: LayoutView) => void;
  toggleView: () => void;
  isCollapsed: boolean;
  setIsCollapsed: (collapsed: boolean) => void;
  toggleCollapsed: () => void;
}

const LayoutContext = createContext<LayoutContextType | undefined>(undefined);

export function LayoutProvider({ children }: { children: React.ReactNode }) {
  const [view, setViewState] = useState<LayoutView>('sidebar');
  const [isCollapsed, setIsCollapsedState] = useState(true); // Colapsada por defecto

  // Load from localStorage on mount
  useEffect(() => {
    const savedView = localStorage.getItem('fomo-layout-view') as LayoutView;
    if (savedView && (savedView === 'sidebar' || savedView === 'tabs')) {
      setViewState(savedView);
    }

    const savedCollapsed = localStorage.getItem('fomo-sidebar-collapsed');
    if (savedCollapsed === 'false') {
      setIsCollapsedState(false);
    }
  }, []);

  const setView = (newView: LayoutView) => {
    setViewState(newView);
    localStorage.setItem('fomo-layout-view', newView);
  };

  const toggleView = () => {
    const newView = view === 'sidebar' ? 'tabs' : 'sidebar';
    setView(newView);
  };

  const setIsCollapsed = (collapsed: boolean) => {
    setIsCollapsedState(collapsed);
    localStorage.setItem('fomo-sidebar-collapsed', collapsed.toString());
  };

  const toggleCollapsed = () => {
    const newCollapsed = !isCollapsed;
    setIsCollapsed(newCollapsed);
  };

  return (
    <LayoutContext.Provider value={{
      view,
      setView,
      toggleView,
      isCollapsed,
      setIsCollapsed,
      toggleCollapsed
    }}>
      {children}
    </LayoutContext.Provider>
  );
}

export function useLayout() {
  const context = useContext(LayoutContext);
  if (context === undefined) {
    throw new Error('useLayout must be used within a LayoutProvider');
  }
  return context;
}
