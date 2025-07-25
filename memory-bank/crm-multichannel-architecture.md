# CRM Multi-Canal - Arquitectura Propuesta
## FOMO Platform

### 🎯 Objetivo
Evolucionar de un sistema centrado en formularios web hacia un **CRM multi-canal unificado** que capture, procese y gestione leads desde cualquier fuente de manera inteligente.

### 📊 Nuevo Modelo de Datos

#### **1. Tabla Central: `unified_leads`**
```sql
CREATE TABLE unified_leads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  
  -- Información básica (normalizada)
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255),
  phone VARCHAR(50),
  company VARCHAR(255),
  position VARCHAR(100),
  
  -- Canal y fuente
  channel_type lead_channel NOT NULL, -- 'web_form', 'facebook_ads', 'linkedin', 'google_ads', 'whatsapp', 'email', 'cold_call', 'referral', 'chatbot', 'event'
  source_id VARCHAR(255), -- ID específico del canal (form_id, ad_id, campaign_id, etc.)
  source_name VARCHAR(255), -- Nombre descriptivo de la fuente
  
  -- Datos específicos del canal (JSON flexible)
  channel_data JSONB, -- Datos específicos según el canal
  
  -- Información contextual
  utm_data JSONB, -- Todos los parámetros UTM
  technical_data JSONB, -- IP, user_agent, device_info, etc.
  custom_fields JSONB, -- Campos adicionales según necesidades
  
  -- Scoring y clasificación
  lead_score INTEGER DEFAULT 0 CHECK (lead_score >= 0 AND lead_score <= 100),
  quality_grade lead_quality DEFAULT 'unknown', -- 'hot', 'warm', 'cold', 'unknown'
  priority lead_priority DEFAULT 'medium',
  
  -- Estado y gestión
  status lead_status DEFAULT 'new',
  stage pipeline_stage DEFAULT 'unqualified',
  assigned_to UUID REFERENCES user_profiles(id),
  
  -- Contexto de negocio
  estimated_value DECIMAL(10,2),
  close_probability INTEGER DEFAULT 0 CHECK (close_probability >= 0 AND close_probability <= 100),
  expected_close_date DATE,
  
  -- Actividad y seguimiento
  first_contact_at TIMESTAMP WITH TIME ZONE,
  last_activity_at TIMESTAMP WITH TIME ZONE,
  next_action_date TIMESTAMP WITH TIME ZONE,
  
  -- Duplicación y deduplicación
  is_duplicate BOOLEAN DEFAULT false,
  master_lead_id UUID REFERENCES unified_leads(id),
  confidence_score DECIMAL(3,2), -- Para algoritmos de deduplicación
  
  -- Metadatos
  raw_payload JSONB, -- Datos originales sin procesar (para debugging)
  processing_status VARCHAR(50) DEFAULT 'processed', -- 'processing', 'processed', 'failed'
  processing_errors TEXT[],
  
  -- Timestamps
  captured_at TIMESTAMP WITH TIME ZONE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enums
CREATE TYPE lead_channel AS ENUM (
  'web_form', 'facebook_ads', 'instagram_ads', 'linkedin_ads', 'linkedin_organic',
  'google_ads', 'google_organic', 'whatsapp', 'email_marketing', 'cold_call', 
  'referral', 'chatbot', 'event', 'direct', 'other'
);

CREATE TYPE lead_quality AS ENUM ('hot', 'warm', 'cold', 'unknown');
CREATE TYPE lead_priority AS ENUM ('urgent', 'high', 'medium', 'low');
CREATE TYPE lead_status AS ENUM ('new', 'contacted', 'qualified', 'proposal_sent', 'negotiation', 'closed_won', 'closed_lost', 'unqualified');
CREATE TYPE pipeline_stage AS ENUM ('unqualified', 'lead', 'opportunity', 'proposal', 'negotiation', 'closed');
```

#### **2. Tabla de Procesadores de Canal: `channel_processors`**
```sql
CREATE TABLE channel_processors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  
  channel_type lead_channel NOT NULL,
  processor_name VARCHAR(100) NOT NULL,
  is_active BOOLEAN DEFAULT true,
  
  -- Configuración del procesador
  config JSONB NOT NULL, -- Configuración específica del canal
  field_mapping JSONB NOT NULL, -- Mapeo de campos de entrada a campos estándar
  scoring_rules JSONB, -- Reglas de scoring específicas del canal
  validation_rules JSONB, -- Reglas de validación
  
  -- Estadísticas
  total_processed INTEGER DEFAULT 0,
  success_rate DECIMAL(5,2) DEFAULT 0,
  last_processed_at TIMESTAMP WITH TIME ZONE,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

#### **3. Tabla de Actividades: `lead_activities`**
```sql
CREATE TABLE lead_activities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  lead_id UUID NOT NULL REFERENCES unified_leads(id) ON DELETE CASCADE,
  
  activity_type activity_type NOT NULL,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  
  -- Contexto de la actividad
  channel VARCHAR(100), -- Canal donde ocurrió la actividad
  direction activity_direction, -- 'inbound', 'outbound'
  outcome VARCHAR(100), -- 'successful', 'no_response', 'interested', 'not_interested'
  
  -- Datos específicos según tipo
  activity_data JSONB, -- Email content, call duration, meeting notes, etc.
  
  -- Participantes
  performed_by UUID REFERENCES user_profiles(id),
  participants JSONB, -- Otros participantes en la actividad
  
  -- Programación
  scheduled_at TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE,
  
  -- Follow-up
  requires_followup BOOLEAN DEFAULT false,
  followup_date TIMESTAMP WITH TIME ZONE,
  followup_assigned_to UUID REFERENCES user_profiles(id),
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TYPE activity_type AS ENUM (
  'email_sent', 'email_received', 'call_made', 'call_received', 
  'meeting_scheduled', 'meeting_held', 'proposal_sent', 'contract_sent',
  'demo_completed', 'note_added', 'status_changed', 'assignment_changed',
  'social_interaction', 'website_visit', 'content_download'
);

