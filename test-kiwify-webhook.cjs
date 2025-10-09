#!/usr/bin/env node

/**
 * Script de Teste - Webhook Kiwify
 *
 * Testa o fluxo completo de criação de usuário e envio de email
 * simulando uma compra no Kiwify
 *
 * Uso:
 *   node test-kiwify-webhook.cjs email@teste.com "Nome Completo"
 */

require('dotenv').config()
const { createClient } = require('@supabase/supabase-js')

const SUPABASE_URL = process.env.VITE_SUPABASE_URL
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY
const SENDGRID_API_KEY = process.env.SENDGRID_API_KEY
const SENDGRID_FROM_EMAIL = process.env.SENDGRID_FROM_EMAIL || 'carinaprange86@gmail.com'
const SENDGRID_FROM_NAME = process.env.SENDGRID_FROM_NAME || 'CíliosClick'
const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://clik-cilios2-0.vercel.app'

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

function gerarSenhaTemporaria() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789!@#$'
  let senha = ''
  for (let i = 0; i < 12; i++) {
    senha += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return senha
}

function credentialsEmailTemplate(data) {
  const { userName, userEmail, password, loginUrl } = data

  const subject = '🔐 Suas credenciais de acesso - CíliosClick'

  const htmlContent = `
<!DOCTYPE html>
<html lang="pt-BR">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Suas Credenciais - CíliosClick</title>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap" rel="stylesheet">
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }

        body {
            font-family: 'Inter', system-ui, sans-serif;
            background: linear-gradient(135deg, #fef2f8 0%, #faf5ff 100%);
            padding: 20px;
            line-height: 1.6;
        }

        .container {
            max-width: 600px;
            margin: 0 auto;
            background: white;
            border-radius: 24px;
            box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05);
            overflow: hidden;
        }

        .header {
            background: linear-gradient(135deg, #ec4899 0%, #a855f7 100%);
            padding: 40px 30px;
            text-align: center;
            color: white;
        }

        .logo {
            font-size: 32px;
            font-weight: 700;
            margin-bottom: 10px;
            letter-spacing: -0.5px;
        }

        .subtitle {
            font-size: 16px;
            opacity: 0.9;
            font-weight: 400;
        }

        .content {
            padding: 40px 30px;
        }

        .welcome-text {
            font-size: 24px;
            font-weight: 600;
            color: #1f1f1f;
            margin-bottom: 20px;
            text-align: center;
        }

        .description {
            font-size: 16px;
            color: #525252;
            margin-bottom: 30px;
            text-align: center;
            line-height: 1.7;
        }

        .credentials-card {
            background: linear-gradient(135deg, #fef2f8 0%, #faf5ff 100%);
            border-radius: 16px;
            padding: 30px;
            margin: 30px 0;
            border: 1px solid rgba(236, 72, 153, 0.1);
        }

        .credential-item {
            margin-bottom: 20px;
        }

        .credential-label {
            font-size: 14px;
            font-weight: 600;
            color: #7c3aed;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            margin-bottom: 8px;
        }

        .credential-value {
            font-size: 18px;
            font-weight: 600;
            color: #1f1f1f;
            background: white;
            padding: 12px 16px;
            border-radius: 12px;
            border: 2px solid #e9d5ff;
            font-family: 'Courier New', monospace;
            word-break: break-all;
        }

        .login-button {
            display: inline-block;
            background: linear-gradient(135deg, #ec4899 0%, #a855f7 100%);
            color: white;
            text-decoration: none;
            padding: 16px 32px;
            border-radius: 16px;
            font-weight: 600;
            font-size: 16px;
            text-align: center;
            margin: 20px auto;
            display: block;
            max-width: 200px;
            transition: all 0.2s ease;
            box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
        }

        .security-notice {
            background: #fffbeb;
            border: 1px solid #fde68a;
            border-radius: 12px;
            padding: 20px;
            margin: 30px 0;
        }

        .security-title {
            font-size: 16px;
            font-weight: 600;
            color: #92400e;
            margin-bottom: 10px;
        }

        .security-text {
            font-size: 14px;
            color: #78350f;
            line-height: 1.6;
        }

        .footer {
            background: #fafafa;
            padding: 30px;
            text-align: center;
            border-top: 1px solid #e5e5e5;
        }

        .footer-text {
            font-size: 14px;
            color: #737373;
            margin-bottom: 15px;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <div class="logo">CíliosClick</div>
            <div class="subtitle">Sua plataforma de beleza digital</div>
        </div>

        <div class="content">
            <h1 class="welcome-text">Bem-vinda, ${userName}! 🎉</h1>

            <p class="description">
                Sua conta foi criada com sucesso! Agora você tem acesso completo à plataforma CíliosClick.
                Use as credenciais abaixo para fazer seu primeiro login.
            </p>

            <div class="credentials-card">
                <div class="credential-item">
                    <div class="credential-label">Email de Acesso</div>
                    <div class="credential-value">${userEmail}</div>
                </div>

                <div class="credential-item">
                     <div class="credential-label">Senha Temporária</div>
                     <div class="credential-value">${password}</div>
                 </div>
            </div>

            <a href="${loginUrl}" class="login-button">
                Acessar Plataforma
            </a>

            <div class="security-notice">
                <div class="security-title">
                    🔒 Importante - Segurança da sua conta
                </div>
                <div class="security-text">
                    • Esta é uma senha temporária gerada automaticamente<br>
                    • Recomendamos alterar sua senha no primeiro acesso<br>
                    • Nunca compartilhe suas credenciais com terceiros<br>
                    • Em caso de dúvidas, entre em contato conosco
                </div>
            </div>

            <p class="description">
                Estamos muito felizes em tê-la conosco! Explore todas as funcionalidades da plataforma e
                transforme sua experiência com cílios digitais.
            </p>
        </div>

        <div class="footer">
            <p class="footer-text">
                Este email foi enviado automaticamente pelo sistema CíliosClick.<br>
                Se você não solicitou esta conta, pode ignorar este email.
            </p>

            <p class="footer-text" style="margin-top: 20px; font-size: 12px;">
                © ${new Date().getFullYear()} CíliosClick. Todos os direitos reservados.
            </p>
        </div>
    </div>
</body>
</html>
  `

  const textContent = `
Olá, ${userName}!

Sua conta foi criada com sucesso! Agora você tem acesso completo à plataforma CíliosClick.

🔑 SEUS DADOS DE ACESSO:
URL: ${loginUrl}
E-mail: ${userEmail}
Senha Temporária: ${password}

🔒 IMPORTANTE: Por segurança, recomendamos que você altere sua senha após o primeiro login.

🚀 PRIMEIROS PASSOS:
1. Faça login com suas credenciais
2. Altere sua senha nas configurações
3. Explore a plataforma e comece a aplicar cílios
4. Teste com algumas fotos para se familiarizar

Se tiver dúvidas, entre em contato com nosso suporte.

Bem-vinda à CíliosClick!
Equipe CíliosClick
  `

  return {
    subject,
    htmlContent,
    textContent
  }
}

