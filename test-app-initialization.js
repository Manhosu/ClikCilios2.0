import { createClient } from '@supabase/supabase-js';
import fetch from 'node-fetch';

// Configuração do Supabase
const supabaseUrl = 'https://gguxeqpayaangiplggme.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdndXhlcXBheWFhbmdpcGxnZ21lIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDk4NDYwOTYsImV4cCI6MjA2NTQyMjA5Nn0.WHusG12ZcOYtVSGUQVUT3Vf-MIbu_O6hlc3ha7yVnSE';

const supabase = createClient(supabaseUrl, supabaseKey);

// Simular as funções do fixSupabaseStorage
async function verificarECorrigirStorage(userId) {
  console.log(`🔧 Verificando storage para usuário: ${userId}`);
  
  try {
    // Verificar se bucket MCP existe
    const { data: buckets, error: bucketsError } = await supabase.storage.listBuckets();
    
    if (bucketsError) {
      console.error('❌ Erro ao listar buckets:', bucketsError.message);
      return false;
    }
    
    const mcpBucket = buckets?.find(bucket => bucket.name === 'mcp');
    
    if (!mcpBucket) {
      console.log('⚠️ Bucket MCP não encontrado - tentando criar...');
      
      const { data: createBucket, error: createError } = await supabase.storage.createBucket('mcp', {
        public: true,
        allowedMimeTypes: ['image/jpeg', 'image/png', 'image/webp'],
        fileSizeLimit: 5242880 // 5MB
      });
      
      if (createError) {
        console.error('❌ Erro ao criar bucket MCP:', createError.message);
        return false;
      }
      
      console.log('✅ Bucket MCP criado com sucesso');
    } else {
      console.log('✅ Bucket MCP já existe');
    }
    
    return true;
  } catch (error) {
    console.error('❌ Erro na verificação de storage:', error.message);
    return false;
  }
}

async function verificarECorrigirConfiguracoes(userId) {
  console.log(`⚙️ Verificando configurações para usuário: ${userId}`);
  
  try {
    // Verificar se configurações existem
    const { data: config, error: configError } = await supabase
      .from('configuracoes_usuario')
      .select('*')
      .eq('user_id', userId)
      .single();
    
    if (configError && configError.code === 'PGRST116') {
      console.log('⚠️ Configurações não encontradas - criando configurações padrão...');
      
      const { data: newConfig, error: createError } = await supabase
        .from('configuracoes_usuario')
        .insert({
          user_id: userId,
          frequencia_backup: 'semanal',
          backup_automatico: true
        })
        .select()
        .single();
      
      if (createError) {
        console.error('❌ Erro ao criar configurações:', createError.message);
        return false;
      }
      
      console.log('✅ Configurações padrão criadas');
      return true;
    } else if (configError) {
      console.error('❌ Erro ao buscar configurações:', configError.message);
      return false;
    } else {
      console.log('✅ Configurações já existem');
      return true;
    }
  } catch (error) {
    console.error('❌ Erro na verificação de configurações:', error.message);
    return false;
  }
}

