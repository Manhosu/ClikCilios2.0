const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

// Cliente normal
const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_ANON_KEY
)

// Cliente admin (se disponível)
let adminClient = null
if (process.env.SUPABASE_SERVICE_ROLE_KEY) {
  adminClient = createClient(
    process.env.VITE_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  )
}

async function recriarUsuarioEduardo() {
  console.log('🔧 Recriando usuário Eduardo com credenciais corretas...')
  console.log('')
  
  const email = 'eduardogelista@gmail.com'
  const senha = 'ClikCilios2024!' // Senha que foi enviada no email
  const nome = 'Eduardo'
  
  console.log(`📧 Email: ${email}`)
  console.log(`🔐 Senha: ${senha}`)
  console.log(`👤 Nome: ${nome}`)
  console.log('')
  
  try {
    if (adminClient) {
      console.log('🔍 Buscando usuário existente...')
      
      // Listar todos os usuários para encontrar o Eduardo
      const { data: usersData, error: listError } = await adminClient.auth.admin.listUsers()
      
      if (listError) {
        console.log('❌ Erro ao listar usuários:', listError.message)
      } else {
        const existingUser = usersData.users.find(u => u.email === email)
        
        if (existingUser) {
          console.log('👤 Usuário encontrado:')
          console.log(`   ID: ${existingUser.id}`)
          console.log(`   Email: ${existingUser.email}`)
          console.log(`   Confirmado: ${existingUser.email_confirmed_at ? 'Sim' : 'Não'}`)
          console.log('')
          
          // Deletar usuário existente
          console.log('🗑️ Deletando usuário existente...')
          const { error: deleteError } = await adminClient.auth.admin.deleteUser(existingUser.id)
          
          if (deleteError) {
            console.log('❌ Erro ao deletar usuário:', deleteError.message)
          } else {
            console.log('✅ Usuário deletado com sucesso!')
          }
        } else {
          console.log('ℹ️ Usuário não encontrado no auth')
        }
      }
      
      // Aguardar um pouco
      console.log('⏳ Aguardando 2 segundos...')
      await new Promise(resolve => setTimeout(resolve, 2000))
      
      // Criar novo usuário
      console.log('👤 Criando novo usuário...')
      const { data: newUser, error: createError } = await adminClient.auth.admin.createUser({
        email: email,
        password: senha,
        email_confirm: true, // Confirmar email automaticamente
        user_metadata: {
          name: nome
        }
      })
      
      if (createError) {
        console.log('❌ Erro ao criar usuário:', createError.message)
      } else {
        console.log('✅ Usuário criado com sucesso!')
        console.log(`   ID: ${newUser.user.id}`)
        console.log(`   Email: ${newUser.user.email}`)
        console.log(`   Confirmado: ${newUser.user.email_confirmed_at ? 'Sim' : 'Não'}`)
        console.log('')
        
        // Inserir na tabela users também
        console.log('📝 Inserindo na tabela users...')
        const { data: userData, error: insertError } = await supabase
          .from('users')
          .upsert({
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
        
        // Testar login
        console.log('🧪 Testando login...')
        const { data: loginData, error: loginError } = await supabase.auth.signInWithPassword({
          email: email,
          password: senha
        })
        
        if (loginError) {
          console.log('❌ Erro no login:', loginError.message)
        } else {
          console.log('✅ LOGIN FUNCIONOU!')
          console.log(`   Usuário: ${loginData.user.email}`)
          console.log(`   ID: ${loginData.user.id}`)
          
          // Fazer logout
          await supabase.auth.signOut()
        }
      }
    } else {
      console.log('❌ SUPABASE_SERVICE_ROLE_KEY não configurada')
      console.log('📋 Para recriar o usuário manualmente:')
      console.log('1. Acesse https://supabase.com/dashboard')
      console.log('2. Selecione seu projeto')
      console.log('3. Authentication > Users')
      console.log(`4. Delete o usuário ${email} se existir`)
      console.log('5. Clique em "Add user"')
      console.log(`6. Email: ${email}`)
      console.log(`7. Password: ${senha}`)
      console.log('8. Marque "Auto Confirm User"')
      console.log('9. Clique em "Create user"')
    }
    
  } catch (error) {
    console.log('❌ Erro geral:', error.message)
  }
  
  console.log('')
  console.log('📋 CREDENCIAIS FINAIS:')
  console.log(`   Email: ${email}`)
  console.log(`   Senha: ${senha}`)
  console.log(`   URL: https://clik-cilios2-0.vercel.app/login`)
  console.log('')
  console.log('🎯 Teste agora no navegador!')
}

// Executar
recriarUsuarioEduardo().catch(console.error)