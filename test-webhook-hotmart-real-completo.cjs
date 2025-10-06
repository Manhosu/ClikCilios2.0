#!/usr/bin/env node
/**
 * ========================================
 * TESTE DO WEBHOOK HOTMART - PAYLOADS REAIS COMPLETOS
 * ========================================
 *
 * Este script usa os payloads EXATOS fornecidos pelo usuário
 * para testar o webhook Hotmart corrigido.
 */

const http = require('http');

// Configuração
const WEBHOOK_URL = 'http://localhost:3001/api/hotmart-webhook';
const HOTMART_TOKEN = 'gtnL72D16QPeck2Uky8d92uzq6GHtH6f40dc99-fece-4673-97c2-67aef62e4074';

// ========================================
// PAYLOADS REAIS COMPLETOS DA HOTMART
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
      "is_physical_product": false,
      "content": {
        "has_physical_products": true,
        "products": [
          {
            "id": 4774438,
            "ucode": "559fef42-3406-4d82-b775-d09bd33936b1",
            "name": "How to Make Clear Ice",
            "is_physical_product": false
          },
          {
            "id": 4999597,
            "ucode": "099e7644-b7d1-43d6-82a9-ec6be0118a4b",
            "name": "Organizador de Poeira",
            "is_physical_product": true
          }
        ]
      }
    },
    "affiliates": [
      {
        "affiliate_code": "Q58388177J",
        "name": "Affiliate name"
      }
    ],
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
    "producer": {
      "name": "Producer Test Name",
      "document": "12345678965",
      "legal_nature": "Pessoa Física"
    },
    "commissions": [
      {
        "value": 149.5,
        "source": "MARKETPLACE",
        "currency_value": "BRL"
      },
      {
        "value": 1350.5,
        "source": "PRODUCER",
        "currency_value": "BRL"
      }
    ],
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
      "checkout_country": {
        "name": "Brasil",
        "iso": "BR"
      },
      "order_bump": {
        "is_order_bump": true,
        "parent_purchase_transaction": "HP02316330308193"
      },
      "event_tickets": {
        "amount": 1758660642802
      },
      "original_offer_price": {
        "value": 1500,
        "currency_value": "BRL"
      },
      "order_date": 1511783344000,
      "status": "APPROVED",
      "transaction": "HP16015479281022",
      "payment": {
        "installments_number": 12,
        "type": "CREDIT_CARD"
      },
      "offer": {
        "code": "test",
        "coupon_code": "SHHUHA"
      },
      "sckPaymentLink": "sckPaymentLinkTest",
      "is_funnel": false,
      "business_model": "I"
    },
    "subscription": {
      "status": "ACTIVE",
      "plan": {
        "id": 123,
        "name": "plano de teste"
      },
      "subscriber": {
        "code": "I9OT62C3"
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
      "name": "Produto test postback2",
      "warranty_date": "2017-12-27T00:00:00Z",
      "support_email": "support@hotmart.com.br",
      "has_co_production": false,
      "is_physical_product": false,
      "content": {
        "has_physical_products": true,
        "products": [
          {
            "id": 4774438,
            "ucode": "559fef42-3406-4d82-b775-d09bd33936b1",
            "name": "How to Make Clear Ice",
            "is_physical_product": false
          },
          {
            "id": 4999597,
            "ucode": "099e7644-b7d1-43d6-82a9-ec6be0118a4b",
            "name": "Organizador de Poeira",
            "is_physical_product": true
          }
        ]
      }
    },
    "affiliates": [
      {
        "affiliate_code": "Q58388177J",
        "name": "Affiliate name"
      }
    ],
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
    "producer": {
      "name": "Producer Test Name",
      "document": "12345678965",
      "legal_nature": "Pessoa Física"
    },
    "commissions": [
      {
        "value": 149.5,
        "source": "MARKETPLACE",
        "currency_value": "BRL"
      },
      {
        "value": 1350.5,
        "source": "PRODUCER",
        "currency_value": "BRL"
      }
    ],
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
      "checkout_country": {
        "name": "Brasil",
        "iso": "BR"
      },
      "order_bump": {
        "is_order_bump": true,
        "parent_purchase_transaction": "HP02316330308193"
      },
      "event_tickets": {
        "amount": 1758660642669
      },
      "original_offer_price": {
        "value": 1500,
        "currency_value": "BRL"
      },
      "order_date": 1511783344000,
      "status": "CANCELED",
      "transaction": "HP16015479281022",
      "payment": {
        "installments_number": 12,
        "type": "CREDIT_CARD"
      },
      "offer": {
        "code": "test",
        "coupon_code": "SHHUHA"
      },
      "sckPaymentLink": "sckPaymentLinkTest",
      "is_funnel": false,
      "business_model": "I"
    },
    "subscription": {
      "status": "ACTIVE",
      "plan": {
        "id": 123,
        "name": "plano de teste"
      },
      "subscriber": {
        "code": "I9OT62C3"
      }
    }
  }
};

