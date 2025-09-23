// Webhook Hotmart Simplificado - Validação apenas por Token
// VERSÃO SIMPLIFICADA - SEM HMAC - APENAS HOTTOK
import { createClient } from '@supabase/supabase-js'

// Interfaces para dev-server
interface NextApiRequest {
  method?: string
  body: any
  headers: { [key: string]: string | string[] | undefined }
  url?: string
}

interface NextApiResponse {
  status: (code: number) => NextApiResponse
  json: (data: any) => void
}

// Configuração do Supabase
const supabaseUrl = process.env.VITE_SUPABASE_URL!
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

// Interface simplificada para webhook
interface HotmartWebhook {
  hottok?: string
  event?: string
  data?: {
    purchase?: {
      order_id?: string
      buyer?: {
        name?: string
        email?: string
      }
      price?: {
        value?: number
      }
      status?: string
    }
  }
  [key: string]: any
}

// Função principal do webhook - VERSÃO SIMPLIFICADA
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const startTime = Date.now()

  console.log('🚀 WEBHOOK SIMPLIFICADO INICIADO - VERSÃO TOKEN-ONLY')
  console.log('⏰ Timestamp:', new Date().toISOString())

  // Responder OPTIONS
  if (req.method === 'OPTIONS') {
    console.log('🔄 OPTIONS request received')
    return res.status(200).json({ message: 'CORS OK' })
  }

  // Aceitar apenas POST
  if (req.method !== 'POST') {
    console.log(`❌ Método ${req.method} não permitido`)
    return res.status(405).json({ error: 'Método não permitido' })
  }

  console.log('📨 Webhook Hotmart recebido')
  console.log('📋 Headers:', JSON.stringify(req.headers, null, 2))
  console.log('📄 Body completo:', JSON.stringify(req.body, null, 2))

  try {
    const payload: HotmartWebhook = req.body || {}

    // ==========================================
    // VALIDAÇÃO PRINCIPAL: APENAS HOTTOK
    // ==========================================

    console.log('🔍 Verificando token...')
    console.log('🔑 Token recebido:', payload.hottok || 'AUSENTE')
    console.log('🔑 Token esperado:', process.env.HOTMART_TOKEN || 'NÃO CONFIGURADO')

    // 1. Verificar se hottok existe
    if (!payload.hottok) {
      console.log('❌ Campo hottok ausente')
      return res.status(401).json({ error: 'Token inválido' })
    }

    // 2. Verificar se variável de ambiente está configurada
    if (!process.env.HOTMART_TOKEN) {
      console.log('⚠️ HOTMART_TOKEN não configurado - ACEITAR QUALQUER TOKEN')
      // Em desenvolvimento, aceitar qualquer token
    } else {
      // 3. Comparar tokens
      if (payload.hottok !== process.env.HOTMART_TOKEN) {
        console.log('❌ Token inválido!')
        console.log('   Recebido:', payload.hottok)
        console.log('   Esperado:', process.env.HOTMART_TOKEN)
        return res.status(401).json({ error: 'Token inválido' })
      }
    }

    console.log('✅ Token validado com sucesso!')

    // ==========================================
    // PROCESSAMENTO DO EVENTO
    // ==========================================

    const evento = payload.event || 'unknown'
    console.log(`🔄 Evento recebido: ${evento}`)

    let resultado = { success: true, message: 'Evento processado' }

    // Processar apenas eventos de compra aprovada
    if (evento === 'approved' || evento === 'PURCHASE_APPROVED' || evento === 'complete') {
      console.log('✅ Processando compra aprovada...')

      const buyer = payload.data?.purchase?.buyer
      console.log('👤 Dados do comprador:', JSON.stringify(buyer, null, 2))

      resultado = {
        success: true,
        message: 'Compra processada (simulação - sem criar usuário)',
        data: {
          event: evento,
          buyer_email: buyer?.email || 'N/A',
          buyer_name: buyer?.name || 'N/A'
        }
      }
    } else {
      console.log(`ℹ️ Evento ${evento} recebido (não processado)`)
      resultado = {
        success: true,
        message: `Evento ${evento} recebido`
      }
    }

    const processTime = Date.now() - startTime
    console.log(`⏱️ Processamento concluído em ${processTime}ms`)
    console.log('📤 Resposta final:', JSON.stringify(resultado, null, 2))

    // SEMPRE retornar 200 para Hotmart
    return res.status(200).json({
      ...resultado,
      timestamp: new Date().toISOString(),
      processing_time_ms: processTime,
      version: 'simplified-token-only'
    })

  } catch (error) {
    const processTime = Date.now() - startTime
    console.error('❌ Erro fatal:', error)

    // SEMPRE retornar 200 mesmo com erro
    return res.status(200).json({
      success: false,
      error: 'Erro interno',
      message: error instanceof Error ? error.message : 'Erro desconhecido',
      timestamp: new Date().toISOString(),
      processing_time_ms: processTime,
      version: 'simplified-token-only'
    })
  }
}