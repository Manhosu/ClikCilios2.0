require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Variáveis de ambiente não configuradas:');
  console.error('VITE_SUPABASE_URL:', supabaseUrl ? '✅ Configurada' : '❌ Não encontrada');
  console.error('VITE_SUPABASE_ANON_KEY:', supabaseKey ? '✅ Configurada' : '❌ Não encontrada');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function verificarTabelas() {
  console.log('🔍 Verificando tabelas no banco de dados...');
  console.log('URL:', supabaseUrl);
  console.log('');

  try {
    // Verificar se a tabela pre_users existe
    console.log('1. Verificando tabela pre_users...');
    const { data: preUsers, error: errorPreUsers } = await supabase
      .from('pre_users')
      .select('count', { count: 'exact', head: true });
    
    if (errorPreUsers) {
      console.log('❌ Tabela pre_users:', errorPreUsers.message);
    } else {
      console.log('✅ Tabela pre_users existe! Registros:', preUsers?.length || 0);
    }

    // Verificar se a tabela user_assignments existe
    console.log('\n2. Verificando tabela user_assignments...');
    const { data: userAssignments, error: errorAssignments } = await supabase
      .from('user_assignments')
      .select('count', { count: 'exact', head: true });
    
    if (errorAssignments) {
      console.log('❌ Tabela user_assignments:', errorAssignments.message);
    } else {
      console.log('✅ Tabela user_assignments existe! Registros:', userAssignments?.length || 0);
    }

    // Verificar funções
    console.log('\n3. Verificando função get_pre_users_stats...');
    const { data: stats, error: errorStats } = await supabase
      .rpc('get_pre_users_stats');
    
    if (errorStats) {
      console.log('❌ Função get_pre_users_stats:', errorStats.message);
    } else {
      console.log('✅ Função get_pre_users_stats funciona!');
      console.log('Estatísticas:', stats);
    }

    // Listar todas as tabelas do schema public
    console.log('\n4. Listando todas as tabelas do schema public...');
    const { data: tables, error: errorTables } = await supabase
      .from('information_schema.tables')
      .select('table_name')
      .eq('table_schema', 'public')
      .eq('table_type', 'BASE TABLE');
    
    if (errorTables) {
      console.log('❌ Erro ao listar tabelas:', errorTables.message);
    } else {
      console.log('📋 Tabelas encontradas no schema public:');
      tables?.forEach(table => {
        console.log('  -', table.table_name);
      });
    }

  } catch (error) {
    console.error('❌ Erro geral:', error.message);
  }
}

verificarTabelas();