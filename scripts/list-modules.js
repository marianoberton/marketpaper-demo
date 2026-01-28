
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY; // Better if available, otherwise anon might fail RLS if not admin

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing env vars');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceRoleKey || supabaseKey);

async function listModules() {
  const { data, error } = await supabase
    .from('modules')
    .select('*');

  if (error) {
    console.error('Error fetching modules:', error);
    return;
  }

  console.log('Current Modules:');
  data.forEach(m => console.log(`${m.id}: ${m.name} (${m.route_path})`));
}

listModules();
