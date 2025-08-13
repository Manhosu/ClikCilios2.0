const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

// Configuração do Supabase
const supabaseUrl = process.env.VITE_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Variáveis de ambiente não configuradas:')
  console.log('   VITE_SUPABASE_URL:', !!supabaseUrl)
  console.log('   SUPABASE_SERVICE_ROLE_KEY:', !!supabaseServiceKey)
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function diagnosticarProblemasAuth() {
  console.log('🔍 DIAGNÓSTICO DE PROBLEMAS DE AUTENTICAÇÃO')
  console.log('=' .repeat(60))
  
  try {
    // 1. Verificar usuários existentes
    console.log('\n1️⃣ Verificando usuários no Auth...')
    const { data: authUsers, error: authError } = await supabase.auth.admin.listUsers()
    
    if (authError) {
      console.error('❌ Erro ao listar usuários do Auth:', authError.message)
      return
    }
    
    console.log(`✅ Encontrados ${authUsers.users.length} usuários no Auth`)
    
    // 2. Verificar usuários na tabela users
    console.log('\n2️⃣ Verificando usuários na tabela users...')
    const { data: tableUsers, error: tableError } = await supabase
      .from('users')
      .select('*')
    
    if (tableError) {
      console.error('❌ Erro ao acessar tabela users:', tableError.message)
    } else {
      console.log(`✅ Encontrados ${tableUsers.length} usuários na tabela users`)
    }
    
    // 3. Verificar discrepâncias
    console.log('\n3️⃣ Analisando discrepâncias...')
    const authUserIds = new Set(authUsers.users.map(u => u.id))
    const tableUserIds = new Set(tableUsers?.map(u => u.id) || [])
    
    const authOnlyUsers = authUsers.users.filter(u => !tableUserIds.has(u.id))
    const tableOnlyUsers = tableUsers?.filter(u => !authUserIds.has(u.id)) || []
    
    if (authOnlyUsers.length > 0) {
      console.log(`⚠️  ${authOnlyUsers.length} usuários existem apenas no Auth:`)
      authOnlyUsers.forEach(user => {
        console.log(`   - ${user.email} (${user.id}) - Confirmado: ${user.email_confirmed_at ? 'SIM' : 'NÃO'}`)
      })
    }
    
    if (tableOnlyUsers.length > 0) {
      console.log(`⚠️  ${tableOnlyUsers.length} usuários existem apenas na tabela:`)
      tableOnlyUsers.forEach(user => {
        console.log(`   - ${user.email} (${user.id})`)
      })
    }
    
    // 4. Verificar trigger de criação automática
    console.log('\n4️⃣ Verificando trigger de criação automática...')
    const { data: triggers, error: triggerError } = await supabase
      .rpc('get_triggers_info')
      .catch(() => null)
    
    if (triggerError) {
      console.log('⚠️  Não foi possível verificar triggers automaticamente')
      console.log('   Verifique manualmente no painel do Supabase se o trigger "on_auth_user_created" existe')
    }
    
    // 5. Testar criação de usuário
    console.log('\n5️⃣ Testando criação de usuário...')
    const testEmail = `teste.diagnostico.${Date.now()}@gmail.com`
    const testPassword = 'TesteSeguro123!'
    const testNome = 'Usuário Teste Diagnóstico'
    
    console.log(`📧 Criando usuário de teste: ${testEmail}`)
    
    const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
      email: testEmail,
      password: testPassword,
      options: {
        data: {
          nome: testNome
        }
      }
    })
    
    if (signUpError) {
      console.error('❌ Erro ao criar usuário de teste:', signUpError.message)
    } else if (signUpData.user) {
      console.log('✅ Usuário criado no Auth:', signUpData.user.id)
      
      // Aguardar trigger
      console.log('⏳ Aguardando 3 segundos para o trigger...')
      await new Promise(resolve => setTimeout(resolve, 3000))
      
      // Verificar se foi criado na tabela
      const { data: newUserData, error: newUserError } = await supabase
        .from('users')
        .select('*')
        .eq('id', signUpData.user.id)
        .single()
      
      if (newUserError || !newUserData) {
        console.log('❌ PROBLEMA: Usuário não foi criado automaticamente na tabela users')
        console.log('   Isso indica que o trigger não está funcionando corretamente')
        
        // Tentar criar manualmente
        console.log('🔧 Tentando criar manualmente...')
        const { error: manualError } = await supabase
          .from('users')
          .insert({
            id: signUpData.user.id,
            email: testEmail,
            nome: testNome,
            is_admin: false,
            onboarding_completed: false
          })
        
        if (manualError) {
          console.error('❌ Erro ao criar manualmente:', manualError.message)
        } else {
          console.log('✅ Usuário criado manualmente na tabela users')
        }
      } else {
        console.log('✅ Usuário criado automaticamente na tabela users via trigger')
      }
      
      // Testar login
      console.log('\n6️⃣ Testando login...')
      const { data: loginData, error: loginError } = await supabase.auth.signInWithPassword({
        email: testEmail,
        password: testPassword
      })
      
      if (loginError) {
        console.log('❌ Erro no login:', loginError.message)
        if (loginError.message.includes('Email not confirmed')) {
          console.log('   Isso é normal - o email precisa ser confirmado')
          
          // Confirmar email automaticamente
          console.log('🔧 Confirmando email automaticamente...')
          const { error: confirmError } = await supabase.auth.admin.updateUserById(
            signUpData.user.id,
            { email_confirm: true }
          )
          
          if (confirmError) {
            console.error('❌ Erro ao confirmar email:', confirmError.message)
          } else {
            console.log('✅ Email confirmado')
            
            // Tentar login novamente
            const { data: retryLogin, error: retryError } = await supabase.auth.signInWithPassword({
              email: testEmail,
              password: testPassword
            })
            
            if (retryLogin && retryLogin.user) {
              console.log('✅ Login funcionou após confirmação!')
              await supabase.auth.signOut()
            } else {
              console.log('❌ Login ainda não funciona:', retryError?.message)
            }
          }
        }
      } else if (loginData.user) {
        console.log('✅ Login funcionou imediatamente!')
        await supabase.auth.signOut()
      }
      
      // Limpar usuário de teste
      console.log('🧹 Limpando usuário de teste...')
      await supabase.auth.admin.deleteUser(signUpData.user.id)
      await supabase.from('users').delete().eq('id', signUpData.user.id)
    }
    
    // 7. Verificar configurações RLS
    console.log('\n7️⃣ Verificando configurações RLS...')
    const { data: policies, error: policiesError } = await supabase
      .rpc('get_policies_info')
      .catch(() => null)
    
    if (policiesError) {
      console.log('⚠️  Não foi possível verificar políticas RLS automaticamente')
      console.log('   Verifique manualmente no painel do Supabase:')
      console.log('   1. Database > Tables > users')
      console.log('   2. Verifique se RLS está habilitado')
      console.log('   3. Verifique se existem políticas para SELECT, UPDATE e INSERT')
    }
    
    // 8. Resumo e recomendações
    console.log('\n📋 RESUMO E RECOMENDAÇÕES')
    console.log('=' .repeat(60))
    
    if (authOnlyUsers.length > 0) {
      console.log('\n🔧 AÇÃO NECESSÁRIA - Usuários órfãos no Auth:')
      console.log('1. Execute o script de migração para criar registros na tabela users')
      console.log('2. Ou configure o trigger corretamente')
    }
    
    if (tableOnlyUsers.length > 0) {
      console.log('\n🔧 AÇÃO NECESSÁRIA - Usuários órfãos na tabela:')
      console.log('1. Verifique se estes usuários devem existir')
      console.log('2. Considere removê-los se não tiverem correspondência no Auth')
    }
    
    console.log('\n✅ DIAGNÓSTICO CONCLUÍDO')
    console.log('\nPara resolver problemas de login loop:')
    console.log('1. Certifique-se de que todos os usuários existem em ambas as tabelas')
    console.log('2. Verifique se o trigger está funcionando para novos usuários')
    console.log('3. Confirme que as políticas RLS estão corretas')
    console.log('4. Teste o fluxo completo de registro → confirmação → login')
    
  } catch (error) {
    console.error('❌ Erro durante diagnóstico:', error.message)
  }
}

// Executar diagnóstico
diagnosticarProblemasAuth().catch(console.error)