const { createClient } = require('@supabase/supabase-js')

// Configuração do Supabase
const supabaseUrl = 'https://gguxeqpayaangiplggme.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdndXhlcXBheWFhbmdpcGxnZ21lIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDk4NDYwOTYsImV4cCI6MjA2NTQyMjA5Nn0.WHusG12ZcOYtVSGUQVUT3Vf-MIbu_O6hlc3ha7yVnSE'

const supabase = createClient(supabaseUrl, supabaseKey)

async function criarClienteTeste() {
  try {
    console.log('🔍 Fazendo login...')
    
    // 1. Fazer login
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email: 'eduardo@teste.com',
      password: '123456'
    })
    
    if (authError) {
      console.error('❌ Erro no login:', authError.message)
      return
    }
    
    console.log('✅ Login realizado com sucesso!')
    
    // 2. Criar cliente de teste
    console.log('➕ Criando cliente de teste...')
    
    const { data: novoCliente, error: createError } = await supabase
      .from('clientes')
      .insert({
        nome: 'Cliente Para Testar Delete',
        email: 'delete@teste.com',
        telefone: '(11) 99999-9999',
        user_id: authData.user.id
      })
      .select()
      .single()
    
    if (createError) {
      console.error('❌ Erro ao criar cliente:', createError.message)
      return
    }
    
    console.log('✅ Cliente criado com sucesso!')
    console.log('📋 Cliente:', novoCliente)
    
  } catch (error) {
    console.error('❌ Erro geral:', error)
  }
}

criarClienteTeste()