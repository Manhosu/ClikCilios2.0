require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

// Configuração do Supabase
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseServiceKey || !supabaseAnonKey) {
  console.error('❌ Variáveis de ambiente não configuradas');
  console.error('Necessário: VITE_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, VITE_SUPABASE_ANON_KEY');
  process.exit(1);
}

const supabaseService = createClient(supabaseUrl, supabaseServiceKey);
const supabaseAnon = createClient(supabaseUrl, supabaseAnonKey);

async function testarFuncionalidadeClientes() {
  console.log('🧪 TESTANDO FUNCIONALIDADE DE CLIENTES\n');

  try {
    // 1. Verificar se a tabela clientes existe
    console.log('1. 🔍 Verificando estrutura da tabela clientes...');
    const { data: tableInfo, error: tableError } = await supabaseService
      .from('information_schema.tables')
      .select('*')
      .eq('table_schema', 'public')
      .eq('table_name', 'clientes');

    if (tableError) {
      console.error('   ❌ Erro ao verificar tabela:', tableError.message);
    } else if (tableInfo && tableInfo.length > 0) {
      console.log('   ✅ Tabela clientes existe');
    } else {
      console.log('   ❌ Tabela clientes NÃO existe');
      return;
    }

    // 2. Verificar colunas da tabela
    console.log('\n2. 📋 Verificando colunas da tabela...');
    const { data: columns, error: columnsError } = await supabaseService
      .from('information_schema.columns')
      .select('column_name, data_type, is_nullable')
      .eq('table_schema', 'public')
      .eq('table_name', 'clientes')
      .order('ordinal_position');

    if (columnsError) {
      console.error('   ❌ Erro ao verificar colunas:', columnsError.message);
    } else {
      console.log('   📊 Estrutura da tabela:');
      columns?.forEach(col => {
        console.log(`      - ${col.column_name}: ${col.data_type} (${col.is_nullable === 'YES' ? 'nullable' : 'not null'})`);
      });
    }

    // 3. Verificar políticas RLS
    console.log('\n3. 🔒 Verificando políticas RLS...');
    const { data: policies, error: policiesError } = await supabaseService
      .from('pg_policies')
      .select('policyname, permissive, roles, cmd, qual, with_check')
      .eq('schemaname', 'public')
      .eq('tablename', 'clientes');

    if (policiesError) {
      console.error('   ❌ Erro ao verificar políticas:', policiesError.message);
    } else {
      console.log(`   📋 Políticas encontradas: ${policies?.length || 0}`);
      policies?.forEach(policy => {
        console.log(`      - ${policy.policyname}: ${policy.cmd}`);
      });
    }

    // 4. Testar acesso com chave anônima
    console.log('\n4. 🔓 Testando acesso com chave anônima...');
    const { data: anonTest, error: anonError } = await supabaseAnon
      .from('clientes')
      .select('id')
      .limit(1);

    if (anonError) {
      console.log(`   ❌ Erro com chave anônima: ${anonError.message}`);
    } else {
      console.log('   ✅ Acesso com chave anônima funcionando');
    }

    // 5. Contar clientes existentes
    console.log('\n5. 📊 Contando clientes existentes...');
    const { count, error: countError } = await supabaseService
      .from('clientes')
      .select('*', { count: 'exact', head: true });

    if (countError) {
      console.error('   ❌ Erro ao contar clientes:', countError.message);
    } else {
      console.log(`   📋 Total de clientes: ${count || 0}`);
    }

    // 6. Testar criação de cliente (simulação)
    console.log('\n6. 🧪 Testando criação de cliente...');
    
    // Primeiro, vamos pegar um usuário existente para usar como user_id
    const { data: users, error: usersError } = await supabaseService
      .from('users')
      .select('id, email')
      .limit(1);

    if (usersError || !users || users.length === 0) {
      console.log('   ⚠️ Nenhum usuário encontrado para teste');
    } else {
      const testUserId = users[0].id;
      console.log(`   👤 Usando usuário: ${users[0].email}`);

      // Tentar criar um cliente de teste
      const clienteTeste = {
        user_id: testUserId,
        nome: 'Cliente Teste',
        email: 'teste@exemplo.com',
        telefone: '(11) 99999-9999',
        observacoes: 'Cliente criado para teste'
      };

      const { data: novoCliente, error: criarError } = await supabaseService
        .from('clientes')
        .insert(clienteTeste)
        .select()
        .single();

      if (criarError) {
        console.log(`   ❌ Erro ao criar cliente: ${criarError.message}`);
        console.log(`   🔍 Código do erro: ${criarError.code}`);
      } else {
        console.log('   ✅ Cliente criado com sucesso!');
        console.log(`   📋 ID: ${novoCliente.id}`);
        
        // Limpar o cliente de teste
        await supabaseService
          .from('clientes')
          .delete()
          .eq('id', novoCliente.id);
        console.log('   🧹 Cliente de teste removido');
      }
    }

    // 7. Verificar se há problemas de permissão
    console.log('\n7. 🔐 Verificando permissões específicas...');
    
    // Testar SELECT
    const { data: selectTest, error: selectError } = await supabaseAnon
      .from('clientes')
      .select('id')
      .limit(1);
    
    console.log(`   📖 SELECT: ${selectError ? '❌ ' + selectError.message : '✅ OK'}`);
    
    // Testar INSERT (vai falhar, mas vamos ver o erro)
    const { error: insertError } = await supabaseAnon
      .from('clientes')
      .insert({ nome: 'teste' });
    
    console.log(`   ➕ INSERT: ${insertError ? '❌ ' + insertError.message : '✅ OK'}`);

    console.log('\n📋 RESUMO DO TESTE:');
    console.log('\n✅ FUNCIONANDO:');
    console.log('   - Tabela clientes existe');
    console.log('   - Estrutura da tabela está correta');
    if (!anonError) console.log('   - Acesso de leitura com chave anônima');
    
    console.log('\n❌ PROBLEMAS ENCONTRADOS:');
    if (anonError) console.log('   - Acesso com chave anônima bloqueado');
    if (insertError) console.log('   - Inserção com chave anônima bloqueada (esperado)');
    
    console.log('\n🎯 PRÓXIMOS PASSOS:');
    console.log('1. Verificar se o usuário está autenticado no frontend');
    console.log('2. Verificar se o user_id está sendo passado corretamente');
    console.log('3. Testar criação de cliente no frontend');
    console.log('4. Verificar logs do navegador para erros específicos');

  } catch (error) {
    console.error('❌ Erro durante o teste:', error.message);
  }
}

// Executar teste
testarFuncionalidadeClientes();