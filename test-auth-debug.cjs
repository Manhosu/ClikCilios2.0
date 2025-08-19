const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ Credenciais do Supabase não encontradas');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testAuth() {
  console.log('🔍 Testando autenticação...');
  
  try {
    // Verificar sessão atual
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    
    if (sessionError) {
      console.error('❌ Erro ao obter sessão:', sessionError.message);
      return;
    }
    
    if (!session) {
      console.log('ℹ️ Nenhuma sessão ativa encontrada');
      console.log('💡 Isso é normal se nenhum usuário estiver logado');
      return;
    }
    
    console.log('✅ Sessão encontrada:');
    console.log('- User ID:', session.user.id);
    console.log('- Email:', session.user.email);
    console.log('- Token válido:', !!session.access_token);
    console.log('- Expires at:', new Date(session.expires_at * 1000).toLocaleString());
    
    // Testar se o token é válido
    const { data: { user }, error: userError } = await supabase.auth.getUser(session.access_token);
    
    if (userError) {
      console.error('❌ Token inválido:', userError.message);
      return;
    }
    
    console.log('✅ Token válido para usuário:', user.email);
    
    // Testar acesso às tabelas
    console.log('\n🔍 Testando acesso às tabelas...');
    
    const { data: configData, error: configError } = await supabase
      .from('configuracoes_usuario')
      .select('*')
      .eq('user_id', user.id)
      .limit(1);
    
    if (configError) {
      console.error('❌ Erro ao acessar configuracoes_usuario:', configError.message);
    } else {
      console.log('✅ Acesso a configuracoes_usuario OK');
    }
    
    const { data: imageData, error: imageError } = await supabase
      .from('imagens_clientes')
      .select('*')
      .eq('user_id', user.id)
      .limit(1);
    
    if (imageError) {
      console.error('❌ Erro ao acessar imagens_clientes:', imageError.message);
    } else {
      console.log('✅ Acesso a imagens_clientes OK');
    }
    
  } catch (error) {
    console.error('❌ Erro crítico:', error.message);
  }
}

testAuth().then(() => {
  console.log('\n🏁 Teste concluído');
  process.exit(0);
}).catch(error => {
  console.error('❌ Erro no teste:', error);
  process.exit(1);
});