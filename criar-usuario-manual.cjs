#!/usr/bin/env node

/**
 * Script para criar usuário manualmente no sistema
 *
 * Uso:
 *   node criar-usuario-manual.cjs email@cliente.com "Nome Completo"
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

async function criarUsuarioManual(email, nome) {
  console.log('\n🔧 Criando usuário manualmente...\n')
  console.log(`📧 Email: ${email}`)
  console.log(`👤 Nome: ${nome}\n`)

  // 1. Verificar se usuário já existe
  console.log('🔍 Verificando se usuário já existe...')
  const { data: existingUser } = await supabase.auth.admin.listUsers()
  const userExists = existingUser?.users?.find(u => u.email === email)

  if (userExists) {
    console.log('⚠️  Usuário já existe no sistema!')
    console.log(`   ID: ${userExists.id}`)

    // Gerar nova senha
    const novaSenha = gerarSenhaTemporaria()
    console.log('\n🔑 Gerando nova senha...')

    // Atualizar senha
    const { error: updateError } = await supabase.auth.admin.updateUserById(
      userExists.id,
      { password: novaSenha }
    )

    if (updateError) {
      console.error('❌ Erro ao atualizar senha:', updateError.message)
      return
    }

    console.log('✅ Senha atualizada com sucesso!')
    console.log(`\n📋 CREDENCIAIS:\n`)
    console.log(`   Email: ${email}`)
    console.log(`   Senha: ${novaSenha}`)
    console.log(`   Link: ${APP_URL}/login\n`)

    // Enviar email
    await enviarEmailCredenciais(email, nome, novaSenha)
    return
  }

  // 2. Gerar senha temporária
  const senha = gerarSenhaTemporaria()
  console.log(`🔑 Senha gerada: ${senha}`)

  // 3. Criar usuário no Auth
  console.log('\n👤 Criando usuário no Supabase Auth...')
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

  console.log('✅ Usuário criado no Auth!')
  console.log(`   ID: ${authUser.user.id}`)

  // 4. Criar perfil na tabela users
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
    console.error('❌ Erro ao criar perfil:', profileError.message)
    return
  }

  console.log('✅ Perfil criado com sucesso!')

  // 5. Exibir credenciais
  console.log(`\n📋 CREDENCIAIS CRIADAS:\n`)
  console.log(`   Email: ${email}`)
  console.log(`   Senha: ${senha}`)
  console.log(`   Link: ${APP_URL}/login\n`)

  // 6. Enviar email
  await enviarEmailCredenciais(email, nome, senha)
}

async function enviarEmailCredenciais(email, nome, senha) {
  if (!SENDGRID_API_KEY) {
    console.log('⚠️  SendGrid não configurado - email não será enviado')
    console.log('   Configure SENDGRID_API_KEY no .env para enviar emails\n')
    return
  }

  console.log('📧 Enviando email com credenciais...')

  const loginUrl = `${APP_URL}/login`

  const htmlContent = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #ec4899 0%, #a855f7 100%); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
        .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 8px 8px; }
        .credentials { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border: 2px solid #e9d5ff; }
        .button { display: inline-block; background: linear-gradient(135deg, #ec4899 0%, #a855f7 100%); color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; margin: 20px 0; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🎉 Bem-vinda, ${nome}!</h1>
        </div>
        <div class="content">
            <p>Sua conta foi criada com sucesso no <strong>CíliosClick</strong>!</p>

            <div class="credentials">
                <h3>🔐 Suas Credenciais de Acesso:</h3>
                <p><strong>Email:</strong> ${email}</p>
                <p><strong>Senha:</strong> <code>${senha}</code></p>
            </div>

            <a href="${loginUrl}" class="button">Acessar Plataforma</a>

            <p><small>💡 Por segurança, recomendamos alterar sua senha após o primeiro acesso.</small></p>
        </div>
    </div>
</body>
</html>
  `

  const textContent = `
Olá, ${nome}!

Sua conta foi criada com sucesso no CíliosClick!

🔐 SUAS CREDENCIAIS:
Email: ${email}
Senha: ${senha}

🔗 Link: ${loginUrl}

💡 Por segurança, recomendamos alterar sua senha após o primeiro acesso.

Bem-vinda!
Equipe CíliosClick
  `

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
          subject: '🔐 Suas credenciais de acesso - CíliosClick'
        }],
        from: {
          email: SENDGRID_FROM_EMAIL,
          name: SENDGRID_FROM_NAME
        },
        content: [
          { type: 'text/plain', value: textContent },
          { type: 'text/html', value: htmlContent }
        ]
      })
    })

    if (response.ok) {
      console.log('✅ Email enviado com sucesso!')
    } else {
      const errorText = await response.text()
      console.error('❌ Erro ao enviar email:', response.status, errorText)
    }
  } catch (error) {
    console.error('❌ Erro ao enviar email:', error.message)
  }

  console.log('\n✅ Processo concluído!\n')
}

// Executar
const email = process.argv[2]
const nome = process.argv[3]

if (!email || !nome) {
  console.log('\n❌ Uso incorreto!\n')
  console.log('Uso correto:')
  console.log('  node criar-usuario-manual.cjs email@cliente.com "Nome Completo"\n')
  console.log('Exemplo:')
  console.log('  node criar-usuario-manual.cjs morgancris67@gmail.com "Cristina Tivoli"\n')
  process.exit(1)
}

criarUsuarioManual(email, nome)
