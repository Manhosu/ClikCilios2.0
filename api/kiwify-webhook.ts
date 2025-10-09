import { VercelRequest, VercelResponse } from '@vercel/node'
import { createClient } from '@supabase/supabase-js'
import { credentialsEmailTemplate } from './emailTemplates.mjs'

// Configuração do Supabase
const supabaseUrl = process.env.VITE_SUPABASE_URL!
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

// Configuração do SendGrid para envio de emails
const SENDGRID_API_KEY = process.env.SENDGRID_API_KEY
const SENDGRID_FROM_EMAIL = process.env.SENDGRID_FROM_EMAIL || 'carinaprange86@gmail.com'
const SENDGRID_FROM_NAME = process.env.SENDGRID_FROM_NAME || 'CíliosClick'
const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://clik-cilios2-0.vercel.app'

// Configuração do Kiwify
const KIWIFY_WEBHOOK_SECRET = process.env.KIWIFY_WEBHOOK_SECRET

/**
 * Interface para webhook Kiwify
 *
 * Estrutura baseada na documentação oficial do Kiwify
 * https://docs.kiwify.com.br/
 */
interface KiwifyWebhook {
  order_id?: string
  order_ref?: string
  product_id?: string
  product_name?: string
  Customer?: {
    email?: string
    full_name?: string
    first_name?: string
    CPF?: string
    mobile?: string
  }
  customer?: {
    email?: string
    full_name?: string
    first_name?: string
    CPF?: string
    mobile?: string
  }
  Producer?: {
    email?: string
    name?: string
  }
  Commission?: {
    commission_as?: string
    commission_amount?: number
  }
  Product?: {
    product_id?: string
    product_name?: string
  }
  Purchase?: {
    order_date?: string
    order_id?: string
    payment_type?: string
    status?: string
    approved_date?: string
  }
  order_status?: string
  sale_amount?: number
  transaction_id?: string
  webhook_event_id?: string
  event?: string
}

/**
 * Função para gerar senha temporária segura
 */
function gerarSenhaTemporaria(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789!@#$'
  let senha = ''
  for (let i = 0; i < 12; i++) {
    senha += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return senha
}

/**
 * Função para enviar email com credenciais via SendGrid
 */
async function enviarEmailCredenciais(email: string, nome: string, senha: string): Promise<boolean> {
  if (!SENDGRID_API_KEY) {
    console.log('⚠️ SENDGRID_API_KEY não configurada - email não será enviado')
    return false
  }

  const loginUrl = `${APP_URL}/login`

  const emailTemplate = credentialsEmailTemplate({
    userName: nome,
    userEmail: email,
    password: senha,
    loginUrl: loginUrl
  })

  const htmlContent = emailTemplate.htmlContent
  const textContent = emailTemplate.textContent

  try {
    const response = await fetch('https://api.sendgrid.com/v3/mail/send', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${SENDGRID_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        personalizations: [
          {
            to: [{ email }],
            subject: emailTemplate.subject,
          },
        ],
        from: {
          email: SENDGRID_FROM_EMAIL,
          name: SENDGRID_FROM_NAME,
        },
        content: [
          {
            type: 'text/plain',
            value: textContent,
          },
          {
            type: 'text/html',
            value: htmlContent,
          },
        ],
      }),
    })

    if (response.ok) {
      console.log('✅ Email enviado com sucesso para', email)
      return true
    } else {
      const errorText = await response.text()
      console.error('❌ Erro ao enviar email:', response.status, errorText)
      return false
    }
  } catch (error: any) {
    console.error('❌ Erro ao enviar email:', error.message)
    return false
  }
}

/**
 * Função para criar ou atualizar usuário
 */
