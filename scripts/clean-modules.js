
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing env vars');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

const validPaths = [
  '/workspace',
  '/workspace/construccion',
  '/workspace/crm-fomo',
  '/workspace/crm',
  '/workspace/settings',
  '/workspace/Finanzas',
  '/workspace/Simulador'
];

async function cleanModules() {
  console.log('Starting module cleanup...');

  // 1. Update Construccion path if needed
  const { error: updateError } = await supabase
    .from('modules')
    .update({ route_path: '/workspace/construccion' })
    .eq('route_path', '/construccion');

  if (updateError) {
    console.error('Error updating construction module:', updateError);
  } else {
    console.log('Updated /construccion to /workspace/construccion');
  }

  // 2. Fetch all modules
  const { data: modules, error: fetchError } = await supabase
    .from('modules')
    .select('*');

  if (fetchError) {
    console.error('Error fetching modules:', fetchError);
    return;
  }

  // 3. Identify modules to delete
  // We include '/construccion' in validPaths logic implicitly because we just updated it, 
  // but if the update failed or didn't match, we should be careful.
  // Actually, let's just use the ID or name if we can, but path is safer if names change.
  // After update, the construction module should have the new path.

  const modulesToDelete = modules.filter(m => {
    // Check if path is in valid list
    // Note: The update above might not be reflected in 'modules' variable if we fetched before update? 
    // No, we fetched AFTER update.
    
    // However, if the update found nothing (because it was already correct or didn't exist), 
    // we need to be sure we don't delete the valid ones.
    
    return !validPaths.includes(m.route_path);
  });

  if (modulesToDelete.length === 0) {
    console.log('No modules to delete.');
    return;
  }

  console.log(`Found ${modulesToDelete.length} modules to delete:`);
  modulesToDelete.forEach(m => console.log(`- ${m.name} (${m.route_path})`));

  // 4. Delete them
  const idsToDelete = modulesToDelete.map(m => m.id);
  const { error: deleteError } = await supabase
    .from('modules')
    .delete()
    .in('id', idsToDelete);

  if (deleteError) {
    console.error('Error deleting modules:', deleteError);
  } else {
    console.log('Successfully deleted modules.');
  }
}

cleanModules();
