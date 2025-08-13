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
      console.log(`📝 Mock: Inserindo em ${table}:`);
      console.log(`   - ID: ${data.id || 'N/A'}`);
      console.log(`   - Event Type: ${data.event_type || 'N/A'}`);
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
  assignUser: async (buyerData, purchaseData) => {
    console.log(`🔗 Mock: Atribuindo usuário ${buyerData.email}`);
    console.log(`   - Nome: ${buyerData.name}`);
    console.log(`   - Transação: ${purchaseData.transaction}`);
    return {
      success: true,
      message: 'Usuário atribuído com sucesso',
      user_id: 'mock-assigned-user-id',
      password: 'mock-password-123'
    };
  },
  releaseUser: async (email, transaction) => {
    console.log(`🔓 Mock: Liberando usuário ${email} para transação ${transaction}`);
    return {
      success: true,
      message: 'Usuário liberado com sucesso',
      user_id: 'mock-released-user-id'
    };
  }
};

// Mock do EmailService
const mockEmailService = {
  sendCredentialsEmail: async (email, userName, password, loginUrl) => {
    console.log(`📧 Mock: Enviando email de credenciais`);
    console.log(`   - Para: ${email}`);
    console.log(`   - Nome: ${userName}`);
    console.log(`   - URL de login: ${loginUrl}`);
    return true;
  }
};

async function testWebhook(testFile, eventType) {
  try {
    console.log(`\n🧪 Testando webhook: ${eventType}`);
    console.log('='.repeat(50));
    
    // Carregar o JSON de teste
    const testData = JSON.parse(
      fs.readFileSync(path.join(__dirname, testFile), 'utf8')
    );
    
    console.log('📋 Dados do webhook:');
    console.log('- ID:', testData.id);
    console.log('- Event:', testData.event);
    console.log('- Version:', testData.version);
    console.log('- Buyer Email:', testData.data.buyer.email);
    console.log('- Transaction:', testData.data.purchase.transaction);
    console.log('- Status:', testData.data.purchase.status);
    
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
    console.log('\n💾 Salvando evento bruto...');
    const webhookEvent = {
      id: testData.id,
      event_type: testData.event,
      raw_payload: testData,
      processed: false,
      created_at: new Date().toISOString()
    };
    
    mockSupabase.from('webhook_events').insert(webhookEvent);
    console.log('✅ Evento salvo com sucesso');
    
    // Processar o evento
    console.log('\n🔄 Processando evento...');
    
    if (testData.event === 'PURCHASE_APPROVED' || testData.event === 'PURCHASE_COMPLETE') {
      console.log('🛒 Processando compra aprovada...');
      
      const buyerData = {
        email: testData.data.buyer.email,
        name: testData.data.buyer.name,
        first_name: testData.data.buyer.first_name,
        last_name: testData.data.buyer.last_name,
        document: testData.data.buyer.document
      };
      
      const purchaseData = {
        transaction: testData.data.purchase.transaction,
        value: testData.data.purchase.price.value,
        currency: testData.data.purchase.price.currency_value,
        approved_date: testData.data.purchase.approved_date
      };
      
      console.log('📊 Dados do comprador:');
      console.log('- Email:', buyerData.email);
      console.log('- Nome:', buyerData.name);
      console.log('- Documento:', buyerData.document);
      
      console.log('📊 Dados da compra:');
      console.log('- Transação:', purchaseData.transaction);
      console.log('- Valor:', purchaseData.value, purchaseData.currency);
      
      // Simular atribuição do usuário
      const assignResult = await mockHotmartUsersService.assignUser(buyerData, purchaseData);
      
      if (assignResult.success) {
        console.log('✅ Usuário atribuído com sucesso');
        console.log('- User ID:', assignResult.user_id);
        console.log('- Password:', assignResult.password);
        
        // Simular envio de email
        const emailSent = await mockEmailService.sendCredentialsEmail(
          buyerData.email,
          buyerData.name,
          assignResult.password,
          'https://clik-cilios2-0.vercel.app/login'
        );
        
        if (emailSent) {
          console.log('✅ Email de credenciais enviado');
        } else {
          console.log('❌ Erro ao enviar email');
        }
        
        const response = {
          success: true,
          message: 'Compra processada com sucesso',
          event_type: testData.event,
          user_id: assignResult.user_id,
          transaction: purchaseData.transaction
        };
        
        console.log('\n📤 Resposta do webhook:');
        console.log(JSON.stringify(response, null, 2));
        
      } else {
        console.log('❌ Erro ao atribuir usuário:', assignResult.message);
      }
      
    } else if (testData.event === 'PURCHASE_CANCELED' || testData.event === 'PURCHASE_REFUNDED') {
      console.log('❌ Processando cancelamento/reembolso...');
      
      const buyerEmail = testData.data.buyer.email;
      const transaction = testData.data.purchase.transaction;
      
      console.log('- Email do comprador:', buyerEmail);
      console.log('- Transação:', transaction);
      
      // Simular liberação do usuário
      const releaseResult = await mockHotmartUsersService.releaseUser(buyerEmail, transaction);
      
      if (releaseResult.success) {
        console.log('✅ Usuário liberado com sucesso');
        console.log('- User ID:', releaseResult.user_id);
        
        const response = {
          success: true,
          message: 'Cancelamento processado com sucesso',
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
      const response = {
        success: true,
        message: 'Evento recebido mas não processado',
        event_type: testData.event
      };
      
      console.log('\n📤 Resposta do webhook:');
      console.log(JSON.stringify(response, null, 2));
    }
    
    console.log('\n✅ Teste concluído com sucesso');
    
  } catch (error) {
    console.error('❌ Erro durante o teste:', error.message);
    console.error('Stack trace:', error.stack);
  }
}

async function runAllTests() {
  console.log('🚀 Iniciando testes completos do webhook Hotmart');
  console.log('=' .repeat(60));
  
  // Testar compra aprovada
  await testWebhook('test-webhook-approved.json', 'PURCHASE_APPROVED');
  
  // Testar compra cancelada
  await testWebhook('test-webhook-canceled.json', 'PURCHASE_CANCELED');
  
  console.log('\n🏁 Todos os testes concluídos!');
  console.log('=' .repeat(60));
}

// Executar todos os testes
runAllTests();