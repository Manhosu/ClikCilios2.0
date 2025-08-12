require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

// Configuração do Supabase
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, serviceRoleKey);

console.log('🔍 VERIFICAÇÃO COMPLETA - WEBHOOK HOTMART');
console.log('==================================================');

async function verificarWebhookHotmart() {
  let tudoOk = true;
  
  // 1. Verificar variáveis de ambiente
  console.log('\n1. 🔧 VERIFICANDO VARIÁVEIS DE AMBIENTE...');
  
  const envVars = {
    'VITE_SUPABASE_URL': process.env.VITE_SUPABASE_URL,
    'VITE_SUPABASE_ANON_KEY': process.env.VITE_SUPABASE_ANON_KEY,
    'SUPABASE_SERVICE_ROLE_KEY': process.env.SUPABASE_SERVICE_ROLE_KEY,
    'VITE_HOTMART_WEBHOOK_SECRET': process.env.VITE_HOTMART_WEBHOOK_SECRET,
    'SENDGRID_API_KEY': process.env.SENDGRID_API_KEY,
    'SENDGRID_FROM_EMAIL': process.env.SENDGRID_FROM_EMAIL
  };
  
  for (const [key, value] of Object.entries(envVars)) {
    if (value) {
      console.log(`✅ ${key}: Configurado`);
    } else {
      console.log(`❌ ${key}: NÃO CONFIGURADO`);
      tudoOk = false;
    }
  }
  
  // 2. Verificar conexão com Supabase
  console.log('\n2. 🔗 VERIFICANDO CONEXÃO COM SUPABASE...');
  try {
    const { data, error } = await supabase.from('users').select('count').limit(1);
    if (error) throw error;
    console.log('✅ Conexão com Supabase: OK');
  } catch (error) {
    console.log('❌ Conexão com Supabase: FALHA');
    console.log('   Erro:', error.message);
    tudoOk = false;
  }
  
  // 3. Verificar tabelas necessárias
  console.log('\n3. 📋 VERIFICANDO TABELAS NECESSÁRIAS...');
  
  const tabelas = ['users', 'pre_users', 'user_assignments', 'webhook_events'];
  
  for (const tabela of tabelas) {
    try {
      const { data, error } = await supabase.from(tabela).select('*').limit(1);
      if (error && error.code === '42P01') {
        console.log(`❌ Tabela '${tabela}': NÃO EXISTE`);
        tudoOk = false;
      } else {
        console.log(`✅ Tabela '${tabela}': OK`);
      }
    } catch (error) {
      console.log(`❌ Tabela '${tabela}': ERRO - ${error.message}`);
      tudoOk = false;
    }
  }
  
  // 4. Verificar usuários pré-criados
  console.log('\n4. 👥 VERIFICANDO USUÁRIOS PRÉ-CRIADOS...');
  try {
    const { data: preUsers, error } = await supabase
      .from('pre_users')
      .select('*')
      .eq('status', 'available');
    
    if (error) throw error;
    
    const totalDisponivel = preUsers?.length || 0;
    console.log(`📊 Usuários disponíveis: ${totalDisponivel}`);
    
    if (totalDisponivel === 0) {
      console.log('⚠️  ATENÇÃO: Nenhum usuário pré-criado disponível!');
      console.log('   Você precisa criar usuários antes de configurar o webhook.');
      tudoOk = false;
    } else if (totalDisponivel < 5) {
      console.log('⚠️  ATENÇÃO: Poucos usuários disponíveis (recomendado: pelo menos 5)');
    } else {
      console.log('✅ Quantidade adequada de usuários pré-criados');
    }
  } catch (error) {
    console.log('❌ Erro ao verificar usuários pré-criados:', error.message);
    tudoOk = false;
  }
  
  // 5. Verificar estrutura do endpoint
  console.log('\n5. 🌐 VERIFICANDO ENDPOINT DO WEBHOOK...');
  
  const fs = require('fs');
  const path = require('path');
  
  const endpointPath = path.join(__dirname, 'api', 'hotmart', 'webhook.ts');
  
  if (fs.existsSync(endpointPath)) {
    console.log('✅ Endpoint webhook: api/hotmart/webhook.ts existe');
    
    // Verificar se o arquivo contém as funções essenciais
    const content = fs.readFileSync(endpointPath, 'utf8');
    
    const checks = [
      { name: 'Validação de token', pattern: /x-hotmart-hottok/i },
      { name: 'Processamento de eventos', pattern: /PURCHASE_APPROVED|event/i },
      { name: 'Criação de usuário', pattern: /createUser|signUp/i },
      { name: 'Envio de email', pattern: /sendCredentialsEmail|EmailService/i }
    ];
    
    for (const check of checks) {
      if (check.pattern.test(content)) {
        console.log(`✅ ${check.name}: Implementado`);
      } else {
        console.log(`❌ ${check.name}: NÃO ENCONTRADO`);
        tudoOk = false;
      }
    }
  } else {
    console.log('❌ Endpoint webhook: NÃO EXISTE');
    console.log('   Arquivo esperado: api/hotmart/webhook.ts');
    tudoOk = false;
  }
  
  // 6. Verificar configuração de email
  console.log('\n6. 📧 VERIFICANDO CONFIGURAÇÃO DE EMAIL...');
  
  if (process.env.SENDGRID_API_KEY && process.env.SENDGRID_FROM_EMAIL) {
    console.log('✅ SendGrid: Configurado');
    
    // Testar se a chave parece válida
    if (process.env.SENDGRID_API_KEY.startsWith('SG.')) {
      console.log('✅ Formato da API Key: Válido');
    } else {
      console.log('⚠️  Formato da API Key: Pode estar incorreto');
    }
  } else {
    console.log('❌ SendGrid: NÃO CONFIGURADO');
    console.log('   Emails não serão enviados!');
    tudoOk = false;
  }
  
  // 7. Resultado final
  console.log('\n==================================================');
  console.log('🏁 RESULTADO FINAL:');
  
  if (tudoOk) {
    console.log('✅ TUDO PRONTO! Você pode configurar o webhook na Hotmart.');
    console.log('\n📋 PRÓXIMOS PASSOS:');
    console.log('1. Faça o deploy no Vercel');
    console.log('2. Configure o webhook na Hotmart');
    console.log('3. Teste com uma compra de exemplo');
  } else {
    console.log('❌ PROBLEMAS ENCONTRADOS! Corrija os itens acima antes de prosseguir.');
    console.log('\n🔧 AÇÕES NECESSÁRIAS:');
    console.log('- Configure as variáveis de ambiente faltantes');
    console.log('- Execute as migrações do banco de dados');
    console.log('- Crie usuários pré-criados');
    console.log('- Verifique a implementação do endpoint');
  }
  
  console.log('==================================================');
  
  return tudoOk;
}

// Executar verificação
verificarWebhookHotmart().catch(console.error);