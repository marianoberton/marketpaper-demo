import { NextRequest, NextResponse } from 'next/server'
import { createLead, sendSlackNotification } from '@/lib/crm'
import crypto from 'crypto'

const VERIFY_TOKEN = process.env.META_VERIFY_TOKEN
const APP_SECRET = process.env.META_APP_SECRET
const ACCESS_TOKEN = process.env.META_ACCESS_TOKEN

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const mode = searchParams.get('hub.mode')
  const token = searchParams.get('hub.verify_token')
  const challenge = searchParams.get('hub.challenge')

  if (mode === 'subscribe' && token === VERIFY_TOKEN) {
    console.log('Meta webhook verified successfully')
    return new Response(challenge, { status: 200 })
  } else {
    console.log('Meta webhook verification failed')
    return new Response('Forbidden', { status: 403 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.text()
    const signature = request.headers.get('x-hub-signature-256')

    // Verificar firma del webhook
    if (APP_SECRET && signature) {
      const expectedSignature = crypto
        .createHmac('sha256', APP_SECRET)
        .update(body)
        .digest('hex')

      if (signature !== `sha256=${expectedSignature}`) {
        console.log('Invalid Meta webhook signature')
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
      }
    }

    const data = JSON.parse(body)

    if (data.object === 'page') {
      for (const entry of data.entry) {
        const changes = entry.changes || []
        
        for (const change of changes) {
          if (change.field === 'leadgen') {
            const leadgenId = change.value.leadgen_id
            const formId = change.value.form_id
            const pageId = change.value.page_id
            
            // Obtener datos del lead desde Meta API
            const leadData = await fetchLeadFromMeta(leadgenId)
            
            if (leadData) {
              // Procesar y guardar en CRM
              await processMetaLead(leadData, formId, pageId)
            }
          }
        }
      }
    }

    return NextResponse.json({ success: true })

  } catch (error) {
    console.error('Error processing Meta webhook:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

async function fetchLeadFromMeta(leadgenId: string) {
  if (!ACCESS_TOKEN) {
    console.error('META_ACCESS_TOKEN not configured')
    return null
  }

  const url = `https://graph.facebook.com/v18.0/${leadgenId}?access_token=${ACCESS_TOKEN}`
  
  try {
    const response = await fetch(url)
    const data = await response.json()
    
    if (data.error) {
      console.error('Meta API error:', data.error)
      return null
    }
    
    return {
      id: data.id,
      created_time: data.created_time,
      field_data: data.field_data || []
    }
  } catch (error) {
    console.error('Error fetching lead from Meta:', error)
    return null
  }
}

async function processMetaLead(leadData: any, formId: string, pageId: string) {
  try {
    // Mapear campos de Meta a estructura CRM
    const fieldMap: Record<string, string> = {
      'full_name': 'name',
      'first_name': 'name',
      'last_name': 'lastName',
      'email': 'email',
      'phone_number': 'phone',
      'company_name': 'company',
      'job_title': 'position'
    }

    const crmLead: any = {
      source: pageId.includes('instagram') ? 'instagram-ads' : 'facebook-ads',
      meta_lead_id: leadData.id,
      form_id: formId,
      page_id: pageId,
      status: 'new',
      temperature: 'warm', // Los leads de anuncios suelen ser warm
      priority: 'medium',
      score: 0
    }

    // Mapear campos específicos
    leadData.field_data.forEach((field: any) => {
      const crmField = fieldMap[field.name]
      if (crmField && field.values && field.values.length > 0) {
        if (crmField === 'name' && crmLead.name) {
          // Si ya tenemos nombre, concatenar apellido
          crmLead.name += ` ${field.values[0]}`
        } else {
          crmLead[crmField] = field.values[0]
        }
      }
    })

    // Validar que tenemos los campos mínimos
    if (!crmLead.name || !crmLead.email) {
      console.error('Meta lead missing required fields:', crmLead)
      return
    }

    // Guardar en Supabase
    const lead = await createLead(crmLead)

    // Notificar según la calidad del lead
    const platform = crmLead.source === 'instagram-ads' ? 'Instagram' : 'Facebook'
    if (lead.score >= 70) {
      await sendSlackNotification(`🔥 Nuevo lead de alta calidad desde ${platform}: ${lead.name} - ${lead.company || lead.email}`)
    } else {
      await sendSlackNotification(`📱 Nuevo lead desde ${platform}: ${lead.name} - ${lead.company || lead.email}`)
    }

    console.log(`Successfully processed ${platform} lead:`, lead.id)

  } catch (error) {
    console.error('Error processing Meta lead:', error)
  }
}