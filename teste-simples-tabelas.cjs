require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Variáveis de ambiente não encontradas!');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function testarTabelas() {
  console.log('🧪 TESTE SIMPLES DE TABELAS');
  console.log('URL:', supabaseUrl);
  console.log('Key:', supabaseKey.substring(0, 20) + '...');

  try {
    // Teste 1: SELECT simples
    console.log('\n1. SELECT simples em pre_users');
    const { data: selectData, error: selectError } = await supabase
      .from('pre_users')
      .select('id, username, email, status')
      .limit(5);

    if (selectError) {
      console.log(`❌ Erro no SELECT: ${selectError.code} - ${selectError.message}`);
    } else {
      console.log('✅ SELECT OK, dados:', selectData);
    }

    // Teste 2: COUNT
    console.log('\n2. COUNT em pre_users');
    const { count, error: countError } = await supabase
      .from('pre_users')
      .select('*', { count: 'exact', head: true });

    if (countError) {
      console.log(`❌ Erro no COUNT: ${countError.code} - ${countError.message}`);
    } else {
      console.log('✅ COUNT OK, total:', count);
    }

    // Teste 3: INSERT
    console.log('\n3. INSERT em pre_users');
    const username = 'teste_simples_' + Date.now();
    const { data: insertData, error: insertError } = await supabase
      .from('pre_users')
      .insert({ username, email: `${username}@ciliosclick.com`, status: 'available' })
      .select();

    if (insertError) {
      console.log(`❌ Erro no INSERT: ${insertError.code} - ${insertError.message}`);
    } else {
      console.log('✅ INSERT OK, dados:', insertData);
      // Limpar o registro de teste
      if (insertData && insertData[0]) {
        await supabase
          .from('pre_users')
          .delete()
          .eq('id', insertData[0].id);
        console.log('🧹 Registro de teste removido');
      }
    }

  } catch (error) {
    console.error('❌ Erro geral nos testes:', error.message);
  }
}

testarTabelas();