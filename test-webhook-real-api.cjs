const https = require('https');
const fs = require('fs');
const path = require('path');

// Configurações do teste
const WEBHOOK_URL = 'https://clik-cilios2-0.vercel.app/api/hotmart-webhook';
const WEBHOOK_TOKEN = process.env.HOTMART_WEBHOOK_TOKEN || 'your-webhook-token';

async function sendWebhookRequest(testFile, eventType) {
  return new Promise((resolve, reject) => {
    try {
      console.log(`\n🧪 Testando webhook real: ${eventType}`);
      console.log('='.repeat(50));
      
      // Carregar o JSON de teste
      const testData = JSON.parse(
        fs.readFileSync(path.join(__dirname, testFile), 'utf8')
      );
      
      console.log('📋 Dados do webhook:');
      console.log('- Event:', testData.event);
      console.log('- Transaction:', testData.data.purchase.transaction);
      console.log('- Buyer Email:', testData.data.buyer.email);
      console.log('- Status:', testData.data.purchase.status);
      
      const postData = JSON.stringify(testData);
      
      const options = {
        hostname: 'clik-cilios2-0.vercel.app',
        port: 443,
        path: '/api/hotmart-webhook',
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(postData),
          'X-Hotmart-Hottok': WEBHOOK_TOKEN,
          'User-Agent': 'Hotmart-Webhook-Test/1.0'
        }
      };
      
      console.log('\n🌐 Enviando requisição para:', WEBHOOK_URL);
      console.log('📦 Tamanho do payload:', Buffer.byteLength(postData), 'bytes');
      
      const req = https.request(options, (res) => {
        console.log('\n📡 Resposta recebida:');
        console.log('- Status Code:', res.statusCode);
        console.log('- Status Message:', res.statusMessage);
        console.log('- Headers:', JSON.stringify(res.headers, null, 2));
        
        let responseData = '';
        
        res.on('data', (chunk) => {
          responseData += chunk;
        });
        
        res.on('end', () => {
          console.log('\n📤 Corpo da resposta:');
          try {
            const parsedResponse = JSON.parse(responseData);
            console.log(JSON.stringify(parsedResponse, null, 2));
          } catch (e) {
            console.log('Resposta não é JSON válido:');
            console.log(responseData);
          }
          
          if (res.statusCode >= 200 && res.statusCode < 300) {
            console.log('✅ Webhook processado com sucesso');
            resolve({ success: true, statusCode: res.statusCode, data: responseData });
          } else {
            console.log('❌ Erro no processamento do webhook');
            resolve({ success: false, statusCode: res.statusCode, data: responseData });
          }
        });
      });
      
      req.on('error', (error) => {
        console.error('❌ Erro na requisição:', error.message);
        reject(error);
      });
      
      req.on('timeout', () => {
        console.error('❌ Timeout na requisição');
        req.destroy();
        reject(new Error('Request timeout'));
      });
      
      // Definir timeout de 30 segundos
      req.setTimeout(30000);
      
      // Enviar os dados
      req.write(postData);
      req.end();
      
    } catch (error) {
      console.error('❌ Erro ao preparar requisição:', error.message);
      reject(error);
    }
  });
}

async function testWebhookEndpoint() {
  console.log('🚀 Testando endpoint real do webhook Hotmart');
  console.log('🌐 URL:', WEBHOOK_URL);
  console.log('🔑 Token:', WEBHOOK_TOKEN ? 'Configurado' : 'NÃO CONFIGURADO');
  console.log('=' .repeat(60));
  
  if (!WEBHOOK_TOKEN || WEBHOOK_TOKEN === 'your-webhook-token') {
    console.log('⚠️  AVISO: Token do webhook não configurado!');
    console.log('   Configure a variável HOTMART_WEBHOOK_TOKEN');
    console.log('   Exemplo: set HOTMART_WEBHOOK_TOKEN=seu-token-aqui');
    console.log('\n🔄 Continuando com token de teste...');
  }
  
  try {
    // Testar compra aprovada
    console.log('\n1️⃣ Testando PURCHASE_APPROVED...');
    const approvedResult = await sendWebhookRequest('test-webhook-approved.json', 'PURCHASE_APPROVED');
    
    // Aguardar um pouco entre as requisições
    console.log('\n⏳ Aguardando 2 segundos...');
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Testar compra cancelada
    console.log('\n2️⃣ Testando PURCHASE_CANCELED...');
    const canceledResult = await sendWebhookRequest('test-webhook-canceled.json', 'PURCHASE_CANCELED');
    
    // Resumo dos resultados
    console.log('\n📊 Resumo dos testes:');
    console.log('=' .repeat(40));
    console.log('PURCHASE_APPROVED:', approvedResult.success ? '✅ Sucesso' : '❌ Falha', `(${approvedResult.statusCode})`);
    console.log('PURCHASE_CANCELED:', canceledResult.success ? '✅ Sucesso' : '❌ Falha', `(${canceledResult.statusCode})`);
    
    if (approvedResult.success && canceledResult.success) {
      console.log('\n🎉 Todos os testes passaram!');
    } else {
      console.log('\n⚠️  Alguns testes falharam. Verifique os logs acima.');
    }
    
  } catch (error) {
    console.error('❌ Erro durante os testes:', error.message);
  }
}

// Verificar se os arquivos de teste existem
const requiredFiles = ['test-webhook-approved.json', 'test-webhook-canceled.json'];
const missingFiles = requiredFiles.filter(file => !fs.existsSync(path.join(__dirname, file)));

if (missingFiles.length > 0) {
  console.error('❌ Arquivos de teste não encontrados:', missingFiles.join(', '));
  console.log('💡 Execute primeiro os outros testes para gerar os arquivos JSON');
  process.exit(1);
}

// Executar os testes
testWebhookEndpoint();