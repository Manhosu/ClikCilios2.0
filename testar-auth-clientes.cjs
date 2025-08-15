const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_ANON_KEY
);

async function testarAuthClientes() {
  console.log('🔍 TESTANDO AUTENTICAÇÃO E CRIAÇÃO DE CLIENTES');
  console.log('===============================================');
  
  console.log('\n1. Verificando usuário autenticado atual...');
  try {
    const { data: { user }, error } = await supabase.auth.getUser();
    
    if (error) {
      console.log('❌ Erro ao verificar usuário:', error.message);
    } else if (user) {
      console.log('✅ Usuário autenticado:', {
        id: user.id,
        email: user.email
      });
      
      // Testar criação de cliente com usuário real
      console.log('\n2. Testando criação de cliente com usuário autenticado...');
      await testarCriacaoCliente(user.id);
    } else {
      console.log('❌ Nenhum usuário autenticado');
      console.log('\n🔧 SOLUÇÃO:');
      console.log('1. Faça login na aplicação primeiro');
      console.log('2. Certifique-se de que está autenticado');
      console.log('3. Tente criar o cliente novamente');
    }
  } catch (error) {
    console.log('❌ Erro na verificação de autenticação:', error.message);
  }
  
  console.log('\n3. Verificando se existe algum usuário na tabela auth.users...');
  try {
    const { data, error } = await supabase
      .from('users')
      .select('id, email')
      .limit(5);
    
    if (error) {
      console.log('❌ Erro ao verificar usuários:', error.message);
    } else {
      console.log('✅ Usuários encontrados na tabela users:', data.length);
      if (data.length > 0) {
        console.log('Primeiros usuários:', data);
        
        // Testar com o primeiro usuário encontrado
        console.log('\n4. Testando criação de cliente com primeiro usuário encontrado...');
        await testarCriacaoCliente(data[0].id);
      }
    }
  } catch (error) {
    console.log('❌ Erro na verificação de usuários:', error.message);
  }
  
  console.log('\n===============================================');
  console.log('🏁 TESTE CONCLUÍDO');
}

async function testarCriacaoCliente(userId) {
  try {
    const dadosCliente = {
      user_id: userId,
      nome: 'Cliente Teste Auth',
      email: 'teste.auth@exemplo.com',
      telefone: '11987654321',
      data_nascimento: '1985-05-15',
      observacoes: 'Cliente criado para teste de autenticação'
    };
    
    console.log('Tentando criar cliente para user_id:', userId);
    
    const { data, error } = await supabase
      .from('clientes')
      .insert(dadosCliente)
      .select()
      .single();
    
    if (error) {
      console.log('❌ ERRO na criação:', {
        message: error.message,
        details: error.details,
        hint: error.hint,
        code: error.code
      });
      
      if (error.code === '42501') {
        console.log('\n🔧 DIAGNÓSTICO:');
        console.log('- Erro 42501 = Violação de política RLS');
        console.log('- A política RLS exige auth.uid() = user_id');
        console.log('- Mas auth.uid() está retornando NULL ou valor diferente');
        console.log('\n💡 SOLUÇÕES:');
        console.log('1. Execute o SQL corrigir-tabela-clientes.sql no Supabase Dashboard');
        console.log('2. Faça login na aplicação web');
        console.log('3. Tente criar o cliente através da interface da aplicação');
      }
    } else {
      console.log('✅ Cliente criado com sucesso:', data);
      
      // Limpar cliente de teste
      const { error: deleteError } = await supabase
        .from('clientes')
        .delete()
        .eq('id', data.id);
      
      if (!deleteError) {
        console.log('✅ Cliente de teste removido');
      }
    }
  } catch (error) {
    console.log('❌ Erro na função de teste:', error.message);
  }
}

testarAuthClientes().catch(console.error);