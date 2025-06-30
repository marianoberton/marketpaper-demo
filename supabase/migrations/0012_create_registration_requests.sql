-- Crear tabla para solicitudes de registro
CREATE TABLE IF NOT EXISTS public.registration_requests (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  full_name text NOT NULL,
  email text NOT NULL,
  company_name text NOT NULL,
  phone text NOT NULL,
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'processed')),
  requested_at timestamptz DEFAULT now(),
  processed_at timestamptz NULL,
  processed_by uuid NULL,
  notes text NULL,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Índices para mejor rendimiento
CREATE INDEX IF NOT EXISTS idx_registration_requests_email ON public.registration_requests(email);
CREATE INDEX IF NOT EXISTS idx_registration_requests_status ON public.registration_requests(status);
CREATE INDEX IF NOT EXISTS idx_registration_requests_requested_at ON public.registration_requests(requested_at);

-- RLS (Row Level Security)
ALTER TABLE public.registration_requests ENABLE ROW LEVEL SECURITY;

-- Política: Solo super admins pueden ver y gestionar solicitudes
CREATE POLICY "Super admins can view all registration requests" ON public.registration_requests
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.super_admins sa
    WHERE sa.user_id = auth.uid()
    AND sa.status = 'active'
  )
);

CREATE POLICY "Super admins can update registration requests" ON public.registration_requests
FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM public.super_admins sa
    WHERE sa.user_id = auth.uid()
    AND sa.status = 'active'
  )
);

-- Política especial para insertar: permitir inserciones anónimas (formulario público)
CREATE POLICY "Anyone can insert registration requests" ON public.registration_requests
FOR INSERT
WITH CHECK (true);

-- Trigger para actualizar updated_at
CREATE OR REPLACE FUNCTION update_registration_requests_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_registration_requests_updated_at
  BEFORE UPDATE ON public.registration_requests
  FOR EACH ROW
  EXECUTE FUNCTION update_registration_requests_updated_at(); 