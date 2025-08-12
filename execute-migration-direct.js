import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import dotenv from 'dotenv';

// Carregar variáveis de ambiente
dotenv.config({ path: '.env.local' });

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Variáveis de ambiente VITE_SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY são obrigatórias');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function executeMigrationDirect() {
  try {
    console.log('🚀 Executando migração de consolidação de usuários Hotmart...');
    
    // 1. Adicionar colunas à tabela users
    console.log('📝 Adicionando novas colunas à tabela users...');
    
    const alterTableCommands = [
      "ALTER TABLE public.users ADD COLUMN IF NOT EXISTS username VARCHAR(50) UNIQUE;",
      "ALTER TABLE public.users ADD COLUMN IF NOT EXISTS password_hash TEXT;",
      "ALTER TABLE public.users ADD COLUMN IF NOT EXISTS status VARCHAR(20) DEFAULT 'available' CHECK (status IN ('available', 'occupied', 'suspended'));",
      "ALTER TABLE public.users ADD COLUMN IF NOT EXISTS hotmart_buyer_email VARCHAR(255);",
      "ALTER TABLE public.users ADD COLUMN IF NOT EXISTS hotmart_buyer_name VARCHAR(255);",
      "ALTER TABLE public.users ADD COLUMN IF NOT EXISTS hotmart_transaction_id VARCHAR(100);",
      "ALTER TABLE public.users ADD COLUMN IF NOT EXISTS hotmart_notification_id VARCHAR(100);",
      "ALTER TABLE public.users ADD COLUMN IF NOT EXISTS assigned_at TIMESTAMP WITH TIME ZONE;",
      "ALTER TABLE public.users ADD COLUMN IF NOT EXISTS expires_at TIMESTAMP WITH TIME ZONE;",
      "ALTER TABLE public.users ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}'::jsonb;"
    ];
    
    for (const command of alterTableCommands) {
      const { error } = await supabase.rpc('exec', { sql: command });
      if (error && !error.message.includes('already exists')) {
        console.log(`⚠️ Comando: ${command}`);
        console.log(`⚠️ Aviso: ${error.message}`);
      }
    }
    
    // 2. Criar índices
    console.log('📝 Criando índices...');
    const indexCommands = [
      "CREATE INDEX IF NOT EXISTS idx_users_username ON public.users(username);",
      "CREATE INDEX IF NOT EXISTS idx_users_status ON public.users(status);",
      "CREATE INDEX IF NOT EXISTS idx_users_hotmart_transaction ON public.users(hotmart_transaction_id);",
      "CREATE INDEX IF NOT EXISTS idx_users_hotmart_notification ON public.users(hotmart_notification_id);"
    ];
    
    for (const command of indexCommands) {
      const { error } = await supabase.rpc('exec', { sql: command });
      if (error && !error.message.includes('already exists')) {
        console.log(`⚠️ Índice: ${command}`);
        console.log(`⚠️ Aviso: ${error.message}`);
      }
    }
    
    // 3. Gerar usuários Hotmart
    console.log('👥 Gerando 200 usuários Hotmart...');
    
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
      .select('id', { count: 'exact' })
      .not('username', 'is', null);
    
    if (countError) {
      console.log('⚠️ Erro ao contar usuários existentes:', countError.message);
    }
    
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
          username: `hotmart${userNumber}`,
          password_hash: generateRandomPassword(),
          status: 'available',
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
    
    // 4. Configurar usuários administrativos
    console.log('👑 Configurando usuários administrativos...');
    
    const adminUsers = [
      { email: 'eduardogelista@gmail.com', username: 'eduardo_admin' },
      { email: 'carinaprange86@gmail.com', username: 'carina_admin' }
    ];
    
    for (const admin of adminUsers) {
      const { error: updateError } = await supabase
        .from('users')
        .update({
          username: admin.username,
          password_hash: generateRandomPassword(),
          status: 'occupied',
          is_admin: true,
          onboarding_completed: true
        })
        .eq('email', admin.email);
      
      if (updateError) {
        console.log(`⚠️ Erro ao configurar admin ${admin.email}:`, updateError.message);
      } else {
        console.log(`✅ Admin ${admin.email} configurado com sucesso`);
      }
    }
    
    console.log('🎉 Migração concluída com sucesso!');
    
    // Verificar estatísticas
    const { data: stats, error: statsError } = await supabase
      .from('users')
      .select('status')
      .not('username', 'is', null);
    
    if (statsError) {
      console.log('⚠️ Erro ao verificar estatísticas:', statsError.message);
    } else {
      const statusCount = stats.reduce((acc, user) => {
        acc[user.status] = (acc[user.status] || 0) + 1;
        return acc;
      }, {});
      
      console.log('📈 Estatísticas dos usuários Hotmart:');
      console.log(`   - Total: ${stats.length}`);
      console.log(`   - Disponíveis: ${statusCount.available || 0}`);
      console.log(`   - Ocupados: ${statusCount.occupied || 0}`);
      console.log(`   - Suspensos: ${statusCount.suspended || 0}`);
    }
    
  } catch (error) {
    console.error('❌ Erro durante a migração:', error);
    process.exit(1);
  }
}

executeMigrationDirect();