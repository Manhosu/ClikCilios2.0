import { VercelRequest, VercelResponse } from '@vercel/node'
import { createClient } from '@supabase/supabase-js'

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
  [key: string]: any // Aceitar qualquer campo adicional
}

// Gerar senha temporária
function gerarSenhaTemporaria(): string {
  return Math.random().toString(36).slice(-12) + Math.random().toString(36).slice(-12)
}

// Criar usuário (versão simplificada)
async function criarUsuario(buyer: { name?: string; email?: string }) {
  if (!buyer?.email || !buyer?.name) {
    return { success: false, message: 'Dados do comprador incompletos' }
  }

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
      console.log(`✅ Usuário já existe: ${email}`)
      return { success: true, user_id: existingUser.id, created: false }
    }

    // Criar novo usuário
    const senha = gerarSenhaTemporaria()
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email: email,
      password: senha,
      email_confirm: true,
      user_metadata: { nome, created_by: 'hotmart_webhook' }
    })

    if (authError) {
      console.error('❌ Erro ao criar usuário:', authError.message)
      return { success: false, message: authError.message }
    }

    // Criar perfil
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
      console.error('❌ Erro ao criar perfil:', profileError.message)
    }

    console.log(`✅ Usuário criado: ${email}`)
    return { success: true, user_id: authData.user.id, created: true, senha }

  } catch (error) {
    console.error('❌ Erro interno:', error)
    return { success: false, message: 'Erro interno' }
  }
}

// Função principal do webhook
export default async function handler(req: VercelRequest, res: VercelResponse) {
  const startTime = Date.now()

  // Configurar CORS
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')

  // Responder OPTIONS
  if (req.method === 'OPTIONS') {
    console.log('🔄 OPTIONS request received')
    return res.status(200).end()
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

      if (buyer?.email && buyer?.name) {
        const userResult = await criarUsuario(buyer)
        if (userResult.success) {
          resultado = {
            success: true,
            message: 'Compra processada e usuário criado',
            data: {
              user_created: userResult.created,
              user_id: userResult.user_id,
              email: buyer.email
            }
          }
        } else {
          // Mesmo com erro na criação, retornar 200 para Hotmart
          resultado = {
            success: true,
            message: 'Evento recebido mas erro na criação do usuário',
            error: userResult.message
          }
        }
      } else {
        console.log('⚠️ Dados do comprador incompletos')
        resultado = {
          success: true,
          message: 'Evento recebido mas dados incompletos'
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
      processing_time_ms: processTime
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
      processing_time_ms: processTime
    })
  }
}

/**
 * CONFIGURAÇÃO NO VERCEL:
 *
 * 1. Acesse o painel do Vercel
 * 2. Vá em Settings > Environment Variables
 * 3. Adicione a variável:
 *    Name: HOTMART_TOKEN
 *    Value: gtnL72D16QPeck2Uky8d92uzq6GHtH6f40dc99-fece-4673-97c2-67aef62e4074
 * 4. Deploy novamente o projeto
 *
 * ESTRUTURA ESPERADA DO PAYLOAD:
 * {
 *   "hottok": "gtnL72D16QPeck2Uky8d92uzq6GHtH6f40dc99-fece-4673-97c2-67aef62e4074",
 *   "event": "approved",
 *   "data": {
 *     "purchase": {
 *       "buyer": {
 *         "name": "Nome do Cliente",
 *         "email": "cliente@email.com"
 *       }
 *     }
 *   }
 * }
 */