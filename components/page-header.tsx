import { Button } from "@/components/ui/button";
import { ContentViewToggle } from "@/components/content-view-toggle";
import { Download, RefreshCw, Plus } from "lucide-react";

interface PageHeaderProps {
  title: string;
  description: string;
  showExport?: boolean;
  showRefresh?: boolean;
  showAdd?: boolean;
  customActions?: React.ReactNode;
  accentColor?: "yellow" | "blue" | "orange" | "plum";
}

export function PageHeader({
  title,
  description,
  showExport = true,
  showRefresh = true,
  showAdd = false,
  customActions,
  accentColor = "yellow"
}: PageHeaderProps) {
  const getAccentGradient = () => {
    switch (accentColor) {
      case "blue": return "from-brilliant-blue to-signal-yellow";
      case "orange": return "from-orange-500 to-signal-yellow";
      case "plum": return "from-plum to-brilliant-blue";
      default: return "from-signal-yellow to-orange-500";
    }
  };

  return (
    <div className="flex justify-between items-start mb-8 pb-6 border-b border-gray-200/50 dark:border-gray-700/50">
      <div className="space-y-3">
        <h1 className="text-4xl font-bold tracking-tight text-foreground">
          {title}
        </h1>
        <p className="text-lg text-muted-foreground max-w-2xl leading-relaxed">
          {description}
        </p>
        <div className={`h-1 w-24 bg-gradient-to-r ${getAccentGradient()} rounded-full`}></div>
      </div>
      
      <div className="flex gap-3">
        <ContentViewToggle />
        {customActions}
        
        {showAdd && (
          <Button variant="outline" size="sm" className="hover:bg-brilliant-blue hover:text-white transition-colors">
            <Plus className="h-4 w-4 mr-2" />
            Nuevo
          </Button>
        )}
        
        {showRefresh && (
          <Button variant="outline" size="sm" className="hover:bg-brilliant-blue hover:text-white transition-colors">
            <RefreshCw className="h-4 w-4 mr-2" />
            Actualizar
          </Button>
        )}
        
        {showExport && (
          <Button variant="default" size="sm" className="bg-gradient-to-r from-signal-yellow to-orange-500 hover:from-signal-yellow/90 hover:to-orange-500/90 text-slate-900 font-medium">
            <Download className="h-4 w-4 mr-2" />
            Exportar
          </Button>
        )}
      </div>
    </div>
  );
} 