require('dotenv').config();

/**
 * Script para testar o webhook da Hotmart com validação por hottok
 */

// Simular diferentes tipos de eventos da Hotmart com hottok
const testEvents = [
  {
    name: 'Compra Aprovada com Token Válido',
    valid: true,
    data: {
      hottok: 'gtnL72D16QPeck2Uky8d92uzq6GHtH6f40dc99-fece-4673-97c2-67aef62e4074',
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
            name: 'Cliente Teste Token',
            email: 'teste.token@exemplo.com'
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
    name: 'Compra com Token Inválido',
    valid: false,
    data: {
      hottok: 'token_invalido_123',
      id: 'test-webhook-invalid-' + Date.now(),
      event: 'approved',
      version: '2.0.0',
      date_created: new Date().toISOString(),
      data: {
        purchase: {
          order_id: 'HP' + (Date.now() - 1000),
          order_date: Math.floor((Date.now() - 1000) / 1000),
          status: 'APPROVED',
          buyer: {
            name: 'Cliente Token Inválido',
            email: 'invalido@exemplo.com'
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
    name: 'Compra sem Token',
    valid: false,
    data: {
      // hottok: ausente
      id: 'test-webhook-no-token-' + Date.now(),
      event: 'approved',
      version: '2.0.0',
      date_created: new Date().toISOString(),
      data: {
        purchase: {
          order_id: 'HP' + (Date.now() - 2000),
          order_date: Math.floor((Date.now() - 2000) / 1000),
          status: 'APPROVED',
          buyer: {
            name: 'Cliente Sem Token',
            email: 'semtoken@exemplo.com'
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
    name: 'Cancelamento com Token Válido',
    valid: true,
    data: {
      hottok: 'gtnL72D16QPeck2Uky8d92uzq6GHtH6f40dc99-fece-4673-97c2-67aef62e4074',
      id: 'test-webhook-cancel-' + Date.now(),
      event: 'canceled',
      version: '2.0.0',
      date_created: new Date().toISOString(),
      data: {
        purchase: {
          order_id: 'HP' + (Date.now() - 3000),
          order_date: Math.floor((Date.now() - 3000) / 1000),
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
  }
];

// Função para testar um evento específico
async function testWebhookEvent(eventConfig) {
  console.log(`\n🧪 Testando: ${eventConfig.name}`);
  console.log(`📋 Evento: ${eventConfig.data.event}`);
  console.log(`🔐 Token esperado: ${eventConfig.valid ? 'VÁLIDO' : 'INVÁLIDO'}`);

  try {
    const body = JSON.stringify(eventConfig.data, null, 0);

    console.log('📝 Body length:', body.length);
    console.log('🔑 Hottok no payload:', eventConfig.data.hottok || 'AUSENTE');

    // URL do webhook local
    const webhookUrl = 'http://localhost:3006/api/hotmart/webhook';

    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
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

    // Verificar se o resultado está correto baseado na expectativa
    if (eventConfig.valid && response.status === 200) {
      console.log('✅ Teste passou! Token válido aceito.');
      return { success: true, status: response.status, data: responseData };
    } else if (!eventConfig.valid && response.status === 401) {
      console.log('✅ Teste passou! Token inválido rejeitado corretamente.');
      return { success: true, status: response.status, data: responseData };
    } else {
      console.log(`❌ Teste falhou! Expected: ${eventConfig.valid ? '200' : '401'}, Got: ${response.status}`);
      return { success: false, status: response.status, data: responseData };
    }

  } catch (error) {
    console.error('💥 Erro durante o teste:', error.message);
    return { success: false, error: error.message };
  }
}

// Função principal
async function runAllTests() {
  console.log('🚀 Iniciando testes do webhook Hotmart com validação por token');
  console.log('⏰ Timestamp:', new Date().toISOString());

  // Verificar configurações
  console.log('\n🔧 Verificando configurações:');
  console.log('VITE_SUPABASE_URL:', process.env.VITE_SUPABASE_URL ? '✅ Configurado' : '❌ Ausente');
  console.log('SUPABASE_SERVICE_ROLE_KEY:', process.env.SUPABASE_SERVICE_ROLE_KEY ? '✅ Configurado' : '❌ Ausente');
  console.log('HOTMART_TOKEN:', process.env.HOTMART_TOKEN ? '✅ Configurado' : '❌ Ausente');

  const results = [];

  // Executar testes sequencialmente
  for (const eventConfig of testEvents) {
    const result = await testWebhookEvent(eventConfig);
    results.push({
      event: eventConfig.name,
      expected_valid: eventConfig.valid,
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
    const expectedText = result.expected_valid ? 'Token Válido' : 'Token Inválido';
    console.log(`${status} ${result.event} (${expectedText}) - Status: ${result.status || 'ERROR'}`);
  });

  console.log(`\n🎯 Resultados: ${passed} passou(m), ${failed} falhou(ram)`);

  if (failed === 0) {
    console.log('🎉 Todos os testes passaram! O webhook está funcionando corretamente com validação por token.');
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
  runAllTests
};