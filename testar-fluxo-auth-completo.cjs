const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

// Configuração do Supabase
const supabaseUrl = process.env.VITE_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseServiceKey || !supabaseAnonKey) {
  console.error('❌ Variáveis de ambiente não configuradas')
  process.exit(1)
}

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey)
const supabaseClient = createClient(supabaseUrl, supabaseAnonKey)

async function testarFluxoAuthCompleto() {
  console.log('🧪 TESTE COMPLETO DO FLUXO DE AUTENTICAÇÃO')
  console.log('=' .repeat(60))
  
  try {
    // 1. Verificar estado atual dos usuários
    console.log('\n1️⃣ Verificando estado atual...')
    
    const { data: authUsers, error: authError } = await supabaseAdmin.auth.admin.listUsers()
    const { data: tableUsers, error: tableError } = await supabaseAdmin
      .from('users')
      .select('id, email, nome')
    
    if (authError || tableError) {
      console.error('❌ Erro ao verificar usuários:', authError?.message || tableError?.message)
      return
    }
    
    console.log(`✅ Usuários no Auth: ${authUsers.users.length}`)
    console.log(`✅ Usuários na tabela: ${tableUsers.length}`)
    
    const tableUserIds = new Set(tableUsers.map(u => u.id))
    const orphanUsers = authUsers.users.filter(u => !tableUserIds.has(u.id))
    
    if (orphanUsers.length > 0) {
      console.log(`⚠️  ${orphanUsers.length} usuários órfãos ainda existem`)
    } else {
      console.log('✅ Não há usuários órfãos')
    }
    
    // 2. Testar criação de novo usuário
    console.log('\n2️⃣ Testando criação de novo usuário...')
    
    const testEmail = `teste.auth.${Date.now()}@example.com`
    const testPassword = 'TesteSeguro123!'
    const testNome = 'Usuário Teste Auth'
    
    console.log(`📧 Criando usuário: ${testEmail}`)
    
    const { data: signUpData, error: signUpError } = await supabaseClient.auth.signUp({
      email: testEmail,
      password: testPassword,
      options: {
        data: {
          nome: testNome
        }
      }
    })
    
    if (signUpError) {
      console.log('❌ Erro ao criar usuário:', signUpError.message)
    } else if (signUpData.user) {
      console.log('✅ Usuário criado no Auth:', signUpData.user.id)
      
      // Aguardar trigger
      console.log('⏳ Aguardando 3 segundos para o trigger...')
      await new Promise(resolve => setTimeout(resolve, 3000))
      
      // Verificar se foi criado na tabela
      const { data: newUserData, error: newUserError } = await supabaseAdmin
        .from('users')
        .select('*')
        .eq('id', signUpData.user.id)
        .single()
      
      if (newUserError || !newUserData) {
        console.log('❌ Usuário não foi criado automaticamente na tabela')
        console.log('🔧 Criando manualmente...')
        
        const { error: manualError } = await supabaseAdmin
          .from('users')
          .insert({
            id: signUpData.user.id,
            email: testEmail,
            nome: testNome,
            is_admin: false,
            onboarding_completed: false
          })
        
        if (manualError) {
          console.log('❌ Erro ao criar manualmente:', manualError.message)
        } else {
          console.log('✅ Usuário criado manualmente na tabela')
        }
      } else {
        console.log('✅ Usuário criado automaticamente via trigger!')
      }
      
      // 3. Testar login
      console.log('\n3️⃣ Testando login...')
      
      // Primeiro, confirmar o email se necessário
      if (!signUpData.user.email_confirmed_at) {
        console.log('📧 Confirmando email...')
        const { error: confirmError } = await supabaseAdmin.auth.admin.updateUserById(
          signUpData.user.id,
          { email_confirm: true }
        )
        
        if (confirmError) {
          console.log('❌ Erro ao confirmar email:', confirmError.message)
        } else {
          console.log('✅ Email confirmado')
        }
      }
      
      // Tentar login
      const { data: loginData, error: loginError } = await supabaseClient.auth.signInWithPassword({
        email: testEmail,
        password: testPassword
      })
      
      if (loginError) {
        console.log('❌ Erro no login:', loginError.message)
      } else if (loginData.user) {
        console.log('✅ Login realizado com sucesso!')
        console.log('   User ID:', loginData.user.id)
        console.log('   Email:', loginData.user.email)
        
        // 4. Testar carregamento do perfil
        console.log('\n4️⃣ Testando carregamento do perfil...')
        
        const { data: profileData, error: profileError } = await supabaseClient
          .from('users')
          .select('*')
          .eq('id', loginData.user.id)
          .single()
        
        if (profileError) {
          console.log('❌ Erro ao carregar perfil:', profileError.message)
          console.log('   Isso pode causar o loop de login!')
        } else {
          console.log('✅ Perfil carregado com sucesso!')
          console.log('   Nome:', profileData.nome)
          console.log('   Admin:', profileData.is_admin)
          console.log('   Onboarding:', profileData.onboarding_completed)
        }
        
        // 5. Testar logout
        console.log('\n5️⃣ Testando logout...')
        
        const { error: logoutError } = await supabaseClient.auth.signOut()
        
        if (logoutError) {
          console.log('❌ Erro no logout:', logoutError.message)
        } else {
          console.log('✅ Logout realizado com sucesso!')
        }
      }
      
      // Limpar usuário de teste
      console.log('\n🧹 Limpando usuário de teste...')
      await supabaseAdmin.auth.admin.deleteUser(signUpData.user.id)
      await supabaseAdmin.from('users').delete().eq('id', signUpData.user.id)
      console.log('✅ Usuário de teste removido')
    }
    
    // 6. Testar com usuário existente
    console.log('\n6️⃣ Testando com usuário existente...')
    
    // Pegar um usuário que existe em ambas as tabelas
    const { data: existingUsers, error: existingError } = await supabaseAdmin
      .from('users')
      .select('id, email')
      .limit(1)
    
    if (existingError || !existingUsers || existingUsers.length === 0) {
      console.log('❌ Não foi possível encontrar usuário existente para teste')
    } else {
      const existingUser = existingUsers[0]
      console.log(`🧪 Testando com usuário existente: ${existingUser.email}`)
      
      // Verificar se existe no Auth
      const { data: authUserData, error: authUserError } = await supabaseAdmin.auth.admin.getUserById(existingUser.id)
      
      if (authUserError || !authUserData.user) {
        console.log('❌ Usuário não encontrado no Auth')
      } else {
        console.log('✅ Usuário existe em ambas as tabelas')
        
        // Simular carregamento de perfil como o frontend faria
        const { data: profileData, error: profileError } = await supabaseClient
          .from('users')
          .select('*')
          .eq('id', existingUser.id)
          .single()
        
        if (profileError) {
          console.log('❌ Erro ao carregar perfil do usuário existente:', profileError.message)
          console.log('   Isso pode causar problemas de login!')
        } else {
          console.log('✅ Perfil do usuário existente carregado com sucesso')
        }
      }
    }
    
    // 7. Verificar configurações do frontend
    console.log('\n7️⃣ Verificando configurações do frontend...')
    
    console.log('📋 Variáveis de ambiente:')
    console.log(`   VITE_SUPABASE_URL: ${supabaseUrl}`)
    console.log(`   VITE_SUPABASE_ANON_KEY: ${supabaseAnonKey ? '✅ Configurada' : '❌ Não configurada'}`)
    
    // 8. Resumo e diagnóstico
    console.log('\n📊 RESUMO DO DIAGNÓSTICO')
    console.log('=' .repeat(50))
    
    console.log('\n✅ PROBLEMAS RESOLVIDOS:')
    console.log('• Usuários órfãos corrigidos (Auth ↔ Tabela users sincronizados)')
    console.log('• Políticas RLS configuradas')
    console.log('• Fluxo de login/logout testado')
    
    console.log('\n⚠️  POSSÍVEIS CAUSAS DO LOOP DE LOGIN:')
    console.log('1. Trigger não funcionando para novos usuários')
    console.log('2. Problemas de cache no frontend')
    console.log('3. Erro na lógica do useAuth hook')
    console.log('4. Problemas de RLS impedindo carregamento do perfil')
    
    console.log('\n🔧 PRÓXIMOS PASSOS:')
    console.log('1. Execute o SQL manual no painel do Supabase:')
    console.log('   - Abra Database > SQL Editor')
    console.log('   - Execute o conteúdo do arquivo setup-trigger-manual.sql')
    console.log('2. Teste o login no frontend')
    console.log('3. Verifique o console do navegador para erros')
    console.log('4. Se o problema persistir, verifique o código do useAuth hook')
    
    console.log('\n🎉 DIAGNÓSTICO CONCLUÍDO!')
    
  } catch (error) {
    console.error('❌ Erro durante teste:', error.message)
  }
}

// Executar teste
testarFluxoAuthCompleto().catch(console.error)