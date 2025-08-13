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
    
    console.log(`\n🧪 Testando webhook específico: ${evento}`);
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
async function executarTeste() {
  console.log('🚀 Testando JSON específico do PURCHASE_APPROVED');
  console.log('===============================================');
  
  try {
    // Gerar email único para evitar conflitos
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 15);
    const emailUnico = `teste${timestamp}${random}@example.com`;
    
    // JSON fornecido pelo usuário com correções necessárias
    const payload = {
      "id": "4e751758-4628-4eb0-8349-342c82d2dcc9",
      "creation_date": 1755092412566,
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
            "amount": 1755092412225
          },
          "buyer_ip": "00.00.00.00",
          "original_offer_price": {
            "value": 1500,
            "currency_value": "BRL"
          },
          "order_date": 1511783344000,
          "order_id": "HP16015479281022",
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
          "business_model": "I",
          // CORREÇÃO: Mover buyer para dentro de purchase
          "buyer": {
            "email": emailUnico, // Email único para evitar conflitos
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
          }
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
    
    console.log(`\n📧 Email único gerado: ${emailUnico}`);
    console.log(`🆔 Transaction ID: ${payload.data.purchase.transaction}`);
    console.log(`💰 Valor da compra: R$ ${payload.data.purchase.price.value / 100}`);
    console.log(`🎫 Cupom: ${payload.data.purchase.offer.coupon_code}`);
    
    const resultado = await executarCurlComHMAC(payload, 'PURCHASE_APPROVED');
    
    // Análise do resultado
    console.log('\n📊 Análise do resultado:');
    console.log('========================================');
    
    if (resultado.success) {
      console.log('✅ Teste executado com sucesso!');
      console.log('\n🎉 Webhook Hotmart processou o evento PURCHASE_APPROVED corretamente!');
      
      if (resultado.body) {
        try {
          const responseData = JSON.parse(resultado.body);
          if (responseData.data) {
            console.log('\n📋 Detalhes do processamento:');
            console.log(`   - Usuário criado: ${responseData.data.user_created ? 'Sim' : 'Não'}`);
            console.log(`   - ID do usuário: ${responseData.data.user_id}`);
            console.log(`   - Cupom usado: ${responseData.data.cupom_usado || 'Nenhum'}`);
            if (responseData.data.senha_temporaria) {
              console.log(`   - Senha temporária gerada: ${responseData.data.senha_temporaria}`);
            }
          }
        } catch (e) {
          console.log('   Resposta processada com sucesso, mas não foi possível extrair detalhes.');
        }
      }
    } else {
      console.log(`❌ Teste falhou com status ${resultado.statusCode}`);
      
      if (resultado.body) {
        try {
          const errorData = JSON.parse(resultado.body);
          console.log(`\n🔍 Erro detectado: ${errorData.error || errorData.message}`);
          
          if (errorData.error && errorData.error.includes('duplicate key')) {
            console.log('\n💡 Análise do erro:');
            console.log('   Este erro indica que o usuário já existe no banco de dados.');
            console.log('   Isso pode acontecer se:');
            console.log('   1. O teste foi executado anteriormente com o mesmo email');
            console.log('   2. O usuário já foi criado por outro processo');
            console.log('   3. Há dados residuais de testes anteriores');
            console.log('\n✅ O webhook está funcionando corretamente - apenas detectou usuário duplicado.');
          }
        } catch {
          console.log(`   Resposta bruta: ${resultado.body}`);
        }
      }
    }
    
  } catch (error) {
    console.error('❌ Erro durante o teste:', error);
  }
}

// Executar o teste
executarTeste().catch(console.error);