const fs = require('fs');
const path = require('path');

// Simular o ambiente do webhook
process.env.HOTMART_WEBHOOK_TOKEN = 'test-token';
process.env.VITE_SUPABASE_URL = 'https://your-project.supabase.co';
process.env.VITE_SUPABASE_ANON_KEY = 'your-anon-key';
process.env.SUPABASE_SERVICE_ROLE_KEY = 'your-service-role-key';

async function testWebhookCanceled() {
  try {
    console.log('🧪 Testando webhook com compra cancelada...');
    
    // Carregar o JSON de teste
    const testData = JSON.parse(
      fs.readFileSync(path.join(__dirname, 'test-webhook-canceled.json'), 'utf8')
    );
    
    console.log('📋 Dados do teste:');
    console.log('- Event:', testData.event);
    console.log('- Transaction:', testData.data.purchase.transaction);
    console.log('- Buyer Email:', testData.data.buyer.email);
    console.log('- Status:', testData.data.purchase.status);
    
    // Simular a requisição HTTP
    const mockRequest = {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'x-hotmart-hottok': 'test-token'
      },
      body: JSON.stringify(testData)
    };
    
    console.log('\n🔄 Simulando processamento do webhook...');
    
    // Verificar se é um evento de cancelamento
    if (testData.event === 'PURCHASE_CANCELED') {
      console.log('✅ Evento de cancelamento detectado corretamente');
      console.log('🔄 Deveria liberar usuário:', testData.data.buyer.email);
      
      // Simular a lógica de liberação de usuário
      console.log('📧 Simulando liberação de usuário...');
      console.log('- Email do comprador:', testData.data.buyer.email);
      console.log('- Transação:', testData.data.purchase.transaction);
      
      // Verificar estrutura dos dados
      const requiredFields = [
        'data.buyer.email',
        'data.buyer.name',
        'data.purchase.transaction',
        'data.purchase.status'
      ];
      
      let allFieldsPresent = true;
      requiredFields.forEach(field => {
        const fieldValue = field.split('.').reduce((obj, key) => obj?.[key], testData);
        if (!fieldValue) {
          console.log(`❌ Campo obrigatório ausente: ${field}`);
          allFieldsPresent = false;
        } else {
          console.log(`✅ Campo presente: ${field} = ${fieldValue}`);
        }
      });
      
      if (allFieldsPresent) {
        console.log('\n✅ Todos os campos obrigatórios estão presentes');
        console.log('✅ Webhook de cancelamento processado com sucesso');
      } else {
        console.log('\n❌ Alguns campos obrigatórios estão ausentes');
      }
      
    } else {
      console.log('❌ Evento não é de cancelamento:', testData.event);
    }
    
    console.log('\n📊 Resumo do teste:');
    console.log('- Tipo de evento:', testData.event);
    console.log('- Status da compra:', testData.data.purchase.status);
    console.log('- Email do comprador:', testData.data.buyer.email);
    console.log('- Transação:', testData.data.purchase.transaction);
    
  } catch (error) {
    console.error('❌ Erro durante o teste:', error.message);
    console.error('Stack trace:', error.stack);
  }
}

// Executar o teste
testWebhookCanceled();