async function criarUsuario(dados: { email: string; nome: string }): Promise<{
  success: boolean
  message: string
  userId?: string
  senha?: string
}> {
  const { email, nome } = dados

  console.log(`\n📝 Processando usuário: ${email} (${nome})`)

  try {
    // 1. Verificar se usuário já existe
    console.log('🔍 Verificando se usuário já existe...')
    const { data: existingUser } = await supabase.auth.admin.listUsers()
    const userExists = existingUser?.users?.find(u => u.email === email)

    if (userExists) {
      console.log('⚠️ Usuário já existe, gerando nova senha...')

      const novaSenha = gerarSenhaTemporaria()

      // Atualizar senha
      const { error: updateError } = await supabase.auth.admin.updateUserById(
        userExists.id,
        { password: novaSenha }
      )

      if (updateError) {
        console.error('❌ Erro ao atualizar senha:', updateError.message)
        return { success: false, message: `Erro ao atualizar senha: ${updateError.message}` }
      }

      console.log('✅ Senha atualizada com sucesso!')

      // Enviar email
      await enviarEmailCredenciais(email, nome, novaSenha)

      return {
        success: true,
        message: 'Usuário já existe, senha atualizada e email enviado',
        userId: userExists.id,
        senha: novaSenha
      }
    }

    // 2. Criar novo usuário
    console.log('👤 Criando novo usuário...')
    const senha = gerarSenhaTemporaria()

    const { data: authUser, error: authError } = await supabase.auth.admin.createUser({
      email: email,
      password: senha,
      email_confirm: true,
      user_metadata: {
        nome: nome
      }
    })

    if (authError) {
      console.error('❌ Erro ao criar usuário no Auth:', authError.message)
      return { success: false, message: `Erro ao criar usuário: ${authError.message}` }
    }

    console.log('✅ Usuário criado no Auth:', authUser.user.id)

    // 3. Criar perfil na tabela users
    console.log('📝 Criando perfil na tabela users...')
    const { error: profileError } = await supabase
      .from('users')
      .insert({
        id: authUser.user.id,
        email: email,
        nome: nome,
        is_admin: false,
        onboarding_completed: false
      })

    if (profileError) {
      console.error('❌ Erro ao criar perfil:', profileError.message)
      // Continuar mesmo com erro no perfil, o usuário Auth já foi criado
    } else {
      console.log('✅ Perfil criado com sucesso!')
    }

    // 4. Enviar email com credenciais
    console.log('📧 Enviando email com credenciais...')
    const emailEnviado = await enviarEmailCredenciais(email, nome, senha)

    if (emailEnviado) {
      console.log('✅ Processo concluído com sucesso!')
    } else {
      console.log('⚠️ Usuário criado mas email não foi enviado')
    }

    return {
      success: true,
      message: 'Usuário criado e email enviado com sucesso',
      userId: authUser.user.id,
      senha: senha
    }

  } catch (error: any) {
    console.error('❌ Erro ao processar usuário:', error.message)
    return { success: false, message: `Erro ao processar: ${error.message}` }
  }
}

/**
 * Handler principal do webhook Kiwify
 */
export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Permitir apenas POST
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Método não permitido' })
  }

  console.log('\n' + '='.repeat(60))
  console.log('📨 Webhook Kiwify recebido')
  console.log('='.repeat(60))
  console.log('⏰ Timestamp:', new Date().toISOString())
  console.log('📍 IP:', req.headers['x-forwarded-for'] || req.socket?.remoteAddress)

  try {
    const payload: KiwifyWebhook = req.body

    console.log('📦 Payload recebido:', JSON.stringify(payload, null, 2))

    // Validação do webhook secret (opcional, mas recomendado)
    if (KIWIFY_WEBHOOK_SECRET) {
      const receivedSecret = req.headers['x-kiwify-signature'] || req.body.webhook_secret

      if (receivedSecret !== KIWIFY_WEBHOOK_SECRET) {
        console.log('❌ Secret inválido!')
        return res.status(401).json({ error: 'Secret inválido' })
      }

      console.log('✅ Secret validado com sucesso!')
    } else {
      console.log('⚠️ KIWIFY_WEBHOOK_SECRET não configurado - aceitando qualquer requisição')
    }

    // Extrair dados do cliente (Kiwify pode enviar em formatos diferentes)
    const customer = payload.Customer || payload.customer
    const email = customer?.email
    const nomeCompleto = customer?.full_name || customer?.first_name || 'Cliente'

    if (!email) {
      console.log('❌ Email não encontrado no payload')
      return res.status(400).json({ error: 'Email não encontrado' })
    }

    console.log('👤 Cliente identificado:')
    console.log('   Email:', email)
    console.log('   Nome:', nomeCompleto)

    // Verificar status da compra
    const orderStatus = payload.order_status || payload.Purchase?.status
    console.log('📊 Status da compra:', orderStatus)

    // Processar apenas compras aprovadas
    if (orderStatus === 'paid' || orderStatus === 'approved' || orderStatus === 'complete') {
      console.log('✅ Compra aprovada! Processando...')

      const resultado = await criarUsuario({
        email: email,
        nome: nomeCompleto
      })

      if (resultado.success) {
        console.log('\n✅ Webhook processado com sucesso!')
        console.log('   User ID:', resultado.userId)
        console.log('   Senha gerada:', resultado.senha)

        return res.status(200).json({
          success: true,
          message: resultado.message,
          user_id: resultado.userId
        })
      } else {
        console.log('\n❌ Erro ao processar webhook:', resultado.message)
        return res.status(500).json({
          success: false,
          error: resultado.message
        })
      }
    } else {
      console.log('⏸️ Status da compra não é aprovado, ignorando...')
      return res.status(200).json({
        success: true,
        message: 'Webhook recebido mas status não aprovado',
        status: orderStatus
      })
    }

  } catch (error: any) {
    console.error('❌ Erro ao processar webhook:', error.message)
    console.error('Stack:', error.stack)

    return res.status(500).json({
      success: false,
      error: 'Erro interno ao processar webhook',
      details: error.message
    })
  }
}
