const { createClient } = require('@supabase/supabase-js')
require('dotenv').config()

const supabaseUrl = process.env.VITE_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Variáveis de ambiente não encontradas')
  console.log('VITE_SUPABASE_URL:', !!supabaseUrl)
  console.log('SUPABASE_SERVICE_ROLE_KEY:', !!supabaseServiceKey)
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

async function verifyTestUser() {
  try {
    console.log('🔍 Verificando usuário de teste...')
    
    // Verificar na tabela auth.users
    const { data: authUsers, error: authError } = await supabase.auth.admin.listUsers()
    
    if (authError) {
      console.error('❌ Erro ao listar usuários de auth:', authError)
      return
    }
    
    const testUser = authUsers.users.find(user => user.email === 'teste@ciliosclick.com')
    
    if (testUser) {
      console.log('✅ Usuário encontrado na tabela auth.users:')
      console.log('  - ID:', testUser.id)
      console.log('  - Email:', testUser.email)
      console.log('  - Email confirmado:', testUser.email_confirmed_at ? 'Sim' : 'Não')
      console.log('  - Criado em:', testUser.created_at)
      
      // Verificar na tabela users
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('*')
        .eq('email', 'teste@ciliosclick.com')
        .single()
      
      if (userError) {
        console.log('⚠️ Usuário não encontrado na tabela users:', userError.message)
      } else {
        console.log('✅ Usuário encontrado na tabela users:')
        console.log('  - ID:', userData.id)
        console.log('  - Nome:', userData.nome)
        console.log('  - Email:', userData.email)
      }
      
      // Tentar fazer login
      console.log('\n🔐 Testando login...')
      const { data: loginData, error: loginError } = await supabase.auth.signInWithPassword({
        email: 'teste@ciliosclick.com',
        password: '123456'
      })
      
      if (loginError) {
        console.error('❌ Erro no login:', loginError.message)
      } else {
        console.log('✅ Login bem-sucedido!')
        console.log('  - User ID:', loginData.user?.id)
        console.log('  - Email:', loginData.user?.email)
      }
      
    } else {
      console.log('❌ Usuário teste@ciliosclick.com não encontrado na tabela auth.users')
      
      // Listar alguns usuários para debug
      console.log('\n📋 Primeiros 5 usuários encontrados:')
      authUsers.users.slice(0, 5).forEach((user, index) => {
        console.log(`  ${index + 1}. ${user.email} (ID: ${user.id.substring(0, 8)}...)`)
      })
    }
    
  } catch (error) {
    console.error('❌ Erro geral:', error)
  }
}

verifyTestUser()