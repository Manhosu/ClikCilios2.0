const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;

console.log('🔧 Testando conexão com Supabase...');
console.log('URL:', supabaseUrl);
console.log('Key:', supabaseAnonKey ? 'Configurada' : 'Não configurada');

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ Credenciais do Supabase não configuradas!');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testarConexao() {
  try {
    console.log('\n🔍 Testando conexão básica...');
    
    // Testar conexão básica
    const { data, error } = await supabase
      .from('clientes')
      .select('count', { count: 'exact', head: true });
    
    if (error) {
      console.error('❌ Erro ao conectar:', error.message);
      console.error('   Código:', error.code);
      console.error('   Detalhes:', error.details);
      return;
    }
    
    console.log('✅ Conexão com Supabase estabelecida!');
    console.log('📊 Tabela clientes encontrada');
    
    // Testar autenticação
    console.log('\n🔐 Testando autenticação...');
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError) {
      console.log('ℹ️ Usuário não autenticado (normal para teste):', authError.message);
    } else if (user) {
      console.log('✅ Usuário autenticado:', user.email);
    } else {
      console.log('ℹ️ Nenhum usuário autenticado');
    }
    
    console.log('\n✅ Teste de conexão concluído com sucesso!');
    
  } catch (error) {
    console.error('❌ Erro durante o teste:', error);
  }
}

testarConexao();