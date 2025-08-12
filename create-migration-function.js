import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Carregar variáveis de ambiente
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Variáveis de ambiente VITE_SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY são obrigatórias');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function createMigrationFunction() {
  try {
    console.log('🚀 Criando função de migração...');
    
    // Primeiro, vamos criar uma função que execute a migração
    const migrationFunction = `
CREATE OR REPLACE FUNCTION migrate_users_hotmart()
RETURNS TEXT AS $$
DECLARE
  result_text TEXT := '';
BEGIN
  -- Adicionar colunas à tabela users
  BEGIN
    ALTER TABLE public.users ADD COLUMN IF NOT EXISTS username VARCHAR(50) UNIQUE;
    result_text := result_text || 'Coluna username adicionada. ';
  EXCEPTION WHEN OTHERS THEN
    result_text := result_text || 'Erro ao adicionar username: ' || SQLERRM || '. ';
  END;
  
  BEGIN
    ALTER TABLE public.users ADD COLUMN IF NOT EXISTS password_hash TEXT;
    result_text := result_text || 'Coluna password_hash adicionada. ';
  EXCEPTION WHEN OTHERS THEN
    result_text := result_text || 'Erro ao adicionar password_hash: ' || SQLERRM || '. ';
  END;
  
  BEGIN
    ALTER TABLE public.users ADD COLUMN IF NOT EXISTS status VARCHAR(20) DEFAULT 'available';
    result_text := result_text || 'Coluna status adicionada. ';
  EXCEPTION WHEN OTHERS THEN
    result_text := result_text || 'Erro ao adicionar status: ' || SQLERRM || '. ';
  END;
  
  BEGIN
    ALTER TABLE public.users ADD CONSTRAINT IF NOT EXISTS users_status_check CHECK (status IN ('available', 'occupied', 'suspended'));
    result_text := result_text || 'Constraint status adicionada. ';
  EXCEPTION WHEN OTHERS THEN
    result_text := result_text || 'Erro ao adicionar constraint status: ' || SQLERRM || '. ';
  END;
  
  BEGIN
    ALTER TABLE public.users ADD COLUMN IF NOT EXISTS hotmart_buyer_email VARCHAR(255);
    result_text := result_text || 'Coluna hotmart_buyer_email adicionada. ';
  EXCEPTION WHEN OTHERS THEN
    result_text := result_text || 'Erro ao adicionar hotmart_buyer_email: ' || SQLERRM || '. ';
  END;
  
  BEGIN
    ALTER TABLE public.users ADD COLUMN IF NOT EXISTS hotmart_buyer_name VARCHAR(255);
    result_text := result_text || 'Coluna hotmart_buyer_name adicionada. ';
  EXCEPTION WHEN OTHERS THEN
    result_text := result_text || 'Erro ao adicionar hotmart_buyer_name: ' || SQLERRM || '. ';
  END;
  
  BEGIN
    ALTER TABLE public.users ADD COLUMN IF NOT EXISTS hotmart_transaction_id VARCHAR(100);
    result_text := result_text || 'Coluna hotmart_transaction_id adicionada. ';
  EXCEPTION WHEN OTHERS THEN
    result_text := result_text || 'Erro ao adicionar hotmart_transaction_id: ' || SQLERRM || '. ';
  END;
  
  BEGIN
    ALTER TABLE public.users ADD COLUMN IF NOT EXISTS hotmart_notification_id VARCHAR(100);
    result_text := result_text || 'Coluna hotmart_notification_id adicionada. ';
  EXCEPTION WHEN OTHERS THEN
    result_text := result_text || 'Erro ao adicionar hotmart_notification_id: ' || SQLERRM || '. ';
  END;
  
  BEGIN
    ALTER TABLE public.users ADD COLUMN IF NOT EXISTS assigned_at TIMESTAMP WITH TIME ZONE;
    result_text := result_text || 'Coluna assigned_at adicionada. ';
  EXCEPTION WHEN OTHERS THEN
    result_text := result_text || 'Erro ao adicionar assigned_at: ' || SQLERRM || '. ';
  END;
  
  BEGIN
    ALTER TABLE public.users ADD COLUMN IF NOT EXISTS expires_at TIMESTAMP WITH TIME ZONE;
    result_text := result_text || 'Coluna expires_at adicionada. ';
  EXCEPTION WHEN OTHERS THEN
    result_text := result_text || 'Erro ao adicionar expires_at: ' || SQLERRM || '. ';
  END;
  
  BEGIN
    ALTER TABLE public.users ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}'::jsonb;
    result_text := result_text || 'Coluna metadata adicionada. ';
  EXCEPTION WHEN OTHERS THEN
    result_text := result_text || 'Erro ao adicionar metadata: ' || SQLERRM || '. ';
  END;
  
  -- Criar índices
  BEGIN
    CREATE INDEX IF NOT EXISTS idx_users_username ON public.users(username);
    result_text := result_text || 'Índice username criado. ';
  EXCEPTION WHEN OTHERS THEN
    result_text := result_text || 'Erro ao criar índice username: ' || SQLERRM || '. ';
  END;
  
  BEGIN
    CREATE INDEX IF NOT EXISTS idx_users_status ON public.users(status);
    result_text := result_text || 'Índice status criado. ';
  EXCEPTION WHEN OTHERS THEN
    result_text := result_text || 'Erro ao criar índice status: ' || SQLERRM || '. ';
  END;
  
  BEGIN
    CREATE INDEX IF NOT EXISTS idx_users_hotmart_transaction ON public.users(hotmart_transaction_id);
    result_text := result_text || 'Índice hotmart_transaction criado. ';
  EXCEPTION WHEN OTHERS THEN
    result_text := result_text || 'Erro ao criar índice hotmart_transaction: ' || SQLERRM || '. ';
  END;
  
  BEGIN
    CREATE INDEX IF NOT EXISTS idx_users_hotmart_notification ON public.users(hotmart_notification_id);
    result_text := result_text || 'Índice hotmart_notification criado. ';
  EXCEPTION WHEN OTHERS THEN
    result_text := result_text || 'Erro ao criar índice hotmart_notification: ' || SQLERRM || '. ';
  END;
  
  RETURN result_text;
END;
$$ LANGUAGE plpgsql;
    `;
    
    // Criar a função usando uma query SQL direta
    const { data, error } = await supabase
      .from('_temp_function_creation')
      .select('*')
      .limit(1);
    
    // Se a tabela não existe, vamos tentar criar a função de outra forma
    console.log('📝 Tentando criar função de migração...');
    
    // Vamos usar o endpoint SQL direto do Supabase
    const response = await fetch(`${supabaseUrl}/rest/v1/rpc/migrate_users_hotmart`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${supabaseServiceKey}`,
        'Content-Type': 'application/json',
        'apikey': supabaseServiceKey
      },
      body: JSON.stringify({})
    });
    
    if (!response.ok) {
      // Se a função não existe, vamos criá-la primeiro
      console.log('🔧 Função não existe, criando...');
      
      // Vamos tentar uma abordagem mais simples
      const { data: createResult, error: createError } = await supabase.rpc('exec_sql', {
        sql: migrationFunction
      });
      
      if (createError) {
        console.log('⚠️ Erro ao criar função:', createError.message);
        console.log('🔄 Tentando abordagem alternativa...');
        
        // Vamos executar a migração manualmente
        await executeMigrationManually();
        return;
      }
      
      console.log('✅ Função criada com sucesso');
    }
    
    // Executar a função de migração
    console.log('🚀 Executando migração...');
    const { data: migrationResult, error: migrationError } = await supabase.rpc('migrate_users_hotmart');
    
    if (migrationError) {
      console.log('❌ Erro na migração:', migrationError.message);
      console.log('🔄 Tentando abordagem alternativa...');
      await executeMigrationManually();
    } else {
      console.log('✅ Migração executada:', migrationResult);
      await createHotmartUsers();
    }
    
  } catch (error) {
    console.error('❌ Erro durante a criação da função:', error);
    console.log('🔄 Tentando abordagem alternativa...');
    await executeMigrationManually();
  }
}

async function executeMigrationManually() {
  console.log('🔧 Executando migração manual...');
  
  // Vamos tentar adicionar as colunas uma por uma usando INSERT/UPDATE
  try {
    // Primeiro, vamos verificar se as colunas já existem
    const { data: existingUser } = await supabase
      .from('users')
      .select('*')
      .limit(1)
      .single();
    
    console.log('📊 Estrutura atual da tabela users:', Object.keys(existingUser || {}));
    
    // Se não temos as colunas necessárias, vamos criar usuários Hotmart sem elas por enquanto
    await createHotmartUsers();
    
  } catch (error) {
    console.error('❌ Erro na migração manual:', error);
  }
}

async function createHotmartUsers() {
  console.log('👥 Criando usuários Hotmart...');
  
  function generateRandomPassword(length = 12) {
    const chars = 'ABCDEFGHJKMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789';
    let result = '';
    for (let i = 0; i < length; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  }
  
  // Verificar quantos usuários Hotmart já existem
  const { data: existingUsers, error: countError } = await supabase
    .from('users')
    .select('id')
    .like('email', 'hotmart%@clikcilios.com');
  
  const existingCount = existingUsers?.length || 0;
  const usersToCreate = Math.max(0, 200 - existingCount);
  
  console.log(`📊 Usuários Hotmart existentes: ${existingCount}`);
  console.log(`📊 Usuários a criar: ${usersToCreate}`);
  
  if (usersToCreate > 0) {
    const usersToInsert = [];
    
    for (let i = 1; i <= usersToCreate; i++) {
      const userNumber = existingCount + i;
      usersToInsert.push({
        nome: `Usuário Hotmart ${userNumber}`,
        email: `hotmart${userNumber}@clikcilios.com`,
        is_admin: false,
        onboarding_completed: true
      });
    }
    
    // Inserir em lotes de 50
    const batchSize = 50;
    for (let i = 0; i < usersToInsert.length; i += batchSize) {
      const batch = usersToInsert.slice(i, i + batchSize);
      const { error: insertError } = await supabase
        .from('users')
        .insert(batch);
      
      if (insertError) {
        console.log(`❌ Erro ao inserir lote ${Math.floor(i/batchSize) + 1}:`, insertError.message);
      } else {
        console.log(`✅ Lote ${Math.floor(i/batchSize) + 1} inserido com sucesso (${batch.length} usuários)`);
      }
    }
  }
  
  console.log('🎉 Criação de usuários concluída!');
}

createMigrationFunction();