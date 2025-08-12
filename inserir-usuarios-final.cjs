require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Variáveis de ambiente não configuradas');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function inserirUsuarios() {
  console.log('🚀 Inserindo usuários pré-criados...');
  console.log('URL:', supabaseUrl);
  console.log('');
  
  try {
    // Primeiro, vamos tentar inserir um usuário por vez para identificar o problema
    console.log('1. Testando inserção individual...');
    
    const { data: testUser, error: testError } = await supabase
      .from('pre_users')
      .insert({
        username: 'test_user_001',
        email: 'test_user_001@ciliosclick.com',
        status: 'available'
      })
      .select();
    
    if (testError) {
      console.log('❌ Erro na inserção individual:', testError);
      
      // Se der erro de RLS, vamos tentar usar upsert
      console.log('\n2. Tentando com upsert...');
      const { data: upsertData, error: upsertError } = await supabase
        .from('pre_users')
        .upsert({
          username: 'test_user_002',
          email: 'test_user_002@ciliosclick.com',
          status: 'available'
        }, {
          onConflict: 'username'
        })
        .select();
      
      if (upsertError) {
        console.log('❌ Erro no upsert:', upsertError);
        
        // Vamos tentar uma abordagem diferente - verificar se conseguimos pelo menos ler
        console.log('\n3. Verificando permissões de leitura...');
        const { data: readData, error: readError } = await supabase
          .from('pre_users')
          .select('*')
          .limit(1);
        
        if (readError) {
          console.log('❌ Erro na leitura:', readError);
          console.log('\n🔧 SOLUÇÃO: Execute o seguinte SQL no Supabase Dashboard:');
          console.log('ALTER TABLE public.pre_users DISABLE ROW LEVEL SECURITY;');
          console.log('ALTER TABLE public.user_assignments DISABLE ROW LEVEL SECURITY;');
        } else {
          console.log('✅ Leitura OK, mas inserção bloqueada por RLS');
          console.log('\n🔧 SOLUÇÃO: Execute o seguinte SQL no Supabase Dashboard:');
          console.log('ALTER TABLE public.pre_users DISABLE ROW LEVEL SECURITY;');
        }
        return;
      } else {
        console.log('✅ Upsert funcionou!', upsertData);
      }
    } else {
      console.log('✅ Inserção individual funcionou!', testUser);
    }
    
    // Se chegou até aqui, vamos inserir o resto
    console.log('\n4. Inserindo usuários em lote...');
    const usuarios = [];
    for (let i = 1; i <= 20; i++) {
      const username = `user${i.toString().padStart(4, '0')}`;
      const email = `${username}@ciliosclick.com`;
      usuarios.push({
        username: username,
        email: email,
        status: 'available'
      });
    }
    
    const { data: batchData, error: batchError } = await supabase
      .from('pre_users')
      .upsert(usuarios, {
        onConflict: 'username'
      })
      .select();
    
    if (batchError) {
      console.log('❌ Erro no lote:', batchError);
    } else {
      console.log(`✅ ${batchData.length} usuários inseridos com sucesso!`);
    }
    
    // Verificar total final
    const { count, error: countError } = await supabase
      .from('pre_users')
      .select('*', { count: 'exact', head: true });
    
    if (!countError) {
      console.log(`\n📊 Total de usuários na tabela: ${count}`);
    }
    
  } catch (error) {
    console.error('❌ Erro geral:', error);
  }
}

inserirUsuarios();