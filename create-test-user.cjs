const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Variáveis de ambiente VITE_SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY são obrigatórias');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

function generateRandomPassword(length = 8) {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let password = '';
  for (let i = 0; i < length; i++) {
    const randomIndex = Math.floor(Math.random() * chars.length);
    password += chars[randomIndex];
  }
  return password;
}

async function createTestUser() {
  try {
    console.log('🔄 Criando usuário de teste...');
    
    const testEmail = 'testuser' + Date.now() + '@ciliosclick.com';
    const testPassword = generateRandomPassword();
    const testUsername = 'testuser' + Date.now();
    
    console.log('📧 Email:', testEmail);
    console.log('👤 Username:', testUsername);
    console.log('🔑 Senha gerada:', testPassword);
    
    // Primeiro, criar o usuário no Supabase Auth
    const { data: authUser, error: authError } = await supabase.auth.admin.createUser({
      email: testEmail,
      password: testPassword,
      email_confirm: true
    });
    
    if (authError) {
      console.error('❌ Erro ao criar usuário no Auth:', authError.message);
      return;
    }
    
    console.log('✅ Usuário criado no Auth:', authUser.user.id);
    
    // Verificar se o perfil já existe
    const { data: existingProfile } = await supabase
      .from('users')
      .select('*')
      .eq('id', authUser.user.id)
      .single();

    if (existingProfile) {
      console.log('✅ Perfil já existe!');
      console.log('🆔 ID:', existingProfile.id);
      console.log('📧 Email:', existingProfile.email);
      console.log('👤 Nome:', existingProfile.nome);
    } else {
      // Criar perfil do usuário na tabela users
      const { data: userProfile, error: profileError } = await supabase
        .from('users')
        .insert({
          id: authUser.user.id,
          email: testEmail,
          nome: 'Usuário Teste',
          is_admin: false,
          onboarding_completed: false
        })
        .select()
        .single();

      if (profileError) {
        console.error('❌ Erro ao criar perfil do usuário:', profileError.message);
        // Tentar deletar o usuário do Auth se o perfil falhou
        await supabase.auth.admin.deleteUser(authUser.user.id);
        return;
      }

      console.log('✅ Perfil criado com sucesso!');
      console.log('🆔 ID:', userProfile.id);
      console.log('📧 Email:', userProfile.email);
      console.log('👤 Nome:', userProfile.nome);
    }
    
    console.log('🔑 Senha:', testPassword);
    console.log('👤 Username:', testUsername);
    console.log('🆔 ID:', authUser.user.id);
    console.log('\n🎉 Usuário de teste criado com sucesso!');
    console.log('\n📝 Credenciais para login:');
    console.log('Email:', testEmail);
    console.log('Senha:', testPassword);
    
  } catch (error) {
    console.error('❌ Erro geral:', error.message);
  }
}

// Verificar se o usuário já existe antes de criar
async function checkAndCreateTestUser() {
  try {
    const testEmail = 'testuser@ciliosclick.com';
    
    // Verificar se já existe
    const { data: existingUser } = await supabase
      .from('users')
      .select('*')
      .eq('email', testEmail)
      .single();
    
    if (existingUser) {
      console.log('ℹ️ Usuário de teste já existe:');
      console.log('📧 Email:', existingUser.email);
      console.log('👤 Username:', existingUser.username);
      console.log('🔑 Senha original:', 'Senha gerenciada pelo Auth');
      
      // Vamos atualizar as informações básicas
      if (true) {
        console.log('🔄 Atualizando usuário com nova senha...');
        const newPassword = generateRandomPassword();
        
        // Atualizar senha no Auth
        const { error: authError } = await supabase.auth.admin.updateUserById(
          existingUser.id,
          { password: newPassword }
        );
        
        if (authError) {
          console.error('❌ Erro ao atualizar senha no Auth:', authError.message);
          return;
        }
        
        // Atualizar informações básicas se necessário
        const { error: updateError } = await supabase
          .from('users')
          .update({
            nome: 'Usuário Teste Atualizado'
          })
          .eq('id', existingUser.id);
        
        if (updateError) {
          console.error('❌ Erro ao atualizar usuário:', updateError.message);
          return;
        }
        
        console.log('✅ Usuário atualizado com sucesso!');
        console.log('🔑 Nova senha:', newPassword);
      }
      
      return;
    }
    
    await createTestUser();
    
  } catch (error) {
    console.error('❌ Erro ao verificar usuário existente:', error.message);
  }
}

checkAndCreateTestUser();


//vai