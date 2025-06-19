import { createClient } from '@supabase/supabase-js';
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY);
(async () => {
  const { data, error } = await supabase.from('companies').select('id').limit(1);
  console.log({ data, error });
})();