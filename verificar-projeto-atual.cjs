require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function verificarProjeto() {
  console.log('🔍 VERIFICAÇÃO DO PROJETO SUPABASE ATUAL');
  console.log('=' .repeat(50));
  console.log('');
  
  // Extrair ID do projeto da URL
  const projectId = supabaseUrl.match(/https:\/\/([^.]+)\.supabase\.co/)?.[1];
  
  console.log('📋 INFORMAÇÕES DO PROJETO:');
  console.log(`URL: ${supabaseUrl}`);
  console.log(`ID do Projeto: ${projectId}`);
  console.log(`Chave: ${supabaseKey.substring(0, 20)}...`);
  console.log('');
  
  // Verificar conexão
  console.log('🔗 Testando conexão...');
  try {
    const { data, error } = await supabase.auth.getSession();
    if (error) {
      console.log('❌ Erro de conexão:', error.message);
    } else {
      console.log('✅ Conexão OK');
    }
  } catch (e) {
    console.log('❌ Erro de conexão:', e.message);
  }
  
  console.log('');
  console.log('🎯 INSTRUÇÕES PARA O DASHBOARD:');
  console.log('1. Acesse: https://supabase.com/dashboard/projects');
  console.log('2. Procure pelo projeto com ID:', projectId);
  console.log('3. Clique nele para acessar');
  console.log('4. Vá para "SQL Editor" no menu lateral');
  console.log('5. Verifique se a URL mostra:', `https://supabase.com/dashboard/project/${projectId}/sql/...`);
  console.log('');
  
  console.log('⚠️  IMPORTANTE:');
  console.log('- Se o projeto não aparecer na sua lista, você não tem acesso');
  console.log('- Se a URL não bater, você está no projeto errado');
  console.log('- Só execute o SQL quando tiver certeza do projeto correto');
  console.log('');
  
  // Teste final das tabelas
  console.log('🧪 STATUS ATUAL DAS TABELAS:');
  try {
    const { data, error } = await supabase
      .from('pre_users')
      .select('*')
      .limit(1);
    
    if (error && error.code === '42P01') {
      console.log('❌ Tabela pre_users: NÃO EXISTE');
      console.log('   → Você PRECISA executar o SQL no dashboard');
    } else if (error) {
      console.log('❌ Erro inesperado:', error.message);
    } else {
      console.log('✅ Tabela pre_users: EXISTE');
      console.log('   → Sistema pronto para uso!');
    }
  } catch (e) {
    console.log('❌ Erro ao verificar tabela:', e.message);
  }
}

verificarProjeto();