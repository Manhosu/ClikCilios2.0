import { NextApiRequest, NextApiResponse } from 'next'
import crypto from 'crypto'
import { createClient } from '@supabase/supabase-js'

// Configuração do Supabase
const supabaseUrl = process.env.VITE_SUPABASE_URL!
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY!
const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    persistSession: false
  }
})

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
    
    const receivedSignature = signature.replace('sha256=', '');

    const isValid = crypto.timingSafeEqual(
      Buffer.from(expectedSignature, 'hex'),
      Buffer.from(receivedSignature, 'hex')
    );

    console.log('🔐 Comparando assinaturas:', {
      expected: expectedSignature,
      received: receivedSignature,
      match: isValid
    });

    return isValid;
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

// Gerar senha temporária
function gerarSenhaTemporaria(): string {
  return Math.random().toString(36).slice(-12) + Math.random().toString(36).slice(-12)
}

// Criar ou buscar usuário
async function criarOuBuscarUsuario(buyer: { name: string; email: string }) {
  try {
    const email = buyer.email.toLowerCase().trim()
    const nome = buyer.name.trim()

    // Verificar se usuário já existe
    const { data: existingUser } = await supabase
      .from('users')
      .select('id')
      .eq('email', email)
      .single()

    if (existingUser) {
      return {
        success: true,
        user_id: existingUser.id,
        created: false
      }
    }

    console.log('🔄 Criando novo usuário...')
    
    // Gerar um UUID válido para o usuário
    const userId = crypto.randomUUID()
    
    // Inserir usuário diretamente na tabela users
    const { error: profileError } = await supabase
      .from('users')
      .insert({
        id: userId,
        email: email,
        nome: nome,
        is_admin: false,
        onboarding_completed: false
      })

    if (profileError) {
      console.error('❌ Erro ao criar usuário:', profileError)
      return {
        success: false,
        error: 'Erro ao criar usuário: ' + profileError.message
      }
    }

    console.log('✅ Usuário criado:', { email, user_id: userId })

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

    // Verificar se há cupom para registrar
    const cupomCodigo = data.data.purchase.tracking?.coupon
    
    if (cupomCodigo) {
      // Buscar cupom válido
      const { data: cupom, error: cupomError } = await supabase
        .from('cupons')
        .select('id')
        .eq('codigo', cupomCodigo)
        .eq('ativo', true)
        .single()
      
      if (!cupomError && cupom) {
        // Registrar uso do cupom
        const { error: usoError } = await supabase
          .from('usos_cupons')
          .insert({
            cupom_id: cupom.id,
            user_id: resultadoUsuario.user_id,
            valor_compra: data.data.purchase.price.value,
            valor_comissao: data.data.purchase.price.value * 0.1, // 10% de comissão padrão
            origem: 'hotmart',
            hotmart_transaction_id: data.data.purchase.order_id,
            created_at: new Date().toISOString()
          })
        
        if (usoError) {
          console.warn('⚠️ Erro ao registrar uso do cupom:', usoError.message)
        } else {
          console.log('✅ Uso do cupom registrado com sucesso')
        }
      } else {
        console.warn('⚠️ Cupom não encontrado ou inativo:', cupomCodigo)
      }
    }

    console.log('✅ Compra processada com sucesso')
    return {
      success: true,
      message: 'Compra processada com sucesso',
      user_created: resultadoUsuario.created,
      cupom_usado: cupomCodigo || null
    }
  } catch (error) {
    return {
      success: false,
      error: 'Erro interno: ' + (error as Error).message
    }
  }
}

// Função para ler o corpo da requisição como buffer
function getRawBody(req: NextApiRequest): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = []
    req.on('data', (chunk) => chunks.push(chunk))
    req.on('end', () => resolve(Buffer.concat(chunks)))
    req.on('error', (err) => reject(err))
  })
}

// Função principal do webhook
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Método não permitido' })
  }

  console.log('--- INÍCIO DA REQUISIÇÃO WEBHOOK ---')

  try {
    // Obter o corpo bruto da requisição
    const rawBody = await getRawBody(req)
    console.log('📄 Corpo bruto recebido (Buffer):', rawBody.toString('utf8'))

    // Obter assinatura do cabeçalho
    const signature = req.headers['x-hotmart-signature'] as string
    console.log('🔑 Assinatura recebida:', signature)

    if (!signature) {
      console.warn('⚠️ Assinatura HMAC não encontrada no cabeçalho')
      return res.status(401).json({ error: 'Assinatura HMAC necessária' })
    }

    // Validar assinatura
    if (!validarAssinatura(rawBody.toString('utf8'), signature)) {
      console.error('❌ Assinatura HMAC inválida')
      return res.status(401).json({ error: 'Assinatura HMAC inválida' })
    }

    console.log('✅ Assinatura HMAC validada com sucesso!')

    // Parse do corpo da requisição
    const data: HotmartWebhookData = JSON.parse(rawBody.toString('utf8'))
    console.log('📦 Dados do webhook (parsed):', JSON.stringify(data, null, 2))

    // Validar estrutura do webhook
    if (!validarEstrutura(data)) {
      console.error('❌ Estrutura do webhook inválida')
      return res.status(400).json({ error: 'Estrutura do webhook inválida' })
    }

    // Processar evento
    switch (data.event) {
      case 'PURCHASE_APPROVED':
      case 'PURCHASE_COMPLETE':
        const resultado = await processarCompraAprovada(data)
        if (resultado.success) {
          res.status(200).json({ message: 'Compra processada com sucesso' })
        } else {
          res.status(500).json({ error: resultado.error })
        }
        break
      default:
        console.log(`🔔 Evento ${data.event} recebido, mas não processado.`)
        res.status(200).json({ message: 'Evento não processado' })
    }
  } catch (error) {
    console.error('💥 Erro inesperado no webhook:', error)
    res.status(500).json({ error: 'Erro interno no servidor' })
  } finally {
    console.log('--- FIM DA REQUISIÇÃO WEBHOOK ---')
  }
}