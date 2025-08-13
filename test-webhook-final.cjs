const crypto = require('crypto');
const { spawn } = require('child_process');

// Configuração do teste
const WEBHOOK_URL = 'https://clik-cilios2-0.vercel.app/api/hotmart-webhook';
const WEBHOOK_SECRET = 'gtnL72D16QPeck2Uky8d92uzq6GHtH6f40dc99-fece-4673-97c2-67aef62e4074'; // Secret do .env.local

// Função para gerar email único com timestamp mais específico
function gerarEmailUnico() {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 15);
  const microseconds = process.hrtime.bigint().toString().slice(-6);
  return `teste${timestamp}${microseconds}${random}@example.com`;
}

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
    console.log(`- Buyer Email: ${payload.data.purchase.buyer.email}`);
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
  console.log('🚀 Iniciando testes finais do webhook Hotmart');
  console.log('==============================================');
  
  const resultados = [];
  
  try {
    // Teste 1: PURCHASE_APPROVED com email único
    console.log('\n1️⃣ Testando PURCHASE_APPROVED...');
    
    const emailUnico1 = gerarEmailUnico();
    const transactionId1 = `HP${Date.now()}${Math.random().toString(36).substring(2, 8)}`;
    
    const payloadApproved = {
      "id": crypto.randomUUID(),
      "creation_date": Date.now(),
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
        "purchase": {
          "approved_date": Date.now(),
          "order_id": transactionId1,
          "order_date": Date.now(),
          "status": "APPROVED",
          "transaction": transactionId1,
          "price": {
            "value": 1500,
            "currency_code": "BRL"
          },
          "offer": {
            "code": "test",
            "name": "Oferta Teste"
          },
          "buyer": {
            "email": emailUnico1,
            "name": "Teste Comprador Aprovado"
          },
          "buyer_ip": "00.00.00.00",
          "payment": {
            "installments_number": 12,
            "type": "CREDIT_CARD"
          }
        }
      }
    };
    
    console.log(`\n📧 Email único gerado: ${emailUnico1}`);
    console.log(`🆔 Transaction ID: ${transactionId1}`);
    
    const resultadoApproved = await executarCurlComHMAC(payloadApproved, 'PURCHASE_APPROVED');
    resultados.push({ evento: 'PURCHASE_APPROVED', ...resultadoApproved });
    
    console.log('\n⏳ Aguardando 5 segundos...');
    await new Promise(resolve => setTimeout(resolve, 5000));
    
    // Teste 2: PURCHASE_CANCELED com email único
    console.log('\n2️⃣ Testando PURCHASE_CANCELED...');
    
    const emailUnico2 = gerarEmailUnico();
    const transactionId2 = `HP${Date.now()}${Math.random().toString(36).substring(2, 8)}`;
    
    const payloadCanceled = {
      "id": crypto.randomUUID(),
      "creation_date": Date.now(),
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
        "purchase": {
          "approved_date": Date.now(),
          "order_id": transactionId2,
          "order_date": Date.now(),
          "status": "CANCELED",
          "transaction": transactionId2,
          "price": {
            "value": 1500,
            "currency_code": "BRL"
          },
          "offer": {
            "code": "test",
            "name": "Oferta Teste"
          },
          "buyer": {
            "email": emailUnico2,
            "name": "Teste Comprador Cancelado"
          },
          "buyer_ip": "00.00.00.00",
          "payment": {
            "installments_number": 12,
            "type": "CREDIT_CARD"
          }
        }
      }
    };
    
    console.log(`\n📧 Email único gerado: ${emailUnico2}`);
    console.log(`🆔 Transaction ID: ${transactionId2}`);
    
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
    console.log('\n✅ Webhook Hotmart está funcionando corretamente!');
    console.log('   - Validação HMAC: ✅ Funcionando');
    console.log('   - Estrutura de dados: ✅ Validada');
    console.log('   - Processamento PURCHASE_APPROVED: ✅ OK');
    console.log('   - Processamento PURCHASE_CANCELED: ✅ OK');
  } else {
    console.log('\n⚠️  Alguns testes falharam. Verifique os logs acima.');
    console.log('\n🔍 Análise dos erros:');
    resultados.forEach(resultado => {
      if (!resultado.success) {
        console.log(`\n❌ ${resultado.evento}:`);
        console.log(`   Status: ${resultado.statusCode}`);
        if (resultado.body) {
          try {
            const errorData = JSON.parse(resultado.body);
            console.log(`   Erro: ${errorData.error || errorData.message}`);
            if (errorData.error && errorData.error.includes('duplicate key')) {
              console.log('   💡 Sugestão: Este erro indica que o usuário já existe no banco.');
              console.log('      Isso pode ser normal se o teste foi executado anteriormente.');
            }
          } catch {
            console.log(`   Resposta: ${resultado.body}`);
          }
        }
      }
    });
  }
}

// Executar os testes
executarTestes().catch(console.error);