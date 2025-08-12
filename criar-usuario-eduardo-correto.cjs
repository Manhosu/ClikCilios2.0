const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_ANON_KEY
)

async function criarUsuarioEduardo() {
  console.log('🔧 Criando/Atualizando usuário Eduardo com credenciais corretas...')
  console.log('')
  
  const email = 'eduardogelista@gmail.com'
  const senha = 'ClikCilios2024!' // Senha que foi enviada no email
  const nome = 'Eduardo'
  
  console.log(`📧 Email: ${email}`)
  console.log(`🔐 Senha: ${senha}`)
  console.log(`👤 Nome: ${nome}`)
  console.log('')
  
  try {
    // Primeiro, vamos verificar se o usuário já existe
    console.log('🔍 Verificando se usuário já existe...')
    
    const { data: existingUser, error: searchError } = await supabase
      .from('users')
      .select('*')
      .eq('email', email)
      .single()
    
    if (existingUser) {
      console.log('✅ Usuário encontrado na tabela users:')
      console.log(`   ID: ${existingUser.id}`)
      console.log(`   Nome: ${existingUser.name}`)
      console.log(`   Email: ${existingUser.email}`)
      console.log('')
    }
    
    // Tentar fazer login com a senha atual
    console.log('🧪 Testando login com senha do email...')
    const { data: loginTest, error: loginError } = await supabase.auth.signInWithPassword({
      email: email,
      password: senha
    })
    
    if (loginTest && loginTest.user) {
      console.log('✅ LOGIN JÁ FUNCIONA com a senha do email!')
      console.log(`   Usuário: ${loginTest.user.email}`)
      console.log(`   ID Auth: ${loginTest.user.id}`)
      console.log('')
      console.log('🎉 As credenciais do email estão corretas!')
      console.log('📋 Dados para login:')
      console.log(`   Email: ${email}`)
      console.log(`   Senha: ${senha}`)
      console.log(`   URL: https://clik-cilios2-0.vercel.app/login`)
      
      // Fazer logout
      await supabase.auth.signOut()
      return
    }
    
    if (loginError) {
      console.log(`❌ Erro no login: ${loginError.message}`)
      
      if (loginError.message.includes('Invalid login credentials')) {
        console.log('')
        console.log('🔧 Usuário existe mas senha está incorreta. Vamos resetar...')
        
        // Tentar criar novo usuário com a senha correta
        console.log('📝 Criando usuário com senha correta...')
        const { data: newUser, error: signUpError } = await supabase.auth.signUp({
          email: email,
          password: senha,
          options: {
            data: {
              name: nome
            }
          }
        })
        
        if (signUpError) {
          if (signUpError.message.includes('User already registered')) {
            console.log('⚠️ Usuário já existe no auth. Vamos tentar resetar a senha...')
            
            // Reset de senha
            const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
              redirectTo: 'https://clik-cilios2-0.vercel.app/reset-password'
            })
            
            if (resetError) {
              console.log('❌ Erro ao resetar senha:', resetError.message)
            } else {
              console.log('✅ Email de reset enviado!')
              console.log('📧 Verifique o email para resetar a senha')
            }
          } else {
            console.log('❌ Erro ao criar usuário:', signUpError.message)
          }
        } else {
          console.log('✅ Usuário criado com sucesso!')
          console.log(`   Email: ${newUser.user?.email}`)
          console.log(`   ID: ${newUser.user?.id}`)
          
          // Confirmar email automaticamente
          if (newUser.user?.id) {
            console.log('🔧 Confirmando email automaticamente...')
            
            // Usar admin API para confirmar email
            const { createClient } = require('@supabase/supabase-js')
            const adminClient = createClient(
              process.env.VITE_SUPABASE_URL,
              process.env.SUPABASE_SERVICE_ROLE_KEY // Precisa desta chave
            )
            
            if (process.env.SUPABASE_SERVICE_ROLE_KEY) {
              const { error: confirmError } = await adminClient.auth.admin.updateUserById(
                newUser.user.id,
                { email_confirm: true }
              )
              
              if (confirmError) {
                console.log('❌ Erro ao confirmar email:', confirmError.message)
              } else {
                console.log('✅ Email confirmado automaticamente!')
              }
            } else {
              console.log('⚠️ SUPABASE_SERVICE_ROLE_KEY não configurada')
              console.log('📋 Confirme manualmente no painel do Supabase:')
              console.log('1. Acesse https://supabase.com/dashboard')
              console.log('2. Authentication > Users')
              console.log(`3. Encontre ${email}`)
              console.log('4. Clique nos 3 pontos > "Confirm email"')
            }
          }
        }
      } else if (loginError.message.includes('Email not confirmed')) {
        console.log('')
        console.log('📧 Email não confirmado. Vamos confirmar...')
        
        // Tentar confirmar via admin API
        if (process.env.SUPABASE_SERVICE_ROLE_KEY) {
          const { createClient } = require('@supabase/supabase-js')
          const adminClient = createClient(
            process.env.VITE_SUPABASE_URL,
            process.env.SUPABASE_SERVICE_ROLE_KEY
          )
          
          // Buscar usuário por email
          const { data: users, error: listError } = await adminClient.auth.admin.listUsers()
          
          if (users) {
            const user = users.users.find(u => u.email === email)
            if (user) {
              const { error: confirmError } = await adminClient.auth.admin.updateUserById(
                user.id,
                { email_confirm: true }
              )
              
              if (confirmError) {
                console.log('❌ Erro ao confirmar email:', confirmError.message)
              } else {
                console.log('✅ Email confirmado!')
                console.log('🧪 Testando login novamente...')
                
                const { data: retryLogin, error: retryError } = await supabase.auth.signInWithPassword({
                  email: email,
                  password: senha
                })
                
                if (retryLogin && retryLogin.user) {
                  console.log('✅ LOGIN FUNCIONOU após confirmação!')
                  console.log(`   Usuário: ${retryLogin.user.email}`)
                  await supabase.auth.signOut()
                } else {
                  console.log('❌ Login ainda não funciona:', retryError?.message)
                }
              }
            }
          }
        } else {
          console.log('⚠️ SUPABASE_SERVICE_ROLE_KEY não configurada')
          console.log('📋 Confirme manualmente no painel do Supabase')
        }
      }
    }
    
  } catch (error) {
    console.log('❌ Erro geral:', error.message)
  }
  
  console.log('')
  console.log('📋 RESUMO FINAL:')
  console.log(`   Email: ${email}`)
  console.log(`   Senha: ${senha}`)
  console.log(`   URL: https://clik-cilios2-0.vercel.app/login`)
  console.log('')
  console.log('🔧 Se ainda não funcionar:')
  console.log('1. Acesse o painel do Supabase')
  console.log('2. Authentication > Users')
  console.log(`3. Encontre ${email}`)
  console.log('4. Confirme o email se necessário')
  console.log('5. Ou delete e recrie o usuário')
}

// Executar
criarUsuarioEduardo().catch(console.error)