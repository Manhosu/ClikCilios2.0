// Teste de performance do sistema de autenticação
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

// Métricas de performance
class PerformanceMetrics {
  constructor() {
    this.operations = [];
  }
  
  addOperation(name, duration, success = true) {
    this.operations.push({ name, duration, success, timestamp: Date.now() });
  }
  
  getStats(operationName = null) {
    const ops = operationName 
      ? this.operations.filter(op => op.name === operationName)
      : this.operations;
    
    if (ops.length === 0) return null;
    
    const durations = ops.map(op => op.duration);
    const successCount = ops.filter(op => op.success).length;
    
    return {
      count: ops.length,
      successRate: (successCount / ops.length) * 100,
      min: Math.min(...durations),
      max: Math.max(...durations),
      avg: durations.reduce((a, b) => a + b, 0) / durations.length,
      median: durations.sort((a, b) => a - b)[Math.floor(durations.length / 2)]
    };
  }
  
  printReport() {
    console.log('\n📊 RELATÓRIO DE PERFORMANCE');
    console.log('============================================================');
    
    const operationTypes = [...new Set(this.operations.map(op => op.name))];
    
    operationTypes.forEach(opType => {
      const stats = this.getStats(opType);
      if (stats) {
        console.log(`\n🔧 ${opType.toUpperCase()}:`);
        console.log(`   Operações: ${stats.count}`);
        console.log(`   Taxa de sucesso: ${stats.successRate.toFixed(1)}%`);
        console.log(`   Tempo mínimo: ${stats.min}ms`);
        console.log(`   Tempo máximo: ${stats.max}ms`);
        console.log(`   Tempo médio: ${stats.avg.toFixed(1)}ms`);
        console.log(`   Mediana: ${stats.median}ms`);
        
        // Avaliação de performance
        if (stats.avg < 200) {
          console.log(`   Avaliação: ✅ Excelente`);
        } else if (stats.avg < 500) {
          console.log(`   Avaliação: ✅ Bom`);
        } else if (stats.avg < 1000) {
          console.log(`   Avaliação: ⚠️ Aceitável`);
        } else {
          console.log(`   Avaliação: ❌ Lento`);
        }
      }
    });
  }
}

const metrics = new PerformanceMetrics();

// Função para medir tempo de execução
async function measureTime(operationName, operation) {
  const startTime = Date.now();
  try {
    const result = await operation();
    const duration = Date.now() - startTime;
    metrics.addOperation(operationName, duration, true);
    return { success: true, result, duration };
  } catch (error) {
    const duration = Date.now() - startTime;
    metrics.addOperation(operationName, duration, false);
    return { success: false, error, duration };
  }
}

// Teste de conectividade básica
async function testBasicConnectivity() {
  console.log('\n🌐 Testando conectividade básica...');
  
  const tests = [
    {
      name: 'ping_database',
      operation: () => supabase.from('users').select('count').limit(1)
    },
    {
      name: 'get_session',
      operation: () => supabase.auth.getSession()
    },
    {
      name: 'get_user',
      operation: () => supabase.auth.getUser()
    }
  ];
  
  for (const test of tests) {
    const result = await measureTime(test.name, test.operation);
    console.log(`${result.success ? '✅' : '❌'} ${test.name}: ${result.duration}ms`);
  }
}

// Teste de consultas de usuário
async function testUserQueries() {
  console.log('\n👥 Testando consultas de usuário...');
  
  const tests = [
    {
      name: 'list_users_10',
      operation: () => supabase.from('users').select('*').limit(10)
    },
    {
      name: 'list_users_50',
      operation: () => supabase.from('users').select('*').limit(50)
    },
    {
      name: 'count_users',
      operation: () => supabase.from('users').select('*', { count: 'exact', head: true })
    },
    {
      name: 'search_user_by_email',
      operation: () => supabase.from('users').select('*').ilike('email', '%@gmail.com%').limit(5)
    },
    {
      name: 'get_user_by_id',
      operation: async () => {
        // Primeiro pegar um ID válido
        const { data: users } = await supabase.from('users').select('id').limit(1);
        if (users && users.length > 0) {
          return supabase.from('users').select('*').eq('id', users[0].id).single();
        }
        throw new Error('Nenhum usuário encontrado');
      }
    }
  ];
  
  for (const test of tests) {
    const result = await measureTime(test.name, test.operation);
    console.log(`${result.success ? '✅' : '❌'} ${test.name}: ${result.duration}ms`);
  }
}

