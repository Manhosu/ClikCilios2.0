const https = require('https');
const crypto = require('crypto');

// Configuração
const HOTMART_SECRET = 'minha_chave_secreta_hotmart';
const BASE_URL = 'https://clik-cilios2-0.vercel.app';

// Função para gerar HMAC
function generateHMAC(data, secret) {
  return crypto.createHmac('sha256', secret).update(data).digest('hex');
}

// Função para fazer requisição HTTPS
function makeRequest(url, data, headers) {
  return new Promise((resolve, reject) => {
    const postData = JSON.stringify(data);
    
    const options = {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData),
        ...headers
      }
    };

    const req = https.request(url, options, (res) => {
      let responseData = '';
      
      res.on('data', (chunk) => {
        responseData += chunk;
      });
      
      res.on('end', () => {
        try {
          const jsonResponse = JSON.parse(responseData);
          resolve({ status: res.statusCode, data: jsonResponse });
        } catch (e) {
          resolve({ status: res.statusCode, data: responseData });
        }
      });
    });

    req.on('error', (err) => {
      reject(err);
    });

    req.write(postData);
    req.end();
  });
}

// Função principal de teste
async function testPurchaseApprovalFix() {
  console.log('🔧 TESTE: Correção do erro assignUser');
  console.log('============================================================');
  console.log('🎯 Objetivo: Verificar se hotmartUsersService.assignUserToHotmart funciona');
  console.log('📡 Endpoint: /api/hotmart/webhook (endpoint com problema)');
  console.log('');

  // Gerar dados únicos para o teste
  const timestamp = Date.now();
  const randomSuffix = Math.random().toString(36).substring(2, 8);
  const testEmail = `test.${timestamp}.${randomSuffix}@example.com`;
  const transactionId = `TXN_${timestamp}_${randomSuffix}`;
  
  console.log('📋 Dados únicos gerados:');
  console.log(`📧 Email: ${testEmail}`);
  console.log(`🆔 Transaction ID: ${transactionId}`);
  console.log('');

  // Payload de teste para PURCHASE_APPROVED
  const payload = {
    "id": `notification_${timestamp}`,
    "creation_date": new Date().toISOString(),
    "event": "PURCHASE_APPROVED",
    "version": "2.0.0",
    "data": {
      "product": {
        "id": 12345,
        "name": "Curso Cílios Click - Teste"
      },
      "buyer": {
        "email": testEmail,
        "name": "Comprador Teste"
      },
      "purchase": {
        "transaction": transactionId,
        "status": "APPROVED",
        "approved_date": Math.floor(Date.now() / 1000)
      }
    }
  };

  const payloadString = JSON.stringify(payload);
  const hmacSignature = generateHMAC(payloadString, HOTMART_SECRET);
  
  console.log('1️⃣ Testando PURCHASE_APPROVED no endpoint /api/hotmart/webhook...');
  console.log(`🔐 HMAC gerado: ${hmacSignature}`);
  
  try {
    const response = await makeRequest(
      `${BASE_URL}/api/hotmart/webhook`,
      payload,
      {
        'X-Hotmart-Hottok': hmacSignature
      }
    );
    
    console.log(`📊 Status: ${response.status}`);
    console.log(`📤 Resposta: ${JSON.stringify(response.data)}`);
    
    // Análise do resultado
    if (response.status === 500) {
      if (typeof response.data === 'string' && response.data.includes('assignUser is not a function')) {
        console.log('❌ ERRO: Ainda há problema com assignUser!');
        console.log('🔍 O erro de função não encontrada persiste');
      } else if (typeof response.data === 'string' && response.data.includes('FUNCTION_INVOCATION_FAILED')) {
        console.log('❌ ERRO: Falha na invocação da função');
        console.log('🔍 Pode haver outros problemas no código');
      } else {
        console.log('❌ ERRO 500: Erro interno do servidor');
        console.log('🔍 Verifique os logs do Vercel para mais detalhes');
      }
    } else if (response.status === 400) {
      if (response.data && response.data.error && response.data.error.includes('duplicate key')) {
        console.log('✅ SUCESSO: Função assignUserToHotmart funcionou!');
        console.log('ℹ️  Erro de usuário duplicado é comportamento esperado');
      } else {
        console.log('⚠️  Status 400: Erro de validação');
        console.log('🔍 Verifique se os dados estão corretos');
      }
    } else if (response.status === 200) {
      console.log('✅ SUCESSO: Webhook processou corretamente!');
      console.log('🎉 Função assignUserToHotmart está funcionando');
    } else {
      console.log(`⚠️  Status inesperado: ${response.status}`);
      console.log('🔍 Verifique a resposta para mais detalhes');
    }
    
  } catch (error) {
    console.log('❌ ERRO na requisição:', error.message);
  }
  
  console.log('');
  console.log('📋 RESUMO DO TESTE:');
  console.log('========================================');
  console.log('🎯 Testou correção do erro: hotmartUsersService.assignUser -> assignUserToHotmart');
  console.log('📡 Endpoint testado: /api/hotmart/webhook');
  console.log('');
  console.log('🔧 Se ainda houver erro 500:');
  console.log('1. Verifique os logs do Vercel');
  console.log('2. Confirme se o deploy foi feito');
  console.log('3. Teste o endpoint principal /api/hotmart-webhook');
}

// Executar teste
testPurchaseApprovalFix().catch(console.error);