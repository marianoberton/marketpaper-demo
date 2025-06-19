import { NextRequest, NextResponse } from 'next/server'
import { createContact, findContactByPhone, createActivity } from '@/lib/crm-multitenant'
import { createSupabaseAdmin } from '@/lib/supabase'

const WHATSAPP_VERIFY_TOKEN = process.env.WHATSAPP_VERIFY_TOKEN
const WHATSAPP_TOKEN = process.env.WHATSAPP_ACCESS_TOKEN
const PHONE_NUMBER_ID = process.env.WHATSAPP_PHONE_NUMBER_ID

const DEFAULT_COMPANY_ID = 'e6f96979-5638-4c38-8c5e-3331b262d640' // Replace with your logic

export async function GET(request: NextRequest) {
  const url = new URL(request.url)
  const mode = url.searchParams.get('hub.mode')
  const token = url.searchParams.get('hub.verify_token')
  const challenge = url.searchParams.get('hub.challenge')

  if (mode === 'subscribe' && token === WHATSAPP_VERIFY_TOKEN) {
    console.log('WhatsApp webhook verified')
    return new Response(challenge, { status: 200 })
  } else {
    console.log('WhatsApp webhook verification failed')
    return new Response('Forbidden', { status: 403 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    if (body.object === 'whatsapp_business_account') {
      for (const entry of body.entry) {
        const changes = entry.changes || []
        
        for (const change of changes) {
          if (change.field === 'messages') {
            const messages = change.value.messages || []
            
            for (const message of messages) {
              await handleIncomingMessage(message)
            }
          }
        }
      }
    }

    return NextResponse.json({ success: true })

  } catch (error) {
    console.error('Error processing WhatsApp webhook:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

async function handleIncomingMessage(message: any) {
  try {
    const phoneNumber = message.from
    const messageText = message.text?.body || ''
    const messageType = message.type
    const timestamp = new Date(message.timestamp * 1000).toISOString()

    // Buscar contacto existente o crear nuevo
    let contact = await findContactByPhone(phoneNumber)
    
    if (!contact) {
      contact = await createContact({
        name: `WhatsApp ${phoneNumber}`,
        phone: phoneNumber,
        source: 'whatsapp',
        status: 'lead',
        email: '', // Requerido pero lo dejamos vacío por ahora
      }, DEFAULT_COMPANY_ID)
    }

    // Registrar mensaje en CRM
    await createActivity({
      contact_id: contact.id,
      type: 'whatsapp',
      direction: 'inbound',
      content: messageText,
      status: 'completed',
      priority: 'medium',
      whatsapp_message_id: message.id,
      meta_data: {
        message_type: messageType,
        phone_number: phoneNumber,
        timestamp: timestamp
      }
    }, contact.company_id)

    // Procesar mensaje con IA para detectar intención
    const intent = await detectMessageIntent(messageText)
    
    // Responder automáticamente según la intención
    if (intent === 'greeting') {
      await sendAutoResponse(phoneNumber, 'greeting')
    } else if (intent === 'pricing_inquiry') {
      await sendAutoResponse(phoneNumber, 'pricing')
    } else if (intent === 'support_request') {
      await sendAutoResponse(phoneNumber, 'support')
    }

    console.log(`Processed WhatsApp message from ${phoneNumber}`)

  } catch (error) {
    console.error('Error handling WhatsApp message:', error)
  }
}

async function detectMessageIntent(messageText: string): Promise<string> {
  const text = messageText.toLowerCase()
  
  // Palabras clave para detectar intenciones
  const greetingKeywords = ['hola', 'buenos', 'buenas', 'saludos', 'hi', 'hello']
  const pricingKeywords = ['precio', 'costo', 'cuanto', 'tarifa', 'plan', 'presupuesto']
  const supportKeywords = ['ayuda', 'problema', 'error', 'soporte', 'help', 'support']
  
  if (greetingKeywords.some(keyword => text.includes(keyword))) {
    return 'greeting'
  }
  
  if (pricingKeywords.some(keyword => text.includes(keyword))) {
    return 'pricing_inquiry'
  }
  
  if (supportKeywords.some(keyword => text.includes(keyword))) {
    return 'support_request'
  }
  
  return 'general'
}

async function sendAutoResponse(phoneNumber: string, responseType: string) {
  if (!WHATSAPP_TOKEN || !PHONE_NUMBER_ID) {
    console.error('WhatsApp credentials not configured')
    return
  }

  const responses: Record<string, any> = {
    greeting: {
      text: "¡Hola! 👋 Gracias por contactarnos. Soy el asistente virtual de FOMO. ¿En qué puedo ayudarte hoy?",
      buttons: [
        { id: "info", title: "Información" },
        { id: "pricing", title: "Precios" },
        { id: "demo", title: "Solicitar Demo" }
      ]
    },
    pricing: {
      text: "💰 Te envío información sobre nuestros planes:\n\n📊 Plan Básico: €99/mes\n🚀 Plan Pro: €199/mes\n🏢 Plan Enterprise: Personalizado\n\n¿Te gustaría agendar una demo personalizada?",
      buttons: [
        { id: "demo", title: "Agendar Demo" },
        { id: "contact", title: "Hablar con Asesor" }
      ]
    },
    support: {
      text: "🛠️ Estoy aquí para ayudarte. Un miembro de nuestro equipo de soporte se pondrá en contacto contigo pronto.\n\nMientras tanto, puedes visitar nuestra documentación o agendar una llamada.",
      buttons: [
        { id: "docs", title: "Documentación" },
        { id: "call", title: "Agendar Llamada" }
      ]
    }
  }

  const response = responses[responseType]
  if (response) {
    await sendWhatsAppMessage(phoneNumber, response)
  }
}

async function sendWhatsAppMessage(phoneNumber: string, messageData: any) {
  const url = `https://graph.facebook.com/v18.0/${PHONE_NUMBER_ID}/messages`
  
  const payload = {
    messaging_product: "whatsapp",
    to: phoneNumber,
    type: messageData.buttons ? "interactive" : "text",
    ...messageData.buttons ? {
      interactive: {
        type: "button",
        body: { text: messageData.text },
        action: {
          buttons: messageData.buttons.map((btn: any) => ({
            type: "reply",
            reply: { id: btn.id, title: btn.title }
          }))
        }
      }
    } : {
      text: { body: messageData.text }
    }
  }

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${WHATSAPP_TOKEN}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    })

    const result = await response.json()
    
    if (!response.ok) {
      console.error('WhatsApp API error:', result)
      return
    }

    console.log('WhatsApp message sent successfully')
    return result

  } catch (error) {
    console.error('Error sending WhatsApp message:', error)
  }
}