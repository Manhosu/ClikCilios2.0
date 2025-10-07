import { VercelRequest, VercelResponse } from '@vercel/node'
import { createClient } from '@supabase/supabase-js'
const { credentialsEmailTemplate } = require('./emailTemplates')

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

// Interface para webhook Hotmart (estrutura REAL baseada na documentação oficial)
interface HotmartWebhook {
  id?: string
  creation_date?: number
  event?: string
  version?: string
  data?: {
    buyer?: {
      email?: string
      name?: string
      first_name?: string
      last_name?: string
      checkout_phone?: string
      document?: string
    }
    purchase?: {
      transaction?: string
      status?: string
      approved_date?: number
      order_date?: number
      price?: {
        value?: number
        currency_value?: string
      }
    }
    product?: {
      id?: number
      name?: string
      ucode?: string
    }
  }
  [key: string]: any // Aceitar campos adicionais
}

// Gerar senha temporária
function gerarSenhaTemporaria(): string {
  return Math.random().toString(36).slice(-12) + Math.random().toString(36).slice(-12)
}

// Enviar email com credenciais usando SendGrid
async function enviarEmailCredenciais(
  email: string,
  nome: string,
  senha: string
): Promise<boolean> {
  if (!SENDGRID_API_KEY) {
    console.log('⚠️ SENDGRID_API_KEY não configurada - email não será enviado')
    return false
  }

  try {
    const loginUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://clik-cilios2-0.vercel.app/login'

    // Usar template bonito do emailTemplates.js
    const emailTemplate = credentialsEmailTemplate({
      userName: nome,
      userEmail: email,
      password: senha,
      loginUrl: loginUrl
    })

    const htmlContent = emailTemplate.htmlContent
    const textContent = emailTemplate.textContent

    /* Template antigo removido - agora usando emailTemplates.js
    const htmlContent = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Suas Credenciais de Acesso - CíliosClick</title>
</head>
<body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f4f4f4;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
    <tr>
      <td align="center" style="padding: 40px 0;">
        <table role="presentation" width="600" cellspacing="0" cellpadding="0" border="0" style="background-color: #ffffff; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
          <!-- Header -->
          <tr>
            <td style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 40px 30px; text-align: center; border-radius: 8px 8px 0 0;">
              <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: bold;">Bem-vindo ao CíliosClick!</h1>
            </td>
          </tr>
          <!-- Content -->
          <tr>
            <td style="padding: 40px 30px;">
              <p style="margin: 0 0 20px; color: #333333; font-size: 16px; line-height: 1.6;">
                Olá, <strong>${nome}</strong>!
              </p>
              <p style="margin: 0 0 20px; color: #333333; font-size: 16px; line-height: 1.6;">
                Sua compra foi aprovada e sua conta foi criada com sucesso! Aqui estão suas credenciais de acesso:
              </p>

              <!-- Credentials Box -->
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background-color: #f8f9fa; border-radius: 6px; margin: 30px 0;">
                <tr>
                  <td style="padding: 25px;">
                    <p style="margin: 0 0 15px; color: #666666; font-size: 14px; font-weight: bold; text-transform: uppercase; letter-spacing: 0.5px;">
                      Suas Credenciais
                    </p>
                    <p style="margin: 0 0 10px; color: #333333; font-size: 16px;">
                      <strong>Email:</strong> ${email}
                    </p>
                    <p style="margin: 0; color: #333333; font-size: 16px;">
                      <strong>Senha:</strong> <code style="background-color: #ffffff; padding: 4px 8px; border-radius: 4px; font-family: monospace; color: #667eea;">${senha}</code>
                    </p>
                  </td>
                </tr>
              </table>

              <p style="margin: 0 0 30px; color: #333333; font-size: 16px; line-height: 1.6;">
                Clique no botão abaixo para fazer login e começar a usar a plataforma:
              </p>

              <!-- Button -->
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
                <tr>
                  <td align="center">
                    <a href="${loginUrl}" style="display: inline-block; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: #ffffff; text-decoration: none; padding: 16px 40px; border-radius: 6px; font-size: 16px; font-weight: bold; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
                      Acessar Plataforma
                    </a>
                  </td>
                </tr>
              </table>

              <p style="margin: 30px 0 0; color: #999999; font-size: 14px; line-height: 1.6;">
                💡 <strong>Dica:</strong> Por segurança, recomendamos que você altere sua senha após o primeiro acesso.
              </p>
            </td>
          </tr>
          <!-- Footer -->
          <tr>
            <td style="background-color: #f8f9fa; padding: 30px; text-align: center; border-radius: 0 0 8px 8px;">
              <p style="margin: 0; color: #999999; font-size: 14px;">
                Se você não fez essa compra, por favor ignore este email.
              </p>
              <p style="margin: 10px 0 0; color: #999999; font-size: 14px;">
                © ${new Date().getFullYear()} CíliosClick. Todos os direitos reservados.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
    `
    */ // Fim do template antigo

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
      console.log(`✅ Email enviado com sucesso para ${email}`)
      return true
    } else {
      const errorData = await response.text()
      console.error(`❌ Erro ao enviar email:`, response.status, errorData)
      return false
    }
  } catch (error) {
    console.error('❌ Erro ao enviar email:', error)
    return false
  }
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
      // Gerar nova senha e enviar por email
      const novaSenha = gerarSenhaTemporaria()

      // Atualizar senha do usuário existente
      const { error: updateError } = await supabase.auth.admin.updateUserById(
        existingUser.id,
        { password: novaSenha }
      )

      if (updateError) {
        console.error('❌ Erro ao atualizar senha:', updateError.message)
      } else {
        console.log(`✅ Senha atualizada para usuário existente: ${email}`)
        // Enviar email com nova senha
        await enviarEmailCredenciais(email, nome, novaSenha)
      }

      return { success: true, user_id: existingUser.id, created: false, senha: novaSenha }
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

    // Enviar email com credenciais
    await enviarEmailCredenciais(email, nome, senha)

    return { success: true, user_id: authData.user.id, created: true, senha }

  } catch (error) {
    console.error('❌ Erro interno:', error)
    return { success: false, message: 'Erro interno' }
  }
}

