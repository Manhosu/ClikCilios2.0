require('dotenv').config();
const axios = require('axios');
const { createClient } = require('@supabase/supabase-js');

// Configurar Supabase
const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// Simular dados de webhook do Hotmart
const mockWebhookData = {
  id: 'test-webhook-' + Date.now(),
  event: 'PURCHASE_COMPLETE',
  version: '2.0.0',
  date_created: new Date().toISOString(),
  data: {
    product: {
      id: 6012952,
      name: 'CíliosClick - Acesso Premium'
    },
    buyer: {
      email: 'webhook.teste@exemplo.com',
      name: 'Webhook Teste Hotmart'
    },
    purchase: {
      transaction: 'HP' + Date.now(),
      status: 'COMPLETE',
      payment: {
        method: 'CREDIT_CARD',
        installments_number: 1
      },
      price: {
        value: 97.00,
        currency_value: 'BRL'
      }
    },
    commissions: []
  }
};

async function testWebhookEndpoint() {
  console.log('🔍 Testando endpoint do webhook Hotmart...');
  console.log('\n📋 Dados do webhook simulado:');
  console.log('Email do comprador:', mockWebhookData.data.buyer.email);
  console.log('Nome do comprador:', mockWebhookData.data.buyer.name);
  console.log('Transaction ID:', mockWebhookData.data.purchase.transaction);
  console.log('Produto ID:', mockWebhookData.data.product.id);
  
  try {
    // 1. Verificar usuários disponíveis antes
    console.log('\n1️⃣ Verificando usuários disponíveis antes...');
    const { data: beforeUsers } = await supabase
      .from('pre_users')
      .select('*')
      .eq('status', 'available')
      .limit(1);
    
    console.log(`📊 Usuários disponíveis: ${beforeUsers?.length || 0}`);
    
    // 2. Chamar o endpoint do webhook
    console.log('\n2️⃣ Chamando endpoint do webhook...');
    
    const response = await axios.post('http://localhost:3000/api/hotmart/webhook', mockWebhookData, {
      headers: {
        'Content-Type': 'application/json',
        'X-Hotmart-Hottok': process.env.HOTMART_TOKEN || 'test-token'
      },
      timeout: 10000
    });
    
    console.log('✅ Webhook processado com sucesso!');
    console.log('   Status:', response.status);
    console.log('   Resposta:', response.data);
    
    // 3. Verificar se a assinatura foi criada
    console.log('\n3️⃣ Verificando assinatura criada...');
    const { data: assinaturas } = await supabase
      .from('assinaturas')
      .select(`
        *,
        planos(nome),
        users(username, email)
      `)
      .eq('users.email', mockWebhookData.data.buyer.email)
      .order('created_at', { ascending: false })
      .limit(1);
    
    if (assinaturas && assinaturas.length > 0) {
      const assinatura = assinaturas[0];
      console.log('✅ Assinatura criada com sucesso!');
      console.log('   ID:', assinatura.id);
      console.log('   Plano:', assinatura.planos?.nome);
      console.log('   Status:', assinatura.status);
      console.log('   Data início:', assinatura.data_inicio);
      console.log('   Data fim:', assinatura.data_fim);
      console.log('   Usuário:', assinatura.users?.username);
    } else {
      console.log('❌ Nenhuma assinatura encontrada!');
    }
    
    // 4. Verificar usuários disponíveis depois
    console.log('\n4️⃣ Verificando usuários disponíveis depois...');
    const { data: afterUsers } = await supabase
      .from('pre_users')
      .select('*')
      .eq('status', 'available')
      .limit(1);
    
    console.log(`📊 Usuários disponíveis: ${afterUsers?.length || 0}`);
    
    console.log('\n🎉 Teste do endpoint concluído!');
    
  } catch (error) {
    if (error.code === 'ECONNREFUSED') {
      console.error('❌ Erro: Servidor não está rodando!');
      console.log('💡 Execute "npm run dev" para iniciar o servidor.');
    } else {
      console.error('❌ Erro durante o teste:', error.message);
      if (error.response) {
        console.error('   Status:', error.response.status);
        console.error('   Dados:', error.response.data);
      }
    }
  }
}

testWebhookEndpoint().catch(console.error);