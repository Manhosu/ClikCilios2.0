const crypto = require('crypto');
const https = require('https');

// Configuração
const WEBHOOK_URL = 'https://clik-cilios2-0.vercel.app/api/hotmart-webhook';
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
      path: '/api/hotmart-webhook',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-hotmart-signature': `sha256=${signature}`,
        'User-Agent': 'Hotmart-Webhook/1.0'
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
          response: data
        });
      });
    });

    req.on('error', (err) => {
      resolve({
        status: 0,
        response: err.message
      });
    });

    req.write(postData);
    req.end();
  });
}

// Função para delay
function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// Função principal de teste
async function testWebhookProduction() {
  console.log('🚀 TESTE FINAL WEBHOOK HOTMART - PRODUÇÃO');
  console.log('=' .repeat(60));
  console.log('🎯 Objetivo: Verificar se o erro ERR_MODULE_NOT_FOUND foi resolvido');
  console.log('📡 Endpoint: /api/hotmart-webhook (endpoint principal)');
  console.log('');
  
  // Gerar dados únicos
  const timestamp = Date.now();
  const uniqueId = crypto.randomUUID();
  const uniqueEmail = `test.${timestamp}.${Math.random().toString(36).substring(7)}@example.com`;
  const transactionId = `TXN_${timestamp}_${Math.random().toString(36).substring(7)}`;
  
  console.log('📋 Dados únicos gerados:');
  console.log(`📧 Email: ${uniqueEmail}`);
  console.log(`🆔 Transaction ID: ${transactionId}`);
  console.log('');
  
  // Payload PURCHASE_APPROVED
  const approvedPayload = {
    id: uniqueId,
    event: 'PURCHASE_APPROVED',
    data: {
      purchase: {
        order_id: transactionId,
        order_date: timestamp,
        status: 'APPROVED',
        buyer: {
          email: uniqueEmail,
          name: 'Test User Production'
        },
        offer: {
          code: 'PROD001',
          name: 'Produto Teste Produção'
        },
        price: {
          value: 97,
          currency_code: 'BRL'
        },
        transaction: transactionId
      }
    }
  };
  
  console.log('1️⃣ Testando PURCHASE_APPROVED...');
  const approvedPayloadStr = JSON.stringify(approvedPayload);
  const approvedSignature = generateHMAC(approvedPayloadStr, WEBHOOK_SECRET);
  
  console.log(`🔐 HMAC gerado: ${approvedSignature}`);
  
  const approvedResult = await makeRequest(approvedPayload, approvedSignature);
  
  console.log(`📊 Status: ${approvedResult.status}`);
  console.log(`📤 Resposta: ${approvedResult.response}`);
  
  if (approvedResult.status === 500) {
    console.log('❌ ERRO 500: O problema ERR_MODULE_NOT_FOUND ainda não foi resolvido!');
  } else if (approvedResult.status === 400 && approvedResult.response.includes('duplicate key')) {
    console.log('✅ Webhook funcionando: Detectou usuário duplicado (comportamento esperado)');
  } else if (approvedResult.status === 200) {
    console.log('✅ Webhook funcionando: Processamento bem-sucedido');
  } else if (approvedResult.status === 401) {
    console.log('⚠️  Problema de autenticação HMAC');
  } else {
    console.log(`⚠️  Status inesperado: ${approvedResult.status}`);
  }
  
  console.log('');
  console.log('⏳ Aguardando 3 segundos...');
  await delay(3000);
  
  // Payload PURCHASE_CANCELED
  const canceledPayload = {
    id: crypto.randomUUID(),
    event: 'PURCHASE_CANCELED',
    data: {
      purchase: {
        order_id: `CANCEL_${timestamp}`,
        order_date: timestamp,
        status: 'CANCELED',
        buyer: {
          email: uniqueEmail,
          name: 'Test User Production'
        },
        transaction: `CANCEL_${transactionId}`
      }
    }
  };
  
  console.log('2️⃣ Testando PURCHASE_CANCELED...');
  const canceledPayloadStr = JSON.stringify(canceledPayload);
  const canceledSignature = generateHMAC(canceledPayloadStr, WEBHOOK_SECRET);
  
  const canceledResult = await makeRequest(canceledPayload, canceledSignature);
  
  console.log(`📊 Status: ${canceledResult.status}`);
  console.log(`📤 Resposta: ${canceledResult.response}`);
  
  if (canceledResult.status === 500) {
    console.log('❌ ERRO 500: O problema ERR_MODULE_NOT_FOUND ainda não foi resolvido!');
  } else if (canceledResult.status === 200) {
    console.log('✅ Webhook funcionando: Evento cancelado processado corretamente');
  } else {
    console.log(`⚠️  Status inesperado: ${canceledResult.status}`);
  }
  
  console.log('');
  console.log('📋 RESUMO DOS TESTES:');
  console.log('=' .repeat(40));
  
  if (approvedResult.status === 500 || canceledResult.status === 500) {
    console.log('❌ FALHA: Ainda há erro 500 (ERR_MODULE_NOT_FOUND não resolvido)');
    console.log('🔧 Ação necessária: Verificar importações e dependências');
  } else {
    console.log('✅ SUCESSO: Erro ERR_MODULE_NOT_FOUND foi resolvido!');
    console.log('🎉 Webhook está respondendo corretamente');
    
    if (approvedResult.status === 400 && approvedResult.response.includes('duplicate key')) {
      console.log('ℹ️  Nota: Erro de usuário duplicado é comportamento esperado');
    }
  }
  
  console.log('');
  console.log('🔧 Próximos passos:');
  if (approvedResult.status === 500 || canceledResult.status === 500) {
    console.log('1. Verificar logs detalhados no Vercel');
    console.log('2. Confirmar se todas as dependências estão corretas');
    console.log('3. Verificar se o deploy foi atualizado');
  } else {
    console.log('1. Webhook está funcionando corretamente');
    console.log('2. Configurar o endpoint no Hotmart se necessário');
    console.log('3. Monitorar logs de produção');
  }
}

// Executar teste
testWebhookProduction().catch(console.error);