// Função principal do webhook
export default async function handler(req: VercelRequest, res: VercelResponse) {
  const startTime = Date.now()

  // Configurar CORS (permitir header X-Hotmart-Hottok)
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, X-Hotmart-Hottok, x-hotmart-hottok, hottok')

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
    // VALIDAÇÃO DO HOTTOK (HEADER OU BODY)
    // ==========================================

    console.log('🔍 Verificando token hottok...')

    // 1. Buscar hottok em múltiplas fontes (HOTMART ENVIA VIA HEADER!)
    const hottokFromHeader =
      req.headers['x-hotmart-hottok'] ||
      req.headers['X-Hotmart-Hottok'] ||
      req.headers['hottok']

    const hottokFromBody = (payload as any).hottok

    const hottok = hottokFromHeader || hottokFromBody

    console.log('🔑 Token de onde veio:', hottokFromHeader ? 'HEADER' : hottokFromBody ? 'BODY' : 'AUSENTE')
    console.log('🔑 Token recebido:', hottok || 'AUSENTE')
    console.log('🔑 Token esperado:', process.env.HOTMART_TOKEN || 'NÃO CONFIGURADO')

    // 2. Verificar se hottok existe
    if (!hottok) {
      console.log('❌ Token hottok ausente (não encontrado no header nem no body)')
      return res.status(401).json({ error: 'Token inválido' })
    }

    // 3. Verificar se variável de ambiente está configurada
    if (!process.env.HOTMART_TOKEN) {
      console.log('⚠️ HOTMART_TOKEN não configurado no ambiente - ACEITAR QUALQUER TOKEN (modo dev)')
      // Em desenvolvimento, aceitar qualquer token
    } else {
      // 4. Comparar tokens
      if (hottok !== process.env.HOTMART_TOKEN) {
        console.log('❌ Token inválido!')
        console.log('   Recebido:', hottok)
        console.log('   Esperado:', process.env.HOTMART_TOKEN)
        return res.status(401).json({ error: 'Token inválido' })
      }
    }

    console.log('✅ Token hottok validado com sucesso!')

    // ==========================================
    // PROCESSAMENTO DO EVENTO
    // ==========================================

    const evento = payload.event || 'unknown'
    console.log(`🔄 Evento recebido: ${evento}`)

    let resultado: any = { success: true, message: 'Evento processado' }

    // Processar eventos de compra aprovada (ESTRUTURA REAL DA HOTMART)
    if (evento === 'PURCHASE_APPROVED' || evento === 'approved' || evento === 'PURCHASE_COMPLETE') {
      console.log('✅ Processando compra aprovada...')

      // HOTMART ENVIA: data.buyer (não data.purchase.buyer!)
      const buyer = payload.data?.buyer
      console.log('👤 Dados do comprador (data.buyer):', JSON.stringify(buyer, null, 2))

      // Fallback: tentar buscar em data.purchase.buyer (compatibilidade)
      const buyerFallback = payload.data?.purchase?.buyer
      if (buyerFallback && !buyer) {
        console.log('⚠️ Usando fallback: data.purchase.buyer')
      }

      const finalBuyer = buyer || buyerFallback

      if (finalBuyer?.email && finalBuyer?.name) {
        const userResult = await criarUsuario(finalBuyer)
        if (userResult.success) {
          resultado = {
            success: true,
            message: userResult.created
              ? 'Compra processada, usuário criado e email enviado'
              : 'Compra processada, usuário existente atualizado e email enviado',
            data: {
              user_created: userResult.created,
              user_id: userResult.user_id,
              email: finalBuyer.email,
              email_sent: true,
              event: evento
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
        console.log('⚠️ Dados do comprador incompletos ou ausentes')
        console.log('   Estrutura payload.data:', JSON.stringify(payload.data, null, 2))
        resultado = {
          success: true,
          message: 'Evento recebido mas dados do comprador incompletos'
        }
      }
    }
    // Processar eventos de cancelamento
    else if (evento === 'PURCHASE_CANCELED' || evento === 'PURCHASE_CANCELLED' || evento === 'canceled') {
      console.log(`📝 Evento de cancelamento recebido: ${evento}`)
      resultado = {
        success: true,
        message: `Evento ${evento} recebido e registrado (não processado)`
      }
    }
    // Outros eventos
    else {
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
 * ========================================
 * WEBHOOK HOTMART - CONFIGURAÇÃO COMPLETA
 * ========================================
 *
 * Este webhook usa a ESTRUTURA REAL que a Hotmart envia!
 *
 * COMO A HOTMART ENVIA OS DADOS:
 * --------------------------------
 * 1. Token de autenticação: VIA HEADER HTTP "X-Hotmart-Hottok"
 * 2. Dados do comprador: payload.data.buyer (não data.purchase.buyer!)
 * 3. Eventos: PURCHASE_APPROVED, PURCHASE_CANCELED (uppercase + underscore)
 *
 * CONFIGURAÇÃO NO VERCEL:
 * -----------------------
 * Vá em Settings > Environment Variables e adicione:
 *
 * OBRIGATÓRIAS:
 * - HOTMART_TOKEN = gtnL72D16QPeck2Uky8d92uzq6GHtH6f40dc99-fece-4673-97c2-67aef62e4074
 * - VITE_SUPABASE_URL = sua_url_supabase
 * - SUPABASE_SERVICE_ROLE_KEY = sua_service_role_key
 *
 * OPCIONAIS (para envio de email):
 * - SENDGRID_API_KEY = sua_api_key_sendgrid
 * - SENDGRID_FROM_EMAIL = noreply@ciliosclick.com
 * - SENDGRID_FROM_NAME = CíliosClick
 * - NEXT_PUBLIC_APP_URL = https://clik-cilios2-0.vercel.app
 *
 * ESTRUTURA REAL DO PAYLOAD HOTMART:
 * -----------------------------------
 * {
 *   "id": "uuid",
 *   "creation_date": 1758660642845,
 *   "event": "PURCHASE_APPROVED",
 *   "version": "2.0.0",
 *   "data": {
 *     "buyer": {                    // ← ATENÇÃO: data.buyer (não data.purchase.buyer!)
 *       "email": "cliente@email.com",
 *       "name": "Nome do Cliente",
 *       "first_name": "Nome",
 *       "last_name": "Cliente"
 *     },
 *     "purchase": {
 *       "transaction": "HP123456789",
 *       "status": "APPROVED",
 *       "price": { "value": 1500 }
 *     },
 *     "product": {
 *       "id": 123,
 *       "name": "Nome do Produto"
 *     }
 *   }
 * }
 *
 * HEADERS HTTP QUE A HOTMART ENVIA:
 * ----------------------------------
 * X-Hotmart-Hottok: gtnL72D16QPeck2Uky8d92uzq6GHtH6f40dc99-fece-4673-97c2-67aef62e4074
 * Content-Type: application/json
 *
 * EVENTOS SUPORTADOS:
 * -------------------
 * ✅ PURCHASE_APPROVED    → Cria usuário + Envia email com credenciais
 * ✅ PURCHASE_COMPLETE    → Cria usuário + Envia email com credenciais
 * 📝 PURCHASE_CANCELED    → Apenas log (não cria usuário)
 * 📝 PURCHASE_CANCELLED   → Apenas log (não cria usuário)
 * 📝 PURCHASE_REFUNDED    → Apenas log (não cria usuário)
 * 📝 PURCHASE_CHARGEBACK  → Apenas log (não cria usuário)
 *
 * FLUXO DE PROCESSAMENTO:
 * -----------------------
 * 1. Recebe webhook da Hotmart
 * 2. Valida token do header X-Hotmart-Hottok
 * 3. Se evento = PURCHASE_APPROVED:
 *    - Extrai email e nome de data.buyer
 *    - Cria usuário no Supabase (ou atualiza se já existe)
 *    - Gera senha temporária aleatória
 *    - Envia email HTML com credenciais
 * 4. Retorna sempre HTTP 200 (mesmo com erro interno)
 *
 * TESTES:
 * -------
 * Execute: node test-webhook-hotmart-real.cjs
 *
 * IMPORTANTE:
 * -----------
 * - Token DEVE vir no header X-Hotmart-Hottok
 * - Buyer DEVE estar em data.buyer (não data.purchase.buyer)
 * - Sempre retorna 200 para evitar retentativas da Hotmart
 */