const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Variáveis de ambiente não encontradas!');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

/**
 * Verificar se a coluna is_admin existe
 */
async function verificarColunaIsAdmin() {
  console.log('🔍 Verificando se a coluna is_admin existe...');
  
  try {
    // Tentar fazer uma consulta que inclui a coluna is_admin
    const { data, error } = await supabase
      .from('users')
      .select('id, is_admin')
      .limit(1);
    
    if (error) {
      if (error.message.includes('column "is_admin" does not exist')) {
        console.log('❌ Coluna is_admin não existe!');
        return false;
      } else {
        console.error('❌ Erro ao verificar coluna:', error);
        return false;
      }
    }
    
    console.log('✅ Coluna is_admin existe!');
    return true;
  } catch (err) {
    console.error('❌ Erro inesperado:', err.message);
    return false;
  }
}

/**
 * Mostrar instruções para adicionar a coluna
 */
function mostrarInstrucoes() {
  console.log('\n📋 INSTRUÇÕES PARA ADICIONAR A COLUNA is_admin:');
  console.log('=' .repeat(60));
  console.log('1. Acesse o Supabase Dashboard:');
  console.log('   🔗 https://supabase.com/dashboard/project/gguxeqpayaangiplggme/sql');
  console.log('');
  console.log('2. Cole este SQL no editor:');
  console.log('   ALTER TABLE users ADD COLUMN IF NOT EXISTS is_admin BOOLEAN DEFAULT FALSE;');
  console.log('');
  console.log('3. Clique em "Run" para executar');
  console.log('');
  console.log('4. Após executar, rode novamente: node adicionar-is-admin.cjs');
  console.log('=' .repeat(60));
}

/**
 * Função principal
 */
async function main() {
  console.log('🚀 Verificando coluna is_admin na tabela users...');
  console.log('=' .repeat(60));
  
  const colunaExiste = await verificarColunaIsAdmin();
  
  if (colunaExiste) {
    console.log('\n✅ SUCESSO! A coluna is_admin está configurada!');
    console.log('🔄 Agora você pode executar: node criar-tabela-users.cjs');
  } else {
    mostrarInstrucoes();
  }
}

// Executar
if (require.main === module) {
  main();
}

module.exports = { verificarColunaIsAdmin };