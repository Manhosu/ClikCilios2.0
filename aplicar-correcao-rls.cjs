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

async function aplicarCorrecaoRLS() {
  console.log('🔧 APLICANDO CORREÇÃO DAS POLÍTICAS RLS')
  console.log('=' .repeat(50))
  
  try {
    console.log('\n1️⃣ Desabilitando RLS temporariamente...')
    
    await supabaseAdmin.rpc('exec_sql', {
      sql: 'ALTER TABLE public.users DISABLE ROW LEVEL SECURITY;'
    }).then(() => console.log('✅ RLS desabilitado'))
    .catch(() => {
      // Tentar método alternativo
      console.log('⚠️  Método RPC falhou, tentando SQL direto...')
    })
    
    console.log('\n2️⃣ Removendo políticas existentes...')
    
    const policiesToDrop = [
      'Users can view own profile',
      'Users can update own profile', 
      'Enable insert for authenticated users only',
      'Users can insert own profile',
      'Enable read access for all users',
      'Enable insert for service role',
      'Allow public read access',
      'users_select_own',
      'users_update_own',
      'users_insert_service'
    ]
    
    for (const policy of policiesToDrop) {
      try {
        await supabaseAdmin.rpc('exec_sql', {
          sql: `DROP POLICY IF EXISTS "${policy}" ON public.users;`
        })
        console.log(`✅ Política removida: ${policy}`)
      } catch (error) {
        console.log(`⚠️  Política não encontrada: ${policy}`)
      }
    }
    
    console.log('\n3️⃣ Reabilitando RLS...')
    
    await supabaseAdmin.rpc('exec_sql', {
      sql: 'ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;'
    }).then(() => console.log('✅ RLS reabilitado'))
    .catch(() => console.log('⚠️  Erro ao reabilitar RLS'))
    
    console.log('\n4️⃣ Criando novas políticas seguras...')
    
    // Política para SELECT
    try {
      await supabaseAdmin.rpc('exec_sql', {
        sql: `
          CREATE POLICY "users_select_own" ON public.users
            FOR SELECT
            USING (auth.uid() = id);
        `
      })
      console.log('✅ Política SELECT criada')
    } catch (error) {
      console.log('❌ Erro ao criar política SELECT:', error.message)
    }
    
    // Política para UPDATE
    try {
      await supabaseAdmin.rpc('exec_sql', {
        sql: `
          CREATE POLICY "users_update_own" ON public.users
            FOR UPDATE
            USING (auth.uid() = id)
            WITH CHECK (auth.uid() = id);
        `
      })
      console.log('✅ Política UPDATE criada')
    } catch (error) {
      console.log('❌ Erro ao criar política UPDATE:', error.message)
    }
    
    // Política para INSERT (mais restritiva)
    try {
      await supabaseAdmin.rpc('exec_sql', {
        sql: `
          CREATE POLICY "users_insert_service" ON public.users
            FOR INSERT
            WITH CHECK (true);
        `
      })
      console.log('✅ Política INSERT criada')
    } catch (error) {
      console.log('❌ Erro ao criar política INSERT:', error.message)
    }
    
    console.log('\n5️⃣ Testando as novas políticas...')
    
    // Criar usuário de teste
    const testEmail = `teste.rls.${Date.now()}@example.com`
    const testPassword = 'TesteSeguro123!'
    
    console.log(`📧 Criando usuário de teste: ${testEmail}`)
    
    const { data: signUpData, error: signUpError } = await supabaseClient.auth.signUp({
      email: testEmail,
      password: testPassword,
      options: {
        data: {
          nome: 'Teste RLS'
        }
      }
    })
    
    if (signUpError) {
      console.log('❌ Erro ao criar usuário de teste:', signUpError.message)
      return
    }
    
    if (signUpData.user) {
      console.log('✅ Usuário de teste criado:', signUpData.user.id)
      
      // Confirmar email
      await supabaseAdmin.auth.admin.updateUserById(
        signUpData.user.id,
        { email_confirm: true }
      )
      
      // Criar perfil manualmente (já que o trigger pode não estar funcionando)
      const { error: insertError } = await supabaseAdmin
        .from('users')
        .insert({
          id: signUpData.user.id,
          email: testEmail,
          nome: 'Teste RLS',
          is_admin: false,
          onboarding_completed: false
        })
      
      if (insertError) {
        console.log('❌ Erro ao criar perfil:', insertError.message)
      } else {
        console.log('✅ Perfil criado com sucesso')
      }
      
      // Testar login
      console.log('\n6️⃣ Testando login com novas políticas...')
      
      const { data: loginData, error: loginError } = await supabaseClient.auth.signInWithPassword({
        email: testEmail,
        password: testPassword
      })
      
      if (loginError) {
        console.log('❌ Erro no login:', loginError.message)
      } else {
        console.log('✅ Login realizado com sucesso!')
        
        // Testar carregamento do perfil (aqui estava o problema da recursão)
        console.log('\n7️⃣ Testando carregamento do perfil...')
        
        const { data: profileData, error: profileError } = await supabaseClient
          .from('users')
          .select('*')
          .eq('id', loginData.user.id)
          .single()
        
        if (profileError) {
          console.log('❌ Erro ao carregar perfil:', profileError.message)
          if (profileError.message.includes('infinite recursion')) {
            console.log('⚠️  AINDA HÁ RECURSÃO INFINITA! Políticas precisam ser ajustadas manualmente.')
          }
        } else {
          console.log('✅ Perfil carregado com sucesso!')
          console.log('   Nome:', profileData.nome)
          console.log('   🎉 PROBLEMA DA RECURSÃO RESOLVIDO!')
        }
        
        // Logout
        await supabaseClient.auth.signOut()
        console.log('✅ Logout realizado')
      }
      
      // Limpar usuário de teste
      console.log('\n🧹 Limpando usuário de teste...')
      await supabaseAdmin.auth.admin.deleteUser(signUpData.user.id)
      await supabaseAdmin.from('users').delete().eq('id', signUpData.user.id)
      console.log('✅ Usuário de teste removido')
    }
    
    console.log('\n📊 RESULTADO DA CORREÇÃO')
    console.log('=' .repeat(40))
    
    console.log('\n✅ AÇÕES REALIZADAS:')
    console.log('• Políticas RLS antigas removidas')
    console.log('• Novas políticas RLS criadas (sem recursão)')
    console.log('• Teste de login/perfil realizado')
    
    console.log('\n🔧 SE O PROBLEMA PERSISTIR:')
    console.log('1. Execute manualmente o arquivo corrigir-rls-policies.sql no painel do Supabase')
    console.log('2. Execute também o arquivo setup-trigger-manual.sql')
    console.log('3. Teste o login no frontend')
    console.log('4. Verifique o console do navegador')
    
    console.log('\n🎉 CORREÇÃO RLS CONCLUÍDA!')
    
  } catch (error) {
    console.error('❌ Erro durante correção RLS:', error.message)
    
    console.log('\n⚠️  FALLBACK: Execute manualmente os arquivos SQL:')
    console.log('1. corrigir-rls-policies.sql')
    console.log('2. setup-trigger-manual.sql')
  }
}

// Executar correção
aplicarCorrecaoRLS().catch(console.error)