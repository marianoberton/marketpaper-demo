"use client";

interface ContentSection {
  id: string;
  title: string;
  content: React.ReactNode;
}

interface ContentWrapperProps {
  sections: ContentSection[];
  defaultSection?: string;
}

export function ContentWrapper({ sections }: ContentWrapperProps) {
  // Vista completa - muestra todo el contenido
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
