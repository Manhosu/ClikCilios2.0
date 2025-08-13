const crypto = require('crypto');
const { execSync } = require('child_process');

// Configuração
const WEBHOOK_SECRET = 'gtnL72D16QPeck2Uky8d92uzq6GHtH6f40dc99-fece-4673-97c2-67aef62e4074';
const WEBHOOK_URL = 'https://clik-cilios2-0.vercel.app/api/hotmart-webhook';

// Função para gerar HMAC
function generateHMAC(payload, secret) {
  return crypto.createHmac('sha256', secret).update(payload).digest('hex');
}

// Função para testar diferentes formatos de HMAC
function testHMACFormats() {
  console.log('🔍 TESTE DE DEBUG - HMAC WEBHOOK HOTMART');
  console.log('=' .repeat(60));
  console.log('🎯 Objetivo: Identificar o problema com a validação HMAC');
  console.log('');
  
  // Payload simples para teste
  const testPayload = JSON.stringify({
    "id": "test-123",
    "event": "PURCHASE_APPROVED",
    "data": {
      "purchase": {
        "order_id": "TEST123",
        "order_date": Date.now(),
        "status": "APPROVED",
        "buyer": {
          "email": "test@example.com",
          "name": "Test User"
        },
        "offer": {
          "code": "TEST001",
          "name": "Produto Teste"
        },
        "price": {
          "value": 97.00,
          "currency_code": "BRL"
        }
      }
    }
  });
  
  console.log('📋 Payload de teste:');
  console.log(testPayload);
  console.log('');
  console.log(`📦 Tamanho: ${testPayload.length} bytes`);
  console.log('');
  
  // Gerar HMAC
  const hmacSignature = generateHMAC(testPayload, WEBHOOK_SECRET);
  console.log('🔐 Informações de HMAC:');
  console.log(`Secret usado: ${WEBHOOK_SECRET}`);
  console.log(`HMAC gerado: ${hmacSignature}`);
  console.log(`HMAC com prefixo: sha256=${hmacSignature}`);
  console.log('');
  
  // Teste 1: Com prefixo sha256=
  console.log('1️⃣ Testando com prefixo sha256=...');
  testWebhookCall(testPayload, `sha256=${hmacSignature}`, '1');
  
  // Teste 2: Sem prefixo
  console.log('\n2️⃣ Testando sem prefixo...');
  testWebhookCall(testPayload, hmacSignature, '2');
  
  // Teste 3: Verificar se o endpoint está funcionando (sem HMAC)
  console.log('\n3️⃣ Testando sem header HMAC...');
  testWebhookCallNoHMAC(testPayload, '3');
}

function testWebhookCall(payload, signature, testNumber) {
  const curlCommand = [
    'curl',
    '-X POST',
    `"${WEBHOOK_URL}"`,
    '-H "Content-Type: application/json"',
    `-H "X-Hotmart-Signature: ${signature}"`,
    '-H "User-Agent: Hotmart-Webhook/1.0"',
    '--max-time 15',
    '--connect-timeout 5',
    '-w "\nStatus: %{http_code}"',
    `--data '${payload}'`
  ].join(' ');
  
  try {
    const result = execSync(curlCommand, { 
      encoding: 'utf8', 
      stdio: ['pipe', 'pipe', 'pipe'],
      timeout: 20000
    });
    
    console.log(`📡 Resultado teste ${testNumber}:`);
    console.log(result);
    
    // Extrair status
    const statusMatch = result.match(/Status: (\d+)/);
    const status = statusMatch ? parseInt(statusMatch[1]) : 0;
    
    if (status === 200) {
      console.log(`✅ Teste ${testNumber}: Sucesso!`);
    } else {
      console.log(`❌ Teste ${testNumber}: Falha (${status})`);
    }
    
  } catch (error) {
    console.log(`❌ Teste ${testNumber}: Erro na requisição - ${error.message}`);
  }
}

function testWebhookCallNoHMAC(payload, testNumber) {
  const curlCommand = [
    'curl',
    '-X POST',
    `"${WEBHOOK_URL}"`,
    '-H "Content-Type: application/json"',
    '-H "User-Agent: Hotmart-Webhook/1.0"',
    '--max-time 15',
    '--connect-timeout 5',
    '-w "\nStatus: %{http_code}"',
    `--data '${payload}'`
  ].join(' ');
  
  try {
    const result = execSync(curlCommand, { 
      encoding: 'utf8', 
      stdio: ['pipe', 'pipe', 'pipe'],
      timeout: 20000
    });
    
    console.log(`📡 Resultado teste ${testNumber} (sem HMAC):`);
    console.log(result);
    
    // Extrair status
    const statusMatch = result.match(/Status: (\d+)/);
    const status = statusMatch ? parseInt(statusMatch[1]) : 0;
    
    if (status === 400 && result.includes('Assinatura HMAC')) {
      console.log(`✅ Teste ${testNumber}: Endpoint funcionando (rejeita sem HMAC como esperado)`);
    } else if (status === 200) {
      console.log(`⚠️  Teste ${testNumber}: Endpoint aceita requisições sem HMAC`);
    } else {
      console.log(`❌ Teste ${testNumber}: Comportamento inesperado (${status})`);
    }
    
  } catch (error) {
    console.log(`❌ Teste ${testNumber}: Erro na requisição - ${error.message}`);
  }
}

// Executar teste
testHMACFormats();

console.log('\n🔧 Próximos passos sugeridos:');
console.log('1. Verificar se o VITE_HOTMART_WEBHOOK_SECRET está configurado no Vercel');
console.log('2. Verificar se o valor do secret está correto');
console.log('3. Verificar se há diferenças na codificação do payload');
console.log('4. Considerar usar logs temporários no webhook para debug');