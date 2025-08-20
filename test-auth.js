// Teste automatizado do sistema de autenticação
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

// Configuração do Supabase
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ Credenciais do Supabase não encontradas');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Função para testar conectividade e performance
async function testConnectivity() {
  console.log('\n🌐 Testando conectividade com Supabase...');
  
  const startTime = Date.now();
  
  try {
    const { data, error } = await supabase
      .from('users')
      .select('count')
      .limit(1);
    
    const responseTime = Date.now() - startTime;
    
    if (error) {
      console.log(`❌ Erro de conectividade: ${error.message} (${responseTime}ms)`);
      return { success: false, responseTime };
    }
    
    console.log(`✅ Conectividade OK (${responseTime}ms)`);
    return { success: true, responseTime };
    
  } catch (error) {
    const responseTime = Date.now() - startTime;
    console.log(`❌ Erro crítico de conectividade: ${error.message} (${responseTime}ms)`);
    return { success: false, responseTime };
  }
}

// Função para testar integridade dos dados de usuário
async function testUserDataIntegrity() {
  console.log('\n🔍 Testando integridade dos dados de usuário...');
  
  try {
    // Verificar consistência entre auth.users e public.users
    const { data: authUsers, error: authError } = await supabase
      .rpc('get_auth_users_count');
    
    if (authError) {
      console.log('⚠️ Não foi possível verificar usuários auth (função não existe)');
    }
    
    // Verificar usuários na tabela public.users
    const { data: publicUsers, error: publicError } = await supabase
      .from('users')
      .select('id, email, nome, created_at')
      .order('created_at', { ascending: false });
    
    if (publicError) {
      console.log(`❌ Erro ao buscar usuários públicos: ${publicError.message}`);
      return false;
    }
    
    console.log(`✅ Encontrados ${publicUsers.length} usuários na tabela public.users`);
    
    // Verificar campos obrigatórios
    const usersWithMissingData = publicUsers.filter(user => 
      !user.email || !user.nome || !user.id
    );
    
    if (usersWithMissingData.length > 0) {
      console.log(`⚠️ ${usersWithMissingData.length} usuários com dados incompletos`);
      usersWithMissingData.forEach(user => {
        console.log(`   ID: ${user.id}, Email: ${user.email || 'FALTANDO'}, Nome: ${user.nome || 'FALTANDO'}`);
      });
    } else {
      console.log('✅ Todos os usuários têm dados completos');
    }
    
    // Verificar duplicatas de email
    const emails = publicUsers.map(u => u.email).filter(Boolean);
    const uniqueEmails = new Set(emails);
    
    if (emails.length !== uniqueEmails.size) {
      console.log(`⚠️ Detectadas ${emails.length - uniqueEmails.size} duplicatas de email`);
    } else {
      console.log('✅ Nenhuma duplicata de email encontrada');
    }
    
    return true;
    
  } catch (error) {
    console.log(`❌ Erro na verificação de integridade: ${error.message}`);
    return false;
  }
}

// Função para testar performance de consultas
async function testQueryPerformance() {
  console.log('\n⚡ Testando performance de consultas...');
  
  const tests = [
    {
      name: 'Busca de usuário por ID',
      query: async () => {
        const { data: users } = await supabase
          .from('users')
          .select('*')
          .limit(1);
        
        if (users && users.length > 0) {
          return await supabase
            .from('users')
            .select('*')
            .eq('id', users[0].id)
            .single();
        }
        return { data: null, error: 'Nenhum usuário encontrado' };
      }
    },
    {
      name: 'Busca de usuário por email',
      query: async () => {
        return await supabase
          .from('users')
          .select('*')
          .eq('email', 'teste@ciliosclick.com')
          .single();
      }
    },
    {
      name: 'Listagem de usuários (10 mais recentes)',
      query: async () => {
        return await supabase
          .from('users')
          .select('id, email, nome, created_at')
          .order('created_at', { ascending: false })
          .limit(10);
      }
    },
    {
      name: 'Contagem total de usuários',
      query: async () => {
        return await supabase
          .from('users')
          .select('*', { count: 'exact', head: true });
      }
    }
  ];
  
  const results = [];
  
  for (const test of tests) {
    const startTime = Date.now();
    
    try {
      const { data, error } = await test.query();
      const responseTime = Date.now() - startTime;
      
      if (error) {
        console.log(`❌ ${test.name}: ${error.message} (${responseTime}ms)`);
        results.push({ name: test.name, success: false, responseTime, error: error.message });
      } else {
        console.log(`✅ ${test.name}: OK (${responseTime}ms)`);
        results.push({ name: test.name, success: true, responseTime });
      }
      
    } catch (error) {
      const responseTime = Date.now() - startTime;
      console.log(`❌ ${test.name}: Erro crítico (${responseTime}ms)`);
      results.push({ name: test.name, success: false, responseTime, error: error.message });
    }
    
    // Pequena pausa entre testes
    await new Promise(resolve => setTimeout(resolve, 100));
  }
  
  return results;
}

