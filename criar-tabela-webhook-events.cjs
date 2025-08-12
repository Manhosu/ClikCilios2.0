require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

// Configuração do Supabase
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, serviceRoleKey);

console.log('🔧 CRIANDO TABELA WEBHOOK_EVENTS');
console.log('==================================================');

async function criarTabelaWebhookEvents() {
  try {
    console.log('📋 Criando tabela webhook_events...');
    
    // SQL para criar a tabela webhook_events
    const createTableSQL = `
      CREATE TABLE IF NOT EXISTS public.webhook_events (
        id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
        source VARCHAR(50) NOT NULL,
        event_type VARCHAR(100) NOT NULL,
        payload JSONB NOT NULL,
        processed BOOLEAN DEFAULT FALSE,
        processed_at TIMESTAMP WITH TIME ZONE,
        error_message TEXT,
        received_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
      
      -- Criar índices para melhor performance
      CREATE INDEX IF NOT EXISTS idx_webhook_events_source ON public.webhook_events(source);
      CREATE INDEX IF NOT EXISTS idx_webhook_events_event_type ON public.webhook_events(event_type);
      CREATE INDEX IF NOT EXISTS idx_webhook_events_processed ON public.webhook_events(processed);
      CREATE INDEX IF NOT EXISTS idx_webhook_events_received_at ON public.webhook_events(received_at);
      
      -- Habilitar RLS
      ALTER TABLE public.webhook_events ENABLE ROW LEVEL SECURITY;
      
      -- Remover políticas existentes (se houver)
    DROP POLICY IF EXISTS "Allow webhook inserts" ON public.webhook_events;
    DROP POLICY IF EXISTS "Allow authenticated read" ON public.webhook_events;
    DROP POLICY IF EXISTS "Allow service role updates" ON public.webhook_events;

    -- Política para permitir inserção de webhooks
    CREATE POLICY "Allow webhook inserts" ON public.webhook_events
      FOR INSERT WITH CHECK (true);

    -- Política para permitir leitura para usuários autenticados
    CREATE POLICY "Allow authenticated read" ON public.webhook_events
      FOR SELECT USING (auth.role() = 'authenticated');

    -- Política para permitir atualização para service role
    CREATE POLICY "Allow service role updates" ON public.webhook_events
      FOR UPDATE USING (auth.role() = 'service_role');
    `;
    
    // Executar o SQL usando uma função RPC
    const { data, error } = await supabase.rpc('exec_sql', {
      query: createTableSQL
    });
    
    if (error) {
      // Se a função RPC não existir, tentar método alternativo
      if (error.code === '42883') {
        console.log('⚠️  Função exec_sql não encontrada, tentando método alternativo...');
        
        // Tentar criar a tabela diretamente
        const { error: directError } = await supabase
          .from('webhook_events')
          .select('*')
          .limit(1);
        
        if (directError && directError.code === '42P01') {
          console.log('❌ Tabela não existe e não foi possível criar automaticamente.');
          console.log('\n📋 EXECUTE ESTE SQL MANUALMENTE NO SUPABASE DASHBOARD:');
          console.log('==================================================');
          console.log(createTableSQL);
          console.log('==================================================');
          return false;
        } else {
          console.log('✅ Tabela webhook_events já existe!');
          return true;
        }
      } else {
        throw error;
      }
    }
    
    console.log('✅ Tabela webhook_events criada com sucesso!');
    
    // Verificar se a tabela foi criada
    const { data: testData, error: testError } = await supabase
      .from('webhook_events')
      .select('*')
      .limit(1);
    
    if (testError) {
      console.log('❌ Erro ao verificar tabela:', testError.message);
      return false;
    }
    
    console.log('✅ Verificação da tabela: OK');
    return true;
    
  } catch (error) {
    console.error('❌ Erro ao criar tabela webhook_events:', error.message);
    
    console.log('\n📋 EXECUTE ESTE SQL MANUALMENTE NO SUPABASE DASHBOARD:');
    console.log('==================================================');
    console.log(`
      CREATE TABLE IF NOT EXISTS public.webhook_events (
        id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
        source VARCHAR(50) NOT NULL,
        event_type VARCHAR(100) NOT NULL,
        payload JSONB NOT NULL,
        processed BOOLEAN DEFAULT FALSE,
        processed_at TIMESTAMP WITH TIME ZONE,
        error_message TEXT,
        received_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
      
      -- Criar índices para melhor performance
      CREATE INDEX IF NOT EXISTS idx_webhook_events_source ON public.webhook_events(source);
      CREATE INDEX IF NOT EXISTS idx_webhook_events_event_type ON public.webhook_events(event_type);
      CREATE INDEX IF NOT EXISTS idx_webhook_events_processed ON public.webhook_events(processed);
      CREATE INDEX IF NOT EXISTS idx_webhook_events_received_at ON public.webhook_events(received_at);
      
      -- Habilitar RLS
      ALTER TABLE public.webhook_events ENABLE ROW LEVEL SECURITY;
      
      -- Política para permitir inserção de webhooks
      CREATE POLICY IF NOT EXISTS "Allow webhook inserts" ON public.webhook_events
        FOR INSERT WITH CHECK (true);
      
      -- Política para permitir leitura para usuários autenticados
      CREATE POLICY IF NOT EXISTS "Allow authenticated read" ON public.webhook_events
        FOR SELECT USING (auth.role() = 'authenticated');
      
      -- Política para permitir atualização para service role
      CREATE POLICY IF NOT EXISTS "Allow service role updates" ON public.webhook_events
        FOR UPDATE USING (auth.role() = 'service_role');
    `);
    console.log('==================================================');
    
    return false;
  }
}

// Executar criação
criarTabelaWebhookEvents().then(success => {
  if (success) {
    console.log('\n🎉 TABELA WEBHOOK_EVENTS CRIADA COM SUCESSO!');
    console.log('Agora você pode executar novamente a verificação do webhook.');
  } else {
    console.log('\n❌ FALHA AO CRIAR TABELA WEBHOOK_EVENTS');
    console.log('Execute o SQL manualmente no Supabase Dashboard.');
  }
}).catch(console.error);