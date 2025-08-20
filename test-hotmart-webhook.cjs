require('dotenv').config();
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
      id: 12345,
      name: 'CíliosClick - Acesso Premium'
    },
    buyer: {
      email: 'cliente.teste@exemplo.com',
      name: 'Cliente Teste Hotmart'
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

async function testHotmartWebhook() {
  console.log('🔍 Testando fluxo completo do webhook Hotmart...');
  console.log('\n📋 Dados do webhook simulado:');
  console.log('Email do comprador:', mockWebhookData.data.buyer.email);
  console.log('Nome do comprador:', mockWebhookData.data.buyer.name);
  console.log('Transaction ID:', mockWebhookData.data.purchase.transaction);
  console.log('Valor da compra:', mockWebhookData.data.purchase.price.value);
  
  try {
    console.log('\n🔄 Processando webhook...');
    
    // 1. Verificar se já existe um usuário com este email
    console.log('\n1️⃣ Verificando usuário existente...');
    const { data: existingUser } = await supabase
      .from('users')
      .select('*')
      .eq('email', mockWebhookData.data.buyer.email)
      .single();
    
    if (existingUser) {
      console.log('✅ Usuário já existe:', existingUser.id);
      console.log('   Email:', existingUser.email);
      console.log('   Nome:', existingUser.nome);
    } else {
      console.log('ℹ️  Usuário não existe, será necessário criar');
    }
    
    // 2. Verificar usuários disponíveis no pool
    console.log('\n2️⃣ Verificando usuários disponíveis no pool...');
    const { data: availableUsers, error: poolError } = await supabase
      .from('pre_users')
      .select('*')
      .eq('status', 'available')
      .limit(5);
    
    if (poolError) {
      console.error('❌ Erro ao verificar pool de usuários:', poolError.message);
    } else {
      console.log(`📊 Usuários disponíveis no pool: ${availableUsers?.length || 0}`);
      if (availableUsers && availableUsers.length > 0) {
        console.log('   Exemplo:', availableUsers[0].username, '-', availableUsers[0].email);
      }
    }
    
    // 3. Testar função RPC de alocação
    console.log('\n3️⃣ Testando alocação de usuário...');
    const { data: allocatedUser, error: allocError } = await supabase
      .rpc('allocate_available_user', {
        buyer_email: mockWebhookData.data.buyer.email,
        buyer_name: mockWebhookData.data.buyer.name,
        transaction_id: mockWebhookData.data.purchase.transaction,
        notification_id: mockWebhookData.id
      });
    
    if (allocError) {
      console.error('❌ Erro na alocação:', allocError.message);
      
      // Se não conseguir alocar, tentar criar usuário diretamente
      console.log('\n🔄 Tentando criar usuário diretamente...');
      
      // Criar usuário no Auth
      const password = Math.random().toString(36).slice(-8).toUpperCase();
      const { data: authUser, error: authError } = await supabase.auth.admin.createUser({
        email: mockWebhookData.data.buyer.email,
        password: password,
        email_confirm: true
      });
      
      if (authError) {
        console.error('❌ Erro ao criar usuário no Auth:', authError.message);
      } else {
        console.log('✅ Usuário criado no Auth:', authUser.user.id);
        
        // Criar perfil na tabela users
        const { data: userProfile, error: profileError } = await supabase
          .from('users')
          .insert({
            id: authUser.user.id,
            email: mockWebhookData.data.buyer.email,
            nome: mockWebhookData.data.buyer.name,
            hotmart_buyer_email: mockWebhookData.data.buyer.email,
            hotmart_buyer_name: mockWebhookData.data.buyer.name,
            hotmart_transaction_id: mockWebhookData.data.purchase.transaction,
            hotmart_notification_id: mockWebhookData.id,
            is_admin: false,
            onboarding_completed: false
          })
          .select()
          .single();
        
        if (profileError) {
          console.error('❌ Erro ao criar perfil:', profileError.message);
        } else {
          console.log('✅ Perfil criado com sucesso!');
          console.log('   ID:', userProfile.id);
          console.log('   Email:', userProfile.email);
          console.log('   Nome:', userProfile.nome);
          console.log('   Senha gerada:', password);
        }
      }
    } else {
      console.log('✅ Usuário alocado com sucesso!');
      console.log('   Resultado:', allocatedUser);
    }
    
    // 4. Verificar estatísticas
    console.log('\n4️⃣ Verificando estatísticas...');
    const { data: stats, error: statsError } = await supabase
      .rpc('get_users_hotmart_stats');
    
    if (statsError) {
      console.error('❌ Erro ao obter estatísticas:', statsError.message);
    } else {
      console.log('📊 Estatísticas atuais:');
      console.log('   Total de usuários:', stats?.total_users || 0);
      console.log('   Usuários ativos:', stats?.active_users || 0);
      console.log('   Usuários disponíveis:', stats?.available_users || 0);
    }
    
    console.log('\n🎉 Teste do webhook concluído!');
    
  } catch (error) {
    console.error('❌ Erro durante o teste:', error.message);
  }
}

testHotmartWebhook().catch(console.error);