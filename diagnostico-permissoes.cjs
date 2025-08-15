const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseServiceKey || !supabaseAnonKey) {
  console.error('❌ Variáveis de ambiente não configuradas');
  console.log('Necessário: VITE_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, VITE_SUPABASE_ANON_KEY');
  process.exit(1);
}

// Cliente com service role (máximas permissões)
const supabaseService = createClient(supabaseUrl, supabaseServiceKey);

// Cliente com chave anônima (permissões limitadas)
const supabaseAnon = createClient(supabaseUrl, supabaseAnonKey);

async function diagnosticarPermissoes() {
  console.log('🔍 DIAGNÓSTICO DE PERMISSÕES E AUTENTICAÇÃO\n');
  
  try {
    // 1. Verificar conexão básica
    console.log('1. 🔗 Testando conexão com Supabase...');
    const { data: healthCheck } = await supabaseService.from('users').select('count').limit(1);
    console.log('✅ Conexão estabelecida com sucesso\n');
    
    // 2. Verificar usuários na tabela auth.users (apenas service role)
    console.log('2. 👥 Verificando usuários na tabela auth.users...');
    try {
      const { data: authUsers, error: authError } = await supabaseService.auth.admin.listUsers();
      if (authError) {
        console.log('❌ Erro ao acessar auth.users:', authError.message);
      } else {
        console.log(`✅ Encontrados ${authUsers.users.length} usuários na tabela auth.users`);
        if (authUsers.users.length > 0) {
          console.log('   Primeiros 3 usuários:');
          authUsers.users.slice(0, 3).forEach((user, index) => {
            console.log(`   ${index + 1}. ${user.email} (ID: ${user.id.substring(0, 8)}...)`);
          });
        }
      }
    } catch (error) {
      console.log('❌ Erro ao listar usuários auth:', error.message);
    }
    console.log('');
    
    // 3. Verificar usuários na tabela public.users
    console.log('3. 📊 Verificando usuários na tabela public.users...');
    
    // Com service role
    const { data: usersService, error: errorService } = await supabaseService
      .from('users')
      .select('id, email, nome, is_admin')
      .limit(10);
    
    if (errorService) {
      console.log('❌ Erro com service role:', errorService.message);
    } else {
      console.log(`✅ Service role: ${usersService.length} usuários encontrados`);
    }
    
    // Com chave anônima
    const { data: usersAnon, error: errorAnon } = await supabaseAnon
      .from('users')
      .select('id, email, nome, is_admin')
      .limit(10);
    
    if (errorAnon) {
      console.log('❌ Erro com chave anônima:', errorAnon.message);
      console.log('   Isso indica problema nas políticas RLS');
    } else {
      console.log(`✅ Chave anônima: ${usersAnon.length} usuários encontrados`);
    }
    console.log('');
    
    // 4. Verificar políticas RLS
    console.log('4. 🔒 Verificando políticas RLS na tabela users...');
    const { data: policies, error: policiesError } = await supabaseService
      .rpc('get_table_policies', { table_name: 'users' })
      .catch(async () => {
        // Fallback: consulta direta
        return await supabaseService
          .from('pg_policies')
          .select('policyname, cmd, qual')
          .eq('tablename', 'users');
      });
    
    if (policies && policies.length > 0) {
      console.log(`✅ Encontradas ${policies.length} políticas RLS:`);
      policies.forEach(policy => {
        console.log(`   - ${policy.policyname || policy.name}`);
      });
    } else {
      console.log('⚠️  Nenhuma política RLS encontrada ou erro ao consultar');
    }
    console.log('');
    
    // 5. Verificar função handle_new_user
    console.log('5. ⚙️  Verificando função handle_new_user...');
    const { data: functions, error: funcError } = await supabaseService
      .from('information_schema.routines')
      .select('routine_name, routine_type')
      .eq('routine_schema', 'public')
      .eq('routine_name', 'handle_new_user');
    
    if (functions && functions.length > 0) {
      console.log('✅ Função handle_new_user encontrada');
    } else {
      console.log('❌ Função handle_new_user não encontrada');
    }
    console.log('');
    
    // 6. Verificar trigger na tabela auth.users
    console.log('6. 🔄 Verificando trigger on_auth_user_created...');
    const { data: triggers, error: triggerError } = await supabaseService
      .from('information_schema.triggers')
      .select('trigger_name, event_manipulation, action_timing')
      .eq('trigger_schema', 'auth')
      .eq('trigger_name', 'on_auth_user_created');
    
    if (triggers && triggers.length > 0) {
      console.log('✅ Trigger on_auth_user_created encontrado');
    } else {
      console.log('❌ Trigger on_auth_user_created não encontrado');
      console.log('   Isso explica por que novos usuários não são criados automaticamente');
    }
    console.log('');
    
    // 7. Testar criação de usuário de teste
    console.log('7. 🧪 Testando criação de usuário de teste...');
    const testUserId = 'test-' + Date.now();
    const testEmail = `teste${Date.now()}@exemplo.com`;
    
    const { data: testUser, error: testError } = await supabaseService
      .from('users')
      .insert({
        id: testUserId,
        email: testEmail,
        nome: 'Usuário Teste',
        is_admin: false,
        onboarding_completed: false
      })
      .select()
      .single();
    
    if (testError) {
      console.log('❌ Erro ao criar usuário teste:', testError.message);
    } else {
      console.log('✅ Usuário teste criado com sucesso');
      
      // Limpar usuário teste
      await supabaseService.from('users').delete().eq('id', testUserId);
      console.log('✅ Usuário teste removido');
    }
    console.log('');
    
    // 8. Resumo e recomendações
    console.log('📋 RESUMO E RECOMENDAÇÕES:');
    console.log('\n1. Execute o arquivo setup-trigger-alternativo.sql no painel do Supabase');
    console.log('2. Configure o trigger manualmente no painel:');
    console.log('   - Database > Triggers > Create new trigger');
    console.log('   - Nome: on_auth_user_created');
    console.log('   - Tabela: auth.users');
    console.log('   - Evento: Insert');
    console.log('   - Timing: After');
    console.log('   - Função: public.handle_new_user');
    console.log('\n3. Teste o login no frontend após configurar o trigger');
    console.log('\n4. Se o problema persistir, execute corrigir-tabela-clientes.sql');
    
  } catch (error) {
    console.error('❌ Erro durante diagnóstico:', error.message);
  }
}

diagnosticarPermissoes();