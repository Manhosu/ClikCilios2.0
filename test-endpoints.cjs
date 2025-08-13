const https = require('https');

// Função para testar endpoint
function testEndpoint(path, description) {
  return new Promise((resolve) => {
    const options = {
      hostname: 'clik-cilios2-0.vercel.app',
      port: 443,
      path: path,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'Test-Script/1.0'
      }
    };

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => {
        data += chunk;
      });
      res.on('end', () => {
        resolve({
          path,
          description,
          status: res.statusCode,
          response: data,
          exists: true
        });
      });
    });

    req.on('error', (err) => {
      resolve({
        path,
        description,
        status: 0,
        response: err.message,
        exists: false
      });
    });

    req.write(JSON.stringify({ test: 'endpoint' }));
    req.end();
  });
}

// Função principal
async function testAllEndpoints() {
  console.log('🔍 TESTE DE ENDPOINTS WEBHOOK');
  console.log('=' .repeat(50));
  console.log('🎯 Objetivo: Identificar qual endpoint está ativo');
  console.log('');
  
  const endpoints = [
    { path: '/api/hotmart-webhook', description: 'Endpoint principal (hotmart-webhook.ts)' },
    { path: '/api/hotmart/webhook', description: 'Endpoint alternativo (hotmart/webhook.ts)' },
    { path: '/api/webhook-hotmart', description: 'Endpoint src (webhook-hotmart.ts)' }
  ];
  
  console.log('📡 Testando endpoints...');
  console.log('');
  
  for (const endpoint of endpoints) {
    console.log(`🧪 Testando: ${endpoint.path}`);
    console.log(`📋 Descrição: ${endpoint.description}`);
    
    try {
      const result = await testEndpoint(endpoint.path, endpoint.description);
      
      console.log(`📊 Status: ${result.status}`);
      console.log(`📤 Resposta: ${result.response}`);
      
      if (result.status === 404) {
        console.log('❌ Endpoint não existe');
      } else if (result.status >= 400 && result.status < 500) {
        console.log('✅ Endpoint existe (erro esperado sem dados válidos)');
      } else if (result.status >= 200 && result.status < 300) {
        console.log('✅ Endpoint existe e respondeu com sucesso');
      } else {
        console.log('⚠️  Endpoint existe mas com comportamento inesperado');
      }
      
    } catch (error) {
      console.log(`❌ Erro ao testar: ${error.message}`);
    }
    
    console.log('');
  }
  
  console.log('🔧 Próximos passos:');
  console.log('1. Identificar qual endpoint está ativo');
  console.log('2. Verificar se o problema é no secret ou na implementação');
  console.log('3. Corrigir o endpoint correto');
}

// Executar teste
testAllEndpoints().catch(console.error);