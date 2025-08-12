const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

// Cliente Supabase
const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_ANON_KEY
);

/**
 * Script para criar tabelas e popular usuários pré-criados
 */
async function setupAndPopulate() {
  console.log('🚀 Configurando banco e populando usuários...');
  
  try {
    // Primeiro, vamos tentar criar as tabelas básicas usando SQL
    console.log('📋 Criando tabelas...');
    
    // Criar tabela pre_users
    const { error: createTableError } = await supabase.rpc('exec_sql', {
      sql: `
        CREATE TABLE IF NOT EXISTS public.pre_users (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          username TEXT NOT NULL UNIQUE,
          email TEXT NOT NULL UNIQUE,
          password_hash TEXT,
          status TEXT NOT NULL DEFAULT 'available',
          metadata JSONB DEFAULT '{}'::jsonb,
          created_at TIMESTAMPTZ DEFAULT NOW(),
          updated_at TIMESTAMPTZ DEFAULT NOW()
        );
        
        CREATE INDEX IF NOT EXISTS idx_pre_users_status ON public.pre_users(status);
        CREATE INDEX IF NOT EXISTS idx_pre_users_username ON public.pre_users(username);
        CREATE UNIQUE INDEX IF NOT EXISTS idx_pre_users_email_lower ON public.pre_users ((lower(email)));
      `
    });
    
    if (createTableError) {
      console.log('⚠️  Não foi possível criar tabelas via RPC, tentando inserção direta...');
    } else {
      console.log('✅ Tabelas criadas com sucesso!');
    }
    
    // Verificar se já existem usuários
    const { data: existingUsers, error: checkError } = await supabase
      .from('pre_users')
      .select('count', { count: 'exact' });
    
    if (checkError) {
      console.error('❌ Erro ao verificar usuários existentes:', checkError);
      
      // Se a tabela não existe, vamos tentar criar via SQL direto
      console.log('🔧 Tentando criar tabela via SQL direto...');
      
      const { error: sqlError } = await supabase
        .from('_sql')
        .insert({
          query: `
            CREATE TABLE IF NOT EXISTS public.pre_users (
              id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
              username TEXT NOT NULL UNIQUE,
              email TEXT NOT NULL UNIQUE,
              password_hash TEXT,
              status TEXT NOT NULL DEFAULT 'available',
              metadata JSONB DEFAULT '{}'::jsonb,
              created_at TIMESTAMPTZ DEFAULT NOW(),
              updated_at TIMESTAMPTZ DEFAULT NOW()
            );
          `
        });
      
      if (sqlError) {
        console.error('❌ Não foi possível criar a tabela automaticamente.');
        console.log('\n📝 Para continuar, você precisa:');
        console.log('1. Acessar o Supabase Dashboard');
        console.log('2. Ir para SQL Editor');
        console.log('3. Executar o arquivo migrations/create_hotmart_integration_complete.sql');
        console.log('4. Executar este script novamente');
        return;
      }
    }
    
    const existingCount = existingUsers?.length || 0;
    console.log(`📊 Usuários existentes: ${existingCount}`);
    
    if (existingCount >= 200) {
      console.log('✅ Já existem 200 ou mais usuários pré-criados!');
      return;
    }
    
    // Gerar usuários para inserir
    const usersToCreate = [];
    const startFrom = existingCount + 1;
    const totalToCreate = 200 - existingCount;
    
    console.log(`🔄 Criando ${totalToCreate} novos usuários...`);
    
    for (let i = startFrom; i <= 200; i++) {
      const username = `user${i.toString().padStart(4, '0')}`;
      usersToCreate.push({
        username,
        email: `${username}@ciliosclick.com`,
        status: 'available',
        metadata: {}
      });
    }
    
    // Inserir em lotes de 50
    const batchSize = 50;
    let inserted = 0;
    
    for (let i = 0; i < usersToCreate.length; i += batchSize) {
      const batch = usersToCreate.slice(i, i + batchSize);
      
      const { data, error } = await supabase
        .from('pre_users')
        .insert(batch)
        .select('username');
      
      if (error) {
        console.error(`❌ Erro no lote ${Math.floor(i/batchSize) + 1}:`, error);
        break;
      }
      
      inserted += data?.length || 0;
      console.log(`✅ Lote ${Math.floor(i/batchSize) + 1} inserido: ${data?.length || 0} usuários`);
    }
    
    console.log(`\n🎉 Processo concluído!`);
    console.log(`📊 Total de usuários inseridos: ${inserted}`);
    
    // Verificar status final
    const { data: finalUsers, error: finalError } = await supabase
      .from('pre_users')
      .select('status', { count: 'exact' });
    
    if (!finalError) {
      console.log(`📈 Total final de usuários: ${finalUsers?.length || 0}`);
    }
    
  } catch (error) {
    console.error('❌ Erro durante a execução:', error);
  }
}

// Executa o script
if (require.main === module) {
  setupAndPopulate().catch(console.error);
}

module.exports = { setupAndPopulate };