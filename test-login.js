import { createClient } from '@supabase/supabase-js';
import fetch from 'node-fetch';

// Configuração do Supabase
const supabaseUrl = 'https://gguxeqpayaangiplggme.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdndXhlcXBheWFhbmdpcGxnZ21lIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDk4NDYwOTYsImV4cCI6MjA2NTQyMjA5Nn0.WHusG12ZcOYtVSGUQVUT3Vf-MIbu_O6hlc3ha7yVnSE';

const supabase = createClient(supabaseUrl, supabaseKey);

async function testLoginProcess() {
  console.log('🧪 Testando processo de login...');
  
  try {
    // 1. Testar obtenção da sessão inicial
    console.log('\n1. Verificando sessão inicial...');
    const { data: session, error: sessionError } = await supabase.auth.getSession();
    
    if (sessionError) {
      console.error('❌ Erro ao obter sessão:', sessionError.message);
    } else {
      console.log('✅ Sessão obtida:', session?.session ? 'Usuário logado' : 'Nenhuma sessão ativa');
    }
    
    // 2. Testar login com credenciais inválidas
    console.log('\n2. Testando login com credenciais inválidas...');
    const { data: loginData, error: loginError } = await supabase.auth.signInWithPassword({
      email: 'teste@inexistente.com',
      password: 'senhaerrada'
    });
    
    if (loginError) {
      console.log('✅ Erro esperado para credenciais inválidas:', loginError.message);
    } else {
      console.log('⚠️ Login deveria ter falhou mas não falhou');
    }
    
    // 3. Testar verificação de usuário existente
    console.log('\n3. Verificando usuários existentes...');
    const { data: users, error: usersError } = await supabase
      .from('users')
      .select('id, email, nome')
      .limit(3);
    
    if (usersError) {
      console.error('❌ Erro ao buscar usuários:', usersError.message);
    } else {
      console.log('✅ Usuários encontrados:', users?.length || 0);
      if (users && users.length > 0) {
        console.log('Primeiro usuário:', users[0]);
      }
    }
    
    // 4. Testar verificação de configurações
    console.log('\n4. Testando verificação de configurações...');
    if (users && users.length > 0) {
      const userId = users[0].id;
      const { data: config, error: configError } = await supabase
        .from('configuracoes_usuario')
        .select('*')
        .eq('user_id', userId)
        .single();
      
      if (configError && configError.code === 'PGRST116') {
        console.log('⚠️ Configurações não encontradas para o usuário (normal para novos usuários)');
      } else if (configError) {
        console.error('❌ Erro ao buscar configurações:', configError.message);
      } else {
        console.log('✅ Configurações encontradas para o usuário');
      }
    }
    
    // 5. Testar verificação de bucket de storage
    console.log('\n5. Testando verificação de storage...');
    const { data: buckets, error: bucketsError } = await supabase.storage.listBuckets();
    
    if (bucketsError) {
      console.error('❌ Erro ao listar buckets:', bucketsError.message);
    } else {
      console.log('✅ Buckets encontrados:', buckets?.length || 0);
      const mcpBucket = buckets?.find(b => b.name === 'mcp');
      console.log('Bucket MCP existe:', mcpBucket ? 'Sim' : 'Não');
    }
    
    // 6. Testar APIs de autenticação
    console.log('\n6. Testando APIs de autenticação...');
    
    // Teste sem token
    try {
      const response = await fetch('http://localhost:3001/api/list-images', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      const result = await response.text();
      console.log('API sem token - Status:', response.status, 'Resposta:', result);
    } catch (error) {
      console.error('❌ Erro ao testar API:', error.message);
    }
    
    console.log('\n✅ Teste de processo de login concluído!');
    
  } catch (error) {
    console.error('❌ Erro geral no teste:', error.message);
  }
}

// Executar o teste
testLoginProcess();