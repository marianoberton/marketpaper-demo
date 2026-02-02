import { Client } from '@hubspot/api-client'
import { createAdminClient } from '@/utils/supabase/server'
import { decryptSecret } from '@/lib/encryption'

export async function getHubSpotClient(companyId: string) {
  // Use admin client to bypass RLS since we need to read secrets for backend processing
  const supabase = createAdminClient()

  // 1. Fetch encrypted credentials
  const { data, error } = await supabase
    .from('company_integrations')
    .select('encrypted_credentials, credentials_iv, environment, provider')
    .eq('company_id', companyId)
    .eq('is_active', true)
    
  if (error || !data) {
    throw new Error(`HubSpot integration query failed: ${error?.message}`)
  }
  
  // Find Hubspot or Custom API that acts as Hubspot
  const integrationRequest = data.find((i: any) => i.provider === 'hubspot' || i.provider === 'custom')

  if (!integrationRequest) {
     throw new Error(`HubSpot integration not found. Available providers: ${data.map((d:any) => d.provider).join(', ')}`)
  }

  // 2. Decrypt token
  const decryptedData = decryptSecret(integrationRequest.encrypted_credentials, integrationRequest.credentials_iv)
  
  if (!decryptedData) {
    throw new Error('Failed to decrypt HubSpot credentials')
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

  // Debug (Safe log)
  if (accessToken) {
    console.log('DEBUG HUBSPOT TOKEN:', accessToken.substring(0, 5) + '...')
  } else {
    console.error('DEBUG HUBSPOT TOKEN: Empty token extracted')
  }

  // 3. Initialize HubSpot Client
  const hubspotClient = new Client({ accessToken })
  
  return hubspotClient
}
