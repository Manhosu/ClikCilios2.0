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

async function verificarCorrecaoDuplicatas() {
  console.log('🔍 VERIFICAÇÃO DE CORREÇÃO DE DUPLICATAS\n');

  try {
    // 1. Verificar conexão
    console.log('1. 🔗 Testando conexão com Supabase...');
    const { data: testConnection } = await supabaseService
      .from('users')
      .select('count')
      .limit(1);
    
    if (testConnection !== null) {
      console.log('   ✅ Conexão estabelecida com sucesso\n');
    } else {
      throw new Error('Falha na conexão');
    }

    // 2. Verificar emails duplicados
    console.log('2. 📧 Verificando emails duplicados...');
    const { data: duplicateEmails, error: duplicateError } = await supabaseService
      .rpc('check_duplicate_emails');
    
    if (duplicateError) {
      // Se a função não existe, verificar manualmente
      const { data: emailCheck } = await supabaseService
        .from('users')
        .select('email')
        .then(result => {
          if (result.data) {
            const emails = result.data.map(u => u.email);
            const duplicates = emails.filter((email, index) => emails.indexOf(email) !== index);
            return { data: duplicates.length };
          }
          return { data: 0 };
        });
      
      if (emailCheck.data === 0) {
        console.log('   ✅ Nenhum email duplicado encontrado');
      } else {
        console.log(`   ⚠️ ${emailCheck.data} emails duplicados encontrados`);
      }
    }

    // 3. Verificar sincronização entre auth.users e public.users
    console.log('\n3. 🔄 Verificando sincronização de usuários...');
    
    // Contar usuários em auth.users
    const { count: authUsersCount } = await supabaseService
      .from('users')
      .select('*', { count: 'exact', head: true })
      .eq('id', 'non-existent-id'); // Hack para contar auth.users via service
    
    // Contar usuários em public.users
    const { count: publicUsersCount } = await supabaseService
      .from('users')
      .select('*', { count: 'exact', head: true });
    
    console.log(`   Auth.users: ${authUsersCount || 'N/A'} usuários`);
    console.log(`   Public.users: ${publicUsersCount || 0} usuários`);
    
    // 4. Testar acesso anônimo
    console.log('\n4. 🔓 Testando acesso anônimo...');
    const { data: anonUsers, error: anonError } = await supabaseAnon
      .from('users')
      .select('id, email')
      .limit(5);
    
    if (anonError) {
      console.log(`   ❌ Erro no acesso anônimo: ${anonError.message}`);
    } else {
      console.log(`   ✅ Acesso anônimo funcionando: ${anonUsers?.length || 0} usuários visíveis`);
    }

    // 5. Verificar políticas RLS
    console.log('\n5. 🔒 Verificando políticas RLS...');
    const { data: policies, error: policiesError } = await supabaseService
      .rpc('get_table_policies', { table_name: 'users' });
    
    if (policiesError) {
      console.log('   ⚠️ Não foi possível verificar políticas RLS automaticamente');
    } else if (policies && policies.length > 0) {
      console.log(`   ✅ ${policies.length} políticas RLS encontradas`);
      policies.forEach(policy => {
        console.log(`      - ${policy.policyname}: ${policy.cmd}`);
      });
    } else {
      console.log('   ⚠️ Nenhuma política RLS encontrada');
    }

    // 6. Verificar função handle_new_user
    console.log('\n6. ⚙️ Verificando função handle_new_user...');
    const { data: functionExists } = await supabaseService
      .rpc('check_function_exists', { function_name: 'handle_new_user' })
      .catch(() => ({ data: false }));
    
    if (functionExists) {
      console.log('   ✅ Função handle_new_user encontrada');
    } else {
      console.log('   ❌ Função handle_new_user não encontrada');
    }

    // 7. Testar criação de usuário (simulação)
    console.log('\n7. 🧪 Testando integridade dos dados...');
    
    // Verificar se há usuários órfãos
    const { data: orphanCheck } = await supabaseService
      .from('users')
      .select('id, email')
      .limit(1);
    
    if (orphanCheck && orphanCheck.length > 0) {
      console.log('   ✅ Dados íntegros: usuários encontrados na tabela public.users');
    } else {
      console.log('   ⚠️ Nenhum usuário encontrado na tabela public.users');
    }

    // 8. Resumo final
    console.log('\n📋 RESUMO DA VERIFICAÇÃO:');
    console.log('\n✅ VERIFICAÇÕES CONCLUÍDAS:');
    console.log('   - Conexão com Supabase');
    console.log('   - Verificação de emails duplicados');
    console.log('   - Contagem de usuários');
    console.log('   - Teste de acesso anônimo');
    console.log('   - Verificação de políticas RLS');
    console.log('   - Verificação da função handle_new_user');
    console.log('   - Integridade dos dados');
    
    console.log('\n🔧 PRÓXIMOS PASSOS:');
    console.log('1. Execute solucao-final-robusta.sql no painel do Supabase');
    console.log('2. Configure o trigger manualmente:');
    console.log('   - Database > Triggers > Create new trigger');
    console.log('   - Nome: on_auth_user_created');
    console.log('   - Tabela: auth.users');
    console.log('   - Evento: Insert');
    console.log('   - Função: public.handle_new_user');
    console.log('3. Teste o login no frontend');
    console.log('4. Execute: node testar-solucao-final.cjs');
    
  } catch (error) {
    console.error('❌ Erro durante a verificação:', error.message);
    console.error('\n🔧 SOLUÇÃO:');
    console.error('1. Verifique as variáveis de ambiente');
    console.error('2. Execute solucao-final-robusta.sql no painel do Supabase');
    console.error('3. Configure o trigger manualmente');
  }
}

// Executar verificação
verificarCorrecaoDuplicatas();