const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

// Simular variáveis de ambiente
process.env.HOTMART_WEBHOOK_TOKEN = 'test-token-123';
process.env.VITE_SUPABASE_URL = 'https://test-project.supabase.co';
process.env.VITE_SUPABASE_ANON_KEY = 'test-anon-key';
process.env.SUPABASE_SERVICE_ROLE_KEY = 'test-service-role-key';

// Mock do Supabase
const mockSupabase = {
  from: (table) => ({
    insert: (data) => {
      console.log(`📝 Mock: Inserindo em ${table}:`, JSON.stringify(data, null, 2));
      return { data: [{ id: 'mock-id' }], error: null };
    },
    select: (fields) => ({
      eq: (field, value) => ({
        single: () => {
          console.log(`🔍 Mock: Buscando em ${table} onde ${field} = ${value}`);
          if (table === 'users' && field === 'email') {
            return { data: { id: 'mock-user-id', email: value }, error: null };
          }
          return { data: null, error: null };
        }
      })
    })
  })
};

// Mock do hotmartUsersService
const mockHotmartUsersService = {
  releaseUser: async (email, transaction) => {
    console.log(`🔓 Mock: Liberando usuário ${email} para transação ${transaction}`);
    return {
      success: true,
      message: 'Usuário liberado com sucesso',
      user_id: 'mock-user-id'
    };
  }
};

async function testWebhookComplete() {
  try {
    console.log('🧪 Testando webhook completo com compra cancelada...');
    
    // Carregar o JSON de teste
    const testData = JSON.parse(
      fs.readFileSync(path.join(__dirname, 'test-webhook-canceled.json'), 'utf8')
    );
    
    console.log('\n📋 Dados do webhook:');
    console.log('- ID:', testData.id);
    console.log('- Event:', testData.event);
    console.log('- Version:', testData.version);
    console.log('- Creation Date:', new Date(testData.creation_date));
    
    // Simular validação do token
    const receivedToken = 'test-token-123';
    const expectedToken = process.env.HOTMART_WEBHOOK_TOKEN;
    
    console.log('\n🔐 Validação do token:');
    if (receivedToken === expectedToken) {
      console.log('✅ Token válido');
    } else {
      console.log('❌ Token inválido');
      return;
    }
    
    // Simular salvamento do evento bruto
    console.log('\n💾 Salvando evento bruto no banco...');
    const webhookEvent = {
      id: testData.id,
      event_type: testData.event,
      raw_payload: testData,
      processed: false,
      created_at: new Date().toISOString()
    };
    
    const insertResult = mockSupabase.from('webhook_events').insert(webhookEvent);
    console.log('✅ Evento salvo com sucesso');
    
    // Processar o evento
    console.log('\n🔄 Processando evento...');
    
    if (testData.event === 'PURCHASE_CANCELED') {
      console.log('📧 Processando cancelamento de compra...');
      
      const buyerEmail = testData.data.buyer.email;
      const transaction = testData.data.purchase.transaction;
      const buyerName = testData.data.buyer.name;
      
      console.log('- Email do comprador:', buyerEmail);
      console.log('- Nome do comprador:', buyerName);
      console.log('- Transação:', transaction);
      
      // Simular liberação do usuário
      const releaseResult = await mockHotmartUsersService.releaseUser(buyerEmail, transaction);
      
      if (releaseResult.success) {
        console.log('✅ Usuário liberado com sucesso');
        console.log('- User ID:', releaseResult.user_id);
        console.log('- Mensagem:', releaseResult.message);
        
        // Simular resposta de sucesso
        const response = {
          success: true,
          message: 'Webhook processado com sucesso',
          event_type: testData.event,
          user_id: releaseResult.user_id,
          transaction: transaction
        };
        
        console.log('\n📤 Resposta do webhook:');
        console.log(JSON.stringify(response, null, 2));
        
      } else {
        console.log('❌ Erro ao liberar usuário:', releaseResult.message);
      }
      
    } else {
      console.log('ℹ️ Evento não processado:', testData.event);
    }
    
    // Verificar integridade dos dados
    console.log('\n🔍 Verificação de integridade dos dados:');
    
    const requiredFields = {
      'ID do evento': testData.id,
      'Tipo de evento': testData.event,
      'Email do comprador': testData.data?.buyer?.email,
      'Nome do comprador': testData.data?.buyer?.name,
      'Transação': testData.data?.purchase?.transaction,
      'Status da compra': testData.data?.purchase?.status,
      'Data de criação': testData.creation_date
    };
    
    let allValid = true;
    Object.entries(requiredFields).forEach(([field, value]) => {
      if (value) {
        console.log(`✅ ${field}: ${value}`);
      } else {
        console.log(`❌ ${field}: AUSENTE`);
        allValid = false;
      }
    });
    
    console.log('\n📊 Resultado final:');
    if (allValid) {
      console.log('✅ Todos os dados estão presentes e válidos');
      console.log('✅ Webhook de cancelamento processado com sucesso');
    } else {
      console.log('❌ Alguns dados obrigatórios estão ausentes');
    }
    
  } catch (error) {
    console.error('❌ Erro durante o teste completo:', error.message);
    console.error('Stack trace:', error.stack);
  }
}

// Executar o teste
testWebhookComplete();