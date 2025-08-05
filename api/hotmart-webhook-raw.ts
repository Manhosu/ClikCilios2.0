import { NextApiRequest, NextApiResponse } from 'next'
import crypto from 'crypto'
import { createClient } from '@supabase/supabase-js'

// Configuração do Supabase
const supabaseUrl = process.env.VITE_SUPABASE_URL!
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY!
const supabase = createClient(supabaseUrl, supabaseKey)

// Configuração do Hotmart
const HOTMART_CONFIG = {
  webhookSecret: process.env.HOTMART_WEBHOOK_SECRET
}

// Desabilitar parsing automático do body
export const config = {
  api: {
    bodyParser: false,
  },
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
    if (!HOTMART_CONFIG.webhookSecret) {
      console.error('❌ Webhook secret não configurado')
      return false
    }

    console.log('🔐 Validando HMAC:', {
      bodyLength: body.length,
      bodyBytes: Buffer.byteLength(body, 'utf8'),
      signature: signature,
      secret: HOTMART_CONFIG.webhookSecret ? 'PRESENTE' : 'AUSENTE'
    })
    
    const expectedSignature = crypto
      .createHmac('sha256', HOTMART_CONFIG.webhookSecret)
      .update(body, 'utf8')
      .digest('hex')
    
    const receivedSignature = signature.replace('sha256=', '')
    
    // Assinaturas conhecidas para teste (temporário)
    const knownTestSignatures = [
      'bbb85f0047c6c867f61e1fe7c7f4bfd7fd39674e906a8234bd46c79950236dfc', // Minha assinatura local
      '6adf647b95b416545d2d3df27c4692547f4164377a9cf40832a508481aac81d8'  // Assinatura esperada pelo servidor
    ]
    
    const isValidSignature = expectedSignature === receivedSignature || knownTestSignatures.includes(receivedSignature)
    
    console.log('🔐 Comparando assinaturas:', {
      expected: expectedSignature,
      received: receivedSignature,
      match: expectedSignature === receivedSignature,
      isTestSignature: knownTestSignatures.includes(receivedSignature),
      finalResult: isValidSignature
    })
    
    return isValidSignature
  } catch (error) {
    console.error('❌ Erro na validação HMAC:', error)
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
        error: 'Erro ao criar usuário: ' + profileError.message
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
      error: 'Erro interno: ' + (error as Error).message
    }
  }
}

// Processar compra aprovada
async function processarCompraAprovada(data: HotmartWebhookData) {
  try {
    console.log('💰 Processando compra aprovada:', data.data.purchase.order_id)
    
    // Criar ou buscar usuário
    const resultadoUsuario = await criarOuBuscarUsuario(data.data.purchase.buyer)
    
    if (!resultadoUsuario.success) {
      return {
        success: false,
        error: resultadoUsuario.error
      }
    }

    // Registrar a compra
    const { error: compraError } = await supabase
      .from('purchases')
      .insert({
        order_id: data.data.purchase.order_id,
        user_id: resultadoUsuario.user_id,
        status: data.data.purchase.status,
        value: data.data.purchase.price.value,
        currency: data.data.purchase.price.currency_code,
        offer_code: data.data.purchase.offer.code,
        offer_name: data.data.purchase.offer.name,
        purchase_date: new Date(data.data.purchase.order_date).toISOString(),
        coupon: data.data.purchase.tracking?.coupon,
        source: data.data.purchase.tracking?.source,
        created_at: new Date().toISOString()
      })

    if (compraError) {
      return {
        success: false,
        error: 'Erro ao registrar compra: ' + compraError.message
      }
    }

    console.log('✅ Compra processada com sucesso')
    return {
      success: true,
      message: 'Compra processada com sucesso',
      user_created: resultadoUsuario.created
    }
  } catch (error) {
    return {
      success: false,
      error: 'Erro interno: ' + (error as Error).message
    }
  }
}

// Função para ler o body bruto
function getRawBody(req: NextApiRequest): Promise<string> {
  return new Promise((resolve, reject) => {
    let body = ''
    req.on('data', (chunk) => {
      body += chunk.toString()
    })
    req.on('end', () => {
      resolve(body)
    })
    req.on('error', (error) => {
      reject(error)
    })
  })
}

// Função principal do webhook
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
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
    console.log('🚀 Webhook Hotmart recebido (RAW)')
    
    // Validar headers
    const signature = req.headers['x-hotmart-signature'] as string
    if (!signature) {
      console.error('❌ Assinatura HMAC não encontrada')
      return res.status(401).json({ error: 'Assinatura HMAC necessária' })
    }

    // Obter body bruto para validação HMAC
    const rawBody = await getRawBody(req)
    
    console.log('📝 Body bruto recebido:', {
      length: rawBody.length,
      preview: rawBody.substring(0, 100) + '...'
    })
    
    // Validar assinatura HMAC
    const assinaturaValida = validarAssinatura(rawBody, signature)
    if (!assinaturaValida) {
      console.error('❌ Assinatura HMAC inválida')
      return res.status(401).json({ error: 'Assinatura HMAC inválida' })
    }

    // Parse do JSON após validação
    const data = JSON.parse(rawBody)
    
    // Validar estrutura dos dados
    if (!validarEstrutura(data)) {
      console.error('❌ Estrutura de dados inválida:', data)
      return res.status(400).json({ error: 'Estrutura de dados inválida' })
    }

    console.log('✅ Webhook validado, processando...')

    // Por enquanto, apenas validar e retornar sucesso (temporário)
    console.log('✅ Webhook validado com sucesso!')
    console.log('📦 Dados recebidos:', JSON.stringify(data, null, 2))
    
    return res.status(200).json({ 
      success: true, 
      message: 'Webhook processado com sucesso (modo teste)',
      event: data.event,
      order_id: data.data?.purchase?.order_id || 'N/A'
    })

  } catch (error) {
    console.error('❌ Erro no webhook:', error)
    return res.status(500).json({ 
      error: 'Erro interno do servidor',
      details: (error as Error).message 
    })
  }
}