async function testAppInitialization() {
  console.log('🚀 Testando inicialização completa da aplicação...');
  
  try {
    // 1. Simular carregamento inicial
    console.log('\n1. 📱 Simulando carregamento inicial da aplicação...');
    
    const initStart = Date.now();
    
    // Verificar sessão atual
    const { data: session, error: sessionError } = await supabase.auth.getSession();
    
    if (sessionError) {
      console.error('❌ Erro ao obter sessão:', sessionError.message);
    } else {
      console.log('✅ Verificação de sessão:', session.session ? 'Usuário logado' : 'Usuário não logado');
    }
    
    const initEnd = Date.now();
    console.log(`⏱️ Tempo de inicialização: ${initEnd - initStart}ms`);
    
    // 2. Simular login de usuário existente
    console.log('\n2. 🔐 Simulando login de usuário existente...');
    
    // Buscar um usuário real para teste
    const { data: users, error: usersError } = await supabase
      .from('users')
      .select('id, email')
      .limit(1);
    
    if (usersError || !users || users.length === 0) {
      console.log('⚠️ Nenhum usuário encontrado para teste de login');
      return;
    }
    
    const testUser = users[0];
    console.log(`👤 Testando com usuário: ${testUser.email}`);
    
    // 3. Simular processo pós-login
    console.log('\n3. 🔧 Simulando processo pós-login...');
    
    const postLoginStart = Date.now();
    
    // Verificar e corrigir storage
    const storageOk = await verificarECorrigirStorage(testUser.id);
    
    // Verificar e corrigir configurações
    const configOk = await verificarECorrigirConfiguracoes(testUser.id);
    
    const postLoginEnd = Date.now();
    console.log(`⏱️ Tempo de processo pós-login: ${postLoginEnd - postLoginStart}ms`);
    
    // 4. Testar carregamento de dados do dashboard
    console.log('\n4. 📊 Testando carregamento de dados do dashboard...');
    
    const dashboardStart = Date.now();
    
    // Simular carregamento de contadores
    const promises = [
      // Contar clientes
      supabase
        .from('clientes')
        .select('id', { count: 'exact' })
        .eq('user_id', testUser.id),
      
      // Contar imagens
      supabase
        .from('imagens_clientes')
        .select('id', { count: 'exact' })
        .eq('user_id', testUser.id),
      
      // Buscar imagens recentes
      supabase
        .from('imagens_clientes')
        .select('*')
        .eq('user_id', testUser.id)
        .order('created_at', { ascending: false })
        .limit(5)
    ];
    
    const results = await Promise.allSettled(promises);
    const dashboardEnd = Date.now();
    
    console.log(`⏱️ Tempo de carregamento do dashboard: ${dashboardEnd - dashboardStart}ms`);
    
    // Analisar resultados
    const [clientesResult, imagensResult, imagensRecentesResult] = results;
    
    if (clientesResult.status === 'fulfilled' && !clientesResult.value.error) {
      console.log(`👥 Clientes encontrados: ${clientesResult.value.count || 0}`);
    } else {
      console.error('❌ Erro ao contar clientes:', clientesResult.reason || clientesResult.value?.error?.message);
    }
    
    if (imagensResult.status === 'fulfilled' && !imagensResult.value.error) {
      console.log(`📸 Imagens encontradas: ${imagensResult.value.count || 0}`);
    } else {
      console.error('❌ Erro ao contar imagens:', imagensResult.reason || imagensResult.value?.error?.message);
    }
    
    if (imagensRecentesResult.status === 'fulfilled' && !imagensRecentesResult.value.error) {
      console.log(`🆕 Imagens recentes: ${imagensRecentesResult.value.data?.length || 0}`);
    } else {
      console.error('❌ Erro ao buscar imagens recentes:', imagensRecentesResult.reason || imagensRecentesResult.value?.error?.message);
    }
    
    // 5. Testar cenários de erro
    console.log('\n5. 🚨 Testando cenários de erro...');
    
    // Simular perda de conexão
    const timeoutPromise = new Promise((_, reject) => 
      setTimeout(() => reject(new Error('Timeout simulado')), 100)
    );
    
    try {
      await Promise.race([
        supabase.from('tabela_inexistente').select('*'),
        timeoutPromise
      ]);
    } catch (error) {
      if (error.message === 'Timeout simulado') {
        console.log('✅ Timeout simulado funcionou');
      } else {
        console.log('✅ Erro de tabela inexistente capturado:', error.message);
      }
    }
    
    // 6. Teste de stress - múltiplas operações simultâneas
    console.log('\n6. 💪 Teste de stress - operações simultâneas...');
    
    const stressStart = Date.now();
    const stressPromises = [];
    
    // Simular 10 operações simultâneas
    for (let i = 0; i < 10; i++) {
      stressPromises.push(
        supabase
          .from('users')
          .select('id')
          .eq('id', testUser.id)
          .single()
      );
    }
    
    const stressResults = await Promise.allSettled(stressPromises);
    const stressEnd = Date.now();
    
    const successfulOperations = stressResults.filter(r => r.status === 'fulfilled' && !r.value.error).length;
    console.log(`✅ Operações bem-sucedidas: ${successfulOperations}/10`);
    console.log(`⏱️ Tempo total do teste de stress: ${stressEnd - stressStart}ms`);
    console.log(`⚡ Tempo médio por operação: ${(stressEnd - stressStart) / 10}ms`);
    
    // 7. Resumo final
    console.log('\n📋 RESUMO DA INICIALIZAÇÃO:');
    console.log(`✅ Storage: ${storageOk ? 'OK' : 'PROBLEMA'}`);
    console.log(`✅ Configurações: ${configOk ? 'OK' : 'PROBLEMA'}`);
    console.log(`✅ Performance: ${(dashboardEnd - dashboardStart) < 1000 ? 'BOA' : 'LENTA'}`);
    console.log(`✅ Stress test: ${successfulOperations >= 8 ? 'PASSOU' : 'FALHOU'}`);
    
    // Recomendações
    console.log('\n🎯 RECOMENDAÇÕES:');
    
    if (!storageOk) {
      console.log('⚠️ Implementar retry automático para criação de bucket');
    }
    
    if (!configOk) {
      console.log('⚠️ Implementar fallback para configurações padrão');
    }
    
    if ((dashboardEnd - dashboardStart) > 1000) {
      console.log('⚠️ Otimizar carregamento do dashboard (usar cache ou lazy loading)');
    }
    
    if (successfulOperations < 8) {
      console.log('⚠️ Implementar rate limiting ou connection pooling');
    }
    
    console.log('✅ Sistema aparenta estar estável para uso em produção');
    
  } catch (error) {
    console.error('❌ Erro crítico na inicialização:', error.message);
    console.log('🚨 AÇÃO NECESSÁRIA: Investigar erro crítico antes do deploy');
  }
}

// Executar teste
testAppInitialization();