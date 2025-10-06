#!/usr/bin/env node
/**
 * ========================================
 * EXECUÇÃO AUTOMÁTICA DO TESTE - EDUARDO
 * ========================================
 *
 * Este script executa automaticamente o teste
 * de compra aprovada para eduardogelista@gmail.com
 * usando o ambiente de produção (Vercel)
 */

const https = require('https');

// Configuração
const WEBHOOK_URL = 'https://clik-cilios2-0.vercel.app/api/hotmart-webhook';
const HOTMART_TOKEN = 'gtnL72D16QPeck2Uky8d92uzq6GHtH6f40dc99-fece-4673-97c2-67aef62e4074';

// Payload de teste para compra aprovada
const payloadCompraAprovada = {
  "id": `test-${Date.now()}-eduardo`,
  "creation_date": Date.now(),
  "event": "PURCHASE_APPROVED",
  "version": "2.0.0",
  "data": {
    "product": {
      "id": 123456,
      "ucode": "cilios-click-produto-test",
      "name": "CíliosClick - Acesso Completo",
      "warranty_date": "2025-12-31T23:59:59Z",
      "support_email": "suporte@ciliosclick.com",
      "has_co_production": false,
      "is_physical_product": false
    },
    "buyer": {
      "email": "eduardogelista@gmail.com",
      "name": "Eduardo Gelista",
      "first_name": "Eduardo",
      "last_name": "Gelista",
      "checkout_phone": "+5511999999999",
      "document": "12345678901"
    },
    "purchase": {
      "transaction": `TXN-${Date.now()}-EDUARDO`,
      "status": "APPROVED",
      "approved_date": Date.now(),
      "order_date": Date.now() - 60000, // 1 minuto atrás
      "price": {
        "value": 97.00,
        "currency_value": "BRL"
      }
    }
  }
};

// Função para fazer requisição HTTPS
function makeRequest(url, payload, token) {
  return new Promise((resolve, reject) => {
    const urlObj = new URL(url);
    const postData = JSON.stringify(payload);
    
    const options = {
      hostname: urlObj.hostname,
      port: 443,
      path: urlObj.pathname,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData),
        'X-Hotmart-Hottok': token,
        'User-Agent': 'Hotmart-Webhook-Test/1.0'
      }
    };

    const req = https.request(options, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        resolve({
          statusCode: res.statusCode,
          headers: res.headers,
          body: data
        });
      });
    });

    req.on('error', (error) => {
      reject(error);
    });

    req.write(postData);
    req.end();
  });
}

// Função principal
async function executarTeste() {
  console.log('🚀 EXECUTANDO TESTE DE COMPRA APROVADA AUTOMATICAMENTE');
  console.log('=' .repeat(60));
  console.log('📧 Email do comprador:', payloadCompraAprovada.data.buyer.email);
  console.log('👤 Nome do comprador:', payloadCompraAprovada.data.buyer.name);
  console.log('🆔 ID da transação:', payloadCompraAprovada.data.purchase.transaction);
  console.log('💰 Valor da compra: R$', payloadCompraAprovada.data.purchase.price.value);
  console.log('🌐 Ambiente: Produção (Vercel)');
  console.log('🎯 URL:', WEBHOOK_URL);
  console.log('');
  
  try {
    console.log('📤 Enviando payload de compra aprovada...');
    console.log('⏳ Aguarde...');
    
    const response = await makeRequest(WEBHOOK_URL, payloadCompraAprovada, HOTMART_TOKEN);
    
    console.log('');
    console.log('📥 RESPOSTA DO WEBHOOK:');
    console.log('=' .repeat(40));
    console.log('🔢 Status Code:', response.statusCode);
    
    let responseBody;
    try {
      responseBody = JSON.parse(response.body);
      console.log('📄 Resposta:', JSON.stringify(responseBody, null, 2));
    } catch (e) {
      console.log('📄 Resposta (texto):', response.body);
    }
    
    if (response.statusCode === 200) {
      console.log('');
      console.log('✅ SUCESSO! Compra processada com sucesso!');
      console.log('');
      console.log('📧 PRÓXIMOS PASSOS:');
      console.log('1. ✉️  Verifique o email eduardogelista@gmail.com');
      console.log('2. 🔍 Procure por um email do CíliosClick com as credenciais');
      console.log('3. 🔑 Use as credenciais para fazer login na plataforma');
      console.log('4. 🌐 Acesse: https://clik-cilios2-0.vercel.app/login');
      console.log('');
      console.log('💡 DICA: O email pode demorar alguns minutos para chegar.');
      console.log('    Verifique também a pasta de spam/lixo eletrônico.');
      
      if (responseBody && responseBody.data) {
        console.log('');
        console.log('📊 DETALHES DO PROCESSAMENTO:');
        console.log('   👤 Usuário criado:', responseBody.data.user_created ? 'Sim' : 'Não (já existia)');
        console.log('   📧 Email enviado:', responseBody.data.email_sent ? 'Sim' : 'Não');
        console.log('   🆔 User ID:', responseBody.data.user_id || 'N/A');
      }
    } else {
      console.log('');
      console.log('❌ ERRO! Falha ao processar compra');
      console.log('🔍 Status Code:', response.statusCode);
      console.log('📄 Resposta:', response.body);
    }
    
  } catch (error) {
    console.error('');
    console.error('💥 ERRO NA REQUISIÇÃO:');
    console.error('❌', error.message);
    
    if (error.code === 'ENOTFOUND') {
      console.error('');
      console.error('🌐 Erro de DNS - Verifique sua conexão com a internet');
    } else if (error.code === 'ECONNREFUSED') {
      console.error('');
      console.error('🔌 Conexão recusada - Verifique se o servidor está online');
    }
  }
}

// Executar teste
if (require.main === module) {
  executarTeste().catch(console.error);
}

module.exports = { executarTeste };