require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

console.log('🔍 Testando conexão com Supabase...');
console.log('URL:', supabaseUrl);
console.log('Key (primeiros 20 chars):', supabaseKey ? supabaseKey.substring(0, 20) + '...' : 'NÃO ENCONTRADA');
console.log('Key (últimos 10 chars):', supabaseKey ? '...' + supabaseKey.slice(-10) : 'NÃO ENCONTRADA');
console.log('Key length:', supabaseKey ? supabaseKey.length : 0);
console.log('');

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Variáveis de ambiente não configuradas');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function testarConexao() {
  try {
    console.log('1. Testando conexão básica...');
    
    // Teste 1: Verificar se consegue fazer uma query simples
    const { data, error } = await supabase
      .from('pre_users')
      .select('count', { count: 'exact', head: true });
    
    if (error) {
      console.log('❌ Erro na query:', error);
      console.log('Código:', error.code);
      console.log('Mensagem:', error.message);
      console.log('Detalhes:', error.details);
      console.log('Hint:', error.hint);
    } else {
      console.log('✅ Conexão OK! Count:', data);
    }
    
    console.log('\n2. Testando inserção simples...');
    
    // Teste 2: Tentar inserir um único registro
    const username = 'teste_' + Date.now();
    const { data: insertData, error: insertError } = await supabase
      .from('pre_users')
      .insert({
        username,
        email: `${username}@ciliosclick.com`,
        status: 'available'
      })
      .select();
    
    if (insertError) {
      console.log('❌ Erro na inserção:', insertError);
      console.log('Código:', insertError.code);
      console.log('Mensagem:', insertError.message);
      console.log('Detalhes:', insertError.details);
      console.log('Hint:', insertError.hint);
    } else {
      console.log('✅ Inserção OK!', insertData);
    }
    
    console.log('\n3. Testando listagem...');
    
    // Teste 3: Listar alguns registros
    const { data: listData, error: listError } = await supabase
      .from('pre_users')
      .select('id, username, email, status')
      .limit(5);
    
    if (listError) {
      console.log('❌ Erro na listagem:', listError);
    } else {
      console.log('✅ Listagem OK! Registros encontrados:', listData.length);
      listData.forEach(user => {
        console.log(`  - ${user.username} <${user.email}> (${user.status})`);
      });
    }
    
  } catch (error) {
    console.error('❌ Erro geral:', error);
  }
}

testarConexao();