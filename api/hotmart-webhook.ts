import { VercelRequest, VercelResponse } from '@vercel/node'
import { createClient } from '@supabase/supabase-js'
import crypto from 'crypto'

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
  webhookSecret: process.env.VITE_HOTMART_WEBHOOK_SECRET || '',
  validStatuses: ['APPROVED', 'COMPLETE', 'PAID']
}

// Interface para dados do webhook
interface HotmartWebhookData {
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

// Validar assinatura HMAC
function validarAssinatura(body: string, signature: string): boolean {
  try {
    const expectedSignature = crypto
      .createHmac('sha256', HOTMART_CONFIG.webhookSecret)
      .update(body)
      .digest('hex')
    
    const receivedSignature = signature.replace('sha256=', '')
    
    return crypto.timingSafeEqual(
      Buffer.from(expectedSignature, 'hex'),
      Buffer.from(receivedSignature, 'hex')
    )
  } catch (error) {
    return false
  }
}

// Validar estrutura do webhook
function validarEstrutura(data: any): data is HotmartWebhookData {
  try {
    return (
      data &&
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
async function processarWebhook(webhookData: HotmartWebhookData) {
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
  // Configurar CORS
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, X-Hotmart-Signature')

  // Responder OPTIONS para CORS
  if (req.method === 'OPTIONS') {
    return res.status(200).end()
  }

  // Apenas aceitar POST
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Método não permitido' })
  }

  try {
    // Validar headers
    const signature = req.headers['x-hotmart-signature'] as string
    if (!signature) {
      return res.status(401).json({ error: 'Assinatura HMAC necessária' })
    }

    // Obter body como string para validação HMAC
    const body = JSON.stringify(req.body)
    
    // Validar assinatura HMAC
    const assinaturaValida = validarAssinatura(body, signature)
    if (!assinaturaValida) {
      return res.status(401).json({ error: 'Assinatura HMAC inválida' })
    }

    // Validar estrutura dos dados
    if (!validarEstrutura(req.body)) {
      return res.status(400).json({ error: 'Estrutura de dados inválida' })
    }

    // Processar webhook baseado no evento
    let resultado
    const evento = req.body.event

    switch (evento) {
      case 'PURCHASE_APPROVED':
      case 'PURCHASE_COMPLETE':
        resultado = await processarWebhook(req.body)
        break
      
      case 'PURCHASE_CANCELED':
      case 'PURCHASE_REFUNDED':
      case 'PURCHASE_CHARGEBACK':
        return res.status(200).json({ 
          message: `Evento ${evento} recebido mas não processado` 
        })
      
      default:
        return res.status(200).json({ 
          message: 'Evento não reconhecido'
        })
    }

    // Responder com resultado
    return res.status(resultado.success ? 200 : 400).json(resultado)

  } catch (error) {
    console.error('❌ Erro fatal no webhook:', error)
    return res.status(500).json({
      success: false,
      error: 'Erro interno do servidor'
    })
  }
}