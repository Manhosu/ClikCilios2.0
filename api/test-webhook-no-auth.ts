import { NextApiRequest, NextApiResponse } from 'next'
import { createClient } from '@supabase/supabase-js'

// Configuração do Supabase
const supabaseUrl = process.env.VITE_SUPABASE_URL!
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY!
const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    persistSession: false
  }
})

// Desabilitar parsing automático do body
export const config = {
  api: {
    bodyParser: false,
  },
}

// Função para ler o body da requisição
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

// Validar estrutura dos dados
function validarEstrutura(data: any): boolean {
  try {
    const purchase = data?.data?.purchase
    if (!purchase) {
      console.error('❌ Estrutura inválida: purchase não encontrado')
      return false
    }

    const requiredFields = [
      'buyer.email',
      'buyer.name', 
      'status',
      'order_id'
    ]

    for (const field of requiredFields) {
      const fieldPath = field.split('.')
      let current = purchase
      
      for (const part of fieldPath) {
        if (!current || !current[part]) {
          console.error(`❌ Campo obrigatório ausente: ${field}`)
          return false
        }
        current = current[part]
      }
    }

    return true
  } catch (error) {
    console.error('❌ Erro na validação da estrutura:', error)
    return false
  }
}

// Processar compra aprovada
async function processarCompraAprovada(data: any) {
  try {
    const purchase = data.data.purchase
    const buyer = purchase.buyer
    
    console.log('📦 Processando compra aprovada:', {
      email: buyer.email,
      name: buyer.name,
      orderId: purchase.order_id,
      status: purchase.status
    })

    // Verificar se o usuário já existe
    const { data: existingUser, error: searchError } = await supabase
      .from('users')
      .select('*')
      .eq('email', buyer.email)
      .single()

    if (searchError && searchError.code !== 'PGRST116') {
      throw new Error(`Erro ao buscar usuário: ${searchError.message}`)
    }

    let userId: string

    if (existingUser) {
      console.log('👤 Usuário já existe:', existingUser.id)
      userId = existingUser.id
    } else {
      // Criar novo usuário
      console.log('👤 Criando novo usuário...')
      
      const newUserId = crypto.randomUUID()
      
      const { data: newUser, error: createError } = await supabase
        .from('users')
        .insert({
          id: newUserId,
          email: buyer.email,
          name: buyer.name,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select()
        .single()

      if (createError) {
        throw new Error(`Erro ao criar usuário: ${createError.message}`)
      }

      console.log('✅ Usuário criado:', newUser)
      userId = newUserId
    }

    // Registrar a compra
    const { data: purchase_record, error: purchaseError } = await supabase
      .from('purchases')
      .insert({
        user_id: userId,
        order_id: purchase.order_id,
        status: purchase.status,
        amount: purchase.price?.value || 0,
        currency: purchase.price?.currency_code || 'BRL',
        product_name: purchase.offer?.name || 'Produto',
        created_at: new Date().toISOString()
      })

    if (purchaseError) {
      console.error('❌ Erro ao registrar compra:', purchaseError)
    } else {
      console.log('✅ Compra registrada com sucesso')
    }

    return { success: true, userId }
  } catch (error) {
    console.error('❌ Erro ao processar compra:', error)
    throw error
  }
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  console.log('🚀 Webhook de teste recebido (sem autenticação)')
  
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Método não permitido' })
  }

  try {
    // Ler o body da requisição
    const rawBody = await getRawBody(req)
    console.log('📥 Body recebido:', rawBody)

    // Parse do JSON
    const data = JSON.parse(rawBody)
    console.log('📋 Dados parseados:', JSON.stringify(data, null, 2))

    // Validar estrutura
    if (!validarEstrutura(data)) {
      return res.status(400).json({ error: 'Estrutura de dados inválida' })
    }

    // Processar apenas compras aprovadas
    if (data.event === 'PURCHASE_APPROVED' && data.data?.purchase?.status === 'APPROVED') {
      await processarCompraAprovada(data)
      return res.status(200).json({ 
        success: true, 
        message: 'Compra processada com sucesso',
        event: data.event
      })
    }

    // Outros eventos
    console.log('ℹ️ Evento não processado:', data.event)
    return res.status(200).json({ 
      success: true, 
      message: 'Evento recebido mas não processado',
      event: data.event
    })

  } catch (error) {
    console.error('❌ Erro no webhook:', error)
    return res.status(500).json({ 
      error: 'Erro ao processar webhook',
      details: error instanceof Error ? error.message : 'Erro desconhecido'
    })
  }
}