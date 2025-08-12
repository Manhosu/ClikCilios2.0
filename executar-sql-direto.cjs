require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function executarSQL() {
  console.log('🚀 EXECUTANDO SQL DIRETAMENTE VIA JAVASCRIPT');
  console.log('URL:', supabaseUrl);
  console.log('');
  
  // Lê o arquivo SQL
  let sqlContent;
  try {
    sqlContent = fs.readFileSync('create-minimal-tables.sql', 'utf8');
    console.log('✅ Arquivo SQL carregado com sucesso');
  } catch (error) {
    console.log('❌ Erro ao ler arquivo SQL:', error.message);
    return;
  }
  
  // Divide o SQL em comandos individuais
  const commands = sqlContent
    .split(';')
    .map(cmd => cmd.trim())
    .filter(cmd => cmd.length > 0 && !cmd.startsWith('--'));
  
  console.log(`📝 Encontrados ${commands.length} comandos SQL`);
  console.log('');
  
  // Executa cada comando
  for (let i = 0; i < commands.length; i++) {
    const command = commands[i];
    console.log(`${i + 1}. Executando: ${command.substring(0, 50)}...`);
    
    try {
      const { data, error } = await supabase.rpc('exec_sql', {
        query: command
      });
      
      if (error) {
        console.log(`❌ ERRO: ${error.code} - ${error.message}`);
      } else {
        console.log('✅ SUCESSO');
      }
    } catch (e) {
      console.log(`❌ EXCEÇÃO: ${e.message}`);
    }
  }
  
  console.log('');
  console.log('🧪 Testando se as tabelas foram criadas...');
  
  // Testa se as tabelas foram criadas
  try {
    const { data, error } = await supabase
      .from('pre_users')
      .select('*')
      .limit(1);
    
    if (error) {
      console.log('❌ Tabela pre_users ainda não existe:', error.message);
    } else {
      console.log('✅ Tabela pre_users criada com sucesso!');
    }
  } catch (e) {
    console.log('❌ Erro ao testar tabela:', e.message);
  }
}

executarSQL();