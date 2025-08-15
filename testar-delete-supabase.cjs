const { createClient } = require('@supabase/supabase-js')

// Configuração do Supabase
const supabaseUrl = 'https://gguxeqpayaangiplggme.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdndXhlcXBheWFhbmdpcGxnZ21lIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDk4NDYwOTYsImV4cCI6MjA2NTQyMjA5Nn0.WHusG12ZcOYtVSGUQVUT3Vf-MIbu_O6hlc3ha7yVnSE'

const supabase = createClient(supabaseUrl, supabaseKey)

async function testarDeleteCliente() {
  try {
    console.log('🔍 Testando conexão com Supabase...')
    
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
    console.log('👤 Usuário:', authData.user.id)
    
    // 2. Listar clientes existentes
    const { data: clientes, error: listError } = await supabase
      .from('clientes')
      .select('*')
    
    if (listError) {
      console.error('❌ Erro ao listar clientes:', listError.message)
      return
    }
    
    console.log('📋 Clientes encontrados:', clientes.length)
    clientes.forEach(cliente => {
      console.log(`  - ${cliente.nome} (ID: ${cliente.id})`)
    })
    
    // 3. Criar um cliente de teste se não houver nenhum
    if (clientes.length === 0) {
      console.log('➕ Criando cliente de teste...')
      
      const { data: novoCliente, error: createError } = await supabase
        .from('clientes')
        .insert({
          nome: 'Cliente Teste Delete',
          email: 'teste@delete.com',
          user_id: authData.user.id
        })
        .select()
        .single()
      
      if (createError) {
        console.error('❌ Erro ao criar cliente:', createError.message)
        return
      }
      
      console.log('✅ Cliente criado:', novoCliente)
      clientes.push(novoCliente)
    }
    
    // 4. Tentar excluir o primeiro cliente
    if (clientes.length > 0) {
      const clienteParaExcluir = clientes[0]
      console.log(`🗑️ Tentando excluir cliente: ${clienteParaExcluir.nome} (ID: ${clienteParaExcluir.id})`)
      
      const { data: deletedData, error: deleteError } = await supabase
        .from('clientes')
        .delete()
        .eq('id', clienteParaExcluir.id)
        .select()
      
      if (deleteError) {
        console.error('❌ Erro ao excluir cliente:', deleteError.message)
        console.error('   Código:', deleteError.code)
        console.error('   Detalhes:', deleteError.details)
        return
      }
      
      if (!deletedData || deletedData.length === 0) {
        console.warn('⚠️ Nenhum cliente foi excluído (pode não existir ou não pertencer ao usuário)')
      } else {
        console.log('✅ Cliente excluído com sucesso:', deletedData[0])
      }
    }
    
  } catch (error) {
    console.error('❌ Erro geral:', error)
  }
}

testarDeleteCliente()