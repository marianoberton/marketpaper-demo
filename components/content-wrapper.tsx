"use client";

import { useLayout } from "@/components/layout-context";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface ContentSection {
  id: string;
  title: string;
  content: React.ReactNode;
}

interface ContentWrapperProps {
  sections: ContentSection[];
  defaultSection?: string;
}

export function ContentWrapper({ sections, defaultSection }: ContentWrapperProps) {
  const { contentView } = useLayout();

  if (contentView === 'full') {
    // Vista completa - muestra todo el contenido sin tabs
    return (
      <div className="space-y-8">
        {sections.map((section) => (
          <section key={section.id} className="space-y-6">
            <h2 className="text-2xl font-semibold text-foreground border-b border-gray-200/50 dark:border-gray-700/50 pb-2">
              {section.title}
            </h2>
            {section.content}
          </section>
        ))}
      </div>
    );
  }

  // Vista con tabs - organiza el contenido en pestañas
  return (
    <Tabs defaultValue={defaultSection || sections[0]?.id} className="w-full space-y-6">
      <TabsList className="bg-white/50 dark:bg-gray-900/50 backdrop-blur-sm border border-gray-200/50 dark:border-gray-700/50 p-1 rounded-lg">
        {sections.map((section) => (
          <TabsTrigger 
            key={section.id}
            value={section.id}
            className="data-[state=active]:bg-signal-yellow data-[state=active]:text-slate-900 font-medium transition-all px-4"
          >
            {section.title}
          </TabsTrigger>
        ))}
      </TabsList>

      {sections.map((section) => (
        <TabsContent key={section.id} value={section.id} className="space-y-6 mt-8">
          {section.content}
        </TabsContent>
      ))}
    </Tabs>
  );
} 