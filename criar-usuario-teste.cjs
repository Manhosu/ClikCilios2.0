const { createClient } = require('@supabase/supabase-js')

// Configuração do Supabase com service role key para criar usuários
const supabaseUrl = 'https://gguxeqpayaangiplggme.supabase.co'
const serviceRoleKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdndXhlcXBheWFhbmdpcGxnZ21lIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0OTg0NjA5NiwiZXhwIjoyMDY1NDIyMDk2fQ.782bdkQ0eiNSqF55VzIyv4kMLoKecXCOq85apB1E7MI'

const supabase = createClient(supabaseUrl, serviceRoleKey)

async function criarUsuarioTeste() {
  try {
    console.log('👤 Criando usuário de teste...')
    
    // Criar usuário
    const { data, error } = await supabase.auth.admin.createUser({
      email: 'eduardo@teste.com',
      password: '123456',
      email_confirm: true
    })
    
    if (error) {
      if (error.message.includes('already registered')) {
        console.log('✅ Usuário já existe!')
        
        // Tentar listar usuários para verificar
        const { data: users, error: listError } = await supabase.auth.admin.listUsers()
        if (!listError) {
          const user = users.users.find(u => u.email === 'eduardo@teste.com')
          if (user) {
            console.log('📋 Usuário encontrado:', user.id)
            return user.id
          }
        }
      } else {
        console.error('❌ Erro ao criar usuário:', error.message)
        return null
      }
    } else {
      console.log('✅ Usuário criado com sucesso!')
      console.log('📋 ID do usuário:', data.user.id)
      return data.user.id
    }
    
  } catch (error) {
    console.error('❌ Erro geral:', error)
    return null
  }
}

criarUsuarioTeste()