import React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { FileText, Shield, AlertCircle, FileSignature } from 'lucide-react'
import { Separator } from '@/components/ui/separator'
import DomainReportSection from './DomainReportSection'
import InsurancePolicySection from './InsurancePolicySection'
import InhibitionReportSection from './InhibitionReportSection'
import ContractSection from './ContractSection'

interface OtherDocumentsProps {
  project: any
  onProjectUpdate?: (updatedProject: any) => void
}

export default function OtherDocuments({ project, onProjectUpdate }: OtherDocumentsProps) {
  return (
    <div className="space-y-6">
      {/* Header principal */}
      <div className="flex items-center gap-3">
        <div className="p-2 bg-purple-500/10 rounded-lg">
          <FileText className="h-6 w-6 text-purple-600" />
        </div>
        <div>
          <h2 className="text-2xl font-bold text-foreground">Otros Documentos</h2>
          <p className="text-sm text-muted-foreground">
            Documentos adicionales requeridos para el proyecto
          </p>
        </div>
      </div>

      {/* Layout de columnas */}
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-2 gap-6">
        {/* Columna 1: Informe de Dominio */}
        <Card className="h-fit">
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center gap-2 text-lg">
              <FileText className="h-5 w-5 text-primary" />
              Informe de Dominio
            </CardTitle>
            <p className="text-sm text-muted-foreground">
              Documento requerido para el Registro de Etapa de Proyecto (vigencia 90 días)
            </p>
          </CardHeader>
          <CardContent>
            <DomainReportSection
              project={project}
              onProjectUpdate={onProjectUpdate}
            />
          </CardContent>
        </Card>

        {/* Columna 2: Póliza de Seguro */}
        <Card className="h-fit">
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Shield className="h-5 w-5 text-primary" />
              Póliza de Seguro
            </CardTitle>
            <p className="text-sm text-muted-foreground">
              Cobertura de seguro para el proyecto de construcción
            </p>
          </CardHeader>
          <CardContent>
            <InsurancePolicySection
              project={project}
              onProjectUpdate={onProjectUpdate}
            />
          </CardContent>
        </Card>

        {/* Columna 3: Informe de Inhibición */}
        <Card className="h-fit">
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center gap-2 text-lg">
              <AlertCircle className="h-5 w-5 text-primary" />
              Informe de Inhibición
            </CardTitle>
            <p className="text-sm text-muted-foreground">
              Certificación de ausencia de inhibiciones legales
            </p>
          </CardHeader>
          <CardContent>
            <InhibitionReportSection
              project={project}
              onProjectUpdate={onProjectUpdate}
            />
          </CardContent>
        </Card>

        {/* Columna 4: Contrato de Obra */}
        <Card className="h-fit">
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center gap-2 text-lg">
              <FileSignature className="h-5 w-5 text-primary" />
              Contrato de Obra
            </CardTitle>
            <p className="text-sm text-muted-foreground">
              Contrato de obra del proyecto de construcción
            </p>
          </CardHeader>
          <CardContent>
            <ContractSection
              project={project}
              onProjectUpdate={onProjectUpdate}
            />
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
