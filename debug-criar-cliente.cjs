const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_ANON_KEY
);

async function debugCriarCliente() {
  console.log('🔍 DEBUGANDO CRIAÇÃO DE CLIENTE');
  console.log('================================');
  
  // Simular dados de um usuário autenticado
  const userId = '123e4567-e89b-12d3-a456-426614174000'; // UUID fictício para teste
  
  console.log('\n1. Verificando estrutura da tabela clientes...');
  try {
    const { data: estrutura, error: errorEstrutura } = await supabase
      .from('clientes')
      .select('*')
      .limit(0);
    
    if (errorEstrutura) {
      console.log('❌ Erro ao verificar estrutura:', errorEstrutura);
    } else {
      console.log('✅ Estrutura da tabela acessível');
    }
  } catch (error) {
    console.log('❌ Erro na verificação:', error.message);
  }
  
  console.log('\n2. Testando inserção de cliente...');
  try {
    const dadosCliente = {
      user_id: userId,
      nome: 'Cliente Teste Debug',
      email: 'teste@debug.com',
      telefone: '11999999999',
      data_nascimento: '1990-01-01',
      observacoes: 'Cliente criado para debug'
    };
    
    console.log('Dados a serem inseridos:', dadosCliente);
    
    const { data, error } = await supabase
      .from('clientes')
      .insert(dadosCliente)
      .select()
      .single();
    
    if (error) {
      console.log('❌ ERRO DETALHADO:', {
        message: error.message,
        details: error.details,
        hint: error.hint,
        code: error.code
      });
    } else {
      console.log('✅ Cliente criado com sucesso:', data);
      
      // Limpar o cliente de teste
      console.log('\n3. Limpando cliente de teste...');
      const { error: deleteError } = await supabase
        .from('clientes')
        .delete()
        .eq('id', data.id);
      
      if (deleteError) {
        console.log('⚠️  Erro ao limpar:', deleteError.message);
      } else {
        console.log('✅ Cliente de teste removido');
      }
    }
  } catch (error) {
    console.log('❌ Erro na inserção:', error.message);
  }
  
  console.log('\n4. Verificando políticas RLS...');
  try {
    // Tentar acessar sem user_id específico
    const { data, error } = await supabase
      .from('clientes')
      .select('*')
      .limit(1);
    
    if (error) {
      console.log('❌ Erro RLS:', error.message);
    } else {
      console.log('✅ RLS funcionando, dados retornados:', data.length, 'registros');
    }
  } catch (error) {
    console.log('❌ Erro na verificação RLS:', error.message);
  }
  
  console.log('\n================================');
  console.log('🏁 DEBUG CONCLUÍDO');
}

debugCriarCliente().catch(console.error);