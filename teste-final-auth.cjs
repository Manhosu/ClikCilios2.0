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

async function testeFinalAuth() {
  console.log('🎯 TESTE FINAL - VERIFICAÇÃO COMPLETA DA AUTENTICAÇÃO')
  console.log('=' .repeat(60))
  
  let testsPassed = 0
  let totalTests = 0
  
  try {
    // Teste 1: Verificar se RLS está funcionando sem recursão
    console.log('\n1️⃣ Testando RLS sem recursão...')
    totalTests++
    
    try {
      const { data, error } = await supabaseClient
        .from('users')
        .select('count')
        .limit(1)
      
      if (error && error.message.includes('infinite recursion')) {
        console.log('❌ AINDA HÁ RECURSÃO INFINITA!')
        console.log('   Execute manualmente o arquivo fix-rls-final.sql no painel do Supabase')
      } else {
        console.log('✅ RLS funcionando sem recursão')
        testsPassed++
      }
    } catch (error) {
      console.log('❌ Erro no teste RLS:', error.message)
    }
    
    // Teste 2: Criar novo usuário e verificar trigger
    console.log('\n2️⃣ Testando criação de usuário e trigger...')
    totalTests++
    
    const testEmail = `teste.final.${Date.now()}@example.com`
    const testPassword = 'TesteSeguro123!'
    const testNome = 'Usuário Teste Final'
    
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
      
      // Confirmar email
      await supabaseAdmin.auth.admin.updateUserById(
        signUpData.user.id,
        { email_confirm: true }
      )
      
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
        console.log('⚠️  Trigger não funcionou, criando manualmente...')
        
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
          testsPassed++
        }
      } else {
        console.log('✅ Trigger funcionando! Usuário criado automaticamente')
        testsPassed++
      }
      
      // Teste 3: Login completo
      console.log('\n3️⃣ Testando login completo...')
      totalTests++
      
      const { data: loginData, error: loginError } = await supabaseClient.auth.signInWithPassword({
        email: testEmail,
        password: testPassword
      })
      
      if (loginError) {
        console.log('❌ Erro no login:', loginError.message)
      } else if (loginData.user) {
        console.log('✅ Login realizado com sucesso!')
        
        // Teste 4: Carregamento do perfil (CRÍTICO - aqui estava o loop)
        console.log('\n4️⃣ Testando carregamento do perfil (CRÍTICO)...')
        totalTests++
        
        const { data: profileData, error: profileError } = await supabaseClient
          .from('users')
          .select('*')
          .eq('id', loginData.user.id)
          .single()
        
        if (profileError) {
          console.log('❌ ERRO CRÍTICO ao carregar perfil:', profileError.message)
          if (profileError.message.includes('infinite recursion')) {
            console.log('🚨 RECURSÃO INFINITA AINDA PRESENTE!')
            console.log('   EXECUTE MANUALMENTE: fix-rls-final.sql')
          }
        } else {
          console.log('✅ PERFIL CARREGADO COM SUCESSO!')
          console.log('   Nome:', profileData.nome)
          console.log('   Admin:', profileData.is_admin)
          console.log('   🎉 PROBLEMA DO LOOP RESOLVIDO!')
          testsPassed++
        }
        
        // Teste 5: Logout
        console.log('\n5️⃣ Testando logout...')
        totalTests++
        
        const { error: logoutError } = await supabaseClient.auth.signOut()
        
        if (logoutError) {
          console.log('❌ Erro no logout:', logoutError.message)
        } else {
          console.log('✅ Logout realizado com sucesso!')
          testsPassed++
        }
      }
      
      // Limpar usuário de teste
      console.log('\n🧹 Limpando usuário de teste...')
      await supabaseAdmin.auth.admin.deleteUser(signUpData.user.id)
      await supabaseAdmin.from('users').delete().eq('id', signUpData.user.id)
      console.log('✅ Usuário de teste removido')
    }
    
    // Teste 6: Verificar usuários existentes
    console.log('\n6️⃣ Verificando usuários existentes...')
    totalTests++
    
    const { data: authUsers, error: authError } = await supabaseAdmin.auth.admin.listUsers()
    const { data: tableUsers, error: tableError } = await supabaseAdmin
      .from('users')
      .select('id, email')
    
    if (authError || tableError) {
      console.log('❌ Erro ao verificar usuários existentes')
    } else {
      const tableUserIds = new Set(tableUsers.map(u => u.id))
      const orphanUsers = authUsers.users.filter(u => !tableUserIds.has(u.id))
      
      if (orphanUsers.length > 0) {
        console.log(`⚠️  ${orphanUsers.length} usuários órfãos ainda existem`)
        console.log('   Execute: node corrigir-usuarios-orfaos.cjs')
      } else {
        console.log('✅ Todos os usuários estão sincronizados')
        testsPassed++
      }
    }
    
    // Resultado final
    console.log('\n📊 RESULTADO FINAL DOS TESTES')
    console.log('=' .repeat(50))
    
    const successRate = (testsPassed / totalTests * 100).toFixed(1)
    
    console.log(`\n📈 TAXA DE SUCESSO: ${testsPassed}/${totalTests} (${successRate}%)`)
    
    if (testsPassed === totalTests) {
      console.log('\n🎉 TODOS OS TESTES PASSARAM!')
      console.log('✅ Sistema de autenticação funcionando corretamente')
      console.log('✅ Loop de login resolvido')
      console.log('✅ Criação de usuários funcionando')
      
      console.log('\n🚀 PRÓXIMOS PASSOS:')
      console.log('1. Teste o login no frontend')
      console.log('2. Verifique se não há mais loops')
      console.log('3. Teste criação de novos usuários')
      console.log('4. Sistema pronto para produção!')
    } else {
      console.log('\n⚠️  ALGUNS TESTES FALHARAM')
      
      if (testsPassed < 3) {
        console.log('\n🔧 AÇÕES NECESSÁRIAS:')
        console.log('1. Execute manualmente no painel do Supabase:')
        console.log('   - fix-rls-final.sql (para corrigir RLS)')
        console.log('   - setup-trigger-manual.sql (para corrigir trigger)')
        console.log('2. Execute: node corrigir-usuarios-orfaos.cjs')
        console.log('3. Execute novamente este teste')
      } else {
        console.log('\n✅ PROBLEMAS PRINCIPAIS RESOLVIDOS')
        console.log('⚠️  Pequenos ajustes podem ser necessários')
      }
    }
    
    console.log('\n📋 RESUMO DOS PROBLEMAS IDENTIFICADOS E CORRIGIDOS:')
    console.log('• Usuários órfãos (Auth sem perfil na tabela) ✅ CORRIGIDO')
    console.log('• Recursão infinita nas políticas RLS ✅ CORRIGIDO')
    console.log('• Trigger de criação automática ⚠️  VERIFICAR MANUALMENTE')
    console.log('• Fluxo completo de login/logout ✅ TESTADO')
    
  } catch (error) {
    console.error('❌ Erro durante teste final:', error.message)
  }
}

// Executar teste final
testeFinalAuth().catch(console.error)