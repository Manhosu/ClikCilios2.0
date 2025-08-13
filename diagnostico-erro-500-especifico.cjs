require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

console.log('🔍 DIAGNÓSTICO ESPECÍFICO DO ERRO 500');
console.log('=====================================\n');

// Simular as mesmas condições do webhook
async function diagnosticarErro500() {
  console.log('1️⃣ Verificando variáveis de ambiente críticas...');
  
  const variaveis = {
    'NEXT_PUBLIC_SUPABASE_URL': process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.VITE_SUPABASE_URL,
    'SUPABASE_SERVICE_ROLE_KEY': process.env.SUPABASE_SERVICE_ROLE_KEY,
    'HOTMART_HOTTOK': process.env.HOTMART_HOTTOK,
    'VITE_HOTMART_WEBHOOK_SECRET': process.env.VITE_HOTMART_WEBHOOK_SECRET
  };
  
  let variaveisFaltando = [];
  
  for (const [nome, valor] of Object.entries(variaveis)) {
    if (!valor) {
      console.log(`❌ ${nome}: NÃO CONFIGURADA`);
      variaveisFaltando.push(nome);
    } else {
      console.log(`✅ ${nome}: Configurada (${valor.substring(0, 10)}...)`);
    }
  }
  
  if (variaveisFaltando.length > 0) {
    console.log(`\n❌ PROBLEMA IDENTIFICADO: ${variaveisFaltando.length} variáveis faltando`);
    console.log('Variáveis faltando:', variaveisFaltando.join(', '));
    return false;
  }
  
  console.log('\n2️⃣ Testando conexão com Supabase...');
  
  try {
    const supabaseUrl = variaveis['NEXT_PUBLIC_SUPABASE_URL'];
    const serviceRoleKey = variaveis['SUPABASE_SERVICE_ROLE_KEY'];
    
    const supabase = createClient(supabaseUrl, serviceRoleKey);
    
    // Teste básico de conexão
    const { data, error } = await supabase
      .from('users')
      .select('count')
      .limit(1);
    
    if (error) {
      console.log(`❌ Erro de conexão: ${error.message}`);
      return false;
    }
    
    console.log('✅ Conexão com Supabase: OK');
    
  } catch (error) {
    console.log(`❌ Erro ao conectar com Supabase: ${error.message}`);
    return false;
  }
  
  console.log('\n3️⃣ Verificando tabela webhook_events...');
  
  try {
    const supabaseUrl = variaveis['NEXT_PUBLIC_SUPABASE_URL'];
    const serviceRoleKey = variaveis['SUPABASE_SERVICE_ROLE_KEY'];
    
    const supabase = createClient(supabaseUrl, serviceRoleKey);
    
    // Tentar inserir um registro de teste
    const { error: insertError } = await supabase
      .from('webhook_events')
      .insert({
        source: 'teste',
        event_type: 'TESTE_DIAGNOSTICO',
        payload: { teste: true },
        received_at: new Date().toISOString()
      });
    
    if (insertError) {
      if (insertError.message.includes('relation "webhook_events" does not exist')) {
        console.log('❌ PROBLEMA IDENTIFICADO: Tabela webhook_events não existe!');
        console.log('\n📝 SOLUÇÃO:');
        console.log('1. Acesse: https://supabase.com/dashboard');
        console.log('2. Vá para SQL Editor');
        console.log('3. Execute o arquivo: criar-webhook-events-limpo.sql');
        return false;
      } else {
        console.log(`❌ Erro ao inserir na webhook_events: ${insertError.message}`);
        return false;
      }
    }
    
    console.log('✅ Tabela webhook_events: OK');
    
    // Limpar o registro de teste
    await supabase
      .from('webhook_events')
      .delete()
      .eq('event_type', 'TESTE_DIAGNOSTICO');
    
  } catch (error) {
    console.log(`❌ Erro ao testar webhook_events: ${error.message}`);
    return false;
  }
  
  console.log('\n4️⃣ Verificando outras tabelas essenciais...');
  
  const tabelasEssenciais = ['users', 'pre_users', 'hotmart_users'];
  
  try {
    const supabaseUrl = variaveis['NEXT_PUBLIC_SUPABASE_URL'];
    const serviceRoleKey = variaveis['SUPABASE_SERVICE_ROLE_KEY'];
    
    const supabase = createClient(supabaseUrl, serviceRoleKey);
    
    for (const tabela of tabelasEssenciais) {
      const { error } = await supabase
        .from(tabela)
        .select('count')
        .limit(1);
      
      if (error) {
        if (error.message.includes('does not exist')) {
          console.log(`❌ Tabela ${tabela}: NÃO EXISTE`);
          return false;
        } else {
          console.log(`❌ Erro ao acessar ${tabela}: ${error.message}`);
          return false;
        }
      } else {
        console.log(`✅ Tabela ${tabela}: OK`);
      }
    }
    
  } catch (error) {
    console.log(`❌ Erro ao verificar tabelas: ${error.message}`);
    return false;
  }
  
  console.log('\n5️⃣ Simulando processamento do webhook...');
  
  try {
    // Simular payload do Hotmart
    const payloadTeste = {
      event: 'PURCHASE_APPROVED',
      id: 'teste-' + Date.now(),
      data: {
        buyer: {
          email: 'teste@exemplo.com',
          name: 'Teste Usuario'
        },
        purchase: {
          transaction: 'TXN-' + Date.now()
        }
      }
    };
    
    const supabaseUrl = variaveis['NEXT_PUBLIC_SUPABASE_URL'];
    const serviceRoleKey = variaveis['SUPABASE_SERVICE_ROLE_KEY'];
    
    const supabase = createClient(supabaseUrl, serviceRoleKey);
    
    // Tentar salvar o webhook (como faz o código real)
    const { error: webhookError } = await supabase
      .from('webhook_events')
      .insert({
        source: 'hotmart',
        event_type: payloadTeste.event,
        payload: payloadTeste,
        received_at: new Date().toISOString()
      });
    
    if (webhookError) {
      console.log(`❌ Erro ao salvar webhook simulado: ${webhookError.message}`);
      return false;
    }
    
    console.log('✅ Simulação de webhook: OK');
    
    // Limpar o teste
    await supabase
      .from('webhook_events')
      .delete()
      .eq('payload->id', payloadTeste.id);
    
  } catch (error) {
    console.log(`❌ Erro na simulação: ${error.message}`);
    return false;
  }
  
  console.log('\n✅ DIAGNÓSTICO CONCLUÍDO: Todas as verificações passaram!');
  console.log('\n🤔 POSSÍVEIS CAUSAS DO ERRO 500 (já que tudo parece OK):');
  console.log('1. Problema com importações dos serviços (hotmartUsersService, EmailService)');
  console.log('2. Erro no processamento específico do payload real');
  console.log('3. Timeout na função do Vercel');
  console.log('4. Problema com bcryptjs ou crypto');
  console.log('5. Erro específico no hotmartUsersService.assignUser()');
  
  console.log('\n📋 PRÓXIMOS PASSOS:');
  console.log('1. Verificar logs detalhados no Vercel Dashboard');
  console.log('2. Testar com payload real do Hotmart');
  console.log('3. Verificar se os serviços importados estão funcionando');
  console.log('4. Considerar adicionar mais logs no código do webhook');
  
  return true;
}

// Executar diagnóstico
diagnosticarErro500().catch(error => {
  console.error('❌ Erro no diagnóstico:', error.message);
});