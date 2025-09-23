import { VercelRequest, VercelResponse } from '@vercel/node'
import { createClient } from '@supabase/supabase-js'

// Configuração do Supabase com service role para operações administrativas
const supabaseUrl = process.env.VITE_SUPABASE_URL!
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

// Configurações da Hotmart
const HOTMART_CONFIG = {
  token: process.env.HOTMART_TOKEN || '',
  validStatuses: ['APPROVED', 'COMPLETE', 'PAID'],
  eventMapping: {
    'approved': 'PURCHASE_APPROVED',
    'complete': 'PURCHASE_COMPLETE',
    'canceled': 'PURCHASE_CANCELED',
    'cancelled': 'PURCHASE_CANCELED',
    'refunded': 'PURCHASE_REFUNDED',
    'chargeback': 'PURCHASE_CHARGEBACK'
  }
}

// Interface para dados do webhook
interface HotmartWebhookPayload {
  hottok: string
  id: string
  event: string
  data: {
    purchase: {
      order_id: string
      order_date: number
      status: string
      buyer: {
        name: string
        email: string
      }
      offer: {
        code: string
        name: string
      }
      price: {
        value: number
        currency_code: string
      }
      tracking?: {
        coupon?: string
        source?: string
      }
    }
  }
}

// Validar estrutura do webhook
function validarEstrutura(data: any): data is HotmartWebhookPayload {
  try {
    return (
      data &&
      data.hottok &&
      data.data &&
      data.data.purchase &&
      data.data.purchase.buyer &&
      data.data.purchase.buyer.email &&
      data.data.purchase.buyer.name &&
      data.data.purchase.status &&
      data.data.purchase.order_id
    )
  } catch {
    return false
  }
}

// Gerar senha temporária
function gerarSenhaTemporaria(): string {
  return Math.random().toString(36).slice(-12) + Math.random().toString(36).slice(-12)
}

// Criar ou buscar usuário real
async function criarOuBuscarUsuario(buyer: { name: string; email: string }) {
  try {
    const email = buyer.email.toLowerCase().trim()
    const nome = buyer.name.trim()

    // Verificar se usuário já existe na tabela users
    const { data: existingProfile } = await supabase
      .from('users')
      .select('id')
      .eq('email', email)
      .single()

    if (existingProfile) {
      return {
        success: true,
        user_id: existingProfile.id,
        created: false
      }
    }

    // Gerar senha temporária
    const senhaTemporaria = gerarSenhaTemporaria()

    // Criar usuário no Supabase Auth
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email: email,
      password: senhaTemporaria,
      email_confirm: true,
      user_metadata: {
        nome: nome,
        created_by: 'hotmart_webhook'
      }
    })

    if (authError) {
      return {
        success: false,
        message: 'Erro ao criar usuário no Auth',
        error: authError.message
      }
    }

    // Criar perfil do usuário na tabela users
    const { error: profileError } = await supabase
      .from('users')
      .insert({
        id: authData.user.id,
        email: email,
        nome: nome,
        is_admin: false,
        onboarding_completed: false,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })

    if (profileError) {
      return {
        success: false,
        message: 'Erro ao criar perfil do usuário',
        error: profileError.message
      }
    }

    return {
      success: true,
      user_id: authData.user.id,
      created: true,
      senha_temporaria: senhaTemporaria
    }
  } catch (error) {
    return {
      success: false,
      message: 'Erro interno ao processar usuário',
      error: error instanceof Error ? error.message : 'Erro desconhecido'
    }
  }
}

// Registrar uso de cupom
async function registrarUsoCupom(
  cupomCodigo: string,
  userId: string,
  valorCompra: number,
  orderId: string
) {
  try {
    // Buscar cupom válido
    const { data: cupom, error: cupomError } = await supabase
      .from('cupons')
      .select('id')
      .eq('codigo', cupomCodigo)
      .eq('ativo', true)
      .single()

    if (cupomError || !cupom) {
      return null
    }

    // Registrar uso do cupom
    const { data: usoCupom, error: usoError } = await supabase
      .from('usos_cupons')
      .insert({
        cupom_id: cupom.id,
        user_id: userId,
        valor_compra: valorCompra,
        valor_comissao: valorCompra * 0.1, // 10% padrão
        origem: 'hotmart',
        hotmart_transaction_id: orderId,
        created_at: new Date().toISOString()
      })
      .select()
      .single()

    if (usoError) {
      return null
    }

    return usoCupom.id
  } catch (error) {
    return null
  }
}

