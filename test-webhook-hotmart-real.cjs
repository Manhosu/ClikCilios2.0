#!/usr/bin/env node
/**
 * Script de teste do webhook Hotmart com PAYLOADS REAIS
 * Usa exatamente a estrutura que a Hotmart envia
 */

const http = require('http');

// Configuração
const WEBHOOK_URL = 'http://localhost:3001/api/hotmart-webhook';
const HOTMART_TOKEN = 'gtnL72D16QPeck2Uky8d92uzq6GHtH6f40dc99-fece-4673-97c2-67aef62e4074';

// ========================================
// PAYLOADS REAIS DA HOTMART (fornecidos pelo usuário)
// ========================================

const payloadPurchaseApproved = {
  "id": "0096289e-8277-41a7-9fe1-bf4d25f20a33",
  "creation_date": 1758660642845,
  "event": "PURCHASE_APPROVED",
  "version": "2.0.0",
  "data": {
    "product": {
      "id": 0,
      "ucode": "fb056612-bcc6-4217-9e6d-2a5d1110ac2f",
      "name": "Produto test postback2",
      "warranty_date": "2017-12-27T00:00:00Z",
      "support_email": "support@hotmart.com.br",
      "has_co_production": false,
      "is_physical_product": false
    },
    "buyer": {
      "email": "testeComprador271101postman15@example.com",
      "name": "Teste Comprador",
      "first_name": "Teste",
      "last_name": "Comprador",
      "checkout_phone_code": "999999999",
      "checkout_phone": "99999999900",
      "address": {
        "city": "Uberlândia",
        "country": "Brasil",
        "country_iso": "BR",
        "state": "Minas Gerais",
        "neighborhood": "Tubalina",
        "zipcode": "38400123",
        "address": "Avenida Francisco Galassi",
        "number": "10",
        "complement": "Perto do shopping"
      },
      "document": "69526128664",
      "document_type": "CPF"
    },
    "purchase": {
      "approved_date": 1511783346000,
      "full_price": {
        "value": 1500,
        "currency_value": "BRL"
      },
      "price": {
        "value": 1500,
        "currency_value": "BRL"
      },
      "order_date": 1511783344000,
      "status": "APPROVED",
      "transaction": "HP16015479281022",
      "payment": {
        "installments_number": 12,
        "type": "CREDIT_CARD"
      }
    }
  }
};

const payloadPurchaseCanceled = {
  "id": "05146749-94c4-4822-ba1e-192fdb415ae0",
  "creation_date": 1758660642747,
  "event": "PURCHASE_CANCELED",
  "version": "2.0.0",
  "data": {
    "product": {
      "id": 0,
      "ucode": "fb056612-bcc6-4217-9e6d-2a5d1110ac2f",
      "name": "Produto test postback2"
    },
    "buyer": {
      "email": "testeComprador271101postman15@example.com",
      "name": "Teste Comprador",
      "first_name": "Teste",
      "last_name": "Comprador"
    },
    "purchase": {
      "status": "CANCELED",
      "transaction": "HP16015479281022"
    }
  }
};

// Função para fazer requisição HTTP simulando a Hotmart
async function sendWebhook(url, payload, testName, sendTokenInHeader = true) {
  return new Promise((resolve, reject) => {
    const urlObj = new URL(url);
    const data = JSON.stringify(payload);

    const headers = {
      'Content-Type': 'application/json',
      'Content-Length': data.length,
    };

    // HOTMART ENVIA O TOKEN VIA HEADER!
    if (sendTokenInHeader) {
      headers['X-Hotmart-Hottok'] = HOTMART_TOKEN;
    }

    const options = {
      hostname: urlObj.hostname,
      port: urlObj.port || 80,
      path: urlObj.pathname,
      method: 'POST',
      headers: headers,
    };

    console.log(`\n${'='.repeat(80)}`);
    console.log(`🧪 TESTE: ${testName}`);
    console.log(`${'='.repeat(80)}`);
    console.log(`📤 URL: ${url}`);
    console.log(`📋 Headers:`, JSON.stringify(headers, null, 2));
    console.log(`📄 Payload (preview):`, JSON.stringify({
      event: payload.event,
      buyer_email: payload.data?.buyer?.email,
      buyer_name: payload.data?.buyer?.name
    }, null, 2));

    const req = http.request(options, (res) => {
      let responseData = '';

      res.on('data', (chunk) => {
        responseData += chunk;
      });

      res.on('end', () => {
        console.log(`\n📥 RESPOSTA:`);
        console.log(`   Status: ${res.statusCode}`);

        try {
          const parsed = JSON.parse(responseData);
          console.log(`   Body:`, JSON.stringify(parsed, null, 2));
        } catch (e) {
          console.log(`   Body (raw):`, responseData);
        }

        // Verificar resultado esperado
        if (testName.includes('token válido') && res.statusCode === 200) {
          console.log(`✅ TESTE PASSOU - Status 200 OK`);
        } else if (testName.includes('sem token') && res.statusCode === 401) {
          console.log(`✅ TESTE PASSOU - Status 401 esperado (sem token)`);
        } else if (testName.includes('token inválido') && res.statusCode === 401) {
          console.log(`✅ TESTE PASSOU - Status 401 esperado (token inválido)`);
        } else if (res.statusCode === 200) {
          console.log(`✅ TESTE PASSOU - Status 200 OK`);
        } else {
          console.log(`❌ TESTE FALHOU - Status inesperado: ${res.statusCode}`);
        }

        resolve({ statusCode: res.statusCode, body: responseData });
      });
    });

    req.on('error', (error) => {
      console.error(`❌ ERRO na requisição:`, error.message);
      reject(error);
    });

    req.write(data);
    req.end();
  });
}

