// Script para verificar se a tabela webhook_events existe
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

async function verificarTabelaWebhookEvents() {
  console.log('🔍 Verificando tabela webhook_events...');
  
  // Configuração do Supabase
  const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
  const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY;
  
  if (!supabaseUrl || !supabaseKey) {
    console.error('❌ Variáveis de ambiente do Supabase não encontradas!');
    console.log('Necessário: VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY');
    return;
  }
  
  console.log('✅ Variáveis do Supabase encontradas');
  console.log('URL:', supabaseUrl);
  console.log('Key:', supabaseKey.substring(0, 20) + '...');
  
  const supabase = createClient(supabaseUrl, supabaseKey);
  
  try {
    // Tenta fazer uma consulta simples na tabela
    console.log('\n📊 Testando acesso à tabela webhook_events...');
    const { data, error } = await supabase
      .from('webhook_events')
      .select('count')
      .limit(1);
    
    if (error) {
      console.error('❌ Erro ao acessar tabela webhook_events:');
      console.error(error.message);
      
      if (error.message.includes('relation "webhook_events" does not exist')) {
        console.log('\n🚨 PROBLEMA IDENTIFICADO: Tabela webhook_events não existe!');
        console.log('\n🔧 SOLUÇÃO:');
        console.log('1. Execute o arquivo: criar-webhook-events-limpo.sql');
        console.log('2. No Supabase SQL Editor');
        console.log('3. Ou execute: node criar-tabela-webhook-events.cjs');
      }
    } else {
      console.log('✅ Tabela webhook_events existe e está acessível');
      console.log('Dados:', data);
    }
    
  } catch (err) {
    console.error('❌ Erro inesperado:', err.message);
  }
  
  // Verificar outras tabelas relacionadas
  console.log('\n📋 Verificando outras tabelas...');
  
  const tabelas = ['users', 'pre_users', 'hotmart_users'];
  
  for (const tabela of tabelas) {
    try {
      const { data, error } = await supabase
        .from(tabela)
        .select('count')
        .limit(1);
      
      if (error) {
        console.log(`❌ ${tabela}: ${error.message}`);
      } else {
        console.log(`✅ ${tabela}: OK`);
      }
    } catch (err) {
      console.log(`❌ ${tabela}: ${err.message}`);
    }
  }
}

verificarTabelaWebhookEvents().catch(console.error);