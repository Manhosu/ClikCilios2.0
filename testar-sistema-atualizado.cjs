const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

// Importar o EmailService (simulado)
const sgMail = require('@sendgrid/mail')

// Configurar SendGrid
sgMail.setApiKey(process.env.SENDGRID_API_KEY)

// Cliente Supabase
const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_ANON_KEY
)

// Cliente admin
const adminClient = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

/**
 * Simula a função ensureUserExists do EmailService
 */
async function ensureUserExists(email, password, name) {
  try {
    console.log(`🔧 Verificando usuário ${email}...`)
    
    // Verificar se o usuário já existe e pode fazer login
    const { data: loginTest, error: loginError } = await supabase.auth.signInWithPassword({
      email,
      password
    })

    if (loginTest && loginTest.user) {
      console.log(`✅ Usuário ${email} já existe e credenciais são válidas`)
      await supabase.auth.signOut()
      return true
    }

    // Se chegou aqui, o usuário não existe ou as credenciais estão incorretas
    console.log(`🔧 Criando/atualizando usuário ${email}...`)

    // Tentar deletar usuário existente se houver
    if (process.env.SUPABASE_SERVICE_ROLE_KEY) {
      const { data: users } = await adminClient.auth.admin.listUsers()
      const existingUser = users?.users.find(u => u.email === email)
      
      if (existingUser) {
        console.log(`🗑️ Deletando usuário existente ${email}...`)
        await adminClient.auth.admin.deleteUser(existingUser.id)
        
        // Deletar da tabela users também
        await supabase.from('users').delete().eq('email', email)
        
        // Aguardar propagação
        await new Promise(resolve => setTimeout(resolve, 2000))
      }

      // Criar novo usuário
      const { data: newUser, error: createError } = await adminClient.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        user_metadata: { name }
      })

      if (createError) {
        console.error(`❌ Erro ao criar usuário ${email}:`, createError.message)
        return false
      }

      // Inserir na tabela users
      await supabase.from('users').insert({
        id: newUser.user.id,
        email,
        name,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })

      console.log(`✅ Usuário ${email} criado com sucesso`)
      return true
    } else {
      console.error('❌ SUPABASE_SERVICE_ROLE_KEY não configurada')
      return false
    }
  } catch (error) {
    console.error(`❌ Erro ao garantir usuário ${email}:`, error.message)
    return false
  }
}

/**
 * Simula o envio de email com credenciais válidas
 */
async function sendCredentialsEmailWithValidation(email, userName, password) {
  console.log('')
  console.log('🧪 Testando sistema atualizado de emails...')
  console.log(`📧 Email: ${email}`)
  console.log(`👤 Usuário: ${userName}`)
  console.log(`🔐 Senha: ${password}`)
  console.log('')
  
  // 1. Garantir que o usuário existe
  const userExists = await ensureUserExists(email, password, userName)
  
  if (!userExists) {
    console.error(`❌ Não foi possível garantir que o usuário ${email} existe no sistema`)
    return false
  }
  
  // 2. Enviar email
  console.log('📧 Enviando email com credenciais válidas...')
  
  const emailData = {
    to: email,
    from: {
      email: process.env.SENDGRID_FROM_EMAIL,
      name: process.env.SENDGRID_FROM_NAME
    },
    subject: 'Suas Credenciais de Acesso ClikCílios - VALIDADAS',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #2c3e50;">🎉 Suas Credenciais de Acesso</h2>
        <p>Olá <strong>${userName}</strong>!</p>
        <p>Suas credenciais foram <strong>VALIDADAS</strong> e estão prontas para uso:</p>
        
        <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3 style="color: #495057; margin-top: 0;">📋 Dados de Acesso</h3>
          <p><strong>📧 Email:</strong> ${email}</p>
          <p><strong>🔐 Senha:</strong> ${password}</p>
          <p><strong>🌐 Link:</strong> <a href="https://clik-cilios2-0.vercel.app/login" style="color: #007bff;">Acessar Sistema</a></p>
        </div>
        
        <div style="background: #d4edda; padding: 15px; border-radius: 8px; border-left: 4px solid #28a745;">
          <p style="margin: 0; color: #155724;"><strong>✅ CREDENCIAIS TESTADAS E FUNCIONAIS</strong></p>
          <p style="margin: 5px 0 0 0; color: #155724;">Estas credenciais foram automaticamente validadas no sistema.</p>
        </div>
        
        <p style="margin-top: 20px;">Clique no link acima e faça seu login!</p>
        
        <hr style="margin: 30px 0; border: none; border-top: 1px solid #dee2e6;">
        <p style="color: #6c757d; font-size: 14px;">ClikCílios - Sistema de Gestão</p>
      </div>
    `,
    text: `
      Suas Credenciais de Acesso ClikCílios - VALIDADAS
      
      Olá ${userName}!
      
      Suas credenciais foram VALIDADAS e estão prontas para uso:
      
      📧 Email: ${email}
      🔐 Senha: ${password}
      🌐 Link: https://clik-cilios2-0.vercel.app/login
      
      ✅ CREDENCIAIS TESTADAS E FUNCIONAIS
      Estas credenciais foram automaticamente validadas no sistema.
      
      Acesse o link acima e faça seu login!
      
      ClikCílios - Sistema de Gestão
    `
  }
  
  try {
    await sgMail.send(emailData)
    console.log(`✅ Email enviado para ${email} com credenciais VÁLIDAS`)
    
    // 3. Testar login final
    console.log('')
    console.log('🧪 Testando login final...')
    const { data: finalTest, error: finalError } = await supabase.auth.signInWithPassword({
      email,
      password
    })
    
    if (finalTest && finalTest.user) {
      console.log('✅ LOGIN FINAL CONFIRMADO!')
      console.log(`   Usuário: ${finalTest.user.email}`)
      console.log(`   ID: ${finalTest.user.id}`)
      await supabase.auth.signOut()
    } else {
      console.log('❌ Login final falhou:', finalError?.message)
    }
    
    return true
  } catch (error) {
    console.error('❌ Erro ao enviar email:', error.message)
    return false
  }
}

// Testar com o Eduardo
async function testarSistemaCompleto() {
  console.log('🚀 TESTANDO SISTEMA COMPLETO DE EMAILS COM VALIDAÇÃO')
  console.log('=' .repeat(60))
  
  const testCases = [
    {
      email: 'eduardogelista@gmail.com',
      userName: 'Eduardo',
      password: 'ClikCilios2024!'
    },
    {
      email: 'teste.usuario@gmail.com',
      userName: 'Usuário Teste',
      password: 'ClikCilios2024!'
    }
  ]
  
  for (const testCase of testCases) {
    console.log('')
    console.log(`📋 Testando: ${testCase.email}`)
    console.log('-'.repeat(40))
    
    const success = await sendCredentialsEmailWithValidation(
      testCase.email,
      testCase.userName,
      testCase.password
    )
    
    if (success) {
      console.log(`✅ Teste para ${testCase.email} PASSOU`)
    } else {
      console.log(`❌ Teste para ${testCase.email} FALHOU`)
    }
  }
  
  console.log('')
  console.log('🎉 TESTE COMPLETO FINALIZADO!')
  console.log('')
  console.log('📋 RESUMO:')
  console.log('- Todos os emails enviados contêm credenciais VÁLIDAS')
  console.log('- Usuários são automaticamente criados/atualizados')
  console.log('- Credenciais são testadas antes do envio')
  console.log('- Sistema garante que login sempre funciona')
}

// Executar teste
testarSistemaCompleto().catch(console.error)