const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testarExclusaoCliente() {
  try {
    console.log('🔧 Testando funcionalidade de exclusão de cliente...');
    
    // 1. Verificar se há clientes na tabela
    console.log('\n📋 Listando clientes existentes...');
    const { data: clientes, error: listarError } = await supabase
      .from('clientes')
      .select('*')
      .limit(5);
    
    if (listarError) {
      console.error('❌ Erro ao listar clientes:', listarError.message);
      return;
    }
    
    console.log(`📊 Encontrados ${clientes.length} clientes`);
    if (clientes.length > 0) {
      console.log('Primeiro cliente:', clientes[0]);
    }
    
    // 2. Tentar criar um cliente de teste
    console.log('\n➕ Criando cliente de teste...');
    const clienteTeste = {
      user_id: 'test-user-id',
      nome: 'Cliente Teste Exclusão',
      email: 'teste@exclusao.com',
      telefone: '(11) 99999-9999'
    };
    
    const { data: clienteCriado, error: criarError } = await supabase
      .from('clientes')
      .insert(clienteTeste)
      .select()
      .single();
    
    if (criarError) {
      console.error('❌ Erro ao criar cliente de teste:', criarError.message);
      console.error('   Código:', criarError.code);
      console.error('   Detalhes:', criarError.details);
      
      // Se não conseguir criar, vamos tentar excluir um existente
      if (clientes.length > 0) {
        console.log('\n🗑️ Tentando excluir cliente existente...');
        await tentarExcluir(clientes[0].id);
      }
      return;
    }
    
    console.log('✅ Cliente de teste criado:', clienteCriado.id);
    
    // 3. Tentar excluir o cliente de teste
    console.log('\n🗑️ Tentando excluir cliente de teste...');
    await tentarExcluir(clienteCriado.id);
    
  } catch (error) {
    console.error('❌ Erro durante o teste:', error);
  }
}

async function tentarExcluir(clienteId) {
  try {
    console.log(`🗑️ Tentando excluir cliente: ${clienteId}`);
    
    // Verificar autenticação
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError) {
      console.log('⚠️ Usuário não autenticado:', authError.message);
      console.log('   Isso pode ser a causa do problema!');
    }
    
    // Tentar exclusão
    const { data, error } = await supabase
      .from('clientes')
      .delete()
      .eq('id', clienteId)
      .select();
    
    if (error) {
      console.error('❌ Erro ao excluir cliente:', error.message);
      console.error('   Código:', error.code);
      console.error('   Detalhes:', error.details);
      
      if (error.code === '42501') {
        console.log('💡 Problema: Falta de permissão (RLS - Row Level Security)');
        console.log('   Solução: Usuário precisa estar autenticado ou RLS precisa ser ajustado');
      }
      
      return false;
    }
    
    if (!data || data.length === 0) {
      console.warn('⚠️ Nenhum cliente foi excluído (pode não existir ou não pertencer ao usuário)');
      return false;
    }
    
    console.log('✅ Cliente excluído com sucesso:', data[0]);
    return true;
    
  } catch (error) {
    console.error('❌ Erro durante exclusão:', error);
    return false;
  }
}

testarExclusaoCliente();