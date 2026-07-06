import { footballPlugin } from './football.plugin.js';
import { createClient } from '@supabase/supabase-js';

const plugins = new Map();

export async function loadPluginRegistry() {
  console.log('[Plugins] Loading plugin registry...');
  
  // Register built-in plugins
  plugins.set(footballPlugin.id, footballPlugin);
  
  // In a full implementation, we could fetch dynamic plugins from Supabase
  // const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);
  // const { data } = await supabase.from('condition_plugins').select('*').eq('active', true);
  // data.forEach(p => registerPlugin(p));
}

export function getPlugin(id) {
  return plugins.get(id);
}
