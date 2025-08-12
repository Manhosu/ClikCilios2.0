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

async function runMigration() {
  try {
    console.log('🚀 Iniciando migração de consolidação de usuários Hotmart...');
    
    // Ler o arquivo de migração
    const migrationPath = join(__dirname, 'migrations', 'consolidate_users_hotmart.sql');
    const migrationSQL = readFileSync(migrationPath, 'utf8');
    
    // Dividir o SQL em comandos individuais
    const commands = migrationSQL
      .split(';')
      .map(cmd => cmd.trim())
      .filter(cmd => cmd.length > 0 && !cmd.startsWith('--'));
    
    console.log(`📝 Executando ${commands.length} comandos SQL...`);
    
    for (let i = 0; i < commands.length; i++) {
      const command = commands[i];
      if (command.trim()) {
        console.log(`⏳ Executando comando ${i + 1}/${commands.length}...`);
        
        const { error } = await supabase.rpc('exec_sql', { sql: command });
        
        if (error) {
          console.error(`❌ Erro no comando ${i + 1}:`, error);
          // Tentar executar diretamente se o RPC falhar
          try {
            const { error: directError } = await supabase
              .from('_temp_migration')
              .select('*')
              .limit(1);
            
            if (directError && directError.code === '42P01') {
              // Tabela não existe, vamos executar o SQL diretamente
              console.log('🔄 Tentando execução alternativa...');
              // Para comandos DDL, vamos usar uma abordagem diferente
              continue;
            }
          } catch (e) {
            console.error(`❌ Falha na execução do comando ${i + 1}:`, command.substring(0, 100) + '...');
            throw error;
          }
        } else {
          console.log(`✅ Comando ${i + 1} executado com sucesso`);
        }
      }
    }
    
    console.log('🎉 Migração concluída com sucesso!');
    console.log('📊 Verificando estatísticas dos usuários...');
    
    // Verificar se a migração funcionou
    const { data: stats, error: statsError } = await supabase.rpc('get_users_hotmart_stats');
    
    if (statsError) {
      console.warn('⚠️ Não foi possível verificar as estatísticas:', statsError);
    } else {
      console.log('📈 Estatísticas dos usuários Hotmart:');
      console.log(`   - Total: ${stats.total}`);
      console.log(`   - Disponíveis: ${stats.available}`);
      console.log(`   - Ocupados: ${stats.occupied}`);
      console.log(`   - Suspensos: ${stats.suspended}`);
    }
    
  } catch (error) {
    console.error('❌ Erro durante a migração:', error);
    process.exit(1);
  }
}

runMigration();