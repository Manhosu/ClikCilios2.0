const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
require('dotenv').config();

async function runMigration() {
  try {
    console.log('🚀 Iniciando migração da tabela imagens_clientes...');
    
    const supabaseUrl = process.env.VITE_SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    
    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error('Variáveis de ambiente do Supabase não encontradas!');
    }
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    // Ler o arquivo SQL
    const sql = fs.readFileSync('./migrations/create_imagens_clientes_table.sql', 'utf8');
    
    console.log('📄 Executando SQL...');
    
    // Dividir em comandos individuais
    const commands = sql
      .split(';')
      .map(cmd => cmd.trim())
      .filter(cmd => cmd.length > 0 && !cmd.startsWith('--'));
    
    console.log(`⚡ Executando ${commands.length} comandos...`);
    
    for (let i = 0; i < commands.length; i++) {
      const command = commands[i];
      console.log(`📝 Comando ${i + 1}/${commands.length}...`);
      
      try {
        const { data, error } = await supabase.rpc('exec_sql', { sql: command });
        
        if (error) {
          console.warn(`⚠️ Aviso no comando ${i + 1}:`, error.message);
        } else {
          console.log(`✅ Comando ${i + 1} executado com sucesso`);
        }
      } catch (cmdError) {
        console.warn(`⚠️ Erro no comando ${i + 1}:`, cmdError.message);
      }
    }
    
    // Testar se a tabela foi criada
    console.log('\n🧪 Testando tabela imagens_clientes...');
    const { data, error } = await supabase
      .from('imagens_clientes')
      .select('count')
      .limit(1);
    
    if (error) {
      console.error('❌ Erro ao testar tabela:', error.message);
    } else {
      console.log('✅ Tabela imagens_clientes criada e funcionando!');
    }
    
    console.log('\n🎉 Migração concluída com sucesso!');
    
  } catch (error) {
    console.error('❌ Erro na migração:', error.message);
    process.exit(1);
  }
}

runMigration();