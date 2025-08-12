const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

// Cliente admin
const adminClient = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

// Cliente normal
const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_ANON_KEY
)

async function deletarERecriarEduardo() {
  console.log('🔧 Deletando e recriando usuário Eduardo...')
  console.log('')
  
  const email = 'eduardogelista@gmail.com'
  const senha = 'ClikCilios2024!'
  const nome = 'Eduardo'
  
  try {
    // 1. Listar todos os usuários
    console.log('🔍 Buscando usuário Eduardo...')
    const { data: usersData, error: listError } = await adminClient.auth.admin.listUsers()
    
    if (listError) {
      console.log('❌ Erro ao listar usuários:', listError.message)
      return
    }
    
    // 2. Encontrar o usuário Eduardo
    const eduardoUser = usersData.users.find(u => u.email === email)
    
    if (eduardoUser) {
      console.log('👤 Usuário Eduardo encontrado:')
      console.log(`   ID: ${eduardoUser.id}`)
      console.log(`   Email: ${eduardoUser.email}`)
      console.log(`   Criado em: ${eduardoUser.created_at}`)
      console.log('')
      
      // 3. Deletar o usuário
      console.log('🗑️ Deletando usuário...')
      const { error: deleteError } = await adminClient.auth.admin.deleteUser(eduardoUser.id)
      
      if (deleteError) {
        console.log('❌ Erro ao deletar usuário:', deleteError.message)
        return
      }
      
      console.log('✅ Usuário deletado com sucesso!')
      
      // 4. Deletar da tabela users também
      console.log('🗑️ Deletando da tabela users...')
      const { error: deleteTableError } = await supabase
        .from('users')
        .delete()
        .eq('email', email)
      
      if (deleteTableError) {
        console.log('⚠️ Erro ao deletar da tabela users:', deleteTableError.message)
      } else {
        console.log('✅ Deletado da tabela users!')
      }
      
    } else {
      console.log('ℹ️ Usuário Eduardo não encontrado no auth')
    }
    
    // 5. Aguardar um pouco
    console.log('⏳ Aguardando 3 segundos...')
    await new Promise(resolve => setTimeout(resolve, 3000))
    
    // 6. Criar novo usuário
    console.log('👤 Criando novo usuário Eduardo...')
    const { data: newUser, error: createError } = await adminClient.auth.admin.createUser({
      email: email,
      password: senha,
      email_confirm: true,
      user_metadata: {
        name: nome
      }
    })
    
    if (createError) {
      console.log('❌ Erro ao criar usuário:', createError.message)
      return
    }
    
    console.log('✅ Usuário criado com sucesso!')
    console.log(`   ID: ${newUser.user.id}`)
    console.log(`   Email: ${newUser.user.email}`)
    console.log(`   Email confirmado: ${newUser.user.email_confirmed_at ? 'Sim' : 'Não'}`)
    console.log('')
    
    // 7. Inserir na tabela users
    console.log('📝 Inserindo na tabela users...')
    const { data: userData, error: insertError } = await supabase
      .from('users')
      .insert({
        id: newUser.user.id,
        email: email,
        name: nome,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select()
    
    if (insertError) {
      console.log('❌ Erro ao inserir na tabela users:', insertError.message)
    } else {
      console.log('✅ Usuário inserido na tabela users!')
    }
    
    // 8. Testar login
    console.log('')
    console.log('🧪 Testando login...')
    const { data: loginData, error: loginError } = await supabase.auth.signInWithPassword({
      email: email,
      password: senha
    })
    
    if (loginError) {
      console.log('❌ Erro no login:', loginError.message)
    } else {
      console.log('✅ LOGIN FUNCIONOU PERFEITAMENTE!')
      console.log(`   Usuário logado: ${loginData.user.email}`)
      console.log(`   ID: ${loginData.user.id}`)
      
      // Fazer logout
      await supabase.auth.signOut()
      console.log('🚪 Logout realizado')
    }
    
  } catch (error) {
    console.log('❌ Erro geral:', error.message)
  }
  
  console.log('')
  console.log('🎉 PROCESSO CONCLUÍDO!')
  console.log('')
  console.log('📋 CREDENCIAIS VÁLIDAS:')
  console.log(`   📧 Email: ${email}`)
  console.log(`   🔐 Senha: ${senha}`)
  console.log(`   🌐 URL: https://clik-cilios2-0.vercel.app/login`)
  console.log('')
  console.log('✅ Agora você pode fazer login no sistema!')
}

// Executar
deletarERecriarEduardo().catch(console.error)