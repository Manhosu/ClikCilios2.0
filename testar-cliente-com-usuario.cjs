require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_ANON_KEY
);

async function testarCriacaoClienteComUsuario() {
  console.log('🔍 TESTANDO CRIAÇÃO DE CLIENTE COM USUÁRIO ESPECÍFICO');
  console.log('===============================================');

  try {
    // 1. Listar usuários disponíveis
    console.log('1. Listando usuários disponíveis...');
    const { data: todosUsuarios, error: errorListar } = await supabase
      .from('users')
      .select('id, email, nome')
      .limit(5);

    if (errorListar) {
      console.log('❌ Erro ao listar usuários:', errorListar.message);
      return;
    }

    console.log('✅ Usuários encontrados:', todosUsuarios.length);
    todosUsuarios.forEach((user, index) => {
      console.log(`   ${index + 1}. ${user.email} (${user.nome})`);
    });

    // Usar o primeiro usuário disponível
    const usuarios = todosUsuarios[0];
    if (!usuarios) {
      console.log('❌ Nenhum usuário encontrado');
      return;
    }

    console.log('\n✅ Usuário selecionado:', usuarios.email);
    console.log('   ID:', usuarios.id);

    // 2. Verificar se a tabela clientes existe
    console.log('\n2. Verificando estrutura da tabela clientes...');
    const { data: estrutura, error: errorEstrutura } = await supabase
      .from('clientes')
      .select('*')
      .limit(1);

    if (errorEstrutura) {
      console.log('❌ Erro ao acessar tabela clientes:', errorEstrutura.message);
      console.log('💡 Você precisa executar o arquivo corrigir-tabela-clientes.sql no Supabase Dashboard');
      return;
    }

    console.log('✅ Tabela clientes acessível');

    // 3. Tentar criar um cliente usando o service_role
    console.log('\n3. Testando criação de cliente...');
    
    const clienteTeste = {
      user_id: usuarios.id,
      nome: 'Cliente Teste',
      email: 'cliente.teste@example.com',
      telefone: '(11) 99999-9999',
      data_nascimento: '1990-01-01',
      observacoes: 'Cliente criado para teste'
    };

    const { data: novoCliente, error: errorCliente } = await supabase
      .from('clientes')
      .insert([clienteTeste])
      .select()
      .single();

    if (errorCliente) {
      console.log('❌ Erro ao criar cliente:', errorCliente.message);
      console.log('   Código:', errorCliente.code);
      
      if (errorCliente.code === '42501') {
        console.log('\n💡 SOLUÇÃO PARA ERRO 42501:');
        console.log('   1. Execute o arquivo corrigir-tabela-clientes.sql no Supabase Dashboard');
        console.log('   2. Certifique-se de que as políticas RLS estão corretas');
        console.log('   3. Verifique se o usuário tem permissões adequadas');
      }
      return;
    }

    console.log('✅ Cliente criado com sucesso!');
    console.log('   ID:', novoCliente.id);
    console.log('   Nome:', novoCliente.nome);
    console.log('   Email:', novoCliente.email);

    // 4. Limpar o cliente de teste
    console.log('\n4. Removendo cliente de teste...');
    const { error: errorRemover } = await supabase
      .from('clientes')
      .delete()
      .eq('id', novoCliente.id);

    if (errorRemover) {
      console.log('⚠️ Erro ao remover cliente de teste:', errorRemover.message);
    } else {
      console.log('✅ Cliente de teste removido');
    }

  } catch (error) {
    console.log('❌ Erro geral:', error.message);
  }

  console.log('\n===============================================');
  console.log('🏁 TESTE CONCLUÍDO');
}

testarCriacaoClienteComUsuario();