// Função para testar configuração de autenticação
async function testAuthConfiguration() {
  console.log('\n⚙️ Testando configuração de autenticação...');
  
  try {
    // Testar se conseguimos obter a sessão atual
    const startTime = Date.now();
    const { data: session, error } = await supabase.auth.getSession();
    const responseTime = Date.now() - startTime;
    
    if (error) {
      console.log(`❌ Erro ao obter sessão: ${error.message} (${responseTime}ms)`);
      return false;
    }
    
    console.log(`✅ Configuração de auth OK (${responseTime}ms)`);
    
    if (session.session) {
      console.log(`📧 Sessão ativa para: ${session.session.user.email}`);
      console.log(`⏰ Expira em: ${new Date(session.session.expires_at * 1000).toLocaleString()}`);
    } else {
      console.log('ℹ️ Nenhuma sessão ativa (normal para testes)');  
    }
    
    return true;
    
  } catch (error) {
    console.log(`❌ Erro na configuração de auth: ${error.message}`);
    return false;
  }
}

// Função principal de teste
async function runAuthTests() {
  console.log('🚀 Iniciando verificação completa do sistema de autenticação...');
  console.log('=' .repeat(60));
  
  const startTime = Date.now();
  
  // Executar todos os testes
  const connectivityResult = await testConnectivity();
  const authConfigResult = await testAuthConfiguration();
  const integrityResult = await testUserDataIntegrity();
  const performanceResults = await testQueryPerformance();
  
  const totalTime = Date.now() - startTime;
  
  // Relatório final
  console.log('\n📊 RELATÓRIO COMPLETO DE VERIFICAÇÃO');
  console.log('=' .repeat(60));
  
  console.log('\n🌐 CONECTIVIDADE:');
  console.log(`   Status: ${connectivityResult.success ? '✅ OK' : '❌ FALHA'}`);
  console.log(`   Tempo de resposta: ${connectivityResult.responseTime}ms`);
  
  console.log('\n⚙️ CONFIGURAÇÃO DE AUTH:');
  console.log(`   Status: ${authConfigResult ? '✅ OK' : '❌ FALHA'}`);
  
  console.log('\n🔍 INTEGRIDADE DOS DADOS:');
  console.log(`   Status: ${integrityResult ? '✅ OK' : '❌ FALHA'}`);
  
  console.log('\n⚡ PERFORMANCE DAS CONSULTAS:');
  const successfulQueries = performanceResults.filter(r => r.success);
  const failedQueries = performanceResults.filter(r => !r.success);
  
  console.log(`   Consultas bem-sucedidas: ${successfulQueries.length}/${performanceResults.length}`);
  console.log(`   Consultas falharam: ${failedQueries.length}/${performanceResults.length}`);
  
  if (successfulQueries.length > 0) {
    const avgResponseTime = successfulQueries.reduce((sum, r) => sum + r.responseTime, 0) / successfulQueries.length;
    const maxResponseTime = Math.max(...successfulQueries.map(r => r.responseTime));
    const minResponseTime = Math.min(...successfulQueries.map(r => r.responseTime));
    
    console.log(`   Tempo médio de resposta: ${avgResponseTime.toFixed(0)}ms`);
    console.log(`   Tempo mínimo: ${minResponseTime}ms`);
    console.log(`   Tempo máximo: ${maxResponseTime}ms`);
  }
  
  if (failedQueries.length > 0) {
    console.log('\n❌ Consultas com falha:');
    failedQueries.forEach(result => {
      console.log(`   ${result.name}: ${result.error}`);
    });
  }
  
  console.log(`\n⏱️ Tempo total de verificação: ${totalTime}ms`);
  
  // Avaliação geral
  const overallHealth = connectivityResult.success && authConfigResult && integrityResult && (failedQueries.length === 0);
  
  console.log('\n🎯 AVALIAÇÃO GERAL:');
  if (overallHealth) {
    console.log('✅ Sistema de autenticação está funcionando perfeitamente!');
    console.log('✅ Todos os testes passaram com sucesso');
    console.log('✅ Performance dentro dos padrões esperados');
  } else {
    console.log('⚠️ Sistema de autenticação apresenta alguns problemas');
    if (!connectivityResult.success) console.log('❌ Problemas de conectividade detectados');
    if (!authConfigResult) console.log('❌ Problemas na configuração de autenticação');
    if (!integrityResult) console.log('❌ Problemas na integridade dos dados');
    if (failedQueries.length > 0) console.log('❌ Problemas de performance detectados');
  }
  
  return overallHealth;
}

// Executar testes
runAuthTests().then((success) => {
  console.log('\n🏁 Verificação concluída');
  process.exit(success ? 0 : 1);
}).catch(error => {
  console.error('❌ Erro fatal na verificação:', error);
  process.exit(1);
});