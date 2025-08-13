// Script para testar e debugar o webhook do Hotmart
import https from 'https';
import { config } from 'dotenv';

// Carrega variáveis de ambiente
config();

// Configurações
const WEBHOOK_URL = 'https://clik-cilios2-0-three.vercel.app/api/hotmart/webhook';
const HOTMART_TOKEN = process.env.HOTMART_TOKEN || process.env.HOTMART_WEBHOOK_TOKEN || 'SEU_TOKEN_AQUI';

// Payload de teste do Hotmart
const payloadTeste = {
  "id": "test-debug-" + Date.now(),
  "event": "PURCHASE_APPROVED",
  "version": "v1",
  "creation_date": new Date().toISOString(),
  "data": {
    "product": {
      "id": 123456,
      "name": "ClikCilios - Teste Debug",
      "ucode": "test-product"
    },
    "buyer": {
      "email": "teste.debug@email.com",
      "name": "Usuario Debug",
      "document": "12345678901"
    },
    "purchase": {
      "transaction": "HP" + Date.now(),
      "status": "APPROVED",
      "approved_date": new Date().toISOString(),
      "price": {
        "value": 97.00,
        "currency_code": "BRL"
      }
    },
    "affiliates": [],
    "producer": {
      "name": "ClikCilios"
    }
  }
};

// Função para fazer requisição HTTP
function fazerRequisicao(url, options, data) {
  return new Promise((resolve, reject) => {
    const req = https.request(url, options, (res) => {
      let responseData = '';
      
      res.on('data', (chunk) => {
        responseData += chunk;
      });
      
      res.on('end', () => {
        resolve({
          statusCode: res.statusCode,
          headers: res.headers,
          body: responseData
        });
      });
    });
    
    req.on('error', (error) => {
      reject(error);
    });
    
    if (data) {
      req.write(data);
    }
    
    req.end();
  });
}

// Função principal de teste
async function testarWebhook() {
  console.log('🚀 Iniciando teste do webhook Hotmart...');
  console.log('📍 URL:', WEBHOOK_URL);
  console.log('🔑 Token:', HOTMART_TOKEN.substring(0, 10) + '...');
  console.log('');
  
  try {
    // Preparar dados da requisição
    const postData = JSON.stringify(payloadTeste);
    
    const options = {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData),
        'X-Hotmart-Hottok': HOTMART_TOKEN,
        'User-Agent': 'Hotmart-Webhook-Test/1.0'
      }
    };
    
    console.log('📤 Enviando requisição...');
    console.log('Headers:', JSON.stringify(options.headers, null, 2));
    console.log('Payload:', JSON.stringify(payloadTeste, null, 2));
    console.log('');
    
    // Fazer a requisição
    const response = await fazerRequisicao(WEBHOOK_URL, options, postData);
    
    // Analisar resposta
    console.log('📥 RESPOSTA RECEBIDA:');
    console.log('Status Code:', response.statusCode);
    console.log('Headers:', JSON.stringify(response.headers, null, 2));
    console.log('Body:', response.body);
    console.log('');
    
    // Interpretar resultado
    if (response.statusCode === 200) {
      console.log('✅ SUCESSO: Webhook funcionando corretamente!');
      try {
        const jsonResponse = JSON.parse(response.body);
        console.log('📋 Dados da resposta:', jsonResponse);
      } catch (e) {
        console.log('⚠️ Resposta não é JSON válido');
      }
    } else if (response.statusCode === 401) {
      console.log('❌ ERRO 401: Token Hotmart inválido');
      console.log('🔧 Solução: Verifique a variável HOTMART_HOTTOK no Vercel');
    } else if (response.statusCode === 500) {
      console.log('❌ ERRO 500: Erro interno do servidor');
      console.log('🔧 Possíveis causas:');
      console.log('   - Variáveis de ambiente faltando');
      console.log('   - Tabela webhook_events não existe');
      console.log('   - Problema com Supabase');
      console.log('   - Erro no código da função');
    } else {
      console.log(`❌ ERRO ${response.statusCode}: Erro inesperado`);
    }
    
  } catch (error) {
    console.log('💥 ERRO NA REQUISIÇÃO:');
    console.error(error);
    
    if (error.code === 'ENOTFOUND') {
      console.log('🔧 Solução: Verifique se a URL do Vercel está correta');
    } else if (error.code === 'ECONNREFUSED') {
      console.log('🔧 Solução: Servidor não está respondendo');
    }
  }
}

// Função para testar conectividade básica
async function testarConectividade() {
  console.log('🌐 Testando conectividade básica...');
  
  try {
    const options = {
      method: 'GET',
      headers: {
        'User-Agent': 'Webhook-Test/1.0'
      }
    };
    
    const response = await fazerRequisicao('https://clik-cilios2-0-three.vercel.app/', options);
    
    if (response.statusCode === 200) {
      console.log('✅ Site principal acessível');
    } else {
      console.log(`⚠️ Site retornou status ${response.statusCode}`);
    }
    
  } catch (error) {
    console.log('❌ Erro de conectividade:', error.message);
  }
  
  console.log('');
}

// Executar testes
async function executarTestes() {
  console.log('=' .repeat(60));
  console.log('🧪 TESTE DE DEBUG DO WEBHOOK HOTMART');
  console.log('=' .repeat(60));
  console.log('');
  
  // Verificar se o token foi configurado
  if (HOTMART_TOKEN === 'SEU_TOKEN_AQUI') {
    console.log('⚠️ ATENÇÃO: Configure o HOTMART_TOKEN antes de executar!');
    console.log('📝 Edite este arquivo e substitua "SEU_TOKEN_AQUI" pelo token real');
    console.log('');
    return;
  }
  
  await testarConectividade();
  await testarWebhook();
  
  console.log('');
  console.log('🔍 PRÓXIMOS PASSOS:');
  console.log('1. Se erro 500: Verifique variáveis de ambiente no Vercel');
  console.log('2. Se erro 401: Verifique o token HOTMART_HOTTOK');
  console.log('3. Se sucesso: Teste no painel do Hotmart');
  console.log('');
  console.log('📚 Consulte: DIAGNOSTICO_ERRO_WEBHOOK.md');
}

// Executar
executarTestes().catch(console.error);

// Instruções de uso
console.log('');
console.log('💡 COMO USAR:');
console.log('1. Substitua SEU_TOKEN_AQUI pelo token real do Hotmart');
console.log('2. Execute: node testar-webhook-hotmart-debug.js');
console.log('3. Analise os resultados');
console.log('');