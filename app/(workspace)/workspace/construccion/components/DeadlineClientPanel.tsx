import React, { useState, useEffect } from 'react';
import { FileText, Calendar, AlertTriangle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import type { Project } from '@/lib/construction';

interface UploadDate {
  id: string;
  project_id: string;
  section_name: string;
  upload_date: string;
  expiration_date: string;
  days_remaining: number;
  created_at: string;
  updated_at: string;
}

interface DeadlineClientPanelProps {
  project: Project;
  className?: string;
}

export function DeadlineClientPanel({ project, className = '' }: DeadlineClientPanelProps) {
  const [uploadDates, setUploadDates] = useState<UploadDate[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadUploadDates();
  }, [project.id]);

  const loadUploadDates = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/workspace/construction/upload-dates?project_id=${project.id}`);
      if (response.ok) {
        const data = await response.json();
        setUploadDates(data);
      } else {
        console.error('Error loading upload dates:', response.statusText);
      }
    } catch (error) {
      console.error('Error loading upload dates:', error);
      setError('Error al cargar las fechas de carga');
    } finally {
      setLoading(false);
    }
  };

  // Categorizar fechas de vencimiento calculadas
  const categorizeUploadDates = () => {
    const now = new Date();
    const expired = uploadDates.filter(date => date.days_remaining < 0);
    const today = uploadDates.filter(date => date.days_remaining === 0);
    const critical = uploadDates.filter(date => date.days_remaining > 0 && date.days_remaining <= 3);
    const warning = uploadDates.filter(date => date.days_remaining > 3 && date.days_remaining <= 7);
    const upcoming = uploadDates.filter(date => date.days_remaining > 7);

    return { expired, today, critical, warning, upcoming };
  };

  const { expired, today, critical, warning, upcoming } = categorizeUploadDates();

  // Si no hay fechas de carga, no mostrar el panel
  if (uploadDates.length === 0 && !loading) {
    return null;
  }

  return (
    <Card className={`${className}`}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Vigencia de documentos
          </CardTitle>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {loading ? (
          <div className="text-center py-4">
            <p className="text-muted-foreground">Cargando fechas...</p>
          </div>
        ) : error ? (
          <div className="text-center py-4">
            <p className="text-red-600">{error}</p>
          </div>
        ) : uploadDates.length === 0 ? (
          <div className="text-center py-4">
            <p className="text-muted-foreground">No hay documentos cargados</p>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Calendar className="h-4 w-4" />
              <span>Documentos cargados: {uploadDates.length}</span>
            </div>

            <div className="space-y-2 max-h-60 overflow-y-auto">
              {uploadDates.slice(0, 10).map((date) => {
                const getBadgeColor = (daysRemaining: number) => {
                  if (daysRemaining < 0) return 'bg-red-100 text-red-800 border-red-200';
                  if (daysRemaining === 0) return 'bg-orange-100 text-orange-800 border-orange-200';
                  if (daysRemaining <= 3) return 'bg-yellow-100 text-yellow-800 border-yellow-200';
                  if (daysRemaining <= 7) return 'bg-blue-100 text-blue-800 border-blue-200';
                  return 'bg-green-100 text-green-800 border-green-200';
                };

                const getStatusText = (daysRemaining: number) => {
                  if (daysRemaining < 0) return `${Math.abs(daysRemaining)} días vencido`;
                  if (daysRemaining === 0) return 'Vence hoy';
                  return `${daysRemaining} días`;
                };

                return (
                  <div key={date.id} className="flex items-center justify-between text-xs p-2 bg-gray-50 rounded">
                    <div className="flex-1 mr-2">
                      <span className="font-medium truncate block">
                        {date.section_name}
                      </span>
                      <span className="text-muted-foreground text-xs">
                        Cargado: {new Date(date.upload_date).toLocaleDateString('es-ES')} • 
                        Vence: {new Date(date.expiration_date).toLocaleDateString('es-ES')}
                      </span>
                    </div>
                    <Badge className={`${getBadgeColor(date.days_remaining)} text-xs px-2 py-0.5`}>
                      {getStatusText(date.days_remaining)}
                    </Badge>
                  </div>
                );
              })}
            </div>

            {uploadDates.length > 10 && (
              <div className="text-xs text-muted-foreground text-center pt-1">
                +{uploadDates.length - 10} más...
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default DeadlineClientPanel;