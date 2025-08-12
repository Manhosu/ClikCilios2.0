require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Variáveis de ambiente não encontradas!');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function verificarTabelasCompleto() {
  console.log('🎯 VERIFICAÇÃO FINAL DAS TABELAS');
  console.log('=' .repeat(50));
  
  let todasTabelasOK = true;
  
  // Teste 1: Verificar pre_users
  console.log('\n1. 📋 Testando tabela PRE_USERS...');
  try {
    // SELECT
    const { data: selectData, error: selectError } = await supabase
      .from('pre_users')
      .select('id, username, email, status')
      .limit(5);
    
    if (selectError) {
      console.log(`❌ SELECT falhou: ${selectError.code} - ${selectError.message}`);
      todasTabelasOK = false;
    } else {
      console.log(`✅ SELECT funcionou! Registros encontrados: ${selectData.length}`);
      if (selectData.length > 0) {
        console.log('📊 Primeiros registros:', selectData);
      }
    }
    
    // COUNT
    const { count, error: countError } = await supabase
      .from('pre_users')
      .select('*', { count: 'exact', head: true });
    
    if (countError) {
      console.log(`❌ COUNT falhou: ${countError.code} - ${countError.message}`);
    } else {
      console.log(`✅ COUNT funcionou! Total de registros: ${count}`);
    }
    
    // INSERT de teste
    const testUsername = 'teste_verificacao_' + Date.now();
    const { data: insertData, error: insertError } = await supabase
      .from('pre_users')
      .insert({ username: testUsername, email: `${testUsername}@ciliosclick.com`, status: 'available' })
      .select();
    
    if (insertError) {
      console.log(`❌ INSERT falhou: ${insertError.code} - ${insertError.message}`);
      todasTabelasOK = false;
    } else {
      console.log('✅ INSERT funcionou!');
      console.log('📝 Registro criado:', insertData[0]);
      
      // Limpar o teste
      const { error: deleteError } = await supabase
        .from('pre_users')
        .delete()
        .eq('id', insertData[0].id);
      
      if (deleteError) {
        console.log('⚠️  Não foi possível limpar o registro de teste');
      } else {
        console.log('🧹 Registro de teste removido');
      }
    }
    
  } catch (error) {
    console.log('❌ Erro geral na tabela pre_users:', error.message);
    todasTabelasOK = false;
  }
  
  // Teste 2: Verificar user_assignments
  console.log('\n2. 📋 Testando tabela USER_ASSIGNMENTS...');
  try {
    // SELECT
    const { data: selectData, error: selectError } = await supabase
      .from('user_assignments')
      .select('*')
      .limit(5);
    
    if (selectError) {
      console.log(`❌ SELECT falhou: ${selectError.code} - ${selectError.message}`);
      todasTabelasOK = false;
    } else {
      console.log(`✅ SELECT funcionou! Registros encontrados: ${selectData.length}`);
      if (selectData.length > 0) {
        console.log('📊 Primeiros registros:', selectData);
      }
    }
    
    // COUNT
    const { count, error: countError } = await supabase
      .from('user_assignments')
      .select('*', { count: 'exact', head: true });
    
    if (countError) {
      console.log(`❌ COUNT falhou: ${countError.code} - ${countError.message}`);
    } else {
      console.log(`✅ COUNT funcionou! Total de registros: ${count}`);
    }
    
  } catch (error) {
    console.log('❌ Erro geral na tabela user_assignments:', error.message);
    todasTabelasOK = false;
  }
  
  // Teste 3: Verificar relacionamento
  console.log('\n3. 🔗 Testando RELACIONAMENTO entre tabelas...');
  try {
    // Primeiro, verificar se há dados para testar o relacionamento
    const { data: preUsersData } = await supabase
      .from('pre_users')
      .select('id')
      .limit(1);
    
    if (preUsersData && preUsersData.length > 0) {
      const preUserId = preUsersData[0].id;
      
      // Tentar inserir um assignment
      const { data: assignmentData, error: assignmentError } = await supabase
        .from('user_assignments')
        .insert({
          pre_user_id: preUserId,
          assigned_to: 'diagnostic',
          assigned_by: 'diagnostic_script',
          notes: 'Teste de relacionamento',
          expires_at: null
        })
        .select();
      
      if (assignmentError) {
        console.log(`❌ INSERT com FK falhou: ${assignmentError.code} - ${assignmentError.message}`);
        todasTabelasOK = false;
      } else {
        console.log('✅ Relacionamento funcionando!');
        console.log('📝 Assignment criado:', assignmentData[0]);
        
        // Limpar o teste
        await supabase
          .from('user_assignments')
          .delete()
          .eq('id', assignmentData[0].id);
        console.log('🧹 Assignment de teste removido');
      }
    } else {
      console.log('⚠️  Não há usuários para testar o relacionamento');
    }
    
  } catch (error) {
    console.log('❌ Erro no teste de relacionamento:', error.message);
  }
  
  // Resultado final
  console.log('\n' + '=' .repeat(50));
  console.log('🏁 RESULTADO FINAL:');
  
  if (todasTabelasOK) {
    console.log('🎉 SUCESSO! Todas as tabelas estão funcionando corretamente!');
    console.log('✅ pre_users: OK');
    console.log('✅ user_assignments: OK');
    console.log('✅ Relacionamentos: OK');
    console.log('\n🚀 Você pode continuar com o desenvolvimento!');
  } else {
    console.log('❌ FALHA! Algumas tabelas ainda têm problemas.');
    console.log('💡 Verifique se você executou o SQL corretamente no Supabase Dashboard.');
    console.log('📖 Consulte o arquivo INSTRUCOES-CRIAR-TABELAS.md para mais detalhes.');
  }
  
  console.log('=' .repeat(50));
}

verificarTabelasCompleto();