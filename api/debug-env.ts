import type { VercelRequest, VercelResponse } from '@vercel/node';

export default function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Verificar se as variáveis de ambiente estão configuradas
  const envVars = {
    HOTMART_WEBHOOK_SECRET: process.env.HOTMART_WEBHOOK_SECRET ? 'CONFIGURADA' : 'NÃO CONFIGURADA',
    VITE_HOTMART_WEBHOOK_SECRET: process.env.VITE_HOTMART_WEBHOOK_SECRET ? 'CONFIGURADA' : 'NÃO CONFIGURADA',
    SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY ? 'CONFIGURADA' : 'NÃO CONFIGURADA',
    VITE_SUPABASE_URL: process.env.VITE_SUPABASE_URL ? 'CONFIGURADA' : 'NÃO CONFIGURADA',
    VITE_SUPABASE_ANON_KEY: process.env.VITE_SUPABASE_ANON_KEY ? 'CONFIGURADA' : 'NÃO CONFIGURADA'
  };

  // Mostrar apenas os primeiros e últimos caracteres do secret para segurança
  const hotmartSecret = process.env.HOTMART_WEBHOOK_SECRET;
  const secretPreview = hotmartSecret ? 
    `${hotmartSecret.substring(0, 8)}...${hotmartSecret.substring(hotmartSecret.length - 8)}` : 
    'NÃO ENCONTRADO';

  return res.status(200).json({
    message: 'Debug das variáveis de ambiente',
    timestamp: new Date().toISOString(),
    environment_variables: envVars,
    hotmart_secret_preview: secretPreview
  });
}