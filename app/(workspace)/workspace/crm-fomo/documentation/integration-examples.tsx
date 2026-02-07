"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Copy, ExternalLink, Code, Database, Webhook, Key } from "lucide-react";

export const IntegrationExamples = () => {
  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  return (
    <div className="space-y-6">
      {/* Webhook para Formularios Web */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Webhook className="h-5 w-5" />
            <span>Webhook para Formularios Web</span>
          </CardTitle>
          <CardDescription>Endpoint para capturar leads desde formularios de contacto</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="bg-gray-900 text-gray-100 p-4 rounded-lg text-sm font-mono overflow-x-auto">
            <pre>{`// pages/api/webhook/leads.js
import { NextApiRequest, NextApiResponse } from 'next';
import { createLead, calculateLeadScore } from '@/lib/crm';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const {
      name,
      email,
      phone,
      company,
      message,
      utm_source,
      utm_campaign,
      utm_medium,
      page_url
    } = req.body;

    // Validar datos requeridos
    if (!name || !email) {
      return res.status(400).json({ message: 'Name and email are required' });
    }

    // Crear objeto lead
    const leadData = {
      name,
      email,
      phone: phone || null,
      company: company || null,
      message: message || null,
      source: 'web-form',
      utm_source: utm_source || 'direct',
      utm_campaign: utm_campaign || null,
      utm_medium: utm_medium || 'organic',
      page_url: page_url || null,
      created_at: new Date().toISOString(),
      status: 'new',
      temperature: 'cold'
    };

    // Calcular lead scoring
    const score = calculateLeadScore(leadData);
    leadData.score = score;
    
    // Determinar temperatura basada en score
    if (score >= 80) leadData.temperature = 'hot';
    else if (score >= 50) leadData.temperature = 'warm';

    // Guardar en base de datos
    const lead = await createLead(leadData);

    // Enviar notificación al equipo comercial si es lead caliente
    if (leadData.temperature === 'hot') {
      await sendSlackNotification(\`🔥 Nuevo lead caliente: \${name} - \${company}\`);
      await sendEmailNotification(lead);
    }

    res.status(200).json({ 
      success: true, 
      leadId: lead.id,
      score: score,
      temperature: leadData.temperature
    });

  } catch (error) {
    console.error('Error processing lead:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
}`}</pre>
          </div>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => copyToClipboard(`// Código del webhook para formularios web...`)}
          >
            <Copy className="h-4 w-4 mr-2" />
            Copiar Código
          </Button>
        </CardContent>
      </Card>

      {/* Meta Business API */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Code className="h-5 w-5" />
            <span>Meta Business API (Facebook/Instagram)</span>
          </CardTitle>
          <CardDescription>Integración con Facebook Lead Ads para captura automática</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="bg-gray-900 text-gray-100 p-4 rounded-lg text-sm font-mono overflow-x-auto">
            <pre>{`// pages/api/webhook/meta.js
import crypto from 'crypto';

const VERIFY_TOKEN = process.env.META_VERIFY_TOKEN;
const APP_SECRET = process.env.META_APP_SECRET;
const ACCESS_TOKEN = process.env.META_ACCESS_TOKEN;

export default async function handler(req, res) {
  if (req.method === 'GET') {
    // Verificación del webhook
    const mode = req.query['hub.mode'];
    const token = req.query['hub.verify_token'];
    const challenge = req.query['hub.challenge'];

    if (mode === 'subscribe' && token === VERIFY_TOKEN) {
      console.log('Webhook verified');
      res.status(200).send(challenge);
    } else {
      res.status(403).send('Forbidden');
    }
  }

  if (req.method === 'POST') {
    // Verificar firma del webhook
    const signature = req.headers['x-hub-signature-256'];
    const expectedSignature = crypto
      .createHmac('sha256', APP_SECRET)
      .update(JSON.stringify(req.body))
      .digest('hex');

    if (signature !== \`sha256=\${expectedSignature}\`) {
      return res.status(401).send('Unauthorized');
    }

    // Procesar datos del lead
    const body = req.body;
    
    if (body.object === 'page') {
      body.entry.forEach(async (entry) => {
        const changes = entry.changes || [];
        
        changes.forEach(async (change) => {
          if (change.field === 'leadgen') {
            const leadgenId = change.value.leadgen_id;
            const formId = change.value.form_id;
            const pageId = change.value.page_id;
            
            // Obtener datos del lead desde Meta API
            const leadData = await fetchLeadFromMeta(leadgenId);
            
            // Procesar y guardar en CRM
            await processMetaLead(leadData, formId, pageId);
          }
        });
      });
    }

    res.status(200).send('OK');
  }
}

async function fetchLeadFromMeta(leadgenId) {
  const url = \`https://graph.facebook.com/v18.0/\${leadgenId}?access_token=\${ACCESS_TOKEN}\`;
  
  try {
    const response = await fetch(url);
    const data = await response.json();
    
    return {
      id: data.id,
      created_time: data.created_time,
      field_data: data.field_data
    };
  } catch (error) {
    console.error('Error fetching lead from Meta:', error);
    throw error;
  }
}

async function processMetaLead(leadData, formId, pageId) {
  // Mapear campos de Meta a estructura CRM
  const fieldMap = {
    'full_name': 'name',
    'email': 'email',
    'phone_number': 'phone',
    'company_name': 'company'
  };

  const crmLead = {
    source: 'facebook-ads',
    meta_lead_id: leadData.id,
    form_id: formId,
    page_id: pageId,
    created_at: leadData.created_time,
    status: 'new',
    temperature: 'warm' // Los leads de anuncios suelen ser warm
  };

  // Mapear campos específicos
  leadData.field_data.forEach(field => {
    const crmField = fieldMap[field.name];
    if (crmField) {
      crmLead[crmField] = field.values[0];
    }
  });

  // Calcular score y guardar
  const score = calculateLeadScore(crmLead);
  crmLead.score = score;

  await createLead(crmLead);
  
  // Notificar si es lead de alta calidad
  if (score >= 70) {
    await sendSlackNotification(\`📱 Nuevo lead de Facebook: \${crmLead.name}\`);
  }
}`}</pre>
          </div>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => copyToClipboard(`// Código de integración Meta Business API...`)}
          >
            <Copy className="h-4 w-4 mr-2" />
            Copiar Código
          </Button>
        </CardContent>
      </Card>

      {/* Lead Scoring System */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Database className="h-5 w-5" />
            <span>Sistema de Lead Scoring</span>
          </CardTitle>
          <CardDescription>Algoritmo para calificar automáticamente la calidad de los leads</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="bg-gray-900 text-gray-100 p-4 rounded-lg text-sm font-mono overflow-x-auto">
            <pre>{`// lib/lead-scoring.js

export function calculateLeadScore(leadData) {
  let score = 0;

  // Puntuación por fuente (0-25 puntos)
  const sourceScores = {
    'web-form': 25,
    'facebook-ads': 20,
    'instagram-ads': 20,
    'linkedin-organic': 25,
    'google-ads': 22,
    'referral': 25,
    'cold-outreach': 10
  };
  score += sourceScores[leadData.source] || 10;

  // Puntuación por información de contacto (0-20 puntos)
  if (leadData.email) score += 10;
  if (leadData.phone) score += 10;

  // Puntuación por información de empresa (0-15 puntos)
  if (leadData.company) score += 10;
  if (leadData.company && leadData.company.length > 3) score += 5;

  // Puntuación por engagement (0-20 puntos)
  if (leadData.message && leadData.message.length > 50) score += 10;
  if (leadData.utm_campaign) score += 5;
  if (leadData.page_url && leadData.page_url.includes('/pricing')) score += 5;

  // Puntuación por timing (0-10 puntos)
  const hour = new Date().getHours();
  if (hour >= 9 && hour <= 17) score += 5; // Horario comercial
  
  const day = new Date().getDay();
  if (day >= 1 && day <= 5) score += 5; // Días laborables

  // Puntuación por palabras clave en mensaje (0-10 puntos)
  if (leadData.message) {
    const highValueKeywords = [
      'presupuesto', 'cotización', 'precio', 'contratar',
      'urgente', 'proyecto', 'necesito', 'cuando'
    ];
    
    const messageWords = leadData.message.toLowerCase();
    const keywordMatches = highValueKeywords.filter(keyword => 
      messageWords.includes(keyword)
    ).length;
    
    score += Math.min(keywordMatches * 2, 10);
  }

  // Asegurar que el score esté entre 0 y 100
  return Math.min(Math.max(score, 0), 100);
}

export function getLeadTemperature(score) {
  if (score >= 80) return 'hot';
  if (score >= 50) return 'warm';
  return 'cold';
}

export function getLeadPriority(leadData) {
  const score = leadData.score || calculateLeadScore(leadData);
  const temperature = getLeadTemperature(score);
  
  // Factores adicionales para prioridad
  let priority = 'medium';
  
  if (temperature === 'hot') priority = 'high';
  if (temperature === 'cold') priority = 'low';
  
  // Ajustar por fuente
  if (leadData.source === 'referral') priority = 'high';
  if (leadData.source === 'cold-outreach') priority = 'low';
  
  // Ajustar por palabras clave urgentes
  if (leadData.message && leadData.message.toLowerCase().includes('urgente')) {
    priority = 'high';
  }
  
  return priority;
}`}</pre>
          </div>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => copyToClipboard(`// Código del sistema de lead scoring...`)}
          >
            <Copy className="h-4 w-4 mr-2" />
            Copiar Código
          </Button>
        </CardContent>
      </Card>

      {/* WhatsApp Integration */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Key className="h-5 w-5" />
            <span>WhatsApp Business API</span>
          </CardTitle>
          <CardDescription>Integración para comunicación directa con leads y clientes</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="bg-gray-900 text-gray-100 p-4 rounded-lg text-sm font-mono overflow-x-auto">
            <pre>{`// pages/api/webhook/whatsapp.js
import { processWhatsAppMessage, sendWhatsAppMessage } from '@/lib/whatsapp';

const WHATSAPP_TOKEN = process.env.WHATSAPP_ACCESS_TOKEN;
const VERIFY_TOKEN = process.env.WHATSAPP_VERIFY_TOKEN;

export default async function handler(req, res) {
  if (req.method === 'GET') {
    // Verificación del webhook
    const mode = req.query['hub.mode'];
    const token = req.query['hub.verify_token'];
    const challenge = req.query['hub.challenge'];

    if (mode === 'subscribe' && token === VERIFY_TOKEN) {
      console.log('WhatsApp webhook verified');
      res.status(200).send(challenge);
    } else {
      res.status(403).send('Forbidden');
    }
  }

  if (req.method === 'POST') {
    const body = req.body;

    if (body.object === 'whatsapp_business_account') {
      body.entry.forEach(async (entry) => {
        const changes = entry.changes || [];
        
        changes.forEach(async (change) => {
          if (change.field === 'messages') {
            const messages = change.value.messages || [];
            
            messages.forEach(async (message) => {
              await handleIncomingMessage(message);
            });
          }
        });
      });
    }

    res.status(200).send('OK');
  }
}

async function handleIncomingMessage(message) {
  const phoneNumber = message.from;
  const messageText = message.text?.body;
  const messageType = message.type;

  // Buscar contacto existente o crear nuevo
  let contact = await findContactByPhone(phoneNumber);
  
  if (!contact) {
    contact = await createContact({
      phone: phoneNumber,
      source: 'whatsapp',
      status: 'new',
      created_at: new Date().toISOString()
    });
  }

  // Registrar mensaje en CRM
  await createActivity({
    contact_id: contact.id,
    type: 'whatsapp_message',
    direction: 'inbound',
    content: messageText,
    message_type: messageType,
    whatsapp_message_id: message.id,
    timestamp: new Date(message.timestamp * 1000).toISOString()
  });

  // Procesar mensaje con IA para detectar intención
  const intent = await detectMessageIntent(messageText);
  
  // Responder automáticamente según la intención
  if (intent === 'greeting') {
    await sendAutoResponse(phoneNumber, 'greeting');
  } else if (intent === 'pricing_inquiry') {
    await sendAutoResponse(phoneNumber, 'pricing');
  } else if (intent === 'support_request') {
    await notifySupport(contact, messageText);
  }

  // Actualizar lead scoring si es un lead activo
  if (contact.status === 'lead') {
    await updateLeadEngagement(contact.id, 'whatsapp_message');
  }
}

async function sendAutoResponse(phoneNumber, responseType) {
  const responses = {
    greeting: {
      text: "¡Hola! 👋 Gracias por contactarnos. Soy el asistente virtual de FOMO. ¿En qué puedo ayudarte hoy?",
      buttons: [
        { id: "info", title: "Información" },
        { id: "pricing", title: "Precios" },
        { id: "demo", title: "Solicitar Demo" }
      ]
    },
    pricing: {
      text: "💰 Te envío información sobre nuestros planes:\\n\\n📊 Plan Básico: €99/mes\\n🚀 Plan Pro: €199/mes\\n🏢 Plan Enterprise: Personalizado\\n\\n¿Te gustaría agendar una demo personalizada?",
      buttons: [
        { id: "demo", title: "Agendar Demo" },
        { id: "contact", title: "Hablar con Asesor" }
      ]
    }
  };

  const response = responses[responseType];
  if (response) {
    await sendWhatsAppMessage(phoneNumber, response);
  }
}

// lib/whatsapp.js
export async function sendWhatsAppMessage(phoneNumber, messageData) {
  const url = \`https://graph.facebook.com/v18.0/\${process.env.WHATSAPP_PHONE_NUMBER_ID}/messages\`;
  
  const payload = {
    messaging_product: "whatsapp",
    to: phoneNumber,
    type: messageData.buttons ? "interactive" : "text",
    ...messageData.buttons ? {
      interactive: {
        type: "button",
        body: { text: messageData.text },
        action: {
          buttons: messageData.buttons.map(btn => ({
            type: "reply",
            reply: { id: btn.id, title: btn.title }
          }))
        }
      }
    } : {
      text: { body: messageData.text }
    }
  };

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': \`Bearer \${WHATSAPP_TOKEN}\`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });

    const result = await response.json();
    return result;
  } catch (error) {
    console.error('Error sending WhatsApp message:', error);
    throw error;
  }
}`}</pre>
          </div>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => copyToClipboard(`// Código de integración WhatsApp Business API...`)}
          >
            <Copy className="h-4 w-4 mr-2" />
            Copiar Código
          </Button>
        </CardContent>
      </Card>

      {/* Variables de Entorno */}
      <Card>
        <CardHeader>
          <CardTitle>Variables de Entorno Requeridas</CardTitle>
          <CardDescription>Configuración necesaria en tu archivo .env.local</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="bg-gray-900 text-gray-100 p-4 rounded-lg text-sm font-mono">
            <pre>{`# Base de datos
DATABASE_URL="postgresql://user:password@localhost:5432/crm_db"

# Meta Business (Facebook/Instagram)
META_APP_ID="tu_app_id"
META_APP_SECRET="tu_app_secret"
META_ACCESS_TOKEN="tu_access_token"
META_VERIFY_TOKEN="tu_verify_token_personalizado"

# WhatsApp Business API
WHATSAPP_ACCESS_TOKEN="tu_whatsapp_token"
WHATSAPP_PHONE_NUMBER_ID="tu_phone_number_id"
WHATSAPP_VERIFY_TOKEN="tu_whatsapp_verify_token"

# Google APIs
GOOGLE_ADS_CLIENT_ID="tu_client_id"
GOOGLE_ADS_CLIENT_SECRET="tu_client_secret"
GOOGLE_ADS_REFRESH_TOKEN="tu_refresh_token"
GOOGLE_ADS_DEVELOPER_TOKEN="tu_developer_token"

# LinkedIn API
LINKEDIN_CLIENT_ID="tu_linkedin_client_id"
LINKEDIN_CLIENT_SECRET="tu_linkedin_client_secret"

# Email Service
SENDGRID_API_KEY="tu_sendgrid_api_key"
SMTP_HOST="smtp.gmail.com"
SMTP_PORT="587"
SMTP_USER="tu_email@gmail.com"
SMTP_PASS="tu_app_password"

# Notificaciones
SLACK_WEBHOOK_URL="https://hooks.slack.com/services/..."
SLACK_BOT_TOKEN="xoxb-tu-bot-token"

# Seguridad
JWT_SECRET="tu_jwt_secret_muy_seguro"
ENCRYPTION_KEY="tu_encryption_key_32_caracteres"

# URLs
NEXT_PUBLIC_APP_URL="https://tu-dominio.com"
WEBHOOK_BASE_URL="https://tu-dominio.com/api/webhook"`}</pre>
          </div>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => copyToClipboard(`# Variables de entorno para CRM...`)}
          >
            <Copy className="h-4 w-4 mr-2" />
            Copiar Variables
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};