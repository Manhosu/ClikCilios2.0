const { createClient } = require('@supabase/supabase-js')
require('dotenv').config()

const supabaseUrl = process.env.VITE_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Variáveis de ambiente não encontradas')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

async function resetTestUserPassword() {
  try {
    console.log('🔄 Redefinindo senha do usuário de teste...')
    
    // Primeiro, encontrar o usuário
    const { data: authUsers, error: listError } = await supabase.auth.admin.listUsers()
    
    if (listError) {
      console.error('❌ Erro ao listar usuários:', listError)
      return
    }
    
    const testUser = authUsers.users.find(user => user.email === 'teste@ciliosclick.com')
    
    if (!testUser) {
      console.error('❌ Usuário teste@ciliosclick.com não encontrado')
      return
    }
    
    console.log('✅ Usuário encontrado:', testUser.email)
    
    // Redefinir a senha usando o admin API
    const { data: updateData, error: updateError } = await supabase.auth.admin.updateUserById(
      testUser.id,
      {
        password: '123456',
        email_confirm: true
      }
    )
    
    if (updateError) {
      console.error('❌ Erro ao redefinir senha:', updateError)
      return
    }
    
    console.log('✅ Senha redefinida com sucesso!')
    console.log('📧 Email:', updateData.user.email)
    console.log('🔑 Nova senha: 123456')
    
    // Testar o login novamente
    console.log('\n🔐 Testando login com nova senha...')
    
    const { data: loginData, error: loginError } = await supabase.auth.signInWithPassword({
      email: 'teste@ciliosclick.com',
      password: '123456'
    })
    
    if (loginError) {
      console.error('❌ Login ainda falhou:', loginError.message)
    } else {
      console.log('✅ Login bem-sucedido!')
      console.log('  - User ID:', loginData.user?.id)
      console.log('  - Email:', loginData.user?.email)
      
      // Fazer logout
      await supabase.auth.signOut()
    }
    
  } catch (error) {
    console.error('❌ Erro geral:', error)
  }
}

resetTestUserPassword()