// ========================================
// FUNÇÃO PARA ENVIAR WEBHOOK
// ========================================

async function sendWebhook(url, payload, testName, hottok = null) {
  return new Promise((resolve, reject) => {
    const urlObj = new URL(url);
    const data = JSON.stringify(payload);

    const headers = {
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(data),
    };

    // Adicionar header X-Hotmart-Hottok se fornecido
    if (hottok) {
      headers['X-Hotmart-Hottok'] = hottok;
    }

    const options = {
      hostname: urlObj.hostname,
      port: urlObj.port || 80,
      path: urlObj.pathname,
      method: 'POST',
      headers: headers,
    };

    console.log(`\n${'='.repeat(90)}`);
    console.log(`🧪 TESTE: ${testName}`);
    console.log(`${'='.repeat(90)}`);
    console.log(`📤 URL: ${url}`);
    console.log(`📋 Headers:`);
    Object.keys(headers).forEach(key => {
      if (key === 'X-Hotmart-Hottok') {
        console.log(`   ${key}: ${headers[key].substring(0, 30)}...`);
      } else {
        console.log(`   ${key}: ${headers[key]}`);
      }
    });
    console.log(`📄 Payload Summary:`);
    console.log(`   Event: ${payload.event}`);
    console.log(`   Buyer Email: ${payload.data?.buyer?.email || 'N/A'}`);
    console.log(`   Buyer Name: ${payload.data?.buyer?.name || 'N/A'}`);
    console.log(`   Transaction: ${payload.data?.purchase?.transaction || 'N/A'}`);

    const startTime = Date.now();

    const req = http.request(options, (res) => {
      let responseData = '';

      res.on('data', (chunk) => {
        responseData += chunk;
      });

      res.on('end', () => {
        const endTime = Date.now();
        const duration = endTime - startTime;

        console.log(`\n📥 RESPOSTA (${duration}ms):`);
        console.log(`   Status: ${res.statusCode} ${res.statusMessage}`);

        try {
          const parsed = JSON.parse(responseData);
          console.log(`   Body:`);
          console.log(JSON.stringify(parsed, null, 4));
        } catch (e) {
          console.log(`   Body (raw): ${responseData}`);
        }

        // Avaliar resultado
        console.log(`\n🎯 AVALIAÇÃO:`);
        if (testName.includes('token válido') && res.statusCode === 200) {
          console.log(`   ✅ PASSOU - Status 200 OK (esperado)`);
        } else if (testName.includes('sem token') && res.statusCode === 401) {
          console.log(`   ✅ PASSOU - Status 401 Unauthorized (esperado)`);
        } else if (testName.includes('token inválido') && res.statusCode === 401) {
          console.log(`   ✅ PASSOU - Status 401 Unauthorized (esperado)`);
        } else if (res.statusCode === 200) {
          console.log(`   ✅ PASSOU - Status 200 OK`);
        } else {
          console.log(`   ❌ FALHOU - Status inesperado: ${res.statusCode}`);
        }

        resolve({ statusCode: res.statusCode, body: responseData, duration });
      });
    });

    req.on('error', (error) => {
      console.error(`\n❌ ERRO na requisição:`, error.message);
      console.error(`\n💡 DICA: Certifique-se que o servidor está rodando em ${url}`);
      console.error(`   Execute: npm run dev\n`);
      reject(error);
    });

    req.write(data);
    req.end();
  });
}

// ========================================
// EXECUTAR TESTES
// ========================================

