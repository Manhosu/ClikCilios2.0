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

async function forcarRemocaoEduardo() {
  console.log('🔧 Forçando remoção e recriação do usuário Eduardo...')
  console.log('')
  
  const email = 'eduardogelista@gmail.com'
  const senha = 'ClikCilios2024!'
  const nome = 'Eduardo'
  
  try {
    // 1. Listar TODOS os usuários com paginação
    console.log('🔍 Listando TODOS os usuários...')
    let allUsers = []
    let page = 1
    let hasMore = true
    
    while (hasMore) {
      const { data: usersData, error: listError } = await adminClient.auth.admin.listUsers({
        page: page,
        perPage: 1000
      })
      
      if (listError) {
        console.log('❌ Erro ao listar usuários:', listError.message)
        break
      }
      
      allUsers = allUsers.concat(usersData.users)
      hasMore = usersData.users.length === 1000
      page++
      
      console.log(`   Página ${page - 1}: ${usersData.users.length} usuários`)
    }
    
    console.log(`📊 Total de usuários encontrados: ${allUsers.length}`)
    console.log('')
    
    // 2. Procurar Eduardo em todos os usuários
    const eduardoUsers = allUsers.filter(u => 
      u.email === email || 
      u.email?.toLowerCase().includes('eduardo') ||
      u.user_metadata?.name?.toLowerCase().includes('eduardo')
    )
    
    console.log(`🔍 Usuários relacionados ao Eduardo: ${eduardoUsers.length}`)
    
    for (const user of eduardoUsers) {
      console.log(`   - ID: ${user.id}`)
      console.log(`     Email: ${user.email}`)
      console.log(`     Nome: ${user.user_metadata?.name || 'N/A'}`)
      console.log(`     Criado: ${user.created_at}`)
      console.log(`     Confirmado: ${user.email_confirmed_at ? 'Sim' : 'Não'}`)
      console.log('')
      
      if (user.email === email) {
        console.log('🗑️ Deletando usuário Eduardo...')
        const { error: deleteError } = await adminClient.auth.admin.deleteUser(user.id)
        
        if (deleteError) {
          console.log('❌ Erro ao deletar:', deleteError.message)
        } else {
          console.log('✅ Usuário deletado!')
        }
      }
    }
    
    // 3. Limpar tabela users também
    console.log('🗑️ Limpando tabela users...')
    const { error: deleteTableError } = await supabase
      .from('users')
      .delete()
      .eq('email', email)
    
    if (deleteTableError) {
      console.log('⚠️ Erro ao limpar tabela users:', deleteTableError.message)
    } else {
      console.log('✅ Tabela users limpa!')
    }
    
    // 4. Aguardar mais tempo
    console.log('⏳ Aguardando 5 segundos para propagação...')
    await new Promise(resolve => setTimeout(resolve, 5000))
    
    // 5. Tentar criar usuário novamente
    console.log('👤 Tentando criar usuário Eduardo...')
    
    // Primeiro tentar com signup normal
    const { data: signupData, error: signupError } = await supabase.auth.signUp({
      email: email,
      password: senha,
      options: {
        data: {
          name: nome
        }
      }
    })
    
    if (signupError) {
      console.log('❌ Signup normal falhou:', signupError.message)
      
      // Tentar com admin API
      console.log('🔧 Tentando com admin API...')
      const { data: adminData, error: adminError } = await adminClient.auth.admin.createUser({
        email: email,
        password: senha,
        email_confirm: true,
        user_metadata: {
          name: nome
        }
      })
      
      if (adminError) {
        console.log('❌ Admin API também falhou:', adminError.message)
        
        // Última tentativa: usar um email ligeiramente diferente
        const tempEmail = 'eduardo.teste@gmail.com'
        console.log(`🔧 Última tentativa com email temporário: ${tempEmail}`)
        
        const { data: tempData, error: tempError } = await adminClient.auth.admin.createUser({
          email: tempEmail,
          password: senha,
          email_confirm: true,
          user_metadata: {
            name: nome,
            original_email: email
          }
        })
        
        if (tempError) {
          console.log('❌ Todas as tentativas falharam:', tempError.message)
        } else {
          console.log('✅ Usuário criado com email temporário!')
          console.log(`   Use: ${tempEmail} / ${senha}`)
          
          // Inserir na tabela users
          await supabase.from('users').insert({
            id: tempData.user.id,
            email: tempEmail,
            name: nome,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          })
        }
      } else {
        console.log('✅ Usuário criado com admin API!')
        console.log(`   ID: ${adminData.user.id}`)
        
        // Inserir na tabela users
        await supabase.from('users').insert({
          id: adminData.user.id,
          email: email,
          name: nome,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
      }
    } else {
      console.log('✅ Usuário criado com signup normal!')
      console.log(`   ID: ${signupData.user?.id}`)
      
      if (signupData.user?.id) {
        // Confirmar email
        await adminClient.auth.admin.updateUserById(signupData.user.id, {
          email_confirm: true
        })
        
        // Inserir na tabela users
        await supabase.from('users').insert({
          id: signupData.user.id,
          email: email,
          name: nome,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
      }
    }
    
    // 6. Testar login final
    console.log('')
    console.log('🧪 Testando login final...')
    const { data: loginData, error: loginError } = await supabase.auth.signInWithPassword({
      email: email,
      password: senha
    })
    
    if (loginError) {
      console.log('❌ Login ainda não funciona:', loginError.message)
      
      // Testar com email temporário se foi criado
      const { data: tempLogin, error: tempLoginError } = await supabase.auth.signInWithPassword({
        email: 'eduardo.teste@gmail.com',
        password: senha
      })
      
      if (tempLogin && tempLogin.user) {
        console.log('✅ Login funciona com email temporário!')
        console.log(`   Use: eduardo.teste@gmail.com / ${senha}`)
      }
    } else {
      console.log('✅ LOGIN FUNCIONOU PERFEITAMENTE!')
      console.log(`   Usuário: ${loginData.user.email}`)
      await supabase.auth.signOut()
    }
    
  } catch (error) {
    console.log('❌ Erro geral:', error.message)
  }
  
  console.log('')
  console.log('📋 CREDENCIAIS PARA TESTE:')
  console.log(`   📧 Email: ${email} (ou eduardo.teste@gmail.com)`)
  console.log(`   🔐 Senha: ${senha}`)
  console.log(`   🌐 URL: https://clik-cilios2-0.vercel.app/login`)
}

// Executar
forcarRemocaoEduardo().catch(console.error)