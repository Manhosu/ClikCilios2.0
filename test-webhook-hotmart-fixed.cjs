require('dotenv').config();
const crypto = require('crypto');

/**
 * Script para testar o webhook da Hotmart após as correções
 */

// Simular diferentes tipos de eventos da Hotmart
const testEvents = [
  {
    name: 'Compra Aprovada',
    event: 'approved',
    data: {
      id: 'test-webhook-' + Date.now(),
      event: 'approved',
      version: '2.0.0',
      date_created: new Date().toISOString(),
      data: {
        purchase: {
          order_id: 'HP' + Date.now(),
          order_date: Math.floor(Date.now() / 1000),
          status: 'APPROVED',
          buyer: {
            name: 'Cliente Teste Webhook',
            email: 'teste.webhook@exemplo.com'
          },
          offer: {
            code: '6012952',
            name: 'CíliosClick - Acesso Premium'
          },
          price: {
            value: 97.00,
            currency_code: 'BRL'
          },
          tracking: {
            coupon: 'TESTE10',
            source: 'affiliate_test'
          }
        }
      }
    }
  },
  {
    name: 'Compra Cancelada',
    event: 'canceled',
    data: {
      id: 'test-webhook-cancel-' + Date.now(),
      event: 'canceled',
      version: '2.0.0',
      date_created: new Date().toISOString(),
      data: {
        purchase: {
          order_id: 'HP' + (Date.now() - 1000),
          order_date: Math.floor((Date.now() - 1000) / 1000),
          status: 'CANCELED',
          buyer: {
            name: 'Cliente Cancelado',
            email: 'cancelado@exemplo.com'
          },
          offer: {
            code: '6012952',
            name: 'CíliosClick - Acesso Premium'
          },
          price: {
            value: 97.00,
            currency_code: 'BRL'
          }
        }
      }
    }
  },
  {
    name: 'Reembolso',
    event: 'refunded',
    data: {
      id: 'test-webhook-refund-' + Date.now(),
      event: 'refunded',
      version: '2.0.0',
      date_created: new Date().toISOString(),
      data: {
        purchase: {
          order_id: 'HP' + (Date.now() - 2000),
          order_date: Math.floor((Date.now() - 2000) / 1000),
          status: 'REFUNDED',
          buyer: {
            name: 'Cliente Reembolsado',
            email: 'reembolso@exemplo.com'
          },
          offer: {
            code: '6012952',
            name: 'CíliosClick - Acesso Premium'
          },
          price: {
            value: 97.00,
            currency_code: 'BRL'
          }
        }
      }
    }
  }
];

// Função para gerar assinatura HMAC
function generateHMACSignature(body, secret) {
  if (!secret) {
    console.warn('⚠️ HOTMART_WEBHOOK_SECRET não configurado - teste sem assinatura');
    return 'sha256=test_signature_without_secret';
  }

  const hmac = crypto.createHmac('sha256', secret);
  hmac.update(body, 'utf8');
  return 'sha256=' + hmac.digest('hex');
}

// Função para testar um evento específico
async function testWebhookEvent(eventConfig) {
  console.log(`\n🧪 Testando: ${eventConfig.name}`);
  console.log(`📋 Evento: ${eventConfig.event}`);

  try {
    const body = JSON.stringify(eventConfig.data, null, 0);
    const secret = process.env.HOTMART_WEBHOOK_SECRET || process.env.VITE_HOTMART_WEBHOOK_SECRET;
    const signature = generateHMACSignature(body, secret);

    console.log('📝 Body length:', body.length);
    console.log('🔐 Signature:', signature);

    // URL do webhook local (assumindo que está rodando localmente)
    const webhookUrl = 'http://localhost:3006/api/hotmart/webhook';

    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Hotmart-Signature': signature,
        'User-Agent': 'Hotmart-Webhook/1.0'
      },
      body: body
    });

    const responseText = await response.text();
    let responseData;

    try {
      responseData = JSON.parse(responseText);
    } catch (e) {
      responseData = { raw_response: responseText };
    }

    console.log(`📊 Status: ${response.status} ${response.statusText}`);
    console.log('📤 Response:', JSON.stringify(responseData, null, 2));

    if (response.status === 200) {
      console.log('✅ Teste passou!');
      return { success: true, status: response.status, data: responseData };
    } else {
      console.log(`❌ Teste falhou com status ${response.status}`);
      return { success: false, status: response.status, data: responseData };
    }

  } catch (error) {
    console.error('💥 Erro durante o teste:', error.message);
    return { success: false, error: error.message };
  }
}