// Teste de operações de autenticação
async function testAuthOperations() {
  console.log('\n🔐 Testando operações de autenticação...');
  
  const tests = [
    {
      name: 'refresh_session',
      operation: () => supabase.auth.refreshSession()
    },
    {
      name: 'get_session_multiple',
      operation: async () => {
        // Fazer múltiplas chamadas para testar cache
        const promises = Array(5).fill().map(() => supabase.auth.getSession());
        return Promise.all(promises);
      }
    },
    {
      name: 'auth_state_change_listener',
      operation: () => {
        return new Promise((resolve) => {
          const { data: { subscription } } = supabase.auth.onAuthStateChange(() => {
            subscription.unsubscribe();
            resolve(true);
          });
          // Simular mudança de estado
          setTimeout(() => {
            subscription.unsubscribe();
            resolve(true);
          }, 100);
        });
      }
    }
  ];
  
  for (const test of tests) {
    const result = await measureTime(test.name, test.operation);
    console.log(`${result.success ? '✅' : '❌'} ${test.name}: ${result.duration}ms`);
  }
}

// Teste de carga (múltiplas operações simultâneas)
async function testConcurrentLoad() {
  console.log('\n⚡ Testando carga concorrente...');
  
  const concurrentTests = [
    {
      name: 'concurrent_user_queries',
      count: 10,
      operation: () => supabase.from('users').select('id, email, nome').limit(5)
    },
    {
      name: 'concurrent_session_checks',
      count: 15,
      operation: () => supabase.auth.getSession()
    },
    {
      name: 'concurrent_user_counts',
      count: 8,
      operation: () => supabase.from('users').select('*', { count: 'exact', head: true })
    }
  ];
  
  for (const test of concurrentTests) {
    console.log(`\n🔄 Executando ${test.count} operações ${test.name} simultâneas...`);
    
    const startTime = Date.now();
    const promises = Array(test.count).fill().map(() => 
      measureTime(test.name, test.operation)
    );
    
    const results = await Promise.all(promises);
    const totalTime = Date.now() - startTime;
    
    const successCount = results.filter(r => r.success).length;
    const avgTime = results.reduce((sum, r) => sum + r.duration, 0) / results.length;
    
    console.log(`✅ Concluído: ${successCount}/${test.count} sucessos`);
    console.log(`⏱️ Tempo total: ${totalTime}ms`);
    console.log(`📊 Tempo médio por operação: ${avgTime.toFixed(1)}ms`);
    console.log(`🚀 Throughput: ${(test.count / (totalTime / 1000)).toFixed(1)} ops/seg`);
  }
}

// Teste de stress (operações repetidas)
async function testStressLoad() {
  console.log('\n🔥 Testando carga de stress...');
  
  const stressTest = {
    name: 'stress_user_queries',
    iterations: 50,
    operation: () => supabase.from('users').select('id, email').limit(3)
  };
  
  console.log(`🔄 Executando ${stressTest.iterations} operações sequenciais...`);
  
  const startTime = Date.now();
  let successCount = 0;
  
  for (let i = 0; i < stressTest.iterations; i++) {
    const result = await measureTime(stressTest.name, stressTest.operation);
    if (result.success) successCount++;
    
    // Log de progresso a cada 10 operações
    if ((i + 1) % 10 === 0) {
      console.log(`📈 Progresso: ${i + 1}/${stressTest.iterations} (${successCount} sucessos)`);
    }
  }
  
  const totalTime = Date.now() - startTime;
  
  console.log(`\n✅ Stress test concluído:`);
  console.log(`📊 Sucessos: ${successCount}/${stressTest.iterations}`);
  console.log(`⏱️ Tempo total: ${totalTime}ms`);
  console.log(`🚀 Throughput: ${(stressTest.iterations / (totalTime / 1000)).toFixed(1)} ops/seg`);
}

// Função principal
async function runPerformanceTests() {
  console.log('🚀 Iniciando testes de performance do sistema de autenticação...');
  console.log('============================================================');
  
  const startTime = Date.now();
  
  try {
    await testBasicConnectivity();
    await testUserQueries();
    await testAuthOperations();
    await testConcurrentLoad();
    await testStressLoad();
    
    const totalTime = Date.now() - startTime;
    
    // Relatório final
    metrics.printReport();
    
    console.log('\n🎯 AVALIAÇÃO GERAL DE PERFORMANCE');
    console.log('============================================================');
    
    const overallStats = metrics.getStats();
    console.log(`📊 Total de operações: ${overallStats.count}`);
    console.log(`✅ Taxa de sucesso geral: ${overallStats.successRate.toFixed(1)}%`);
    console.log(`⏱️ Tempo médio de resposta: ${overallStats.avg.toFixed(1)}ms`);
    console.log(`⚡ Tempo total de teste: ${totalTime}ms`);
    
    if (overallStats.successRate >= 95 && overallStats.avg < 500) {
      console.log('\n🏆 EXCELENTE: Sistema de autenticação com performance superior!');
    } else if (overallStats.successRate >= 90 && overallStats.avg < 1000) {
      console.log('\n✅ BOM: Sistema de autenticação com performance adequada');
    } else {
      console.log('\n⚠️ ATENÇÃO: Sistema pode precisar de otimizações');
    }
    
  } catch (error) {
    console.error(`❌ Erro durante os testes: ${error.message}`);
  }
  
  console.log('\n🏁 Testes de performance concluídos');
}

// Executar testes
runPerformanceTests().catch(console.error);