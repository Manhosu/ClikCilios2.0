require('dotenv').config({ path: '.env.local' });

/**
 * Script para testar o endpoint de API de email
 * 
 * Uso:
 * node testar-api-email.cjs
 */

async function testarAPIEmail() {
  console.log('🧪 Testando API de envio de email...');
  console.log('');

  // URL da API (ajustar conforme necessário)
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:5173';
  const apiUrl = `${baseUrl}/api/send-email`;
  
  console.log(`📡 URL da API: ${apiUrl}`);
  console.log('');

  // Teste 1: Email de credenciais
  console.log('📧 Teste 1: Email de credenciais');
  await testarCredentials(apiUrl);
  
  console.log('');
  
  // Teste 2: Email de boas-vindas
  console.log('📧 Teste 2: Email de boas-vindas');
  await testarWelcome(apiUrl);
  
  console.log('');
  
  // Teste 3: Email de parceira
  console.log('📧 Teste 3: Email de parceira');
  await testarParceira(apiUrl);
  
  console.log('');
  console.log('✅ Testes concluídos!');
}

async function testarCredentials(apiUrl) {
  const payload = {
    type: 'credentials',
    data: {
      email: 'eduardogelista@gmail.com', // Email do usuário
      userName: 'Maria Silva',
      password: 'TempPass123!',
      loginUrl: 'https://ciliosclick.com/login'
    }
  };
  
  console.log('📤 Enviando:', JSON.stringify(payload, null, 2));
  
  try {
    const fetch = (await import('node-fetch')).default;
    
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload)
    });
    
    const result = await response.json();
    
    console.log(`📊 Status: ${response.status}`);
    console.log('📄 Resposta:', JSON.stringify(result, null, 2));
    
    if (response.ok) {
      console.log('✅ Email de credenciais enviado com sucesso!');
    } else {
      console.log('❌ Falha ao enviar email de credenciais');
    }
  } catch (error) {
    console.error('❌ Erro:', error.message);
  }
}

async function testarWelcome(apiUrl) {
  const payload = {
    type: 'welcome',
    data: {
      userEmail: 'teste@exemplo.com', // Substitua por um email real
      userName: 'Ana Costa',
      loginUrl: 'https://ciliosclick.com/login',
      cupomCode: 'PARCEIRA10',
      parceiraName: 'Carla Beauty'
    }
  };
  
  console.log('📤 Enviando:', JSON.stringify(payload, null, 2));
  
  try {
    const fetch = (await import('node-fetch')).default;
    
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload)
    });
    
    const result = await response.json();
    
    console.log(`📊 Status: ${response.status}`);
    console.log('📄 Resposta:', JSON.stringify(result, null, 2));
    
    if (response.ok) {
      console.log('✅ Email de boas-vindas enviado com sucesso!');
    } else {
      console.log('❌ Falha ao enviar email de boas-vindas');
    }
  } catch (error) {
    console.error('❌ Erro:', error.message);
  }
}

async function testarParceira(apiUrl) {
  const payload = {
    type: 'parceira',
    data: {
      parceiraEmail: 'parceira@exemplo.com', // Substitua por um email real
      parceiraName: 'Carla Beauty',
      clientName: 'Ana Costa',
      clientEmail: 'ana@exemplo.com',
      cupomCode: 'PARCEIRA10',
      commissionAmount: 15.00,
      purchaseValue: 97.00
    }
  };
  
  console.log('📤 Enviando:', JSON.stringify(payload, null, 2));
  
  try {
    const fetch = (await import('node-fetch')).default;
    
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload)
    });
    
    const result = await response.json();
    
    console.log(`📊 Status: ${response.status}`);
    console.log('📄 Resposta:', JSON.stringify(result, null, 2));
    
    if (response.ok) {
      console.log('✅ Email de parceira enviado com sucesso!');
    } else {
      console.log('❌ Falha ao enviar email de parceira');
    }
  } catch (error) {
    console.error('❌ Erro:', error.message);
  }
}

// Função para testar validações
async function testarValidacoes(apiUrl) {
  console.log('🔍 Testando validações da API...');
  console.log('');
  
  const testCases = [
    {
      name: 'Método GET (deve falhar)',
      method: 'GET',
      body: null
    },
    {
      name: 'Payload vazio',
      method: 'POST',
      body: {}
    },
    {
      name: 'Tipo inválido',
      method: 'POST',
      body: {
        type: 'invalid',
        data: {}
      }
    },
    {
      name: 'Credentials sem dados obrigatórios',
      method: 'POST',
      body: {
        type: 'credentials',
        data: {
          email: 'test@example.com'
          // userName e password faltando
        }
      }
    }
  ];
  
  for (const testCase of testCases) {
    console.log(`🧪 Teste: ${testCase.name}`);
    
    try {
      const fetch = (await import('node-fetch')).default;
      
      const options = {
        method: testCase.method,
        headers: {
          'Content-Type': 'application/json',
        }
      };
      
      if (testCase.body) {
        options.body = JSON.stringify(testCase.body);
      }
      
      const response = await fetch(apiUrl, options);
      const result = await response.json();
      
      console.log(`   Status: ${response.status}`);
      console.log(`   Resposta: ${result.message || result.error}`);
      
      if (response.status >= 400) {
        console.log('   ✅ Validação funcionando corretamente');
      } else {
        console.log('   ⚠️ Validação pode estar falhando');
      }
    } catch (error) {
      console.error(`   ❌ Erro: ${error.message}`);
    }
    
    console.log('');
  }
}

// Executar testes
if (require.main === module) {
  testarAPIEmail().catch(console.error);
}

module.exports = {
  testarAPIEmail,
  testarValidacoes
};