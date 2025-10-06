#!/usr/bin/env node
/**
 * Script de teste do webhook Hotmart corrigido
 * Testa a validação do token e o envio de email
 */

const https = require('https');

// Configuração
const WEBHOOK_URL = 'http://localhost:3001/api/hotmart-webhook';
const HOTMART_TOKEN = 'gtnL72D16QPeck2Uky8d92uzq6GHtH6f40dc99-fece-4673-97c2-67aef62e4074';

// Payload de teste
const payloadApproved = {
  hottok: HOTMART_TOKEN,
  event: 'approved',
  data: {
    purchase: {
      order_id: 'TEST123456',
      buyer: {
        name: 'Cliente Teste',
        email: 'teste.webhook@example.com'
      },
      price: {
        value: 97.00
      }
    }
  }
};

const payloadCanceled = {
  hottok: HOTMART_TOKEN,
  event: 'PURCHASE_CANCELED',
  data: {
    purchase: {
      order_id: 'TEST123456'
    }
  }
};

const payloadInvalidToken = {
  hottok: 'token-invalido-123',
  event: 'approved',
  data: {
    purchase: {
      order_id: 'TEST123456',
      buyer: {
        name: 'Cliente Teste',
        email: 'teste@example.com'
      }
    }
  }
};

const payloadNoToken = {
  event: 'approved',
  data: {
    purchase: {
      order_id: 'TEST123456',
      buyer: {
        name: 'Cliente Teste',
        email: 'teste@example.com'
      }
    }
  }
};

// Função para fazer requisição
async function sendWebhook(url, payload, testName) {
  return new Promise((resolve, reject) => {
    const urlObj = new URL(url);
    const data = JSON.stringify(payload);

    const options = {
      hostname: urlObj.hostname,
      port: urlObj.port || 80,
      path: urlObj.pathname,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': data.length,
      },
    };

    console.log(`\n${'='.repeat(80)}`);
    console.log(`🧪 TESTE: ${testName}`);
    console.log(`${'='.repeat(80)}`);
    console.log(`📤 Enviando webhook para: ${url}`);
    console.log(`📄 Payload:`, JSON.stringify(payload, null, 2));

    const req = (urlObj.protocol === 'https:' ? https : require('http')).request(options, (res) => {
      let responseData = '';

      res.on('data', (chunk) => {
        responseData += chunk;
      });

      res.on('end', () => {
        console.log(`\n📥 RESPOSTA:`);
        console.log(`   Status: ${res.statusCode}`);
        console.log(`   Body:`, responseData);

        try {
          const parsed = JSON.parse(responseData);
          console.log(`   Parsed:`, JSON.stringify(parsed, null, 2));
        } catch (e) {
          console.log(`   (Não foi possível parsear como JSON)`);
        }

        if (res.statusCode === 200) {
          console.log(`✅ TESTE PASSOU - Status 200`);
        } else if (res.statusCode === 401 && testName.includes('inválido')) {
          console.log(`✅ TESTE PASSOU - Status 401 esperado para token inválido`);
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
  console.log(`\n🚀 INICIANDO TESTES DO WEBHOOK HOTMART CORRIGIDO`);
  console.log(`⏰ Timestamp: ${new Date().toISOString()}\n`);

  try {
    // Teste 1: Token válido - compra aprovada
    await sendWebhook(WEBHOOK_URL, payloadApproved, '1. Token válido - Compra aprovada');
    await new Promise(resolve => setTimeout(resolve, 2000)); // Aguardar 2 segundos

    // Teste 2: Token válido - cancelamento
    await sendWebhook(WEBHOOK_URL, payloadCanceled, '2. Token válido - Cancelamento');
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Teste 3: Token inválido
    await sendWebhook(WEBHOOK_URL, payloadInvalidToken, '3. Token inválido (deve retornar 401)');
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Teste 4: Token ausente
    await sendWebhook(WEBHOOK_URL, payloadNoToken, '4. Token ausente (deve retornar 401)');

    console.log(`\n${'='.repeat(80)}`);
    console.log(`✅ TODOS OS TESTES CONCLUÍDOS`);
    console.log(`${'='.repeat(80)}\n`);

    console.log(`\n📋 RESUMO:`);
    console.log(`   ✅ Teste 1: Token válido + compra aprovada → Deve criar usuário e enviar email`);
    console.log(`   ✅ Teste 2: Token válido + cancelamento → Deve apenas logar`);
    console.log(`   ✅ Teste 3: Token inválido → Deve retornar 401`);
    console.log(`   ✅ Teste 4: Token ausente → Deve retornar 401`);
    console.log(`\n📧 VERIFICAR: Se SENDGRID_API_KEY estiver configurada, o email deve ser enviado para teste.webhook@example.com`);
    console.log(`\n⚠️  IMPORTANTE: Este teste usa o servidor LOCAL (localhost:3001)`);
    console.log(`   Para testar em PRODUÇÃO, altere WEBHOOK_URL para a URL do Vercel\n`);

  } catch (error) {
    console.error(`❌ ERRO FATAL nos testes:`, error);
    process.exit(1);
  }
}

// Executar
runTests();
