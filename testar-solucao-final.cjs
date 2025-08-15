const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseServiceKey || !supabaseAnonKey) {
  console.error('❌ Variáveis de ambiente não configuradas');
  process.exit(1);
}

// Cliente com service role
const supabaseService = createClient(supabaseUrl, supabaseServiceKey);

// Cliente com chave anônima
const supabaseAnon = createClient(supabaseUrl, supabaseAnonKey);

async function testarSolucaoFinal() {
  console.log('🧪 TESTE DA SOLUÇÃO FINAL\n');
  
  try {
    // 1. Verificar sincronização de usuários
    console.log('1. 📊 Verificando sincronização de usuários...');
    
    const { data: authUsers } = await supabaseService.auth.admin.listUsers();
    const { data: publicUsersService } = await supabaseService
      .from('users')
      .select('id, email')
      .limit(1000);
    
    const { data: publicUsersAnon } = await supabaseAnon
      .from('users')
      .select('id, email')
      .limit(1000);
    
    console.log(`   Auth.users: ${authUsers.users.length} usuários`);
    console.log(`   Public.users (service): ${publicUsersService?.length || 0} usuários`);
    console.log(`   Public.users (anônimo): ${publicUsersAnon?.length || 0} usuários`);
    
    if (publicUsersAnon && publicUsersAnon.length > 0) {
      console.log('✅ Acesso anônimo à tabela users funcionando!');
    } else {
      console.log('❌ Acesso anônimo ainda bloqueado');
    }
    console.log('');
    
    // 2. Testar criação de cliente com usuário existente
    console.log('2. 🧑‍💼 Testando criação de cliente...');
    
    if (publicUsersService && publicUsersService.length > 0) {
      const usuarioTeste = publicUsersService[0];
      console.log(`   Usando usuário: ${usuarioTeste.email}`);
      
      // Testar com service role
      const { data: clienteService, error: errorService } = await supabaseService
        .from('clientes')
        .insert({
          nome: 'Cliente Teste Final',
          telefone: '(11) 99999-9999',
          email: 'teste.final@exemplo.com',
          user_id: usuarioTeste.id
        })
        .select()
        .single();
      
      if (errorService) {
        console.log('❌ Erro ao criar cliente (service):', errorService.message);
      } else {
        console.log('✅ Cliente criado com sucesso (service role)');
        
        // Limpar cliente teste
        await supabaseService.from('clientes').delete().eq('id', clienteService.id);
        console.log('✅ Cliente teste removido');
      }
    } else {
      console.log('❌ Nenhum usuário encontrado para teste');
    }
    console.log('');
    
    // 3. Verificar políticas RLS
    console.log('3. 🔒 Verificando políticas RLS...');
    
    const { data: policies, error: policiesError } = await supabaseService
      .from('pg_policies')
      .select('policyname, cmd')
      .eq('tablename', 'users')
      .eq('schemaname', 'public');
    
    if (policies && policies.length > 0) {
      console.log(`✅ ${policies.length} políticas RLS encontradas:`);
      policies.forEach(policy => {
        console.log(`   - ${policy.policyname} (${policy.cmd})`);
      });
    } else {
      console.log('⚠️  Nenhuma política RLS encontrada');
    }
    console.log('');
    
    // 4. Verificar função handle_new_user
    console.log('4. ⚙️  Verificando função handle_new_user...');
    
    const { data: functions } = await supabaseService
      .from('information_schema.routines')
      .select('routine_name')
      .eq('routine_schema', 'public')
      .eq('routine_name', 'handle_new_user');
    
    if (functions && functions.length > 0) {
      console.log('✅ Função handle_new_user encontrada');
    } else {
      console.log('❌ Função handle_new_user não encontrada');
    }
    console.log('');
    
    // 5. Verificar trigger
    console.log('5. 🔄 Verificando trigger...');
    
    const { data: triggers } = await supabaseService
      .from('information_schema.triggers')
      .select('trigger_name')
      .eq('trigger_schema', 'auth')
      .eq('trigger_name', 'on_auth_user_created');
    
    if (triggers && triggers.length > 0) {
      console.log('✅ Trigger on_auth_user_created encontrado');
    } else {
      console.log('⚠️  Trigger on_auth_user_created não encontrado');
      console.log('   Configure manualmente no painel do Supabase');
    }
    console.log('');
    
    // 6. Resumo final
    console.log('📋 RESUMO FINAL:');
    
    const problemas = [];
    const sucessos = [];
    
    if (publicUsersAnon && publicUsersAnon.length > 0) {
      sucessos.push('✅ Acesso anônimo à tabela users');
    } else {
      problemas.push('❌ Acesso anônimo bloqueado');
    }
    
    if (authUsers.users.length === (publicUsersService?.length || 0)) {
      sucessos.push('✅ Usuários sincronizados');
    } else {
      problemas.push('❌ Usuários não sincronizados');
    }
    
    if (functions && functions.length > 0) {
      sucessos.push('✅ Função handle_new_user criada');
    } else {
      problemas.push('❌ Função handle_new_user ausente');
    }
    
    console.log('\n🎉 SUCESSOS:');
    sucessos.forEach(sucesso => console.log(`   ${sucesso}`));
    
    if (problemas.length > 0) {
      console.log('\n⚠️  PROBLEMAS RESTANTES:');
      problemas.forEach(problema => console.log(`   ${problema}`));
      
      console.log('\n🔧 PRÓXIMOS PASSOS:');
      console.log('1. Execute solucao-definitiva-permissoes.sql no painel do Supabase');
      console.log('2. Configure o trigger manualmente:');
      console.log('   - Database > Triggers > Create new trigger');
      console.log('   - Nome: on_auth_user_created');
      console.log('   - Tabela: auth.users');
      console.log('   - Evento: Insert');
      console.log('   - Função: public.handle_new_user');
      console.log('3. Teste o login no frontend');
    } else {
      console.log('\n🎉 TUDO FUNCIONANDO! Você pode testar a criação de clientes no frontend.');
    }
    
  } catch (error) {
    console.error('❌ Erro durante teste:', error.message);
  }
}

testarSolucaoFinal();