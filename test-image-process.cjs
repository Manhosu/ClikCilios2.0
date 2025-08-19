const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');
const FormData = require('form-data');
const fetch = require('node-fetch');
require('dotenv').config();

// Configuração do Supabase
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function testImageProcess() {
  console.log('🚀 Testando processo completo de salvamento de imagens\n');

  try {
    // 1. Verificar estrutura das tabelas
    console.log('🔍 1. Verificando estrutura das tabelas...');
    
    const { data: imagensTable, error: imagensError } = await supabase
      .from('imagens_clientes')
      .select('*')
      .limit(1);
    
    if (imagensError) {
      console.log('❌ Erro ao acessar tabela imagens_clientes:', imagensError.message);
    } else {
      console.log('✅ Tabela imagens_clientes acessível');
    }

    // 2. Verificar usuários
    console.log('\n👥 2. Verificando usuários...');
    const { data: users, error: usersError } = await supabase.auth.admin.listUsers();
    
    if (usersError) {
      console.log('❌ Erro ao buscar usuários:', usersError.message);
    } else {
      console.log(`✅ Total de usuários: ${users.users.length}`);
      if (users.users.length > 0) {
        const testUser = users.users[0];
        console.log(`📧 Usuário de teste: ${testUser.email}`);
        
        // 3. Verificar imagens existentes do usuário
        console.log('\n📸 3. Verificando imagens existentes...');
        const { data: existingImages, error: existingError } = await supabase
          .from('imagens_clientes')
          .select('*')
          .eq('user_id', testUser.id)
          .order('created_at', { ascending: false })
          .limit(5);
        
        if (existingError) {
          console.log('❌ Erro ao buscar imagens:', existingError.message);
        } else {
          console.log(`✅ Imagens encontradas: ${existingImages.length}`);
          if (existingImages.length > 0) {
            console.log(`📄 Última imagem: ${existingImages[0].filename}`);
          }
        }
      }
    }

    // 4. Verificar storage buckets
    console.log('\n📦 4. Verificando storage buckets...');
    const { data: buckets, error: bucketsError } = await supabase.storage.listBuckets();
    
    if (bucketsError) {
      console.log('❌ Erro ao listar buckets:', bucketsError.message);
    } else {
      console.log(`✅ Buckets encontrados: ${buckets.map(b => b.name).join(', ')}`);
      
      // Verificar conteúdo do bucket MCP
      if (buckets.some(b => b.name === 'MCP')) {
        const { data: bucketFiles, error: filesError } = await supabase.storage
          .from('MCP')
          .list('', { limit: 10 });
        
        if (filesError) {
          console.log('❌ Erro ao listar arquivos do bucket:', filesError.message);
        } else {
          console.log(`📁 Arquivos no bucket MCP: ${bucketFiles.length}`);
        }
      }
    }

    // 5. Testar APIs sem autenticação (para verificar se estão respondendo)
    console.log('\n🌐 5. Testando conectividade das APIs...');
    
    try {
      const listResponse = await fetch('http://localhost:3001/api/list-images', {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' }
      });
      
      console.log(`📊 list-images status: ${listResponse.status}`);
      const listText = await listResponse.text();
      
      if (listResponse.status === 401 || listText.includes('autenticação')) {
        console.log('✅ API list-images está respondendo (requer autenticação)');
      } else {
        console.log('⚠️ Resposta inesperada:', listText.substring(0, 100));
      }
    } catch (error) {
      console.log('❌ Erro ao conectar com list-images:', error.message);
    }

    try {
      const saveResponse = await fetch('http://localhost:3001/api/save-client-image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({})
      });
      
      console.log(`📊 save-client-image status: ${saveResponse.status}`);
      const saveText = await saveResponse.text();
      
      if (saveResponse.status === 401 || saveText.includes('autenticação')) {
        console.log('✅ API save-client-image está respondendo (requer autenticação)');
      } else {
        console.log('⚠️ Resposta inesperada:', saveText.substring(0, 100));
      }
    } catch (error) {
      console.log('❌ Erro ao conectar com save-client-image:', error.message);
    }

    // 6. Verificar configurações do ambiente
    console.log('\n⚙️ 6. Verificando configurações...');
    console.log(`🔗 Supabase URL: ${supabaseUrl ? '✅ Configurado' : '❌ Não configurado'}`);
    console.log(`🔑 Service Key: ${supabaseServiceKey ? '✅ Configurado' : '❌ Não configurado'}`);
    
    // 7. Testar inserção direta no banco (simulando upload)
    console.log('\n💾 7. Testando inserção direta no banco...');
    
    if (users && users.users.length > 0) {
      const testUser = users.users[0];
      const testImageData = {
        user_id: testUser.id,
        filename: `test-${Date.now()}.png`,
        original_name: 'test-image.png',
        file_size: 1024,
        mime_type: 'image/png',
        width: 100,
        height: 100,
        storage_path: `${testUser.id}/test-${Date.now()}.png`
      };
      
      const { data: insertResult, error: insertError } = await supabase
        .from('imagens_clientes')
        .insert(testImageData)
        .select();
      
      if (insertError) {
        console.log('❌ Erro ao inserir imagem de teste:', insertError.message);
      } else {
        console.log('✅ Imagem de teste inserida com sucesso');
        console.log(`📄 ID: ${insertResult[0].id}`);
        
        // Remover imagem de teste
        await supabase
          .from('imagens_clientes')
          .delete()
          .eq('id', insertResult[0].id);
        console.log('🧹 Imagem de teste removida');
      }
    }

  } catch (error) {
    console.log('❌ Erro geral no teste:', error.message);
  }

  console.log('\n✅ Teste completo finalizado!');
  
  // Resumo
  console.log('\n📋 RESUMO DO TESTE:');
  console.log('   🔍 Estrutura do banco: Verificada');
  console.log('   👥 Usuários: Verificados');
  console.log('   📦 Storage: Verificado');
  console.log('   🌐 APIs: Testadas (conectividade)');
  console.log('   💾 Inserção no banco: Testada');
}

// Executar teste
testImageProcess().catch(console.error);