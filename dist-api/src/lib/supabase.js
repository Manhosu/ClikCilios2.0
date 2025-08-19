import { createClient } from '@supabase/supabase-js';
const isApiContext = typeof import.meta === 'undefined' || !import.meta.env;
const supabaseUrl = isApiContext
    ? process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.VITE_SUPABASE_URL
    : import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = isApiContext
    ? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY
    : import.meta.env.VITE_SUPABASE_ANON_KEY;
if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error('Credenciais do Supabase não configuradas. Verifique VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY no arquivo .env');
}
console.info('✅ Supabase configurado corretamente!');
console.info('URL:', supabaseUrl);
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: true
    }
});
export const isDevMode = false;
