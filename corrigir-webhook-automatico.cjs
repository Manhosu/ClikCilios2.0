// Script para corrigir automaticamente o problema do webhook
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

async function corrigirWebhookAutomatico() {
  console.log('🔧 CORREÇÃO AUTOMÁTICA DO WEBHOOK HOTMART');
  console.log('==========================================\n');
  
  // 1. Verificar variáveis de ambiente
  console.log('1️⃣ Verificando variáveis de ambiente...');
  
  const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
  const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  
  if (!supabaseUrl || !supabaseKey) {
    console.error('❌ Variáveis de ambiente do Supabase não encontradas!');
    console.log('\n📝 AÇÃO NECESSÁRIA:');
    console.log('1. Configure as variáveis no arquivo .env:');
    console.log('   VITE_SUPABASE_URL=https://seu-projeto.supabase.co');
    console.log('   VITE_SUPABASE_ANON_KEY=sua-chave-anonima');
    console.log('   SUPABASE_SERVICE_ROLE_KEY=sua-service-role-key');
    console.log('\n2. Configure as mesmas variáveis no Vercel:');
    console.log('   https://vercel.com/dashboard → Settings → Environment Variables');
    return;
  }
  
  console.log('✅ Variáveis do Supabase encontradas');
  
  // 2. Conectar ao Supabase
  console.log('\n2️⃣ Conectando ao Supabase...');
  const supabase = createClient(supabaseUrl, supabaseKey);
  
  // 3. Verificar tabela webhook_events
  console.log('\n3️⃣ Verificando tabela webhook_events...');
  
  try {
    const { data, error } = await supabase
      .from('webhook_events')
      .select('count')
      .limit(1);
    
    if (error && error.message.includes('relation "webhook_events" does not exist')) {
      console.log('❌ Tabela webhook_events não existe');
      
      // 4. Criar tabela automaticamente (se tiver service role key)
      if (serviceRoleKey) {
        console.log('\n4️⃣ Criando tabela webhook_events automaticamente...');
        
        const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey);
        
        const createTableSQL = `
          -- Criar tabela webhook_events
          CREATE TABLE IF NOT EXISTS webhook_events (
            id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
            event_type VARCHAR(50) NOT NULL,
            event_data JSONB NOT NULL,
            raw_payload TEXT,
            processed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
          );
          
          -- Criar índices
          CREATE INDEX IF NOT EXISTS idx_webhook_events_type ON webhook_events(event_type);
          CREATE INDEX IF NOT EXISTS idx_webhook_events_created ON webhook_events(created_at);
          
          -- Habilitar RLS
          ALTER TABLE webhook_events ENABLE ROW LEVEL SECURITY;
          
          -- Política para permitir inserção de webhooks
          DROP POLICY IF EXISTS "Allow webhook inserts" ON webhook_events;
          CREATE POLICY "Allow webhook inserts" ON webhook_events
            FOR INSERT WITH CHECK (true);
          
          -- Política para leitura por usuários autenticados
          DROP POLICY IF EXISTS "Allow authenticated read" ON webhook_events;
          CREATE POLICY "Allow authenticated read" ON webhook_events
            FOR SELECT USING (auth.role() = 'authenticated');
        `;
        
        const { error: createError } = await supabaseAdmin.rpc('exec_sql', {
          sql: createTableSQL
        });
        
        if (createError) {
          console.error('❌ Erro ao criar tabela:', createError.message);
          console.log('\n📝 AÇÃO MANUAL NECESSÁRIA:');
          console.log('1. Acesse: https://supabase.com/dashboard');
          console.log('2. Vá para SQL Editor');
          console.log('3. Execute o arquivo: criar-webhook-events-limpo.sql');
        } else {
          console.log('✅ Tabela webhook_events criada com sucesso!');
        }
      } else {
        console.log('\n📝 AÇÃO MANUAL NECESSÁRIA:');
        console.log('1. Acesse: https://supabase.com/dashboard');
        console.log('2. Vá para SQL Editor');
        console.log('3. Execute o arquivo: criar-webhook-events-limpo.sql');
      }
    } else if (error) {
      console.error('❌ Erro ao verificar tabela:', error.message);
    } else {
      console.log('✅ Tabela webhook_events existe e está acessível');
    }
    
  } catch (err) {
    console.error('❌ Erro inesperado:', err.message);
  }
  
  // 5. Verificar outras tabelas essenciais
  console.log('\n5️⃣ Verificando outras tabelas essenciais...');
  
  const tabelasEssenciais = ['users', 'pre_users', 'hotmart_users'];
  let tabelasFaltando = [];
  
  for (const tabela of tabelasEssenciais) {
    try {
      const { error } = await supabase
        .from(tabela)
        .select('count')
        .limit(1);
      
      if (error && error.message.includes('does not exist')) {
        console.log(`❌ ${tabela}: Não existe`);
        tabelasFaltando.push(tabela);
      } else if (error) {
        console.log(`⚠️ ${tabela}: ${error.message}`);
      } else {
        console.log(`✅ ${tabela}: OK`);
      }
    } catch (err) {
      console.log(`❌ ${tabela}: ${err.message}`);
      tabelasFaltando.push(tabela);
    }
  }
  
  // 6. Resumo e próximos passos
  console.log('\n📋 RESUMO DA VERIFICAÇÃO');
  console.log('========================');
  
  if (tabelasFaltando.length > 0) {
    console.log('❌ Tabelas faltando:', tabelasFaltando.join(', '));
    console.log('\n📝 Execute os scripts de criação de tabelas:');
    console.log('   node criar-tabelas-final.cjs');
  } else {
    console.log('✅ Todas as tabelas essenciais existem');
  }
  
  console.log('\n🚀 PRÓXIMOS PASSOS:');
  console.log('1. Configure as variáveis de ambiente no Vercel');
  console.log('2. Redeploy o projeto no Vercel');
  console.log('3. Teste o webhook: node testar-webhook-hotmart-debug.js');
  console.log('4. Configure o webhook no painel do Hotmart');
  
  console.log('\n📚 Consulte: SOLUCAO_ERRO_500_WEBHOOK.md');
}

corrigirWebhookAutomatico().catch(console.error);