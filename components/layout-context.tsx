"use client";

import React, { createContext, useContext, useState, useEffect } from 'react';

type LayoutView = 'sidebar' | 'tabs';
type ContentView = 'full' | 'tabs';

interface LayoutContextType {
  view: LayoutView;
  setView: (view: LayoutView) => void;
  toggleView: () => void;
  isCollapsed: boolean;
  setIsCollapsed: (collapsed: boolean) => void;
  toggleCollapsed: () => void;
  contentView: ContentView;
  setContentView: (view: ContentView) => void;
  toggleContentView: () => void;
}

const LayoutContext = createContext<LayoutContextType | undefined>(undefined);

export function LayoutProvider({ children }: { children: React.ReactNode }) {
  const [view, setViewState] = useState<LayoutView>('sidebar');
  const [isCollapsed, setIsCollapsedState] = useState(false);
  const [contentView, setContentViewState] = useState<ContentView>('full');

  // Load from localStorage on mount
  useEffect(() => {
    const savedView = localStorage.getItem('fomo-layout-view') as LayoutView;
    if (savedView && (savedView === 'sidebar' || savedView === 'tabs')) {
      setViewState(savedView);
    }
    
    const savedCollapsed = localStorage.getItem('fomo-sidebar-collapsed');
    if (savedCollapsed === 'true') {
      setIsCollapsedState(true);
    }

    const savedContentView = localStorage.getItem('fomo-content-view') as ContentView;
    if (savedContentView && (savedContentView === 'full' || savedContentView === 'tabs')) {
      setContentViewState(savedContentView);
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

  const setContentView = (newContentView: ContentView) => {
    setContentViewState(newContentView);
    localStorage.setItem('fomo-content-view', newContentView);
  };

  const toggleContentView = () => {
    const newContentView = contentView === 'full' ? 'tabs' : 'full';
    setContentView(newContentView);
  };

  return (
    <LayoutContext.Provider value={{ 
      view, 
      setView, 
      toggleView, 
      isCollapsed, 
      setIsCollapsed, 
      toggleCollapsed,
      contentView,
      setContentView,
      toggleContentView
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