const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseAnonKey || !serviceKey) {
  console.error('❌ Credenciais do Supabase não encontradas');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);
const supabaseAdmin = createClient(supabaseUrl, serviceKey);

async function testLoginFlow() {
  console.log('🔍 Verificando usuários existentes...');
  
  try {
    // Listar usuários usando service key
    const { data: users, error: usersError } = await supabaseAdmin.auth.admin.listUsers();
    
    if (usersError) {
      console.error('❌ Erro ao listar usuários:', usersError.message);
      return;
    }
    
    console.log(`✅ Encontrados ${users.users.length} usuários:`);
    users.users.forEach((user, index) => {
      console.log(`${index + 1}. ${user.email} (ID: ${user.id})`);
    });
    
    if (users.users.length === 0) {
      console.log('⚠️ Nenhum usuário encontrado. Criando usuário de teste...');
      
      const testEmail = 'teste@clikcilios.com';
      const testPassword = 'teste123456';
      
      const { data: newUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
        email: testEmail,
        password: testPassword,
        email_confirm: true
      });
      
      if (createError) {
        console.error('❌ Erro ao criar usuário:', createError.message);
        return;
      }
      
      console.log('✅ Usuário de teste criado:', testEmail);
      
      // Criar perfil do usuário
      const { error: profileError } = await supabaseAdmin
        .from('users')
        .insert({
          id: newUser.user.id,
          email: testEmail,
          nome: 'Usuário Teste',
          tipo: 'profissional',
          is_admin: false,
          onboarding_completed: true
        });
      
      if (profileError) {
        console.error('❌ Erro ao criar perfil:', profileError.message);
      } else {
        console.log('✅ Perfil do usuário criado');
      }
    }
    
    // Tentar fazer login com o primeiro usuário
    if (users.users.length > 0) {
      const firstUser = users.users[0];
      console.log(`\n🔐 Tentando fazer login com: ${firstUser.email}`);
      
      // Para teste, vamos usar uma senha padrão
      const testPassword = 'teste123456';
      
      const { data: loginData, error: loginError } = await supabase.auth.signInWithPassword({
        email: firstUser.email,
        password: testPassword
      });
      
      if (loginError) {
        console.error('❌ Erro no login:', loginError.message);
        console.log('💡 Isso pode ser normal se a senha não for "teste123456"');
        
        // Tentar resetar a senha
        console.log('🔄 Tentando resetar senha...');
        const { error: resetError } = await supabaseAdmin.auth.admin.updateUserById(
          firstUser.id,
          { password: testPassword }
        );
        
        if (resetError) {
          console.error('❌ Erro ao resetar senha:', resetError.message);
        } else {
          console.log('✅ Senha resetada para "teste123456"');
          
          // Tentar login novamente
          const { data: retryLogin, error: retryError } = await supabase.auth.signInWithPassword({
            email: firstUser.email,
            password: testPassword
          });
          
          if (retryError) {
            console.error('❌ Erro no segundo login:', retryError.message);
          } else {
            console.log('✅ Login realizado com sucesso!');
            console.log('- Token:', retryLogin.session.access_token.substring(0, 20) + '...');
            
            // Testar API com o token
            await testApiWithToken(retryLogin.session.access_token);
          }
        }
      } else {
        console.log('✅ Login realizado com sucesso!');
        console.log('- Token:', loginData.session.access_token.substring(0, 20) + '...');
        
        // Testar API com o token
        await testApiWithToken(loginData.session.access_token);
      }
    }
    
  } catch (error) {
    console.error('❌ Erro crítico:', error.message);
  }
}

async function testApiWithToken(token) {
  console.log('\n🧪 Testando APIs com token...');
  
  try {
    // Testar save-client-image
    const saveResponse = await fetch('http://localhost:3001/api/save-client-image', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        cliente_id: '00000000-0000-0000-0000-000000000000',
        nome: 'teste.jpg',
        url: 'https://example.com/teste.jpg',
        tipo: 'depois',
        descricao: 'Teste de API'
      })
    });
    
    if (saveResponse.ok) {
      console.log('✅ API save-client-image funcionando');
    } else {
      console.log('❌ API save-client-image falhou:', saveResponse.status);
    }
    
    // Testar list-images
    const listResponse = await fetch('http://localhost:3001/api/list-images', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    if (listResponse.ok) {
      console.log('✅ API list-images funcionando');
    } else {
      console.log('❌ API list-images falhou:', listResponse.status);
    }
    
  } catch (error) {
    console.error('❌ Erro ao testar APIs:', error.message);
  }
}

testLoginFlow().then(() => {
  console.log('\n🏁 Teste de login concluído');
  process.exit(0);
}).catch(error => {
  console.error('❌ Erro no teste:', error);
  process.exit(1);
});