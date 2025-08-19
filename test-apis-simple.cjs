require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');
const fetch = require('node-fetch');

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const appUrl = process.env.VITE_APP_URL || 'http://localhost:3001';

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Variáveis de ambiente do Supabase não configuradas');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function testAPIs() {
  console.log('🧪 Testando APIs de imagens...');
  
  try {
    // 1. Buscar um usuário existente
    console.log('\n📋 1. Buscando usuário existente...');
    const { data: images, error: imagesError } = await supabase
      .from('imagens_clientes')
      .select('user_id')
      .limit(1);
    
    if (imagesError || !images || images.length === 0) {
      console.error('❌ Erro ao buscar usuário:', imagesError);
      return;
    }
    
    const userId = images[0].user_id;
    console.log(`✅ Usuário encontrado: ${userId}`);
    
    // 2. Testar API list-images
    console.log('\n📋 2. Testando API list-images...');
    try {
      const listResponse = await fetch(`${appUrl}/api/list-images?userId=${userId}`);
      console.log(`📊 Status: ${listResponse.status}`);
      
      if (listResponse.ok) {
        const listData = await listResponse.json();
        console.log(`✅ Resposta:`, JSON.stringify(listData, null, 2));
      } else {
        const errorText = await listResponse.text();
        console.log(`❌ Erro:`, errorText);
      }
    } catch (error) {
      console.error('❌ Erro na requisição list-images:', error.message);
    }
    
    // 3. Testar API save-client-image (simulação)
    console.log('\n📋 3. Testando API save-client-image...');
    try {
      const formData = new FormData();
      
      // Criar uma imagem de teste simples (1x1 pixel JPEG)
      const testImageBuffer = Buffer.from([
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
        0x03, 0x01, 0x00, 0x02, 0x11, 0x03, 0x11, 0x00, 0x3F, 0x00, 0xB2, 0xC0,
        0x07, 0xFF, 0xD9
      ]);
      
      const testData = {
        userId: userId,
        clienteId: 'test-api-' + Date.now(),
        nome: 'Teste API',
        categoria: 'volume-russo',
        estilo: 'gatinho'
      };
      
      // Simular FormData (não funciona perfeitamente no Node.js, mas testa a conectividade)
      const saveResponse = await fetch(`${appUrl}/api/save-client-image`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(testData)
      });
      
      console.log(`📊 Status: ${saveResponse.status}`);
      
      if (saveResponse.ok) {
        const saveData = await saveResponse.json();
        console.log(`✅ Resposta:`, JSON.stringify(saveData, null, 2));
      } else {
        const errorText = await saveResponse.text();
        console.log(`❌ Erro:`, errorText);
      }
    } catch (error) {
      console.error('❌ Erro na requisição save-client-image:', error.message);
    }
    
    // 4. Verificar estrutura da tabela após possível migração
    console.log('\n📋 4. Verificando estrutura da tabela...');
    try {
      const testInsert = {
        cliente_id: 'test-structure-' + Date.now(),
        user_id: userId,
        nome: 'teste-estrutura',
        url: 'https://example.com/test.jpg',
        filename: 'test.jpg',
        file_size: 1024,
        mime_type: 'image/jpeg',
        width: 100,
        height: 100,
        storage_path: 'MCP/test.jpg'
      };
      
      const { data: insertData, error: insertError } = await supabase
        .from('imagens_clientes')
        .insert(testInsert)
        .select();
      
      if (insertError) {
        console.log('❌ Erro na inserção (colunas ainda faltantes):', insertError.message);
        
        // Testar inserção básica
        const basicInsert = {
          cliente_id: 'test-basic-' + Date.now(),
          user_id: userId,
          nome: 'teste-básico',
          url: 'https://example.com/basic.jpg'
        };
        
        const { data: basicData, error: basicError } = await supabase
          .from('imagens_clientes')
          .insert(basicInsert)
          .select();
        
        if (basicError) {
          console.log('❌ Erro na inserção básica:', basicError.message);
        } else {
          console.log('✅ Inserção básica funcionou - colunas básicas OK');
          
          // Limpar teste
          await supabase
            .from('imagens_clientes')
            .delete()
            .eq('id', basicData[0].id);
        }
      } else {
        console.log('✅ Inserção completa funcionou - todas as colunas OK!');
        
        // Limpar teste
        await supabase
          .from('imagens_clientes')
          .delete()
          .eq('id', insertData[0].id);
      }
    } catch (error) {
      console.error('❌ Erro no teste de estrutura:', error.message);
    }
    
    console.log('\n✅ Teste de APIs concluído!');
    
  } catch (error) {
    console.error('❌ Erro geral:', error);
  }
}

testAPIs();