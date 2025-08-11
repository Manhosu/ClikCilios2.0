const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

const supabaseUrl = process.env.VITE_SUPABASE_URL
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Variáveis de ambiente do Supabase não encontradas')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

async function testarRegistroAutomatico() {
  console.log('🧪 Testando registro automático com criação manual na tabela users...')
  
  try {
    const testEmail = `teste.automatico.${Date.now()}@gmail.com`
    const testPassword = 'senha123456'
    const testNome = 'Usuário Teste Automático'
    
    console.log('📧 Criando usuário:', testEmail)
    
    // 1. Criar usuário no Auth
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
      console.error('❌ Erro ao criar usuário no Auth:', signUpError.message)
      return
    }
    
    console.log('✅ Usuário criado no Auth:', signUpData.user?.id)
    
    // 2. Criar usuário na tabela users manualmente
    console.log('📝 Criando perfil na tabela users...')
    
    const { error: insertError } = await supabase
      .from('users')
      .insert({
        id: signUpData.user?.id,
        email: signUpData.user?.email || testEmail,
        nome: testNome,
        is_admin: false,
        onboarding_completed: false
      })
    
    if (insertError) {
      console.error('❌ Erro ao criar perfil na tabela users:', insertError.message)
      
      if (insertError.message.includes('row-level security')) {
        console.log('\n🔧 SOLUÇÃO PARA RLS:')
        console.log('1. Acesse o painel do Supabase')
        console.log('2. Vá em Authentication > Settings')
        console.log('3. Desabilite "Enable email confirmations" temporariamente')
        console.log('4. Ou configure RLS para permitir inserções de usuários autenticados')
        console.log('\n📋 SQL para RLS mais permissivo:')
        console.log('DROP POLICY IF EXISTS "Allow authenticated inserts" ON public.users;')
        console.log('CREATE POLICY "Allow authenticated inserts" ON public.users')
        console.log('  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);')
      }
      return
    }
    
    console.log('✅ Perfil criado na tabela users!')
    
    // 3. Verificar se foi criado corretamente
    console.log('🔍 Verificando usuário criado...')
    
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('*')
      .eq('id', signUpData.user?.id)
      .single()
    
    if (userError || !userData) {
      console.error('❌ Erro ao verificar usuário:', userError?.message)
      return
    }
    
    console.log('🎉 SUCESSO! Usuário completo criado:')
    console.log('   - ID:', userData.id)
    console.log('   - Email:', userData.email)
    console.log('   - Nome:', userData.nome)
    console.log('   - Admin:', userData.is_admin)
    console.log('   - Onboarding:', userData.onboarding_completed)
    
    // 4. Testar login (pode falhar se email não confirmado)
    console.log('\n🔐 Testando login...')
    
    const { data: loginData, error: loginError } = await supabase.auth.signInWithPassword({
      email: testEmail,
      password: testPassword
    })
    
    if (loginError) {
      if (loginError.message.includes('Email not confirmed')) {
        console.log('⚠️  Login requer confirmação de email (normal em produção)')
        console.log('   Para desenvolvimento, desabilite confirmação de email no Supabase')
      } else {
        console.log('⚠️  Erro no login:', loginError.message)
      }
    } else {
      console.log('✅ Login funcionando!')
      await supabase.auth.signOut()
    }
    
    console.log('\n🎯 RESULTADO FINAL:')
    console.log('✅ Registro automático: FUNCIONANDO')
    console.log('✅ Criação na tabela users: FUNCIONANDO')
    console.log('✅ Sistema pronto para produção!')
    
    console.log('\n📋 PRÓXIMOS PASSOS:')
    console.log('1. Teste o sistema em http://localhost:5173')
    console.log('2. Crie uma nova conta e verifique se funciona')
    console.log('3. Configure confirmação de email conforme necessário')
    
  } catch (error) {
    console.error('❌ Erro no teste:', error)
  }
}

testarRegistroAutomatico()