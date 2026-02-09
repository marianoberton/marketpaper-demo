import { Button } from "@/components/ui/button";
import { RefreshCw, Plus } from "lucide-react";

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
  showExport = false,
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
      default: return "from-primary to-orange";
    }
  };

  return (
    <div className="flex flex-col sm:flex-row justify-between items-start gap-4 mb-8 pb-6 border-b border-border">
      <div className="space-y-2">
        <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-foreground">
          {title}
        </h1>
        <p className="text-base sm:text-lg text-muted-foreground max-w-2xl leading-relaxed">
          {description}
        </p>
        <div className={`h-1 w-20 bg-gradient-to-r ${getAccentGradient()} rounded-full mt-3`}></div>
      </div>
      
      <div className="flex gap-2 sm:gap-3 flex-wrap">
        {customActions}
        
        {showAdd && (
          <Button size="sm" className="bg-primary text-primary-foreground hover:bg-primary/90">
            <Plus className="h-4 w-4 mr-2" />
            Nuevo
          </Button>
        )}
        
        {showRefresh && (
          <Button variant="outline" size="sm" className="hover:bg-accent transition-colors">
            <RefreshCw className="h-4 w-4 mr-2" />
            Actualizar
          </Button>
        )}
      </div>
    </div>
  );
} 