// Processar webhook
async function processarWebhook(webhookData: HotmartWebhookPayload) {
  try {
    const { data: { purchase } } = webhookData

    // Verificar se o status libera acesso
    if (!HOTMART_CONFIG.validStatuses.includes(purchase.status)) {
      return {
        success: false,
        message: `Status ${purchase.status} não libera acesso`
      }
    }

    // Criar ou buscar usuário
    const userResult = await criarOuBuscarUsuario(purchase.buyer)
    if (!userResult.success) {
      return {
        success: false,
        message: userResult.message,
        error: userResult.error
      }
    }

    // Registrar uso de cupom se existir
    let usoCupomId = null
    const cupomCodigo = purchase.tracking?.coupon || purchase.tracking?.source
    if (cupomCodigo && userResult.user_id) {
      usoCupomId = await registrarUsoCupom(
        cupomCodigo,
        userResult.user_id,
        purchase.price.value,
        purchase.order_id
      )
    }

    return {
      success: true,
      message: 'Compra processada com sucesso',
      data: {
        user_created: userResult.created,
        user_id: userResult.user_id,
        cupom_usado: cupomCodigo || null,
        uso_cupom_id: usoCupomId,
        senha_temporaria: userResult.senha_temporaria
      }
    }

  } catch (error) {
    return {
      success: false,
      message: 'Erro interno no processamento',
      error: error instanceof Error ? error.message : 'Erro desconhecido'
    }
  }
}

// Função principal do webhook
export default async function handler(req: VercelRequest, res: VercelResponse) {
  const startTime = Date.now()

  // Configurar CORS
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')

  // Responder OPTIONS para CORS
  if (req.method === 'OPTIONS') {
    console.log('🔄 Requisição OPTIONS recebida para CORS')
    return res.status(200).end()
  }

  // Apenas aceitar POST
  if (req.method !== 'POST') {
    console.log(`❌ Método ${req.method} não permitido`)
    return res.status(405).json({ error: 'Método não permitido' })
  }

  console.log('📨 Webhook recebido da Hotmart')
  console.log('📋 Headers:', JSON.stringify(req.headers, null, 2))
  console.log('📄 Payload preview:', JSON.stringify(req.body, null, 2).substring(0, 500) + '...')

  try {
    // NOVA VALIDAÇÃO: Verificar campo hottok no payload
    const hottok = req.body?.hottok
    if (!hottok) {
      console.log('❌ Campo hottok ausente no payload')
      return res.status(401).json({ error: 'Token inválido' })
    }

    // Validar hottok contra variável de ambiente
    if (!HOTMART_CONFIG.token) {
      console.warn('⚠️ HOTMART_TOKEN não configurado - validação ignorada para desenvolvimento')
    } else if (hottok !== HOTMART_CONFIG.token) {
      console.log('❌ Token hottok inválido:', { received: hottok, expected: HOTMART_CONFIG.token })
      return res.status(401).json({ error: 'Token inválido' })
    }

    console.log('✅ Token hottok validado com sucesso')

    // Validar estrutura dos dados
    if (!validarEstrutura(req.body)) {
      console.log('❌ Estrutura de dados inválida:', JSON.stringify(req.body, null, 2))
      return res.status(400).json({ error: 'Estrutura de dados inválida' })
    }

    // Normalizar evento usando mapeamento
    const eventoOriginal = req.body.event
    const eventoNormalizado = HOTMART_CONFIG.eventMapping[eventoOriginal] || eventoOriginal

    console.log(`🔄 Processando evento: ${eventoOriginal} → ${eventoNormalizado}`)
    console.log(`👤 Comprador: ${req.body.data?.purchase?.buyer?.email || 'N/A'}`)
    console.log(`💳 Order ID: ${req.body.data?.purchase?.order_id || 'N/A'}`)

    // Processar webhook baseado no evento normalizado
    let resultado

    switch (eventoNormalizado) {
      case 'PURCHASE_APPROVED':
      case 'PURCHASE_COMPLETE':
        console.log('✅ Processando compra aprovada')
        resultado = await processarWebhook(req.body)
        break

      case 'PURCHASE_CANCELED':
      case 'PURCHASE_REFUNDED':
      case 'PURCHASE_CHARGEBACK':
        console.log(`ℹ️ Evento ${eventoNormalizado} recebido - retornando sucesso sem processamento`)
        resultado = {
          success: true,
          message: `Evento ${eventoNormalizado} recebido e processado`
        }
        break

      default:
        console.log(`ℹ️ Evento ${eventoNormalizado} não reconhecido - retornando sucesso`)
        resultado = {
          success: true,
          message: `Evento ${eventoNormalizado} recebido (não processado)`
        }
    }

    const processTime = Date.now() - startTime
    console.log(`⏱️ Processamento concluído em ${processTime}ms`)
    console.log('📤 Resultado:', JSON.stringify(resultado, null, 2))

    // SEMPRE retornar 200 para a Hotmart (mesmo em caso de erro de processamento)
    return res.status(200).json({
      ...resultado,
      webhook_id: req.body.id || 'unknown',
      processed_at: new Date().toISOString(),
      processing_time_ms: processTime
    })

  } catch (error) {
    const processTime = Date.now() - startTime
    console.error('❌ Erro fatal no webhook:', error)
    console.error('Stack trace:', error instanceof Error ? error.stack : 'N/A')

    // SEMPRE retornar 200 para evitar reenvios desnecessários da Hotmart
    return res.status(200).json({
      success: false,
      error: 'Erro interno do servidor',
      error_details: error instanceof Error ? error.message : 'Erro desconhecido',
      processed_at: new Date().toISOString(),
      processing_time_ms: processTime
    })
  }
}