const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

// Configuração do Supabase
const supabaseUrl = process.env.VITE_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Variáveis de ambiente não configuradas')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function corrigirUsuariosOrfaos() {
  console.log('🔧 CORRIGINDO USUÁRIOS ÓRFÃOS')
  console.log('=' .repeat(50))
  
  try {
    // 1. Buscar todos os usuários do Auth
    console.log('\n1️⃣ Buscando usuários do Auth...')
    const { data: authUsers, error: authError } = await supabase.auth.admin.listUsers()
    
    if (authError) {
      console.error('❌ Erro ao listar usuários do Auth:', authError.message)
      return
    }
    
    console.log(`✅ Encontrados ${authUsers.users.length} usuários no Auth`)
    
    // 2. Buscar todos os usuários da tabela users
    console.log('\n2️⃣ Buscando usuários da tabela users...')
    const { data: tableUsers, error: tableError } = await supabase
      .from('users')
      .select('id, email')
    
    if (tableError) {
      console.error('❌ Erro ao acessar tabela users:', tableError.message)
      return
    }
    
    console.log(`✅ Encontrados ${tableUsers.length} usuários na tabela users`)
    
    // 3. Identificar usuários órfãos (existem no Auth mas não na tabela)
    const tableUserIds = new Set(tableUsers.map(u => u.id))
    const orphanUsers = authUsers.users.filter(u => !tableUserIds.has(u.id))
    
    console.log(`\n3️⃣ Encontrados ${orphanUsers.length} usuários órfãos`)
    
    if (orphanUsers.length === 0) {
      console.log('✅ Não há usuários órfãos para corrigir!')
      return
    }
    
    // 4. Criar registros na tabela users para usuários órfãos
    console.log('\n4️⃣ Criando registros na tabela users...')
    
    let sucessos = 0
    let erros = 0
    
    for (const authUser of orphanUsers) {
      try {
        const userData = {
          id: authUser.id,
          email: authUser.email,
          nome: authUser.user_metadata?.nome || 
                authUser.raw_user_meta_data?.nome || 
                authUser.email.split('@')[0],
          is_admin: false,
          onboarding_completed: false,
          created_at: authUser.created_at,
          updated_at: new Date().toISOString()
        }
        
        const { error: insertError } = await supabase
          .from('users')
          .insert(userData)
        
        if (insertError) {
          console.log(`❌ Erro ao criar usuário ${authUser.email}:`, insertError.message)
          erros++
        } else {
          console.log(`✅ Usuário criado: ${authUser.email}`)
          sucessos++
        }
        
        // Pequena pausa para evitar rate limiting
        await new Promise(resolve => setTimeout(resolve, 100))
        
      } catch (error) {
        console.log(`❌ Erro inesperado para ${authUser.email}:`, error.message)
        erros++
      }
    }
    
    console.log(`\n📊 RESULTADO:`)
    console.log(`   ✅ Sucessos: ${sucessos}`)
    console.log(`   ❌ Erros: ${erros}`)
    
    // 5. Verificar se o trigger está funcionando
    console.log('\n5️⃣ Testando trigger para novos usuários...')
    
    const testEmail = `teste.trigger.${Date.now()}@example.com`
    const testPassword = 'TesteSeguro123!'
    
    console.log(`📧 Criando usuário de teste: ${testEmail}`)
    
    const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
      email: testEmail,
      password: testPassword,
      options: {
        data: {
          nome: 'Teste Trigger'
        }
      }
    })
    
    if (signUpError) {
      console.log('❌ Erro ao criar usuário de teste:', signUpError.message)
    } else if (signUpData.user) {
      console.log('✅ Usuário criado no Auth')
      
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
        console.log('❌ PROBLEMA: Trigger não está funcionando!')
        console.log('   O usuário não foi criado automaticamente na tabela users')
        console.log('   Isso pode causar problemas de login para novos usuários')
        
        // Criar manualmente para não deixar órfão
        const { error: manualError } = await supabase
          .from('users')
          .insert({
            id: signUpData.user.id,
            email: testEmail,
            nome: 'Teste Trigger',
            is_admin: false,
            onboarding_completed: false
          })
        
        if (!manualError) {
          console.log('✅ Usuário criado manualmente')
        }
      } else {
        console.log('✅ Trigger funcionando corretamente!')
      }
      
      // Limpar usuário de teste
      await supabase.auth.admin.deleteUser(signUpData.user.id)
      await supabase.from('users').delete().eq('id', signUpData.user.id)
      console.log('🧹 Usuário de teste removido')
    }
    
    // 6. Testar login com usuário real
    console.log('\n6️⃣ Testando login com usuário real...')
    
    // Pegar um usuário que agora deve existir em ambas as tabelas
    const { data: testUsers, error: testUsersError } = await supabase
      .from('users')
      .select('id, email')
      .limit(1)
    
    if (testUsersError || !testUsers || testUsers.length === 0) {
      console.log('❌ Não foi possível encontrar usuário para teste de login')
    } else {
      const testUser = testUsers[0]
      console.log(`🧪 Testando com usuário: ${testUser.email}`)
      
      // Verificar se o usuário existe no Auth
      const { data: authUser, error: authUserError } = await supabase.auth.admin.getUserById(testUser.id)
      
      if (authUserError || !authUser.user) {
        console.log('❌ Usuário não encontrado no Auth')
      } else {
        console.log('✅ Usuário existe em ambas as tabelas')
        console.log('   O login deve funcionar corretamente agora')
      }
    }
    
    console.log('\n🎉 CORREÇÃO CONCLUÍDA!')
    console.log('\n📋 PRÓXIMOS PASSOS:')
    console.log('1. Teste o login no frontend')
    console.log('2. Se ainda houver problemas, verifique:')
    console.log('   - Se o trigger está ativo no Supabase')
    console.log('   - Se as políticas RLS estão corretas')
    console.log('   - Se não há erros no console do navegador')
    
  } catch (error) {
    console.error('❌ Erro durante correção:', error.message)
  }
}

// Executar correção
corrigirUsuariosOrfaos().catch(console.error)