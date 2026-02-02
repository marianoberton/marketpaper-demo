
import { getHubSpotClient } from "@/lib/hubspot"

const COMPANY_ID = 'e674f997-04c0-425a-9ce5-d11f812046b8'
const PIPELINE_ID = '804074768'

// Manually ensure env vars are present for the script runtime
process.env.ENCRYPTION_KEY = '937d1847ed267a7272ddc29185cfc938f9a1304e727a34f468950d71f37f2fb5'
process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://adouqsqyjasjucdgwqxv.supabase.co'
process.env.SUPABASE_SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFkb3Vxc3F5amFzanVjZGd3cXh2Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MDI4NTgzMiwiZXhwIjoyMDY1ODYxODMyfQ.AGZMwuvsnEsSM8JN9EcvDXZelaQQ3s5Q5DVrHFEGGCU'

async function inspect() {
    try {
        console.log('Connecting...')
        const hubspot = await getHubSpotClient(COMPANY_ID)
        
        console.log(`Fetching pipeline ${PIPELINE_ID}...`)
        const result = await hubspot.crm.pipelines.pipelinesApi.getById('deals', PIPELINE_ID)
        
        console.log('STAGES:')
        result.stages.forEach(stage => {
            console.log(`- [${stage.id}] ${stage.label} (Prob: ${stage.metadata?.probability})`)
        })

    } catch (e: any) {
        console.error('Error:', e.message)
    }
}

inspect()
