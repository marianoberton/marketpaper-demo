import { Client } from '@hubspot/api-client'
import { createAdminClient } from '@/utils/supabase/server'
import { decryptSecret } from '@/lib/encryption'

export async function getHubSpotClient(companyId: string) {
  try {
    // Use admin client to bypass RLS since we need to read secrets for backend processing
    const supabase = createAdminClient()

    // 1. Fetch encrypted credentials
    const { data, error } = await supabase
      .from('company_integrations')
      .select('encrypted_credentials, credentials_iv, environment, provider')
      .eq('company_id', companyId)
      .eq('is_active', true)

    if (error) {
      console.error('[getHubSpotClient] Database query error:', error)
      throw new Error(`Error al consultar integraciones: ${error.message}`)
    }

    if (!data || data.length === 0) {
      throw new Error('No se encontraron integraciones activas para esta empresa. Por favor, configure HubSpot en Configuración.')
    }

    // Find Hubspot or Custom API that acts as Hubspot
    const integrationRequest = data.find((i: any) => i.provider === 'hubspot' || i.provider === 'custom')

    if (!integrationRequest) {
      const availableProviders = data.map((d:any) => d.provider).join(', ')
      throw new Error(`No se encontró integración de HubSpot. Proveedores disponibles: ${availableProviders || 'ninguno'}`)
    }

    // 2. Decrypt token
    if (!integrationRequest.encrypted_credentials || !integrationRequest.credentials_iv) {
      throw new Error('Las credenciales de HubSpot están incompletas. Por favor, reconfigure la integración.')
    }

    const decryptedData = decryptSecret(integrationRequest.encrypted_credentials, integrationRequest.credentials_iv)

    if (!decryptedData) {
      throw new Error('Error al descifrar las credenciales de HubSpot. Por favor, reconfigure la integración.')
    }

    // Expecting the stored secret to be the access token string directly
    // or a JSON with { accessToken: ... } depending on how we saved it.
    // For simplicity based on previous steps, let's assume it's the raw token string
    // or handle JSON parsing if needed.
    // Given the "Custom API" context in user request, it's likely a Private App Token.

    let accessToken = decryptedData
    try {
      const parsed = JSON.parse(decryptedData)
      if (parsed.accessToken) accessToken = parsed.accessToken
      else if (parsed.token) accessToken = parsed.token
      else if (parsed.api_key) accessToken = parsed.api_key // Added support for UI format
    } catch (e) {
      // Not JSON, use as is (raw token)
    }

    if (!accessToken || accessToken.trim() === '') {
      throw new Error('El token de HubSpot está vacío. Por favor, reconfigure la integración con un token válido.')
    }

    // Debug (Safe log)
    console.log('[getHubSpotClient] Token loaded successfully:', accessToken.substring(0, 5) + '...')

    // 3. Initialize HubSpot Client
    const hubspotClient = new Client({ accessToken })

    return hubspotClient
  } catch (error) {
    // Re-throw with context
    if (error instanceof Error) {
      console.error('[getHubSpotClient] Error:', error.message)
      throw error
    }
    throw new Error('Error desconocido al inicializar cliente de HubSpot')
  }
}
