require('dotenv').config();

/**
 * Teste Final do Webhook Hotmart Simplificado
 * Testa apenas validação por token hottok
 */

// Casos de teste
const testCases = [
  {
    name: '✅ Token Válido - Compra Aprovada',
    shouldPass: true,
    expectedStatus: 200,
    payload: {
      hottok: 'gtnL72D16QPeck2Uky8d92uzq6GHtH6f40dc99-fece-4673-97c2-67aef62e4074',
      event: 'approved',
      data: {
        purchase: {
          order_id: 'HP' + Date.now(),
          buyer: {
            name: 'Cliente Teste',
            email: 'teste@exemplo.com'
          },
          price: {
            value: 97.00
          },
          status: 'APPROVED'
        }
      }
    }
  },
  {
    name: '❌ Token Inválido',
    shouldPass: false,
    expectedStatus: 401,
    payload: {
      hottok: 'token_invalido_123',
      event: 'approved',
      data: {
        purchase: {
          order_id: 'HP' + Date.now(),
          buyer: {
            name: 'Cliente Inválido',
            email: 'invalido@exemplo.com'
          }
        }
      }
    }
  },
  {
    name: '❌ Token Ausente',
    shouldPass: false,
    expectedStatus: 401,
    payload: {
      // hottok: ausente
      event: 'approved',
      data: {
        purchase: {
          order_id: 'HP' + Date.now(),
          buyer: {
            name: 'Cliente Sem Token',
            email: 'semtoken@exemplo.com'
          }
        }
      }
    }
  },
  {
    name: '✅ Token Válido - Cancelamento',
    shouldPass: true,
    expectedStatus: 200,
    payload: {
      hottok: 'gtnL72D16QPeck2Uky8d92uzq6GHtH6f40dc99-fece-4673-97c2-67aef62e4074',
      event: 'canceled',
      data: {
        purchase: {
          order_id: 'HP' + Date.now(),
          buyer: {
            name: 'Cliente Cancelado',
            email: 'cancelado@exemplo.com'
          }
        }
      }
    }
  },
  {
    name: '✅ Token Válido - Dados Incompletos',
    shouldPass: true,
    expectedStatus: 200,
    payload: {
      hottok: 'gtnL72D16QPeck2Uky8d92uzq6GHtH6f40dc99-fece-4673-97c2-67aef62e4074',
      event: 'approved'
      // data: ausente
    }
  }
];

async function testWebhook(testCase) {
  console.log(`\n🧪 ${testCase.name}`);
  console.log(`📋 Evento: ${testCase.payload.event || 'N/A'}`);
  console.log(`🔑 Token: ${testCase.payload.hottok ? 'PRESENTE' : 'AUSENTE'}`);
  console.log(`🎯 Esperado: ${testCase.expectedStatus}`);

  try {
    const response = await fetch('http://localhost:3006/api/hotmart/webhook', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'Hotmart-Test/1.0'
      },
      body: JSON.stringify(testCase.payload)
    });

    const responseText = await response.text();
    let responseData;

    try {
      responseData = JSON.parse(responseText);
    } catch (e) {
      responseData = { raw_response: responseText };
    }

    console.log(`📊 Status Recebido: ${response.status}`);
    console.log(`📤 Resposta:`, JSON.stringify(responseData, null, 2));

    // Verificar se passou
    const passed = response.status === testCase.expectedStatus;

    if (passed) {
      console.log('✅ PASSOU!');
    } else {
      console.log(`❌ FALHOU! Esperado: ${testCase.expectedStatus}, Recebido: ${response.status}`);
    }

    return {
      name: testCase.name,
      passed,
      expectedStatus: testCase.expectedStatus,
      actualStatus: response.status,
      response: responseData
    };

  } catch (error) {
    console.log(`💥 ERRO: ${error.message}`);
    return {
      name: testCase.name,
      passed: false,
      error: error.message
    };
  }
}

async function testConnectivity() {
  console.log('🔌 Testando conectividade...');
  try {
    const response = await fetch('http://localhost:3006/api/hotmart/webhook', {
      method: 'OPTIONS'
    });
    console.log(`📡 OPTIONS: ${response.status}`);
    return response.status === 200;
  } catch (error) {
    console.log(`❌ Conectividade: ${error.message}`);
    return false;
  }
}

async function runAllTests() {
  console.log('🚀 TESTE FINAL DO WEBHOOK HOTMART SIMPLIFICADO');
  console.log('⏰ Timestamp:', new Date().toISOString());
  console.log('═'.repeat(60));

  // Verificar conectividade
  const connected = await testConnectivity();
  if (!connected) {
    console.log('\n🛑 Servidor não está rodando!');
    console.log('💡 Execute: npm run dev:api');
    return;
  }

  // Verificar configurações
  console.log('\n🔧 Configurações:');
  console.log('VITE_SUPABASE_URL:', process.env.VITE_SUPABASE_URL ? '✅' : '❌');
  console.log('SUPABASE_SERVICE_ROLE_KEY:', process.env.SUPABASE_SERVICE_ROLE_KEY ? '✅' : '❌');
  console.log('HOTMART_TOKEN:', process.env.HOTMART_TOKEN ? '✅' : '❌');

  // Executar todos os testes
  const results = [];
  for (const testCase of testCases) {
    const result = await testWebhook(testCase);
    results.push(result);
    await new Promise(resolve => setTimeout(resolve, 500)); // Pausa entre testes
  }

  // Resumo final
  console.log('\n📋 RESUMO FINAL:');
  console.log('═'.repeat(60));

  const passed = results.filter(r => r.passed).length;
  const failed = results.filter(r => !r.passed).length;

  results.forEach(result => {
    const icon = result.passed ? '✅' : '❌';
    const status = result.actualStatus ? `(${result.actualStatus})` : '(ERROR)';
    console.log(`${icon} ${result.name} ${status}`);
  });

  console.log(`\n🎯 RESULTADO: ${passed} passou(m), ${failed} falhou(ram)`);

  if (failed === 0) {
    console.log('🎉 PERFEITO! Todos os testes passaram!');
    console.log('🟢 O webhook está pronto para os testes da Hotmart!');
  } else {
    console.log('⚠️ Alguns testes falharam. Verifique os logs acima.');
  }

  return results;
}

// Executar se chamado diretamente
if (require.main === module) {
  runAllTests().catch(console.error);
}

module.exports = { runAllTests, testWebhook };