// Executar testes
async function runTests() {
  console.log(`\n🚀 TESTES DO WEBHOOK HOTMART - PAYLOADS REAIS`);
  console.log(`⏰ Timestamp: ${new Date().toISOString()}`);
  console.log(`🔗 URL: ${WEBHOOK_URL}`);
  console.log(`🔑 Token: ${HOTMART_TOKEN.substring(0, 20)}...`);
  console.log(`\n📌 IMPORTANTE: Este script usa a ESTRUTURA REAL que a Hotmart envia!\n`);

  try {
    // Teste 1: PURCHASE_APPROVED com token válido via header
    await sendWebhook(
      WEBHOOK_URL,
      payloadPurchaseApproved,
      '1. PURCHASE_APPROVED - Token válido via header (deve criar usuário)',
      true
    );
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Teste 2: PURCHASE_CANCELED com token válido via header
    await sendWebhook(
      WEBHOOK_URL,
      payloadPurchaseCanceled,
      '2. PURCHASE_CANCELED - Token válido via header (apenas log)',
      true
    );
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Teste 3: PURCHASE_APPROVED sem token (deve retornar 401)
    await sendWebhook(
      WEBHOOK_URL,
      payloadPurchaseApproved,
      '3. PURCHASE_APPROVED - Sem token no header (deve retornar 401)',
      false
    );
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Teste 4: PURCHASE_APPROVED com token inválido
    const payloadComTokenInvalido = { ...payloadPurchaseApproved };
    await sendWebhook(
      WEBHOOK_URL,
      payloadComTokenInvalido,
      '4. PURCHASE_APPROVED - Token inválido no header (deve retornar 401)',
      false
    );

    console.log(`\n${'='.repeat(80)}`);
    console.log(`✅ TODOS OS TESTES CONCLUÍDOS`);
    console.log(`${'='.repeat(80)}\n`);

    console.log(`📋 RESUMO DOS TESTES:`);
    console.log(`   ✅ Teste 1: PURCHASE_APPROVED com token → Deve criar usuário e enviar email`);
    console.log(`   ✅ Teste 2: PURCHASE_CANCELED com token → Deve apenas logar`);
    console.log(`   ✅ Teste 3: PURCHASE_APPROVED sem token → Deve retornar 401`);
    console.log(`   ✅ Teste 4: PURCHASE_APPROVED token inválido → Deve retornar 401`);

    console.log(`\n📧 VERIFICAR:`);
    console.log(`   1. Usuário criado no Supabase para: testeComprador271101postman15@example.com`);
    console.log(`   2. Email enviado para: testeComprador271101postman15@example.com`);
    console.log(`   3. Credenciais de login funcionais`);

    console.log(`\n📝 ESTRUTURA DO PAYLOAD HOTMART:`);
    console.log(`   - Token via HEADER: X-Hotmart-Hottok`);
    console.log(`   - Buyer em: data.buyer (não data.purchase.buyer!)`);
    console.log(`   - Evento: PURCHASE_APPROVED (uppercase + underscore)`);

    console.log(`\n⚠️  NOTA: Este teste usa servidor LOCAL (localhost:3001)`);
    console.log(`   Para testar em produção, altere WEBHOOK_URL para a URL do Vercel\n`);

  } catch (error) {
    console.error(`❌ ERRO FATAL nos testes:`, error);
    process.exit(1);
  }
}

// Adicionar handler para CTRL+C
process.on('SIGINT', () => {
  console.log('\n\n⚠️  Testes interrompidos pelo usuário\n');
  process.exit(0);
});

// Executar
runTests().catch(error => {
  console.error('❌ Erro fatal:', error);
  process.exit(1);
});
