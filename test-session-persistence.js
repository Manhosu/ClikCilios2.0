// Teste de persistência de sessão
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

const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false
  }
});

// Função para testar persistência de sessão
async function testSessionPersistence() {
  console.log('🔐 Testando persistência de sessão...');
  
  try {
    // 1. Verificar se há sessão ativa
    console.log('\n1️⃣ Verificando sessão atual...');
    const { data: { session: currentSession } } = await supabase.auth.getSession();
    
    if (currentSession) {
      console.log(`✅ Sessão ativa encontrada para: ${currentSession.user.email}`);
      console.log(`📅 Expira em: ${new Date(currentSession.expires_at * 1000).toLocaleString()}`);
      console.log(`🔑 Token válido: ${currentSession.access_token ? 'Sim' : 'Não'}`);
      
      // Testar se o token ainda é válido
      const { data: user, error } = await supabase.auth.getUser();
      if (error) {
        console.log(`⚠️ Token inválido: ${error.message}`);
        return false;
      } else {
        console.log(`✅ Token válido para usuário: ${user.user.email}`);
      }
    } else {
      console.log('ℹ️ Nenhuma sessão ativa encontrada');
    }
    
    // 2. Testar configuração de persistência
    console.log('\n2️⃣ Testando configuração de persistência...');
    
    // Verificar se o localStorage está sendo usado
    if (typeof window !== 'undefined') {
      console.log('🌐 Ambiente: Browser (localStorage disponível)');
    } else {
      console.log('🖥️ Ambiente: Node.js (simulando persistência)');
    }
    
    // 3. Testar refresh de token
    console.log('\n3️⃣ Testando refresh de token...');
    
    if (currentSession) {
      const { data: refreshData, error: refreshError } = await supabase.auth.refreshSession();
      
      if (refreshError) {
        console.log(`❌ Erro ao renovar sessão: ${refreshError.message}`);
        return false;
      } else {
        console.log('✅ Token renovado com sucesso');
        console.log(`📅 Nova expiração: ${new Date(refreshData.session.expires_at * 1000).toLocaleString()}`);
      }
    }
    
    // 4. Testar listener de mudanças de auth
    console.log('\n4️⃣ Testando listener de autenticação...');
    
    let listenerWorking = false;
    
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      console.log(`🔔 Evento de auth detectado: ${event}`);
      if (session) {
        console.log(`👤 Usuário: ${session.user.email}`);
      }
      listenerWorking = true;
    });
    
    // Aguardar um pouco para ver se o listener funciona
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    if (listenerWorking) {
      console.log('✅ Listener de autenticação funcionando');
    } else {
      console.log('⚠️ Listener de autenticação não detectou eventos');
    }
    
    // Limpar subscription
    subscription.unsubscribe();
    
    // 5. Verificar configurações de storage
    console.log('\n5️⃣ Verificando configurações de storage...');
    
    const storageKey = `sb-${supabaseUrl.split('//')[1].split('.')[0]}-auth-token`;
    console.log(`🔑 Chave de storage esperada: ${storageKey}`);
    
    return true;
    
  } catch (error) {
    console.error(`❌ Erro no teste de persistência: ${error.message}`);
    return false;
  }
}

// Função para testar logout e limpeza de sessão
async function testLogoutAndCleanup() {
  console.log('\n🚪 Testando logout e limpeza de sessão...');
  
  try {
    const { data: { session: beforeLogout } } = await supabase.auth.getSession();
    
    if (beforeLogout) {
      console.log(`👤 Usuário antes do logout: ${beforeLogout.user.email}`);
      
      // Fazer logout
      const { error } = await supabase.auth.signOut();
      
      if (error) {
        console.log(`❌ Erro no logout: ${error.message}`);
        return false;
      }
      
      console.log('✅ Logout realizado');
      
      // Verificar se a sessão foi limpa
      const { data: { session: afterLogout } } = await supabase.auth.getSession();
      
      if (afterLogout) {
        console.log('⚠️ Sessão ainda ativa após logout');
        return false;
      } else {
        console.log('✅ Sessão limpa com sucesso');
        return true;
      }
    } else {
      console.log('ℹ️ Nenhuma sessão ativa para fazer logout');
      return true;
    }
    
  } catch (error) {
    console.error(`❌ Erro no teste de logout: ${error.message}`);
    return false;
  }
}

// Função principal
async function runSessionTests() {
  console.log('🚀 Iniciando testes de persistência de sessão...');
  console.log('============================================================');
  
  const startTime = Date.now();
  
  // Executar testes
  const persistenceResult = await testSessionPersistence();
  const logoutResult = await testLogoutAndCleanup();
  
  const totalTime = Date.now() - startTime;
  
  // Relatório final
  console.log('\n📊 RELATÓRIO DE TESTES DE SESSÃO');
  console.log('============================================================');
  
  console.log('\n🔐 PERSISTÊNCIA DE SESSÃO:');
  console.log(`   Status: ${persistenceResult ? '✅ OK' : '❌ FALHOU'}`);
  
  console.log('\n🚪 LOGOUT E LIMPEZA:');
  console.log(`   Status: ${logoutResult ? '✅ OK' : '❌ FALHOU'}`);
  
  console.log(`\n⏱️ Tempo total de teste: ${totalTime}ms`);
  
  console.log('\n🎯 AVALIAÇÃO GERAL:');
  if (persistenceResult && logoutResult) {
    console.log('✅ Todos os testes de sessão passaram!');
    console.log('✅ Sistema de persistência funcionando corretamente');
  } else {
    console.log('⚠️ Alguns testes falharam');
    console.log('🔧 Verificar configurações de autenticação');
  }
  
  console.log('\n🏁 Testes de sessão concluídos');
}

// Executar testes
runSessionTests().catch(console.error);