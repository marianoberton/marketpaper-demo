-- migrations/001_add_template_to_company.sql

-- Añadir la columna para la clave externa a la tabla de empresas
ALTER TABLE public.companies
ADD COLUMN client_template_id UUID;

-- Añadir la restricción de clave externa para vincular con las plantillas de cliente
ALTER TABLE public.companies
ADD CONSTRAINT fk_client_template
FOREIGN KEY (client_template_id)
REFERENCES public.client_templates(id)
ON DELETE SET NULL; -- Si una plantilla se elimina, la empresa no se elimina, solo se desvincula

-- Opcional: Crear un índice para mejorar el rendimiento de las búsquedas
CREATE INDEX idx_companies_client_template_id ON public.companies(client_template_id);

-- Comentario para explicar el cambio
COMMENT ON COLUMN public.companies.client_template_id IS 'ID de la plantilla de cliente asignada a esta empresa.'; 