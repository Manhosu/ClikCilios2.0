require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Variáveis de ambiente não encontradas!');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function diagnosticoCompleto() {
  console.log('🔍 DIAGNÓSTICO COMPLETO DO BANCO DE DADOS');
  console.log('URL:', supabaseUrl);
  console.log('Key:', supabaseKey.substring(0, 20) + '...');
  
  try {
    // 1. Verificar conexão básica
    console.log('\n1. 🔗 Testando conexão básica...');
    const { data: connectionTest, error: connectionError } = await supabase
      .from('_supabase_migrations')
      .select('*')
      .limit(1);
    
    if (connectionError) {
      console.log('⚠️  Erro de conexão ou tabela de migrações não existe:', connectionError.code);
    } else {
      console.log('✅ Conexão estabelecida com sucesso');
    }
    
    // 2. Listar todas as tabelas no schema public
    console.log('\n2. 📋 Listando tabelas no schema public...');
    const { data: tables, error: tablesError } = await supabase
      .rpc('exec_sql', { query: "SELECT table_name FROM information_schema.tables WHERE table_schema = 'public';" });
    
    if (tablesError) {
      console.log('❌ Erro ao listar tabelas:', tablesError.message);
      
      // Método alternativo: tentar acessar algumas tabelas conhecidas
      console.log('\n🔄 Tentando método alternativo...');
      const knownTables = ['users', 'profiles', 'auth', 'pre_users', 'user_assignments'];
      
      for (const tableName of knownTables) {
        try {
          const { data, error } = await supabase
            .from(tableName)
            .select('*')
            .limit(1);
          
          if (error) {
            if (error.code === '42P01') {
              console.log(`❌ Tabela '${tableName}' NÃO existe`);
            } else {
              console.log(`⚠️  Tabela '${tableName}' existe mas erro: ${error.code} - ${error.message}`);
            }
          } else {
            console.log(`✅ Tabela '${tableName}' existe e acessível`);
          }
        } catch (e) {
          console.log(`❌ Erro ao verificar '${tableName}':`, e.message);
        }
      }
    } else {
      console.log('✅ Tabelas encontradas:', tables);
    }
    
    // 3. Verificar especificamente pre_users
    console.log('\n3. 🎯 Verificação específica da tabela pre_users...');
    
    // Teste 1: SELECT simples
    const { data: selectData, error: selectError } = await supabase
      .from('pre_users')
      .select('*')
      .limit(1);
    
    console.log('SELECT Test:');
    if (selectError) {
      console.log(`❌ Erro: ${selectError.code} - ${selectError.message}`);
    } else {
      console.log('✅ SELECT funcionou, dados:', selectData);
    }
    
    // Teste 2: COUNT
    const { count, error: countError } = await supabase
      .from('pre_users')
      .select('*', { count: 'exact', head: true });
    
    console.log('COUNT Test:');
    if (countError) {
      console.log(`❌ Erro: ${countError.code} - ${countError.message}`);
    } else {
      console.log('✅ COUNT funcionou, total:', count);
    }
    
    // Teste 3: INSERT
    const testUsername = 'test_user_' + Date.now();
    const { data: insertData, error: insertError } = await supabase
      .from('pre_users')
      .insert({ username: testUsername, email: `${testUsername}@ciliosclick.com`, status: 'available' })
      .select();
    
    console.log('INSERT Test:');
    if (insertError) {
      console.log(`❌ Erro: ${insertError.code} - ${insertError.message}`);
    } else {
      console.log('✅ INSERT funcionou, dados:', insertData);
      
      // Limpar o teste
      if (insertData && insertData[0]) {
        await supabase
          .from('pre_users')
          .delete()
          .eq('id', insertData[0].id);
        console.log('🧹 Registro de teste removido');
      }
    }
    
    // 4. Verificar permissões e RLS
    console.log('\n4. 🔒 Verificando Row Level Security...');
    const { data: rlsData, error: rlsError } = await supabase
      .rpc('exec_sql', { 
        query: "SELECT schemaname, tablename, rowsecurity FROM pg_tables WHERE schemaname = 'public' AND tablename = 'pre_users';" 
      });
    
    if (rlsError) {
      console.log('❌ Não foi possível verificar RLS:', rlsError.message);
    } else {
      console.log('✅ Informações RLS:', rlsData);
    }
    
    // 5. Conclusão
    console.log('\n📊 CONCLUSÃO DO DIAGNÓSTICO:');
    if (selectError && selectError.code === '42P01') {
      console.log('🔴 A tabela pre_users definitivamente NÃO EXISTE');
      console.log('💡 Solução: Execute o SQL de criação manualmente no Supabase Dashboard');
    } else if (selectError && selectError.code !== '42P01') {
      console.log('🟡 A tabela pre_users EXISTE mas há problemas de permissão/RLS');
      console.log('💡 Solução: Verificar e ajustar políticas RLS');
    } else {
      console.log('🟢 A tabela pre_users existe e está funcionando corretamente');
    }
    
  } catch (error) {
    console.error('❌ Erro geral no diagnóstico:', error.message);
  }
}

diagnosticoCompleto();