CREATE TYPE activity_direction AS ENUM ('inbound', 'outbound');
```

### 🔄 Sistema de Procesadores por Canal

#### **Procesador Base (Interface)**
```typescript
interface ChannelProcessor {
  channelType: LeadChannel;
  
  // Procesar datos de entrada del canal
  processRawData(rawData: any): Promise<ProcessedLead>;
  
  // Validar datos
  validateData(data: ProcessedLead): ValidationResult;
  
  // Calcular scoring específico del canal
  calculateChannelScore(data: ProcessedLead): number;
  
  // Normalizar campos
  normalizeFields(data: any): StandardLeadFields;
  
  // Detectar duplicados
  findPotentialDuplicates(data: ProcessedLead): Promise<DuplicateMatch[]>;
}
```

#### **Procesadores Específicos**

1. **WebFormProcessor**: Procesa formularios web (actual contact_leads)
2. **FacebookAdsProcessor**: Integración con Facebook Lead Ads API
3. **LinkedInProcessor**: LinkedIn Lead Gen Forms
4. **GoogleAdsProcessor**: Google Ads conversions
5. **WhatsAppProcessor**: Mensajes de WhatsApp Business
6. **EmailProcessor**: Campañas de email marketing
7. **ColdCallProcessor**: Llamadas en frío manuales
8. **ReferralProcessor**: Leads por referido
9. **ChatbotProcessor**: Conversaciones de chatbot/AI
10. **EventProcessor**: Leads de eventos/ferias

### 🎯 Sistema de Scoring Unificado

```typescript
interface LeadScoringEngine {
  // Scoring base (común a todos los canales)
  calculateBaseScore(lead: UnifiedLead): number;
  
  // Scoring específico del canal
  calculateChannelScore(lead: UnifiedLead, processor: ChannelProcessor): number;
  
  // Scoring temporal (timing, urgencia)
  calculateTimingScore(lead: UnifiedLead): number;
  
  // Scoring contextual (empresa, sector, tamaño)
  calculateContextScore(lead: UnifiedLead): number;
  
  // Score final ponderado
  calculateFinalScore(lead: UnifiedLead): LeadScore;
}

interface LeadScore {
  total: number; // 0-100
  breakdown: {
    base: number;
    channel: number;
    timing: number;
    context: number;
  };
  confidence: number;
  reasons: string[];
}
```

### 🌟 APIs Unificadas

#### **1. API Universal de Captura**
```typescript
// POST /api/leads/capture
{
  "channel": "facebook_ads",
  "source_id": "campaign_123",
  "data": {
    // Datos específicos del canal
  },
  "metadata": {
    // Contexto adicional
  }
}
```

#### **2. API de Gestión**
```typescript
// GET /api/leads
// POST /api/leads
// PUT /api/leads/:id
// DELETE /api/leads/:id

// Filtros avanzados
GET /api/leads?channel=facebook_ads&quality=hot&assigned_to=user123&stage=opportunity
```

#### **3. API de Analytics**
```typescript
// GET /api/leads/analytics
{
  "by_channel": {...},
  "by_quality": {...},
  "by_stage": {...},
  "conversion_rates": {...},
  "roi_by_channel": {...}
}
```

### 🚀 Plan de Implementación

#### **Fase 1: Migración y Base** (1-2 semanas)
1. Crear nuevas tablas
2. Migrar contact_leads existentes
3. Implementar API básica unificada
4. Procesador para web forms

#### **Fase 2: Canales Principales** (2-3 semanas)
1. Facebook/Instagram Ads
2. LinkedIn Ads
3. Google Ads
4. WhatsApp Business

#### **Fase 3: Canales Adicionales** (2-3 semanas)
1. Email Marketing
2. Llamadas en frío
3. Referidos
4. Chatbot/AI

#### **Fase 4: Optimización** (1-2 semanas)
1. Deduplicación automática
2. Scoring avanzado
3. Automatizaciones
4. Analytics avanzados

### 💡 Beneficios del Nuevo Sistema

1. **Flexibilidad Total**: Cualquier canal puede integrarse fácilmente
2. **Datos Consistentes**: Normalización automática
3. **Scoring Inteligente**: Considera el contexto del canal
4. **Deduplicación**: Evita leads duplicados entre canales
5. **Analytics Completos**: Visión 360° de todas las fuentes
6. **Escalabilidad**: Fácil agregar nuevos canales
7. **API Unificada**: Un solo endpoint para todo

### 🔧 Configuración por Canal

Cada empresa podrá configurar:
- Qué canales están activos
- Mapping de campos específico
- Reglas de scoring por canal
- Validaciones personalizadas
- Automatizaciones específicas
- Asignación automática por canal

### 📊 Dashboard Unificado

Un dashboard que muestre:
- Leads por canal en tiempo real
- Performance de cada canal
- Conversion rates por fuente
- ROI por canal de marketing
- Embudo unificado de todos los canales
- Alerts y notifications inteligentes 