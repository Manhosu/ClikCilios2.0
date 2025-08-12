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
    // Verificar se já existem usuários
    const { data: existingUsers, error: checkError } = await supabase
      .from('pre_users')
      .select('username')
      .limit(5);
    
    if (checkError) {
      console.log('❌ Erro ao verificar usuários existentes:', checkError);
      return;
    }
    
    console.log('✅ Tabela acessível!');
    console.log('📊 Usuários existentes encontrados:', existingUsers?.length || 0);
    
    if (existingUsers && existingUsers.length > 0) {
      console.log('⚠️ Já existem usuários na tabela:');
      existingUsers.forEach(user => console.log('  -', user.username));
      console.log('');
    }
    
    // Criar lista de usuários para inserir
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
    
    console.log('📝 Inserindo 20 usuários...');
    
    // Inserir usuários usando upsert para evitar duplicatas
    const { data: insertedUsers, error: insertError } = await supabase
      .from('pre_users')
      .upsert(usuarios, {
        onConflict: 'username',
        ignoreDuplicates: false
      })
      .select();
    
    if (insertError) {
      console.log('❌ Erro ao inserir usuários:', insertError);
      return;
    }
    
    console.log(`✅ ${insertedUsers?.length || 0} usuários processados com sucesso!`);
    
    // Verificar total final
    const { count, error: countError } = await supabase
      .from('pre_users')
      .select('*', { count: 'exact', head: true });
    
    if (!countError) {
      console.log(`📊 Total de usuários na tabela: ${count}`);
    }
    
    // Mostrar alguns usuários como exemplo
    const { data: sampleUsers, error: sampleError } = await supabase
      .from('pre_users')
      .select('username, email, status')
      .limit(5);
    
    if (!sampleError && sampleUsers) {
      console.log('\n📋 Exemplos de usuários na tabela:');
      sampleUsers.forEach(user => {
        console.log(`  • ${user.username} <${user.email}> (${user.status})`);
      });
    }
    
    console.log('\n🎉 População de usuários concluída!');
    
  } catch (error) {
    console.error('❌ Erro geral:', error);
  }
}

inserirUsuarios();