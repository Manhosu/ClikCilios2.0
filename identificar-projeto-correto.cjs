require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

console.log('🔍 IDENTIFICANDO O PROJETO CORRETO DO SUPABASE');
console.log('=' .repeat(50));
console.log('');
console.log('📋 Configuração atual:');
console.log('URL:', supabaseUrl);
console.log('Key:', supabaseKey ? `${supabaseKey.substring(0, 20)}...` : 'NÃO DEFINIDA');
console.log('');

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Variáveis de ambiente não configuradas');
  process.exit(1);
}

// Extrair o ID do projeto da URL
const projectId = supabaseUrl.match(/https:\/\/([^.]+)\.supabase\.co/)?.[1];
console.log('🆔 ID do Projeto extraído da URL:', projectId);
console.log('');

const supabase = createClient(supabaseUrl, supabaseKey);

async function verificarProjeto() {
  try {
    console.log('🔍 Testando conexão...');
    
    // Tentar uma operação simples para verificar se a conexão funciona
    const { data, error } = await supabase
      .from('pre_users')
      .select('count', { count: 'exact', head: true });
    
    if (error) {
      console.log('❌ Erro ao conectar:', error.message);
      console.log('');
      
      if (error.code === '42P01') {
        console.log('🚨 PROBLEMA IDENTIFICADO:');
        console.log('A tabela "pre_users" NÃO EXISTE neste projeto!');
        console.log('');
        console.log('💡 SOLUÇÕES POSSÍVEIS:');
        console.log('');
        console.log('1️⃣  OPÇÃO 1 - Executar SQL neste projeto:');
        console.log('   • Acesse: https://supabase.com/dashboard/project/' + projectId);
        console.log('   • Vá em SQL Editor');
        console.log('   • Execute o arquivo: create-minimal-tables.sql');
        console.log('');
        console.log('2️⃣  OPÇÃO 2 - Usar o projeto onde já executou o SQL:');
        console.log('   • Se você já executou o SQL em outro projeto');
        console.log('   • Atualize o .env.local com a URL correta');
        console.log('   • Atualize também a ANON_KEY correspondente');
        console.log('');
        console.log('📝 Para descobrir em qual projeto você executou o SQL:');
        console.log('   • Acesse: https://supabase.com/dashboard/projects');
        console.log('   • Verifique cada projeto em SQL Editor > History');
        console.log('   • Procure pelo histórico do create-minimal-tables.sql');
      } else {
        console.log('🚨 PROBLEMA DE AUTENTICAÇÃO:');
        console.log('A chave API pode estar incorreta para este projeto.');
        console.log('');
        console.log('💡 SOLUÇÃO:');
        console.log('1. Acesse: https://supabase.com/dashboard/project/' + projectId + '/settings/api');
        console.log('2. Copie a "anon public" key');
        console.log('3. Atualize VITE_SUPABASE_ANON_KEY no .env.local');
      }
    } else {
      console.log('✅ Conexão OK!');
      console.log('📊 Registros na tabela pre_users:', data);
      console.log('');
      console.log('🎉 TUDO CERTO! Este é o projeto correto.');
      console.log('Agora você pode executar: node populate-pre-users.cjs');
    }
    
  } catch (error) {
    console.error('❌ Erro inesperado:', error.message);
  }
}

verificarProjeto();