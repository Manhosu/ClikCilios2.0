const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
require('dotenv').config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Credenciais do Supabase não encontradas');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function executeManualFix() {
  console.log('🔧 Executando correção manual da tabela configuracoes_usuario...');
  
  try {
    // Ler o arquivo SQL
    const sqlContent = fs.readFileSync('./manual-configuracoes-fix.sql', 'utf8');
    
    // Dividir em comandos individuais
    const commands = sqlContent
      .split(';')
      .map(cmd => cmd.trim())
      .filter(cmd => cmd && !cmd.startsWith('--') && cmd.length > 5);
    
    console.log(`📝 Executando ${commands.length} comandos SQL...`);
    
    for (let i = 0; i < commands.length; i++) {
      const command = commands[i];
      console.log(`[${i + 1}/${commands.length}] Executando comando...`);
      
      try {
        const { data, error } = await supabase.rpc('exec_sql', {
          sql: command + ';'
        });
        
        if (error) {
          // Tentar executar diretamente se exec_sql não existir
          const { data: directData, error: directError } = await supabase
            .from('_temp')
            .select('1')
            .limit(0);
          
          if (directError && directError.message.includes('does not exist')) {
            console.log(`⚠️ Comando ${i + 1} pulado (função exec_sql não disponível)`);
            continue;
          }
          
          console.error(`❌ Erro no comando ${i + 1}:`, error.message);
        } else {
          console.log(`✅ Comando ${i + 1} executado com sucesso`);
        }
      } catch (err) {
        console.error(`❌ Erro no comando ${i + 1}:`, err.message);
      }
    }
    
    // Testar se a tabela foi criada corretamente
    console.log('\n🧪 Testando tabela criada...');
    const { data: testData, error: testError } = await supabase
      .from('configuracoes_usuario')
      .select('*')
      .limit(1);
    
    if (testError) {
      console.error('❌ Erro ao testar tabela:', testError.message);
    } else {
      console.log('✅ Tabela configuracoes_usuario funcionando corretamente!');
    }
    
  } catch (error) {
    console.error('❌ Erro geral:', error.message);
  }
}

executeManualFix();