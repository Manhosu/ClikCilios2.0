require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');
const fetch = require('node-fetch');
const FormData = require('form-data');
const fs = require('fs');
const path = require('path');

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseAnonKey || !supabaseServiceKey) {
  console.error('❌ Variáveis de ambiente do Supabase não configuradas');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);
const supabaseClient = createClient(supabaseUrl, supabaseAnonKey);

async function testImageUploadWithAuth() {
  console.log('🚀 Testando upload de imagens com autenticação\n');

  try {
    // 1. Buscar um usuário existente
    console.log('👥 1. Buscando usuário de teste...');
    const { data: users, error: usersError } = await supabase.auth.admin.listUsers();
    
    if (usersError) {
      console.error('❌ Erro ao buscar usuários:', usersError.message);
      return;
    }

    if (!users || users.users.length === 0) {
      console.log('❌ Nenhum usuário encontrado');
      return;
    }

    const testUser = users.users[0];
    console.log(`✅ Usuário encontrado: ${testUser.email}`);

    // 2. Fazer login com o usuário de teste
    console.log('\n🔑 2. Fazendo login...');
    const { data: authData, error: authError } = await supabaseClient.auth.signInWithPassword({
      email: 'teste@ciliosclick.com',
      password: '123456'
    });
    
    if (authError) {
      console.error('❌ Erro ao fazer login:', authError.message);
      console.log('ℹ️ Tentando criar usuário de teste...');
      
      // Tentar criar usuário de teste
      const { data: signUpData, error: signUpError } = await supabaseClient.auth.signUp({
        email: 'teste@ciliosclick.com',
        password: 'teste123'
      });
      
      if (signUpError) {
        console.error('❌ Erro ao criar usuário:', signUpError.message);
        return;
      }
      
      console.log('✅ Usuário de teste criado');
      
      // Fazer login novamente
      const { data: retryAuthData, error: retryAuthError } = await supabaseClient.auth.signInWithPassword({
        email: 'teste@ciliosclick.com',
        password: 'teste123'
      });
      
      if (retryAuthError) {
        console.error('❌ Erro ao fazer login após criação:', retryAuthError.message);
        return;
      }
      
      authData = retryAuthData;
    }

    const accessToken = authData.session?.access_token;
    if (!accessToken) {
      console.error('❌ Token de acesso não encontrado');
      return;
    }
    
    console.log('✅ Login realizado com sucesso');

    // 3. Testar API list-images com autenticação
    console.log('\n📋 3. Testando API list-images...');
    const listResponse = await fetch('http://localhost:3001/api/list-images', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      }
    });

    console.log(`📊 Status da resposta: ${listResponse.status}`);
    
    if (listResponse.ok) {
      const listData = await listResponse.json();
      console.log('✅ API list-images funcionando!');
      console.log(`📸 Imagens encontradas: ${listData.images ? listData.images.length : 0}`);
      if (listData.images && listData.images.length > 0) {
        console.log('📄 Primeira imagem:', JSON.stringify(listData.images[0], null, 2));
      }
    } else {
      const errorText = await listResponse.text();
      console.log(`❌ Erro na API list-images: ${errorText}`);
    }

    // 4. Criar uma imagem de teste
    console.log('\n🖼️ 4. Criando imagem de teste...');
    const testImagePath = path.join(__dirname, 'test-image.jpg');
    
    // Criar uma imagem simples (1x1 pixel JPEG)
    const jpegHeader = Buffer.from([
      0xFF, 0xD8, 0xFF, 0xE0, 0x00, 0x10, 0x4A, 0x46, 0x49, 0x46, 0x00, 0x01,
      0x01, 0x01, 0x00, 0x48, 0x00, 0x48, 0x00, 0x00, 0xFF, 0xDB, 0x00, 0x43,
      0x00, 0x08, 0x06, 0x06, 0x07, 0x06, 0x05, 0x08, 0x07, 0x07, 0x07, 0x09,
      0x09, 0x08, 0x0A, 0x0C, 0x14, 0x0D, 0x0C, 0x0B, 0x0B, 0x0C, 0x19, 0x12,
      0x13, 0x0F, 0x14, 0x1D, 0x1A, 0x1F, 0x1E, 0x1D, 0x1A, 0x1C, 0x1C, 0x20,
      0x24, 0x2E, 0x27, 0x20, 0x22, 0x2C, 0x23, 0x1C, 0x1C, 0x28, 0x37, 0x29,
      0x2C, 0x30, 0x31, 0x34, 0x34, 0x34, 0x1F, 0x27, 0x39, 0x3D, 0x38, 0x32,
      0x3C, 0x2E, 0x33, 0x34, 0x32, 0xFF, 0xC0, 0x00, 0x11, 0x08, 0x00, 0x01,
      0x00, 0x01, 0x01, 0x01, 0x11, 0x00, 0x02, 0x11, 0x01, 0x03, 0x11, 0x01,
      0xFF, 0xC4, 0x00, 0x14, 0x00, 0x01, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
      0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x08, 0xFF, 0xC4,
      0x00, 0x14, 0x10, 0x01, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
      0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0xFF, 0xDA, 0x00, 0x0C,
      0x03, 0x01, 0x00, 0x02, 0x11, 0x03, 0x11, 0x00, 0x3F, 0x00, 0xAA, 0xFF, 0xD9
    ]);
    
    fs.writeFileSync(testImagePath, jpegHeader);
    console.log('✅ Imagem de teste criada');

    // 5. Testar upload de imagem
    console.log('\n📤 5. Testando upload de imagem...');
    const formData = new FormData();
    formData.append('image', fs.createReadStream(testImagePath));
    formData.append('clienteId', '1');
    formData.append('descricao', 'Imagem de teste via script');

    const uploadResponse = await fetch('http://localhost:3001/api/save-client-image', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        ...formData.getHeaders()
      },
      body: formData
    });

    console.log(`📊 Status do upload: ${uploadResponse.status}`);
    
    if (uploadResponse.ok) {
      const uploadData = await uploadResponse.json();
      console.log('✅ Upload realizado com sucesso!');
      console.log('📄 Dados da imagem:', JSON.stringify(uploadData, null, 2));
    } else {
      const errorText = await uploadResponse.text();
      console.log(`❌ Erro no upload: ${errorText}`);
    }

    // 6. Verificar se a imagem foi salva no banco
    console.log('\n💾 6. Verificando imagem no banco...');
    const { data: images, error: imagesError } = await supabase
      .from('imagens_clientes')
      .select('*')
      .eq('user_id', authData.user.id)
      .order('created_at', { ascending: false })
      .limit(3);

    if (imagesError) {
      console.log(`❌ Erro ao buscar imagens: ${imagesError.message}`);
    } else {
      console.log(`✅ Imagens do usuário: ${images.length}`);
      if (images.length > 0) {
        console.log('📄 Últimas imagens:');
        images.forEach((img, index) => {
          console.log(`   ${index + 1}. ${img.nome || img.filename || 'sem nome'} - ${img.created_at}`);
        });
      }
    }

    // Limpar arquivo de teste
    if (fs.existsSync(testImagePath)) {
      fs.unlinkSync(testImagePath);
      console.log('\n🧹 Arquivo de teste removido');
    }

  } catch (error) {
    console.error('❌ Erro durante o teste:', error.message);
    console.error('Stack:', error.stack);
  }

  console.log('\n✅ Teste de upload com autenticação finalizado!');
}

testImageUploadWithAuth();