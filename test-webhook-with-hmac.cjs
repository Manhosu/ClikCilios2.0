const crypto = require('crypto');
const { spawn } = require('child_process');

// Configuração do teste
const WEBHOOK_URL = 'https://clik-cilios2-0.vercel.app/api/hotmart-webhook';
const WEBHOOK_SECRET = 'gtnL72D16QPeck2Uky8d92uzq6GHtH6f40dc99-fece-4673-97c2-67aef62e4074'; // Secret do .env.local

// Função para gerar assinatura HMAC
function gerarAssinaturaHMAC(body, secret) {
  const signature = crypto
    .createHmac('sha256', secret)
    .update(body)
    .digest('hex');
  return `sha256=${signature}`;
}

// Função para executar curl com assinatura HMAC
function executarCurlComHMAC(payload, evento) {
  return new Promise((resolve, reject) => {
    const body = JSON.stringify(payload);
    const signature = gerarAssinaturaHMAC(body, WEBHOOK_SECRET);
    
    console.log(`\n🧪 Testando webhook real com HMAC: ${evento}`);
    console.log('==================================================');
    console.log('📋 Dados do webhook:');
    console.log(`- Event: ${payload.event}`);
    console.log(`- Transaction: ${payload.data.purchase.transaction}`);
    console.log(`- Buyer Email: ${payload.data.buyer.email}`);
    console.log(`- Status: ${payload.data.purchase.status}`);
    console.log(`\n🔐 Assinatura HMAC: ${signature}`);
    
    const curlArgs = [
      '-X', 'POST',
      '-H', 'Content-Type: application/json',
      '-H', `X-Hotmart-Signature: ${signature}`,
      '-d', body,
      '-v',
      WEBHOOK_URL
    ];
    
    console.log(`\n🌐 Enviando requisição para: ${WEBHOOK_URL}`);
    console.log(`📦 Tamanho do payload: ${body.length} bytes`);
    
    const curl = spawn('curl', curlArgs);
    let stdout = '';
    let stderr = '';
    
    curl.stdout.on('data', (data) => {
      stdout += data.toString();
    });
    
    curl.stderr.on('data', (data) => {
      stderr += data.toString();
    });
    
    curl.on('close', (code) => {
      console.log('\n📡 Resposta recebida:');
      
      // Extrair informações do stderr (headers e status)
      const statusMatch = stderr.match(/< HTTP\/\d\.\d (\d+) (.+)/);;
      const statusCode = statusMatch ? statusMatch[1] : 'Unknown';
      const statusMessage = statusMatch ? statusMatch[2] : 'Unknown';
      
      console.log(`- Status Code: ${statusCode}`);
      console.log(`- Status Message: ${statusMessage}`);
      
      // Extrair headers
      const headerLines = stderr.split('\n').filter(line => line.startsWith('< '));
      const headers = {};
      headerLines.forEach(line => {
        const match = line.match(/< ([^:]+): (.+)/);
        if (match) {
          headers[match[1].toLowerCase()] = match[2].trim();
        }
      });
      
      if (Object.keys(headers).length > 0) {
        console.log('- Headers:', JSON.stringify(headers, null, 2));
      }
      
      // Mostrar corpo da resposta
      if (stdout.trim()) {
        console.log('\n📤 Corpo da resposta:');
        try {
          const jsonResponse = JSON.parse(stdout);
          console.log(JSON.stringify(jsonResponse, null, 2));
        } catch {
          console.log(stdout);
        }
      }
      
      // Verificar se foi bem-sucedido
      const success = statusCode.startsWith('2');
      if (success) {
        console.log('✅ Webhook processado com sucesso');
      } else {
        console.log('❌ Erro no processamento do webhook');
      }
      
      resolve({ success, statusCode, statusMessage, body: stdout, headers });
    });
    
    curl.on('error', (error) => {
      console.error('❌ Erro ao executar curl:', error);
      reject(error);
    });
  });
}

// Função principal de teste
async function executarTestes() {
  console.log('🚀 Iniciando testes do webhook Hotmart com HMAC');
  console.log('================================================');
  
  const resultados = [];
  
  try {
    // Teste 1: PURCHASE_APPROVED
    console.log('\n1️⃣ Testando PURCHASE_APPROVED...');
    
    const payloadApproved = {
      "id": "b3099f0c-4d8a-4de3-8fec-47a95bc8ee36",
      "creation_date": 1755092412685,
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
          "document": "69526128664",
          "document_type": "CPF"
        },
        "purchase": {
          "approved_date": 1511783346000,
          "order_id": "HP02316330308193",
          "order_date": 1511783344000,
          "status": "APPROVED",
          "transaction": "HP02316330308193",
          "price": {
            "value": 1500,
            "currency_code": "BRL"
          },
          "offer": {
            "code": "test",
            "name": "Oferta Teste"
          },
          "buyer": {
            "email": "testeComprador271101postman15@example.com",
            "name": "Teste Comprador"
          },
          "buyer_ip": "00.00.00.00",
          "payment": {
            "installments_number": 12,
            "type": "CREDIT_CARD"
          }
        }
      }
    };
    
    const resultadoApproved = await executarCurlComHMAC(payloadApproved, 'PURCHASE_APPROVED');
    resultados.push({ evento: 'PURCHASE_APPROVED', ...resultadoApproved });
    
    console.log('\n⏳ Aguardando 2 segundos...');
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Teste 2: PURCHASE_CANCELED
    console.log('\n2️⃣ Testando PURCHASE_CANCELED...');
    
    const payloadCanceled = {
      "id": "b3099f0c-4d8a-4de3-8fec-47a95bc8ee36",
      "creation_date": 1755092412685,
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
          "is_physical_product": false
        },
        "buyer": {
          "email": "testeComprador271101postman15@example.com",
          "name": "Teste Comprador",
          "first_name": "Teste",
          "last_name": "Comprador",
          "checkout_phone_code": "999999999",
          "checkout_phone": "99999999900",
          "document": "69526128664",
          "document_type": "CPF"
        },
        "purchase": {
          "approved_date": 1511783346000,
          "order_id": "HP16015479281022",
          "order_date": 1511783344000,
          "status": "CANCELED",
          "transaction": "HP16015479281022",
          "price": {
            "value": 1500,
            "currency_code": "BRL"
          },
          "offer": {
            "code": "test",
            "name": "Oferta Teste"
          },
          "buyer": {
            "email": "testeComprador271101postman15@example.com",
            "name": "Teste Comprador"
          },
          "buyer_ip": "00.00.00.00",
          "payment": {
            "installments_number": 12,
            "type": "CREDIT_CARD"
          }
        }
      }
    };
    
    const resultadoCanceled = await executarCurlComHMAC(payloadCanceled, 'PURCHASE_CANCELED');
    resultados.push({ evento: 'PURCHASE_CANCELED', ...resultadoCanceled });
    
  } catch (error) {
    console.error('❌ Erro durante os testes:', error);
  }
  
  // Resumo dos resultados
  console.log('\n📊 Resumo dos testes:');
  console.log('========================================');
  
  let todosPassaram = true;
  resultados.forEach(resultado => {
    const status = resultado.success ? '✅ Sucesso' : `❌ Falha (${resultado.statusCode})`;
    console.log(`${resultado.evento}: ${status}`);
    if (!resultado.success) todosPassaram = false;
  });
  
  if (todosPassaram) {
    console.log('\n🎉 Todos os testes passaram!');
  } else {
    console.log('\n⚠️  Alguns testes falharam. Verifique os logs acima.');
  }
}

// Executar os testes
executarTestes().catch(console.error);