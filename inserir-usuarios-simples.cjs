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
  
  try {
    // Verificação rápida: leitura
    const { data: checkRead, error: readError } = await supabase
      .from('pre_users')
      .select('id, username, email')
      .limit(1);
    if (readError) {
      console.error('❌ Erro de leitura na pre_users:', readError.message || readError);
      return;
    }

    // Criar array de usuários
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
    
    console.log(`📝 Inserindo/atualizando ${usuarios.length} usuários (upsert por username)...`);
    
    // Inserir usuários em lote usando upsert para evitar duplicatas (conflito por username)
    const { data, error } = await supabase
      .from('pre_users')
      .upsert(usuarios, { onConflict: 'username' })
      .select();
    
    if (error) {
      console.error('❌ Erro ao inserir:');
      console.error(' mensagem:', error.message);
      console.error(' código:', error.code);
      console.error(' detalhes:', error.details);
      console.error(' dica:', error.hint);
      // Tentativa de inserção individual para obter mensagem mais clara
      console.log('\n🔎 Tentando inserção individual para diagnóstico...');
      const singleUsername = 'user_test_uniq';
      const { error: singleErr } = await supabase
        .from('pre_users')
        .insert({ username: singleUsername, email: `${singleUsername}@ciliosclick.com`, status: 'available' })
        .select();
      if (singleErr) {
        console.error(' ❌ Inserção individual falhou:');
        console.error('  mensagem:', singleErr.message);
        console.error('  código:', singleErr.code);
        console.error('  detalhes:', singleErr.details);
        console.error('  dica:', singleErr.hint);
      }
      return;
    }
    
    console.log(`✅ ${data.length} usuários processados com sucesso!`);
    
    // Verificar total na tabela
    const { count, error: countError } = await supabase
      .from('pre_users')
      .select('*', { count: 'exact', head: true });
    
    if (countError) {
      console.error('❌ Erro ao contar:', countError.message || countError);
    } else {
      console.log(`📊 Total de usuários na tabela: ${count}`);
    }
    
  } catch (error) {
    console.error('❌ Erro geral:', error);
  }
}

inserirUsuarios();