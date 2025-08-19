import { createClient } from '@supabase/supabase-js';
import fetch from 'node-fetch';

// Configuração do Supabase
const supabaseUrl = 'https://gguxeqpayaangiplggme.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdndXhlcXBheWFhbmdpcGxnZ21lIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDk4NDYwOTYsImV4cCI6MjA2NTQyMjA5Nn0.WHusG12ZcOYtVSGUQVUT3Vf-MIbu_O6hlc3ha7yVnSE';

const supabase = createClient(supabaseUrl, supabaseKey);

async function simulateLoginFlow() {
  console.log('🔄 Simulando fluxo completo de login...');
  
  try {
    // 1. Simular inicialização da aplicação
    console.log('\n1. 🚀 Inicializando aplicação...');
    const startTime = Date.now();
    
    // Verificar sessão inicial (como faz o useAuth)
    const { data: session, error: sessionError } = await supabase.auth.getSession();
    
    if (sessionError) {
      console.error('❌ Erro na inicialização:', sessionError.message);
      return;
    }
    
    const initTime = Date.now() - startTime;
    console.log(`✅ Inicialização concluída em ${initTime}ms`);
    
    // 2. Simular verificação de storage (como faz o fixSupabaseStorage)
    console.log('\n2. 🔍 Verificando storage...');
    const storageStartTime = Date.now();
    let storageTime = 0;
    
    const { data: buckets, error: bucketsError } = await supabase.storage.listBuckets();
    
    if (bucketsError) {
      console.error('❌ Erro ao verificar storage:', bucketsError.message);
      storageTime = Date.now() - storageStartTime;
    } else {
      storageTime = Date.now() - storageStartTime;
      console.log(`✅ Storage verificado em ${storageTime}ms`);
      
      const mcpBucket = buckets?.find(b => b.name === 'mcp');
      if (!mcpBucket) {
        console.log('⚠️ Bucket MCP não existe - seria criado automaticamente');
      }
    }
    
    // 3. Simular login com usuário existente
    console.log('\n3. 🔐 Simulando login...');
    
    // Primeiro, buscar um usuário real para testar
    const { data: users, error: usersError } = await supabase
      .from('users')
      .select('email')
      .limit(1);
    
    if (usersError || !users || users.length === 0) {
      console.log('⚠️ Nenhum usuário encontrado para teste de login');
      return;
    }
    
    const testEmail = users[0].email;
    console.log(`Testando com email: ${testEmail}`);
    
    // Tentar login (vai falhar por não termos a senha, mas testa a conectividade)
    const loginStartTime = Date.now();
    const { data: loginData, error: loginError } = await supabase.auth.signInWithPassword({
      email: testEmail,
      password: 'senha_teste_incorreta'
    });
    
    const loginTime = Date.now() - loginStartTime;
    
    if (loginError) {
      console.log(`✅ Resposta de login em ${loginTime}ms: ${loginError.message}`);
    } else {
      console.log('⚠️ Login não deveria ter funcionado');
    }
    
    // 4. Testar timeout e performance
    console.log('\n4. ⏱️ Testando performance e timeouts...');
    
    // Teste de múltiplas requisições simultâneas
    const concurrentStartTime = Date.now();
    const promises = [];
    
    for (let i = 0; i < 5; i++) {
      promises.push(
        supabase.from('users').select('count').limit(1)
      );
    }
    
    try {
      await Promise.all(promises);
      const concurrentTime = Date.now() - concurrentStartTime;
      console.log(`✅ 5 requisições simultâneas concluídas em ${concurrentTime}ms`);
    } catch (error) {
      console.error('❌ Erro em requisições simultâneas:', error.message);
    }
    
    // 5. Testar cenários de erro
    console.log('\n5. 🚨 Testando cenários de erro...');
    
    // Teste com tabela inexistente
    const { data: invalidData, error: invalidError } = await supabase
      .from('tabela_inexistente')
      .select('*');
    
    if (invalidError) {
      console.log('✅ Erro esperado para tabela inexistente:', invalidError.message);
    }
    
    // 6. Verificar APIs da aplicação
    console.log('\n6. 🌐 Testando APIs da aplicação...');
    
    const apiTests = [
      { endpoint: '/api/list-images', method: 'GET' },
      { endpoint: '/api/save-client-image', method: 'POST' }
    ];
    
    for (const test of apiTests) {
      try {
        const apiStartTime = Date.now();
        const response = await fetch(`http://localhost:3001${test.endpoint}`, {
          method: test.method,
          headers: {
            'Content-Type': 'application/json'
          },
          body: test.method === 'POST' ? JSON.stringify({}) : undefined
        });
        
        const apiTime = Date.now() - apiStartTime;
        const result = await response.text();
        
        console.log(`${test.endpoint} - Status: ${response.status}, Tempo: ${apiTime}ms`);
        
        if (response.status >= 500) {
          console.log('⚠️ Erro interno do servidor detectado');
        }
      } catch (error) {
        console.error(`❌ Erro ao testar ${test.endpoint}:`, error.message);
      }
    }
    
    console.log('\n✅ Simulação de fluxo de login concluída!');
    console.log('\n📊 Resumo dos tempos:');
    console.log(`- Inicialização: ${initTime}ms`);
    console.log(`- Verificação de storage: ${storageTime || 'N/A'}ms`);
    console.log(`- Resposta de login: ${loginTime}ms`);
    
    // Verificar se há tempos suspeitos
    if (initTime > 3000) {
      console.log('⚠️ ALERTA: Inicialização muito lenta (>3s)');
    }
    if (loginTime > 5000) {
      console.log('⚠️ ALERTA: Login muito lento (>5s)');
    }
    
  } catch (error) {
    console.error('❌ Erro geral na simulação:', error.message);
  }
}

// Executar a simulação
simulateLoginFlow();