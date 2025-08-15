// Teste da exclusão de cliente simulando o frontend
require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

async function testarExclusaoFrontend() {
  console.log('🔧 Testando exclusão de cliente (simulando frontend)...');
  console.log('');

  // Configurar Supabase
  const supabaseUrl = process.env.VITE_SUPABASE_URL;
  const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;
  
  if (!supabaseUrl || !supabaseAnonKey) {
    console.log('❌ Credenciais do Supabase não configuradas!');
    return;
  }

  const supabase = createClient(supabaseUrl, supabaseAnonKey);
  
  try {
    // 1. Verificar se há usuário autenticado
    console.log('👤 Verificando autenticação...');
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError) {
      console.log('❌ Erro de autenticação:', authError.message);
      return;
    }
    
    if (!user) {
      console.log('⚠️ Nenhum usuário autenticado!');
      console.log('   Este é o problema! O frontend precisa de um usuário logado.');
      console.log('');
      
      // Tentar fazer login com credenciais de teste
      console.log('🔑 Tentando fazer login com credenciais de teste...');
      const { data: loginData, error: loginError } = await supabase.auth.signInWithPassword({
        email: 'teste@exemplo.com',
        password: 'senha123'
      });
      
      if (loginError) {
        console.log('❌ Erro no login:', loginError.message);
        console.log('   Você precisa criar um usuário ou fazer login primeiro.');
        return;
      }
      
      console.log('✅ Login realizado com sucesso!');
      console.log('   Usuário:', loginData.user.email);
    } else {
      console.log('✅ Usuário autenticado:', user.email);
    }
    
    // 2. Listar clientes existentes
    console.log('');
    console.log('📋 Listando clientes existentes...');
    const { data: clientes, error: listError } = await supabase
      .from('clientes')
      .select('*')
      .limit(5);
    
    if (listError) {
      console.log('❌ Erro ao listar clientes:', listError.message);
      return;
    }
    
    console.log(`   Encontrados ${clientes.length} clientes`);
    if (clientes.length > 0) {
      console.log('   Primeiro cliente:', clientes[0].nome, '(ID:', clientes[0].id + ')');
    }
    
    // 3. Tentar criar um cliente de teste
    console.log('');
    console.log('➕ Criando cliente de teste...');
    const { data: novoCliente, error: createError } = await supabase
      .from('clientes')
      .insert({
        nome: 'Cliente Teste Exclusão',
        email: 'teste.exclusao@exemplo.com',
        telefone: '(11) 99999-9999'
      })
      .select()
      .single();
    
    if (createError) {
      console.log('❌ Erro ao criar cliente:', createError.message);
      return;
    }
    
    console.log('✅ Cliente criado:', novoCliente.nome, '(ID:', novoCliente.id + ')');
    
    // 4. Tentar excluir o cliente
    console.log('');
    console.log('🗑️ Tentando excluir o cliente...');
    const { error: deleteError } = await supabase
      .from('clientes')
      .delete()
      .eq('id', novoCliente.id);
    
    if (deleteError) {
      console.log('❌ Erro ao excluir cliente:', deleteError.message);
      console.log('   Código do erro:', deleteError.code);
      console.log('   Detalhes:', deleteError.details);
      return;
    }
    
    console.log('✅ Cliente excluído com sucesso!');
    
    // 5. Verificar se foi realmente excluído
    console.log('');
    console.log('🔍 Verificando se o cliente foi excluído...');
    const { data: clienteVerificacao, error: verifyError } = await supabase
      .from('clientes')
      .select('*')
      .eq('id', novoCliente.id)
      .single();
    
    if (verifyError && verifyError.code === 'PGRST116') {
      console.log('✅ Confirmado: Cliente foi excluído da base de dados.');
    } else if (clienteVerificacao) {
      console.log('⚠️ Cliente ainda existe na base de dados!');
    } else {
      console.log('❌ Erro na verificação:', verifyError?.message);
    }
    
  } catch (error) {
    console.log('❌ Erro inesperado:', error.message);
  }
  
  console.log('');
  console.log('🏁 Teste concluído.');
}

testarExclusaoFrontend();