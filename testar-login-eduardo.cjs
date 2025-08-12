const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_ANON_KEY
)

async function testarLoginEduardo() {
  console.log('🧪 Testando login do Eduardo...')
  console.log('Email: eduardogelista@gmail.com')
  console.log('ID: db7727ab-04eb-472e-970b-e61b715316a0')
  console.log('')
  
  try {
    // Tentar login
    console.log('🔐 Tentando fazer login...')
    const { data: loginData, error: loginError } = await supabase.auth.signInWithPassword({
      email: 'eduardogelista@gmail.com',
      password: 'Eduardo123!'
    })
    
    if (loginError) {
      console.log('❌ Erro no login:', loginError.message)
      
      if (loginError.message.includes('Email not confirmed')) {
        console.log('')
        console.log('🔧 SOLUÇÃO MANUAL:')
        console.log('1. Acesse: https://supabase.com/dashboard')
        console.log('2. Selecione seu projeto')
        console.log('3. Vá em Authentication > Users')
        console.log('4. Encontre: eduardogelista@gmail.com')
        console.log('5. Clique nos 3 pontos e "Confirm email"')
        console.log('')
        console.log('OU execute este SQL no SQL Editor:')
        console.log('UPDATE auth.users SET email_confirmed_at = NOW() WHERE email = \'eduardogelista@gmail.com\';')
        console.log('')
        console.log('📱 TESTE AGORA:')
        console.log('Acesse http://localhost:5173 e tente fazer login')
        console.log('Email: eduardogelista@gmail.com')
        console.log('Senha: Eduardo123!')
      }
    } else {
      console.log('✅ LOGIN FUNCIONOU!')
      console.log('Usuário logado:', loginData.user.email)
      console.log('ID:', loginData.user.id)
      console.log('')
      console.log('🎉 Agora você pode usar o sistema normalmente!')
      
      // Fazer logout
      await supabase.auth.signOut()
    }
    
  } catch (error) {
    console.error('❌ Erro:', error.message)
  }
}

testarLoginEduardo()