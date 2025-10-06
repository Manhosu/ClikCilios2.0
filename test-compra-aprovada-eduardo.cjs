#!/usr/bin/env node
/**
 * ========================================
 * TESTE DE COMPRA APROVADA - EDUARDO GELISTA
 * ========================================
 *
 * Este script simula uma compra aprovada da Hotmart
 * para criar automaticamente um novo login e enviar
 * as credenciais para eduardogelista@gmail.com
 */

const https = require('https');
const http = require('http');

// Configuração
const WEBHOOK_URL_PROD = 'https://clik-cilios2-0.vercel.app/api/hotmart-webhook';
const WEBHOOK_URL_LOCAL = 'http://localhost:3001/api/hotmart-webhook';
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

// Função para fazer requisição HTTP/HTTPS
function makeRequest(url, payload, token) {
  return new Promise((resolve, reject) => {
    const urlObj = new URL(url);
    const isHttps = urlObj.protocol === 'https:';
    const client = isHttps ? https : http;
    
    const postData = JSON.stringify(payload);
    
    const options = {
      hostname: urlObj.hostname,
      port: urlObj.port || (isHttps ? 443 : 80),
      path: urlObj.pathname,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData),
        'X-Hotmart-Hottok': token,
        'User-Agent': 'Hotmart-Webhook-Test/1.0'
      }
    };

    const req = client.request(options, (res) => {
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
async function testarCompraAprovada() {
  console.log('🚀 INICIANDO TESTE DE COMPRA APROVADA');
  console.log('=' .repeat(50));
  console.log('📧 Email do comprador:', payloadCompraAprovada.data.buyer.email);
  console.log('👤 Nome do comprador:', payloadCompraAprovada.data.buyer.name);
  console.log('🆔 ID da transação:', payloadCompraAprovada.data.purchase.transaction);
  console.log('💰 Valor da compra: R$', payloadCompraAprovada.data.purchase.price.value);
  console.log('');

  // Perguntar qual URL usar
  const readline = require('readline');
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });

  const perguntarUrl = () => {
    return new Promise((resolve) => {
      console.log('🌐 Escolha o ambiente para teste:');
      console.log('1. Produção (Vercel) - Recomendado');
      console.log('2. Local (localhost:3001)');
      console.log('');
      rl.question('Digite 1 ou 2: ', (resposta) => {
        const url = resposta.trim() === '2' ? WEBHOOK_URL_LOCAL : WEBHOOK_URL_PROD;
        resolve(url);
      });
    });
  };

  try {
    const webhookUrl = await perguntarUrl();
    rl.close();
    
    console.log('🎯 URL selecionada:', webhookUrl);
    console.log('');
    console.log('📤 Enviando payload de compra aprovada...');
    
    const response = await makeRequest(webhookUrl, payloadCompraAprovada, HOTMART_TOKEN);
    
    console.log('');
    console.log('📥 RESPOSTA DO WEBHOOK:');
    console.log('=' .repeat(30));
    console.log('🔢 Status Code:', response.statusCode);
    console.log('📋 Headers:', JSON.stringify(response.headers, null, 2));
    console.log('📄 Body:', response.body);
    
    if (response.statusCode === 200) {
      console.log('');
      console.log('✅ SUCESSO! Compra processada com sucesso!');
      console.log('');
      console.log('📧 PRÓXIMOS PASSOS:');
      console.log('1. Verifique o email eduardogelista@gmail.com');
      console.log('2. Procure por um email do CíliosClick com as credenciais');
      console.log('3. Use as credenciais para fazer login na plataforma');
      console.log('');
      console.log('🔗 URL de Login: https://clik-cilios2-0.vercel.app/login');
    } else {
      console.log('');
      console.log('❌ ERRO! Falha ao processar compra');
      console.log('Verifique os logs acima para mais detalhes');
    }
    
  } catch (error) {
    console.error('');
    console.error('💥 ERRO NA REQUISIÇÃO:');
    console.error(error.message);
    
    if (error.code === 'ECONNREFUSED') {
      console.error('');
      console.error('🔧 DICA: Se você escolheu localhost, certifique-se de que:');
      console.error('1. O servidor local está rodando na porta 3001');
      console.error('2. Execute: npm run dev ou yarn dev');
      console.error('');
      console.error('💡 Recomendação: Use a opção 1 (Produção) para testar');
    }
  }
}

// Executar teste
if (require.main === module) {
  testarCompraAprovada().catch(console.error);
}

module.exports = { testarCompraAprovada, payloadCompraAprovada };