async function enviarEmailCredenciais(email, nome, senha) {
  if (!SENDGRID_API_KEY) {
    console.log('⚠️  SendGrid não configurado - email não será enviado')
    console.log('   Configure SENDGRID_API_KEY no .env\n')
    return false
  }

  const loginUrl = `${APP_URL}/login`

  const emailTemplate = credentialsEmailTemplate({
    userName: nome,
    userEmail: email,
    password: senha,
    loginUrl: loginUrl
  })

  try {
    const response = await fetch('https://api.sendgrid.com/v3/mail/send', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${SENDGRID_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        personalizations: [{
          to: [{ email }],
          subject: emailTemplate.subject
        }],
        from: {
          email: SENDGRID_FROM_EMAIL,
          name: SENDGRID_FROM_NAME
        },
        content: [
          { type: 'text/plain', value: emailTemplate.textContent },
          { type: 'text/html', value: emailTemplate.htmlContent }
        ]
      })
    })

    if (response.ok) {
      console.log('✅ Email enviado com sucesso!')
      return true
    } else {
      const errorText = await response.text()
      console.error('❌ Erro ao enviar email:', response.status, errorText)
      return false
    }
  } catch (error) {
    console.error('❌ Erro ao enviar email:', error.message)
    return false
  }
}

async function testarWebhookKiwify(email, nome) {
  console.log('\n' + '='.repeat(60))
  console.log('🧪 TESTE - Webhook Kiwify')
  console.log('='.repeat(60))
  console.log(`\n📧 Email de teste: ${email}`)
  console.log(`👤 Nome: ${nome}\n`)

  // 1. Verificar configurações
  console.log('🔍 Verificando configurações...')
  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
    console.error('❌ Supabase não configurado!')
    return
  }
  console.log('✅ Supabase configurado')

  if (!SENDGRID_API_KEY) {
    console.warn('⚠️  SendGrid não configurado - email não será enviado')
  } else {
    console.log('✅ SendGrid configurado')
  }

  // 2. Verificar se usuário já existe
  console.log('\n🔍 Verificando se usuário já existe...')
  const { data: existingUsers } = await supabase.auth.admin.listUsers()
  const userExists = existingUsers?.users?.find(u => u.email === email)

  if (userExists) {
    console.log('⚠️  Usuário já existe!')
    console.log(`   ID: ${userExists.id}`)
    console.log(`   Email: ${userExists.email}`)
    console.log('\n💡 Atualizando senha e reenviando email...\n')

    const novaSenha = gerarSenhaTemporaria()

    const { error: updateError } = await supabase.auth.admin.updateUserById(
      userExists.id,
      { password: novaSenha }
    )

    if (updateError) {
      console.error('❌ Erro ao atualizar senha:', updateError.message)
      return
    }

    console.log('✅ Senha atualizada')
    console.log(`\n📋 CREDENCIAIS:\n`)
    console.log(`   Email: ${email}`)
    console.log(`   Senha: ${novaSenha}`)
    console.log(`   Link: ${APP_URL}/login\n`)

    console.log('📧 Enviando email...')
    const emailEnviado = await enviarEmailCredenciais(email, nome, novaSenha)

    if (emailEnviado) {
      console.log('\n✅ TESTE CONCLUÍDO COM SUCESSO!')
      console.log(`\n📬 Verifique o email: ${email}`)
      console.log('   (Pode demorar alguns segundos para chegar)\n')
    } else {
      console.log('\n⚠️  Senha atualizada mas email não foi enviado')
      console.log('   Verifique configuração do SendGrid\n')
    }

    return
  }

  // 3. Criar novo usuário
  console.log('👤 Usuário não existe, criando...\n')

  const senha = gerarSenhaTemporaria()
  console.log(`🔑 Senha gerada: ${senha}`)

  console.log('\n📝 Criando usuário no Supabase Auth...')
  const { data: authUser, error: authError } = await supabase.auth.admin.createUser({
    email: email,
    password: senha,
    email_confirm: true,
    user_metadata: {
      nome: nome
    }
  })

  if (authError) {
    console.error('❌ Erro ao criar usuário:', authError.message)
    return
  }

  console.log('✅ Usuário criado no Auth')
  console.log(`   ID: ${authUser.user.id}`)

  console.log('\n📝 Criando perfil na tabela users...')
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
    console.error('⚠️  Erro ao criar perfil:', profileError.message)
    console.log('   (Usuário Auth criado, mas perfil falhou)')
  } else {
    console.log('✅ Perfil criado')
  }

  console.log(`\n📋 CREDENCIAIS CRIADAS:\n`)
  console.log(`   Email: ${email}`)
  console.log(`   Senha: ${senha}`)
  console.log(`   Link: ${APP_URL}/login\n`)

  console.log('📧 Enviando email com credenciais...')
  const emailEnviado = await enviarEmailCredenciais(email, nome, senha)

  if (emailEnviado) {
    console.log('\n✅ TESTE CONCLUÍDO COM SUCESSO!')
    console.log(`\n📬 Verifique o email: ${email}`)
    console.log('   (Pode demorar alguns segundos para chegar)')
    console.log('   Lembre-se de verificar a pasta de SPAM\n')
  } else {
    console.log('\n⚠️  Usuário criado mas email não foi enviado')
    console.log('   Verifique configuração do SendGrid\n')
  }
}

// Executar teste
const email = process.argv[2]
const nome = process.argv[3]

if (!email || !nome) {
  console.log('\n❌ Uso incorreto!\n')
  console.log('Uso correto:')
  console.log('  node test-kiwify-webhook.cjs email@teste.com "Nome Completo"\n')
  console.log('Exemplo:')
  console.log('  node test-kiwify-webhook.cjs eduardogelista@gmail.com "Eduardo Gelista"\n')
  process.exit(1)
}

testarWebhookKiwify(email, nome)
