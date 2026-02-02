'use server'

import { getHubSpotClient } from "@/lib/hubspot"

// Server Action to test connection
export async function testHubSpotConnection(companyId: string) {
  try {
    const hubspot = await getHubSpotClient(companyId)
    
    // Simple call to verify token: Get Pipelines
    const pipelines = await hubspot.crm.pipelines.pipelinesApi.getAll('deals')
    
    return { 
      success: true, 
      count: pipelines.results.length,
      pipelines: pipelines.results.map(p => ({ label: p.label, id: p.id })) 
    }
  } catch (error: any) {
    console.error('HubSpot Connection Error:', error)
    return { success: false, error: error.message }
  }
}