async function runTests() {
  console.log(`\n${'='.repeat(90)}`);
  console.log(`🚀 TESTE DO WEBHOOK HOTMART - PAYLOADS REAIS COMPLETOS`);
  console.log(`${'='.repeat(90)}`);
  console.log(`⏰ Timestamp: ${new Date().toISOString()}`);
  console.log(`🔗 URL: ${WEBHOOK_URL}`);
  console.log(`🔑 Token: ${HOTMART_TOKEN.substring(0, 30)}...`);
  console.log(`📧 Email de teste: testeComprador271101postman15@example.com`);
  console.log(`\n💡 IMPORTANTE: Estes são os payloads EXATOS fornecidos pelo usuário!\n`);

  const results = [];

  try {
    // ========================================
    // TESTE 1: PURCHASE_APPROVED com token válido
    // ========================================
    console.log(`\n🔵 INICIANDO TESTE 1 de 4...`);
    const result1 = await sendWebhook(
      WEBHOOK_URL,
      payloadPurchaseApproved,
      '1. PURCHASE_APPROVED com token válido (deve criar usuário + enviar email)',
      HOTMART_TOKEN
    );
    results.push({ test: 'Teste 1', ...result1 });
    await new Promise(resolve => setTimeout(resolve, 3000)); // Aguardar 3s

    // ========================================
    // TESTE 2: PURCHASE_CANCELED com token válido
    // ========================================
    console.log(`\n🔵 INICIANDO TESTE 2 de 4...`);
    const result2 = await sendWebhook(
      WEBHOOK_URL,
      payloadPurchaseCanceled,
      '2. PURCHASE_CANCELED com token válido (apenas log, não cria usuário)',
      HOTMART_TOKEN
    );
    results.push({ test: 'Teste 2', ...result2 });
    await new Promise(resolve => setTimeout(resolve, 3000));

    // ========================================
    // TESTE 3: PURCHASE_APPROVED sem token
    // ========================================
    console.log(`\n🔵 INICIANDO TESTE 3 de 4...`);
    const result3 = await sendWebhook(
      WEBHOOK_URL,
      payloadPurchaseApproved,
      '3. PURCHASE_APPROVED sem token (deve retornar 401)',
      null // SEM TOKEN
    );
    results.push({ test: 'Teste 3', ...result3 });
    await new Promise(resolve => setTimeout(resolve, 3000));

    // ========================================
    // TESTE 4: PURCHASE_APPROVED com token inválido
    // ========================================
    console.log(`\n🔵 INICIANDO TESTE 4 de 4...`);
    const result4 = await sendWebhook(
      WEBHOOK_URL,
      payloadPurchaseApproved,
      '4. PURCHASE_APPROVED com token inválido (deve retornar 401)',
      'token-invalido-123456789' // TOKEN INVÁLIDO
    );
    results.push({ test: 'Teste 4', ...result4 });

    // ========================================
    // RESUMO FINAL
    // ========================================
    console.log(`\n\n${'='.repeat(90)}`);
    console.log(`✅ TODOS OS TESTES CONCLUÍDOS!`);
    console.log(`${'='.repeat(90)}\n`);

    console.log(`📊 RESUMO DOS RESULTADOS:\n`);
    results.forEach((result, index) => {
      const icon = result.statusCode === 200 || (index >= 2 && result.statusCode === 401) ? '✅' : '❌';
      console.log(`   ${icon} ${result.test}: Status ${result.statusCode} (${result.duration}ms)`);
    });

    console.log(`\n📋 O QUE VERIFICAR:\n`);
    console.log(`   1. ✅ Teste 1 retornou 200 OK?`);
    console.log(`   2. 👤 Usuário criado no Supabase para: testeComprador271101postman15@example.com?`);
    console.log(`   3. 📧 Email enviado com credenciais? (verificar logs do servidor)`);
    console.log(`   4. 🔑 Credenciais funcionam para login?`);
    console.log(`   5. ✅ Teste 2 retornou 200 OK (sem criar usuário)?`);
    console.log(`   6. ❌ Teste 3 retornou 401 (sem token)?`);
    console.log(`   7. ❌ Teste 4 retornou 401 (token inválido)?`);

    console.log(`\n📝 ESTRUTURA DOS PAYLOADS:`);
    console.log(`   ✅ Token enviado via HEADER: X-Hotmart-Hottok`);
    console.log(`   ✅ Buyer em: data.buyer (não data.purchase.buyer)`);
    console.log(`   ✅ Evento: PURCHASE_APPROVED / PURCHASE_CANCELED (uppercase)`);
    console.log(`   ✅ Email: testeComprador271101postman15@example.com`);
    console.log(`   ✅ Nome: Teste Comprador`);

    console.log(`\n🔍 LOGS DO SERVIDOR:`);
    console.log(`   Verifique o terminal do servidor (npm run dev) para ver:`);
    console.log(`   - "Token de onde veio: HEADER"`);
    console.log(`   - "Dados do comprador (data.buyer)"`);
    console.log(`   - "✅ Usuário criado: testeComprador271101postman15@example.com"`);
    console.log(`   - "✅ Email enviado com sucesso para..."`);

    console.log(`\n⚠️  NOTA:`);
    console.log(`   Este teste usa servidor LOCAL (localhost:3001)`);
    console.log(`   Para testar em PRODUÇÃO, altere WEBHOOK_URL no início do script\n`);

  } catch (error) {
    console.error(`\n❌ ERRO FATAL nos testes:`, error.message);
    process.exit(1);
  }
}

// Handler para CTRL+C
process.on('SIGINT', () => {
  console.log('\n\n⚠️  Testes interrompidos pelo usuário\n');
  process.exit(0);
});

// Executar testes
runTests().catch(error => {
  console.error('\n❌ Erro fatal:', error.message);
  process.exit(1);
});
