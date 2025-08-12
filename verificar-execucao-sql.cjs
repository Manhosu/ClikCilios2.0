require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Variáveis de ambiente não configuradas');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function verificarExecucaoSQL() {
  console.log('🔍 VERIFICANDO SE O SQL FOI EXECUTADO CORRETAMENTE');
  console.log('=' .repeat(60));
  console.log('');
  console.log('📋 Projeto atual:', supabaseUrl);
  console.log('🆔 ID do projeto:', supabaseUrl.match(/https:\/\/([^.]+)\.supabase\.co/)?.[1]);
  console.log('');
  
  try {
    // Tentar listar todas as tabelas usando uma query SQL direta
    console.log('1️⃣ Listando todas as tabelas do schema public...');
    
    const { data: tables, error: tablesError } = await supabase
      .rpc('exec_sql', {
        query: `
          SELECT table_name 
          FROM information_schema.tables 
          WHERE table_schema = 'public' 
          AND table_type = 'BASE TABLE'
          ORDER BY table_name;
        `
      });
    
    if (tablesError) {
      console.log('❌ Erro ao listar tabelas via RPC:', tablesError.message);
      
      // Tentar uma abordagem alternativa
      console.log('\n2️⃣ Tentando abordagem alternativa...');
      
      // Tentar acessar diretamente algumas tabelas conhecidas
      const tabelasParaTestar = ['pre_users', 'user_assignments', 'auth.users'];
      
      for (const tabela of tabelasParaTestar) {
        console.log(`\n🔍 Testando tabela: ${tabela}`);
        
        const { data, error } = await supabase
          .from(tabela.replace('auth.', ''))
          .select('*')
          .limit(1);
        
        if (error) {
          if (error.code === '42P01') {
            console.log(`❌ ${tabela}: NÃO EXISTE`);
          } else {
            console.log(`⚠️ ${tabela}: Erro - ${error.message}`);
          }
        } else {
          console.log(`✅ ${tabela}: EXISTE (${data?.length || 0} registros encontrados)`);
        }
      }
      
    } else {
      console.log('✅ Tabelas encontradas no schema public:');
      if (tables && tables.length > 0) {
        tables.forEach(table => {
          console.log(`  • ${table.table_name}`);
        });
      } else {
        console.log('  (Nenhuma tabela encontrada)');
      }
    }
    
    console.log('');
    console.log('3️⃣ Verificando especificamente as tabelas necessárias...');
    
    // Verificar pre_users
    const { data: preUsersData, error: preUsersError } = await supabase
      .from('pre_users')
      .select('count', { count: 'exact', head: true });
    
    if (preUsersError) {
      console.log('❌ Tabela pre_users: NÃO EXISTE');
      console.log('   Erro:', preUsersError.message);
    } else {
      console.log('✅ Tabela pre_users: EXISTE');
      console.log('   Registros:', preUsersData || 0);
    }
    
    // Verificar user_assignments
    const { data: assignmentsData, error: assignmentsError } = await supabase
      .from('user_assignments')
      .select('count', { count: 'exact', head: true });
    
    if (assignmentsError) {
      console.log('❌ Tabela user_assignments: NÃO EXISTE');
      console.log('   Erro:', assignmentsError.message);
    } else {
      console.log('✅ Tabela user_assignments: EXISTE');
      console.log('   Registros:', assignmentsData || 0);
    }
    
    console.log('');
    console.log('4️⃣ Verificando funções...');
    
    // Verificar função get_pre_users_stats
    const { data: statsData, error: statsError } = await supabase
      .rpc('get_pre_users_stats');
    
    if (statsError) {
      console.log('❌ Função get_pre_users_stats: NÃO EXISTE');
      console.log('   Erro:', statsError.message);
    } else {
      console.log('✅ Função get_pre_users_stats: EXISTE');
      console.log('   Resultado:', JSON.stringify(statsData, null, 2));
    }
    
    console.log('');
    console.log('📊 DIAGNÓSTICO FINAL:');
    console.log('=' .repeat(40));
    
    if (preUsersError && assignmentsError) {
      console.log('🚨 PROBLEMA: As tabelas NÃO foram criadas!');
      console.log('');
      console.log('💡 POSSÍVEIS CAUSAS:');
      console.log('1. Você executou o SQL em um projeto diferente');
      console.log('2. Houve erro na execução do SQL (verifique o histórico)');
      console.log('3. Você não tem permissões suficientes');
      console.log('');
      console.log('🔧 SOLUÇÕES:');
      console.log('1. Verifique se está no projeto correto:');
      console.log('   https://supabase.com/dashboard/project/pdkhcvioaiopwsrburxp');
      console.log('2. Vá em SQL Editor > History e verifique se o SQL foi executado');
      console.log('3. Execute o SQL novamente, linha por linha se necessário');
      console.log('4. Verifique se não há erros em vermelho no SQL Editor');
    } else if (!preUsersError && !assignmentsError) {
      console.log('🎉 SUCESSO: Todas as tabelas foram criadas!');
      console.log('Agora você pode executar: node populate-pre-users.cjs');
    } else {
      console.log('⚠️ PARCIAL: Algumas tabelas existem, outras não');
      console.log('Execute o SQL completo novamente');
    }
    
  } catch (error) {
    console.error('❌ Erro inesperado:', error.message);
  }
}

verificarExecucaoSQL();