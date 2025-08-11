import { VercelRequest, VercelResponse } from '@vercel/node'
import { createClient } from '@supabase/supabase-js'
import crypto from 'crypto'

// Configuração do Supabase
const supabaseUrl = process.env.VITE_SUPABASE_URL!
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY!
const supabase = createClient(supabaseUrl, supabaseKey)

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
    // Validação HMAC - logs removidos para produção
    
    const expectedSignature = crypto
      .createHmac('sha256', HOTMART_CONFIG.webhookSecret)
      .update(body)
      .digest('hex')
    
    const receivedSignature = signature.replace('sha256=', '')
    
    // Comparação de assinaturas - logs removidos para produção
    
    return crypto.timingSafeEqual(
      Buffer.from(expectedSignature, 'hex'),
      Buffer.from(receivedSignature, 'hex')
    )
  } catch (error) {
    // Erro na validação HMAC - log removido para produção
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

// Criar ou buscar usuário
async function criarOuBuscarUsuario(buyer: { name: string; email: string }) {
  try {
    // Verificar se usuário já existe na tabela users
    const { data: existingProfile } = await supabase
      .from('users')
      .select('id')
      .eq('email', buyer.email)
      .single()
    
    if (existingProfile) {
      return {
        success: true,
        user_id: existingProfile.id,
        created: false
      }
    }

    // Gerar um ID único para o usuário
    const userId = `hotmart_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`

    // Criar perfil do usuário diretamente na tabela
    const { error: profileError } = await supabase
      .from('users')
      .insert({
        id: userId,
        email: buyer.email,
        nome: buyer.name,
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
      user_id: userId,
      created: true
    }
  } catch (error) {
    return {
      success: false,
      message: 'Erro interno ao processar usuário',
      error: error instanceof Error ? error.message : 'Erro desconhecido'
    }
  }
}

// Processar webhook
async function processarWebhook(webhookData: HotmartWebhookData) {
  try {
    const { data: { purchase } } = webhookData

    // Processando webhook Hotmart - log removido para produção

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

    return {
      success: true,
      message: 'Compra processada com sucesso',
      data: {
        user_created: userResult.created,
        user_id: userResult.user_id,
        cupom_usado: purchase.tracking?.coupon || null
      }
    }

  } catch (error) {
    // Erro ao processar webhook - log removido para produção
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
    // Webhook Hotmart recebido - log removido para produção
    
    // Validar headers
    const signature = req.headers['x-hotmart-signature'] as string
    if (!signature) {
      // Assinatura HMAC não encontrada - log removido para produção
      return res.status(401).json({ error: 'Assinatura HMAC necessária' })
    }

    // Obter body como string para validação HMAC
    const body = JSON.stringify(req.body)
    
    // Validar assinatura HMAC
    const assinaturaValida = validarAssinatura(body, signature)
    if (!assinaturaValida) {
      // Assinatura HMAC inválida - log removido para produção
      return res.status(401).json({ error: 'Assinatura HMAC inválida' })
    }

    // Validar estrutura dos dados
    if (!validarEstrutura(req.body)) {
      // Estrutura de dados inválida - log removido para produção
      return res.status(400).json({ error: 'Estrutura de dados inválida' })
    }

    // Webhook validado, processando - log removido para produção

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
        // Evento recebido mas não processado - log removido para produção
        return res.status(200).json({ 
          message: `Evento ${evento} recebido mas não processado` 
        })
      
      default:
        // Evento ignorado - log removido para produção
        return res.status(200).json({ 
          message: `Evento ${evento} recebido mas não processado` 
        })
    }

    if (resultado.success) {
      // Webhook processado com sucesso - log removido para produção
      return res.status(200).json({
        success: true,
        message: resultado.message,
        data: resultado.data
      })
    } else {
      // Erro no processamento - log removido para produção
      return res.status(400).json({
        success: false,
        message: resultado.message,
        error: resultado.error
      })
    }

  } catch (error) {
    // Erro interno no webhook - log removido para produção
    return res.status(500).json({
      success: false,
      message: 'Erro interno do servidor',
      error: error instanceof Error ? error.message : 'Erro desconhecido'
    })
  }
}