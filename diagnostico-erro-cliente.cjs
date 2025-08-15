require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_ANON_KEY
);

const supabaseService = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function diagnosticarErroCliente() {
  console.log('🔍 DIAGNÓSTICO COMPLETO DO ERRO DE CRIAÇÃO DE CLIENTE');
  console.log('=========================================================');

  try {
    // 1. Verificar conexão com Supabase
    console.log('1. Verificando conexão com Supabase...');
    const { data: healthCheck, error: healthError } = await supabase
      .from('users')
      .select('count')
      .limit(1);

    if (healthError) {
      console.log('❌ Erro de conexão:', healthError.message);
      return;
    }
    console.log('✅ Conexão com Supabase OK');

    // 2. Verificar se a tabela users tem dados (usando service role)
    console.log('\n2. Verificando dados na tabela users (service role)...');
    const { data: usersService, error: usersServiceError } = await supabaseService
      .from('users')
      .select('id, email, nome')
      .limit(3);

    if (usersServiceError) {
      console.log('❌ Erro ao acessar users com service role:', usersServiceError.message);
    } else {
      console.log('✅ Usuários encontrados (service role):', usersService.length);
      usersService.forEach((user, index) => {
        console.log(`   ${index + 1}. ${user.email} (${user.nome})`);
      });
    }

    // 3. Verificar se a tabela users tem dados (usando anon key)
    console.log('\n3. Verificando dados na tabela users (anon key)...');
    const { data: usersAnon, error: usersAnonError } = await supabase
      .from('users')
      .select('id, email, nome')
      .limit(3);

    if (usersAnonError) {
      console.log('❌ Erro ao acessar users com anon key:', usersAnonError.message);
    } else {
      console.log('✅ Usuários encontrados (anon key):', usersAnon.length);
      if (usersAnon.length === 0) {
        console.log('⚠️ PROBLEMA: Políticas RLS estão bloqueando acesso via anon key');
      }
    }

    // 4. Verificar se a tabela clientes existe
    console.log('\n4. Verificando existência da tabela clientes...');
    const { data: clientesTest, error: clientesError } = await supabase
      .from('clientes')
      .select('*')
      .limit(1);

    if (clientesError) {
      console.log('❌ Erro ao acessar tabela clientes:', clientesError.message);
      if (clientesError.code === 'PGRST106') {
        console.log('💡 SOLUÇÃO: A tabela clientes não existe. Execute corrigir-tabela-clientes.sql');
      }
    } else {
      console.log('✅ Tabela clientes existe e é acessível');
    }

    // 5. Testar autenticação
    console.log('\n5. Verificando estado de autenticação...');
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    
    if (sessionError) {
      console.log('❌ Erro ao verificar sessão:', sessionError.message);
    } else if (!session) {
      console.log('❌ Nenhuma sessão ativa encontrada');
      console.log('💡 PROBLEMA: Usuário não está autenticado');
    } else {
      console.log('✅ Sessão ativa encontrada');
      console.log('   Usuário:', session.user.email);
      console.log('   ID:', session.user.id);
    }

    // 6. Testar criação de cliente com service role (se temos usuários)
    if (usersService && usersService.length > 0) {
      console.log('\n6. Testando criação de cliente com service role...');
      const usuarioTeste = usersService[0];
      
      const clienteTeste = {
        user_id: usuarioTeste.id,
        nome: 'Cliente Teste Diagnóstico',
        email: 'diagnostico@teste.com',
        telefone: '(11) 99999-9999'
      };

      const { data: novoCliente, error: errorCriarCliente } = await supabaseService
        .from('clientes')
        .insert([clienteTeste])
        .select()
        .single();

      if (errorCriarCliente) {
        console.log('❌ Erro ao criar cliente (service role):', errorCriarCliente.message);
        console.log('   Código:', errorCriarCliente.code);
      } else {
        console.log('✅ Cliente criado com sucesso (service role)!');
        console.log('   ID:', novoCliente.id);
        
        // Limpar cliente de teste
        await supabaseService.from('clientes').delete().eq('id', novoCliente.id);
        console.log('🧹 Cliente de teste removido');
      }
    }

  } catch (error) {
    console.log('❌ Erro geral:', error.message);
  }

  console.log('\n=========================================================');
  console.log('🏁 DIAGNÓSTICO CONCLUÍDO');
  console.log('\n📋 RESUMO DOS PROBLEMAS IDENTIFICADOS:');
  console.log('1. Se "Usuários encontrados (anon key): 0" → Problema nas políticas RLS da tabela users');
  console.log('2. Se "Nenhuma sessão ativa" → Usuário precisa fazer login no frontend');
  console.log('3. Se "tabela clientes não existe" → Execute corrigir-tabela-clientes.sql');
  console.log('\n💡 SOLUÇÕES:');
  console.log('1. Execute setup-trigger-manual.sql no Supabase Dashboard');
  console.log('2. Execute corrigir-tabela-clientes.sql no Supabase Dashboard');
  console.log('3. Faça login no frontend da aplicação');
  console.log('4. Teste novamente a criação de clientes');
}

diagnosticarErroCliente();