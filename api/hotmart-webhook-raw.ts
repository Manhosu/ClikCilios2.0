// import { NextApiRequest, NextApiResponse } from 'next'
import crypto from 'crypto'
import { createClient } from '@supabase/supabase-js'

// Interfaces para substituir Next.js
interface NextApiRequest {
  method?: string;
  body: any;
  headers: { [key: string]: string | string[] | undefined };
  on: (event: string, callback: (data: any) => void) => void;
}

interface NextApiResponse {
  status: (code: number) => NextApiResponse;
  json: (data: any) => void;
}

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
  webhookSecret: process.env.VITE_HOTMART_WEBHOOK_SECRET
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
      // Webhook secret não configurado - removido log para produção
      return false
    }

    // Validação HMAC - logs removidos para produção
    
    const expectedSignature = crypto
      .createHmac('sha256', HOTMART_CONFIG.webhookSecret)
      .update(body, 'utf8')
      .digest('hex')
    
    const receivedSignature = signature.replace('sha256=', '');

    const isValid = crypto.timingSafeEqual(
      Buffer.from(expectedSignature, 'hex'),
      Buffer.from(receivedSignature, 'hex')
    );

    // Comparação de assinaturas - logs removidos para produção

    return isValid;
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

// Gerar senha temporária
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

    // Criando novo usuário - log removido para produção
    
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
      // Erro ao criar usuário - log removido para produção
      return {
        success: false,
        error: 'Erro ao criar usuário: ' + profileError.message
      }
    }

    // Usuário criado - log removido para produção

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
    // Processando compra aprovada - log removido para produção
    
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
          // Erro ao registrar uso do cupom - log removido para produção
        } else {
          // Uso do cupom registrado com sucesso - log removido para produção
        }
      } else {
        // Cupom não encontrado ou inativo - log removido para produção
      }
    }

    // Compra processada com sucesso - log removido para produção
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
    req.on('data', (chunk: Buffer) => chunks.push(chunk))
    req.on('end', () => resolve(Buffer.concat(chunks)))
    req.on('error', (err: Error) => reject(err))
  })
}

// Função principal do webhook
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Método não permitido' })
  }

  // Início da requisição webhook - log removido para produção

  try {
    // Obter o corpo bruto da requisição
    const rawBody = await getRawBody(req)
    // Corpo bruto recebido - log removido para produção

    // Obter assinatura do cabeçalho
    const signature = req.headers['x-hotmart-signature'] as string
    // Assinatura recebida - log removido para produção

    if (!signature) {
      // Assinatura HMAC não encontrada - log removido para produção
      return res.status(401).json({ error: 'Assinatura HMAC necessária' })
    }

    // Validar assinatura
    if (!validarAssinatura(rawBody.toString('utf8'), signature)) {
      // Assinatura HMAC inválida - log removido para produção
      return res.status(401).json({ error: 'Assinatura HMAC inválida' })
    }

    // Assinatura HMAC validada com sucesso - log removido para produção

    // Parse do corpo da requisição
    const data: HotmartWebhookData = JSON.parse(rawBody.toString('utf8'))
    // Dados do webhook - log removido para produção

    // Validar estrutura do webhook
    if (!validarEstrutura(data)) {
      // Estrutura do webhook inválida - log removido para produção
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
        // Evento recebido mas não processado - log removido para produção
        res.status(200).json({ message: 'Evento não processado' })
    }
  } catch (error) {
    // Erro inesperado no webhook - log removido para produção
    res.status(500).json({ error: 'Erro interno no servidor' })
  } finally {
    // Fim da requisição webhook - log removido para produção
  }
}