#!/usr/bin/env node

/**
 * Script Administrativo - Reenviar Email com Credenciais
 *
 * Este script permite reenviar o email com credenciais de acesso
 * para usuários que não receberam o email inicial após a compra.
 *
 * Uso:
 *   node reenviar-credenciais.cjs email@cliente.com
 */

const { createClient } = require('@supabase/supabase-js')
const { credentialsEmailTemplate } = require('./api/emailTemplates')
require('dotenv').config()

// Configurações
const SUPABASE_URL = process.env.VITE_SUPABASE_URL
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY
const SENDGRID_API_KEY = process.env.SENDGRID_API_KEY
const SENDGRID_FROM_EMAIL = process.env.SENDGRID_FROM_EMAIL || 'carinaprange86@gmail.com'
const SENDGRID_FROM_NAME = process.env.SENDGRID_FROM_NAME || 'CíliosClick'
const APP_URL = process.env.NEXT_PUBLIC_APP_URL || process.env.VITE_APP_URL || 'https://clik-cilios2-0.vercel.app'

// Validar configurações
if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error('❌ Erro: Variáveis VITE_SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY são obrigatórias')
  console.error('   Configure no arquivo .env')
  process.exit(1)
}

if (!SENDGRID_API_KEY) {
  console.error('⚠️  Aviso: SENDGRID_API_KEY não configurada')
  console.error('   Email não será enviado! Configure no arquivo .env ou variáveis de ambiente.')
}

// Cliente Supabase
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

// Gerar senha temporária
function gerarSenhaTemporaria() {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%'
  let senha = ''
  for (let i = 0; i < 12; i++) {
    senha += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return senha
}

// Enviar email com credenciais
async function enviarEmailCredenciais(email, nome, senha) {
  if (!SENDGRID_API_KEY) {
    console.log('⚠️  SENDGRID_API_KEY não configurada - Simulando envio de email')
    console.log('\n📧 Credenciais que seriam enviadas:')
    console.log(`   Email: ${email}`)
    console.log(`   Senha: ${senha}`)
    console.log(`   Link: ${APP_URL}/login\n`)
    return false
  }

  const loginUrl = `${APP_URL}/login`

  // Usar template bonito do emailTemplates.js
  const emailTemplate = credentialsEmailTemplate({
    userName: nome,
    userEmail: email,
    password: senha,
    loginUrl: loginUrl
  })

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
            value: emailTemplate.textContent,
          },
          {
            type: 'text/html',
            value: emailTemplate.htmlContent,
          },
        ],
      }),
    })

    if (response.ok) {
      console.log(`✅ Email enviado com sucesso para ${email}`)
      return true
    } else {
      const errorData = await response.text()
      console.error(`❌ Erro ao enviar email (${response.status}):`, errorData)
      return false
    }
  } catch (error) {
    console.error('❌ Erro ao enviar email:', error.message)
    return false
  }
}

// Função principal
async function reenviarCredenciais(emailUsuario) {
  console.log('\n🔄 Iniciando reenvio de credenciais...\n')

  try {
    // 1. Buscar usuário no banco
    console.log(`🔍 Buscando usuário: ${emailUsuario}`)
    const { data: usuario, error: userError } = await supabase
      .from('users')
      .select('id, email, nome')
      .eq('email', emailUsuario.toLowerCase().trim())
      .single()

    if (userError || !usuario) {
      console.error('❌ Usuário não encontrado no banco de dados')
      console.error('   Email buscado:', emailUsuario)
      console.error('   Erro:', userError?.message || 'Nenhum resultado')
      return false
    }

    console.log('✅ Usuário encontrado:')
    console.log(`   ID: ${usuario.id}`)
    console.log(`   Nome: ${usuario.nome}`)
    console.log(`   Email: ${usuario.email}`)

    // 2. Gerar nova senha temporária
    console.log('\n🔐 Gerando nova senha temporária...')
    const novaSenha = gerarSenhaTemporaria()

    // 3. Atualizar senha no Supabase Auth
    console.log('🔄 Atualizando senha no Supabase Auth...')
    const { error: updateError } = await supabase.auth.admin.updateUserById(
      usuario.id,
      { password: novaSenha }
    )

    if (updateError) {
      console.error('❌ Erro ao atualizar senha:', updateError.message)
      return false
    }

    console.log('✅ Senha atualizada com sucesso')

    // 4. Enviar email com credenciais
    console.log('\n📧 Enviando email com credenciais...')
    const emailEnviado = await enviarEmailCredenciais(
      usuario.email,
      usuario.nome,
      novaSenha
    )

    if (emailEnviado) {
      console.log('\n✅ Processo concluído com sucesso!')
      console.log('\n📋 Resumo:')
      console.log(`   Usuário: ${usuario.nome}`)
      console.log(`   Email: ${usuario.email}`)
      console.log(`   Nova senha: ${novaSenha}`)
      console.log(`   Email enviado: Sim`)
    } else {
      console.log('\n⚠️  Senha atualizada mas email não foi enviado')
      console.log('   Configure SENDGRID_API_KEY para enviar emails')
      console.log('\n📋 Credenciais atualizadas:')
      console.log(`   Email: ${usuario.email}`)
      console.log(`   Senha: ${novaSenha}`)
      console.log('\n💡 Você pode copiar estas credenciais e enviar manualmente para o usuário')
    }

    return true

  } catch (error) {
    console.error('\n❌ Erro fatal:', error.message)
    console.error(error)
    return false
  }
}

// Execução do script
const emailArg = process.argv[2]

if (!emailArg) {
  console.error('\n❌ Erro: Email do usuário não fornecido')
  console.error('\nUso:')
  console.error('  node reenviar-credenciais.cjs email@cliente.com')
  console.error('\nExemplo:')
  console.error('  node reenviar-credenciais.cjs carinaprange86@gmail.com')
  process.exit(1)
}

// Executar
reenviarCredenciais(emailArg)
  .then(success => {
    process.exit(success ? 0 : 1)
  })
  .catch(error => {
    console.error('\n❌ Erro não tratado:', error)
    process.exit(1)
  })
