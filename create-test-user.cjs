const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

// Configuração do Supabase
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function createTestUser() {
  try {
    console.log('🔍 Verificando usuários existentes...');
    
    // Verificar se já existe algum usuário
    const { data: existingUsers, error: listError } = await supabase.auth.admin.listUsers();
    
    if (listError) {
      console.error('❌ Erro ao listar usuários:', listError);
      return;
    }
    
    console.log(`📊 Usuários encontrados: ${existingUsers.users.length}`);
    
    if (existingUsers.users.length > 0) {
      console.log('✅ Usuários existentes:');
      existingUsers.users.forEach(user => {
        console.log(`  - ${user.email} (ID: ${user.id})`);
      });
      
      // Usar o primeiro usuário para teste
      const testUser = existingUsers.users[0];
      console.log(`\n🧪 Usuário de teste: ${testUser.email}`);
      console.log('💡 Use este email para fazer login na aplicação');
      return;
    }
    
    console.log('📝 Criando usuário de teste...');
    
    // Criar usuário de teste
    const { data: newUser, error: createError } = await supabase.auth.admin.createUser({
      email: 'teste@ciliosclick.com',
      password: '123456',
      email_confirm: true,
      user_metadata: {
        nome: 'Usuário Teste'
      }
    });
    
    if (createError) {
      console.error('❌ Erro ao criar usuário:', createError);
      return;
    }
    
    console.log('✅ Usuário criado com sucesso!');
    console.log(`📧 Email: teste@ciliosclick.com`);
    console.log(`🔒 Senha: 123456`);
    console.log(`🆔 ID: ${newUser.user.id}`);
    
    // Criar perfil na tabela users
    const { error: profileError } = await supabase
      .from('users')
      .insert({
        id: newUser.user.id,
        email: 'teste@ciliosclick.com',
        nome: 'Usuário Teste',
        is_admin: true,
        onboarding_completed: true
      });
    
    if (profileError) {
      console.error('⚠️ Erro ao criar perfil (mas usuário foi criado):', profileError);
    } else {
      console.log('✅ Perfil criado na tabela users');
    }
    
  } catch (error) {
    console.error('❌ Erro crítico:', error);
  }
}

createTestUser();