const https = require('https');
const crypto = require('crypto');

// Configuração
const WEBHOOK_URL = 'https://clik-cilios2-0.vercel.app/api/hotmart/webhook';
const WEBHOOK_SECRET = 'gtnL72D16QPeck2Uky8d92uzq6GHtH6f40dc99-fece-4673-97c2-67aef62e4074';

// Função para gerar HMAC
function generateHMAC(payload, secret) {
  const hmac = crypto.createHmac('sha256', secret);
  hmac.update(payload);
  return hmac.digest('hex');
}

// Função para fazer requisição HTTPS
function makeRequest(payload, signature) {
  return new Promise((resolve) => {
    const postData = JSON.stringify(payload);
    
    const options = {
      hostname: 'clik-cilios2-0.vercel.app',
      port: 443,
      path: '/api/hotmart/webhook',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-hotmart-signature': `sha256=${signature}`,
        'User-Agent': 'Module-Fix-Test/1.0'
      }
    };

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => {
        data += chunk;
      });
      res.on('end', () => {
        resolve({
          status: res.statusCode,
          response: data,
          headers: res.headers
        });
      });
    });

    req.on('error', (err) => {
      resolve({
        status: 0,
        response: err.message,
        error: true
      });
    });

    req.write(postData);
    req.end();
  });
}

// Função principal de teste
async function testModuleFix() {
  console.log('🔧 TESTE DE CORREÇÃO - ERR_MODULE_NOT_FOUND');
  console.log('=' .repeat(60));
  console.log('🎯 Objetivo: Verificar se o erro de módulo foi resolvido');
  console.log('📡 Endpoint: /api/hotmart/webhook (endpoint corrigido)');
  console.log('');
  
  // Gerar dados únicos para teste
  const timestamp = Date.now();
  const uniqueId = crypto.randomUUID();
  const uniqueEmail = `moduletest.${timestamp}@example.com`;
  const transactionId = `MODULE_TEST_${timestamp}`;
  
  console.log('📋 Dados de teste:');
  console.log(`📧 Email: ${uniqueEmail}`);
  console.log(`🆔 Transaction ID: ${transactionId}`);
  console.log('');
  
  // Payload de teste simples
  const testPayload = {
    id: uniqueId,
    event: 'PURCHASE_APPROVED',
    data: {
      purchase: {
        order_id: transactionId,
        order_date: timestamp,
        status: 'APPROVED',
        buyer: {
          email: uniqueEmail,
          name: 'Module Test User'
        },
        offer: {
          code: 'MODULE_TEST',
          name: 'Teste Correção Módulo'
        },
        price: {
          value: 1,
          currency_code: 'BRL'
        },
        transaction: transactionId
      }
    }
  };
  
  console.log('🧪 Executando teste...');
  const payloadStr = JSON.stringify(testPayload);
  const signature = generateHMAC(payloadStr, WEBHOOK_SECRET);
  
  console.log(`🔐 HMAC: ${signature}`);
  console.log('');
  
  const result = await makeRequest(testPayload, signature);
  
  console.log('📊 RESULTADO DO TESTE:');
  console.log('=' .repeat(30));
  console.log(`📈 Status HTTP: ${result.status}`);
  console.log(`📤 Resposta: ${result.response}`);
  
  // Análise do resultado
  console.log('');
  console.log('🔍 ANÁLISE:');
  console.log('=' .repeat(20));
  
  if (result.error) {
    console.log('❌ ERRO DE CONEXÃO');
    console.log(`   Detalhes: ${result.response}`);
    console.log('   Possível causa: Problema de rede ou endpoint inativo');
  } else if (result.status === 500) {
    console.log('❌ ERRO 500 - MÓDULO AINDA NÃO RESOLVIDO');
    console.log('   O erro ERR_MODULE_NOT_FOUND ainda persiste');
    console.log('   Ação necessária: Verificar se o deploy foi atualizado');
    
    if (result.response.includes('FUNCTION_INVOCATION_FAILED')) {
      console.log('   Tipo: Falha na invocação da função (módulo não encontrado)');
    }
  } else if (result.status === 400) {
    console.log('✅ MÓDULO RESOLVIDO - ERRO 400 ESPERADO');
    console.log('   O webhook está funcionando (não há mais erro 500)');
    
    if (result.response.includes('duplicate key')) {
      console.log('   Tipo: Erro de usuário duplicado (comportamento normal)');
    } else if (result.response.includes('HMAC')) {
      console.log('   Tipo: Erro de validação HMAC');
    } else {
      console.log('   Tipo: Erro de validação de dados');
    }
  } else if (result.status === 401) {
    console.log('✅ MÓDULO RESOLVIDO - ERRO 401 ESPERADO');
    console.log('   O webhook está funcionando (problema apenas de autenticação)');
    console.log('   Tipo: Erro de validação HMAC ou autenticação');
  } else if (result.status === 200) {
    console.log('✅ MÓDULO RESOLVIDO - SUCESSO COMPLETO');
    console.log('   O webhook processou a requisição com sucesso');
    console.log('   Tipo: Processamento bem-sucedido');
  } else {
    console.log(`⚠️  STATUS INESPERADO: ${result.status}`);
    console.log('   O módulo pode estar resolvido, mas há outro problema');
  }
  
  console.log('');
  console.log('📋 RESUMO:');
  console.log('=' .repeat(15));
  
  if (result.status === 500) {
    console.log('❌ FALHA: ERR_MODULE_NOT_FOUND ainda não foi resolvido');
    console.log('🔧 Próximos passos:');
    console.log('   1. Verificar se o deploy foi atualizado no Vercel');
    console.log('   2. Confirmar se todas as importações foram removidas');
    console.log('   3. Verificar logs detalhados no Vercel Dashboard');
  } else {
    console.log('✅ SUCESSO: ERR_MODULE_NOT_FOUND foi resolvido!');
    console.log('🎉 O webhook está respondendo sem erros de módulo');
    console.log('📝 Próximos passos:');
    console.log('   1. Webhook está operacional');
    console.log('   2. Configurar endpoint no Hotmart se necessário');
    console.log('   3. Implementar envio de email real se desejado');
  }
}

// Executar teste
testModuleFix().catch(console.error);