// Função principal
async function runAllTests() {
  console.log('🚀 Iniciando testes do webhook Hotmart corrigido');
  console.log('⏰ Timestamp:', new Date().toISOString());

  // Verificar configurações
  console.log('\n🔧 Verificando configurações:');
  console.log('VITE_SUPABASE_URL:', process.env.VITE_SUPABASE_URL ? '✅ Configurado' : '❌ Ausente');
  console.log('SUPABASE_SERVICE_ROLE_KEY:', process.env.SUPABASE_SERVICE_ROLE_KEY ? '✅ Configurado' : '❌ Ausente');
  console.log('HOTMART_WEBHOOK_SECRET:', process.env.HOTMART_WEBHOOK_SECRET ? '✅ Configurado' : '❌ Ausente');
  console.log('VITE_HOTMART_WEBHOOK_SECRET:', process.env.VITE_HOTMART_WEBHOOK_SECRET ? '✅ Configurado' : '❌ Ausente');

  const results = [];

  // Executar testes sequencialmente
  for (const eventConfig of testEvents) {
    const result = await testWebhookEvent(eventConfig);
    results.push({
      event: eventConfig.name,
      ...result
    });

    // Aguardar um pouco entre os testes
    await new Promise(resolve => setTimeout(resolve, 1000));
  }

  // Resumo dos resultados
  console.log('\n📋 RESUMO DOS TESTES:');
  console.log('════════════════════');

  const passed = results.filter(r => r.success).length;
  const failed = results.filter(r => !r.success).length;

  results.forEach(result => {
    const status = result.success ? '✅' : '❌';
    console.log(`${status} ${result.event} - Status: ${result.status || 'ERROR'}`);
  });

  console.log(`\n🎯 Resultados: ${passed} passou(m), ${failed} falhou(ram)`);

  if (failed === 0) {
    console.log('🎉 Todos os testes passaram! O webhook está funcionando corretamente.');
  } else {
    console.log('⚠️ Alguns testes falharam. Verifique os logs acima para mais detalhes.');
  }

  return results;
}

// Testar conectividade básica
async function testBasicConnectivity() {
  console.log('\n🔌 Testando conectividade básica...');

  try {
    const response = await fetch('http://localhost:3006/api/hotmart/webhook', {
      method: 'OPTIONS'
    });

    console.log(`📡 OPTIONS request: ${response.status} ${response.statusText}`);
    return response.status === 200;
  } catch (error) {
    console.error('❌ Erro de conectividade:', error.message);
    console.log('💡 Certifique-se de que o servidor está rodando em http://localhost:3006');
    return false;
  }
}

// Executar testes
async function main() {
  const isConnected = await testBasicConnectivity();

  if (!isConnected) {
    console.log('\n🛑 Não foi possível conectar ao webhook. Inicie o servidor com:');
    console.log('   npm run dev:api');
    console.log('   ou');
    console.log('   npm run dev');
    console.log('   O servidor deve estar rodando em http://localhost:3006');
    return;
  }

  await runAllTests();
}

// Verificar se o script está sendo executado diretamente
if (require.main === module) {
  main().catch(console.error);
}

module.exports = {
  testWebhookEvent,
  runAllTests,
  generateHMACSignature
};