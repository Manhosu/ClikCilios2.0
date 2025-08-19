require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');
const fetch = require('node-fetch');
const FormData = require('form-data');
const fs = require('fs');
const path = require('path');

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Variáveis de ambiente do Supabase não configuradas');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function testImageUploadSimple() {
  console.log('🚀 Testando processo de salvamento de imagens\n');

  try {
    // 1. Verificar estrutura da tabela imagens_clientes
    console.log('🔍 1. Verificando estrutura da tabela imagens_clientes...');
    const { data: tableInfo, error: tableError } = await supabase
      .from('imagens_clientes')
      .select('*')
      .limit(1);

    if (tableError) {
      console.log(`❌ Erro ao acessar tabela: ${tableError.message}`);
    } else {
      console.log('✅ Tabela imagens_clientes acessível');
    }

    // 2. Verificar colunas da tabela
    console.log('\n📋 2. Verificando colunas da tabela...');
    const { data: columns, error: columnsError } = await supabase.rpc('get_table_columns', {
      table_name: 'imagens_clientes'
    });

    if (columnsError) {
      console.log(`ℹ️ Não foi possível obter colunas via RPC: ${columnsError.message}`);
      
      // Tentar inserção de teste para verificar colunas
      console.log('🧪 Testando inserção para verificar colunas...');
      const testData = {
        cliente_id: 1,
        user_id: '00000000-0000-0000-0000-000000000000',
        nome: 'teste.jpg',
        url: 'test-url',
        tipo: 'image/jpeg',
        descricao: 'Teste de estrutura'
      };
      
      const { data: insertTest, error: insertError } = await supabase
        .from('imagens_clientes')
        .insert(testData)
        .select();
      
      if (insertError) {
        console.log(`❌ Erro na inserção de teste: ${insertError.message}`);
        
        // Tentar com colunas adicionais
        console.log('🔄 Tentando com colunas adicionais...');
        const extendedTestData = {
          ...testData,
          filename: 'teste.jpg',
          original_name: 'teste.jpg',
          file_size: 1024,
          mime_type: 'image/jpeg',
          width: 100,
          height: 100,
          storage_path: '/test/path'
        };
        
        const { data: extendedInsert, error: extendedError } = await supabase
          .from('imagens_clientes')
          .insert(extendedTestData)
          .select();
        
        if (extendedError) {
          console.log(`❌ Erro na inserção estendida: ${extendedError.message}`);
        } else {
          console.log('✅ Inserção estendida bem-sucedida!');
          console.log('📄 Dados inseridos:', JSON.stringify(extendedInsert[0], null, 2));
          
          // Remover o registro de teste
          await supabase
            .from('imagens_clientes')
            .delete()
            .eq('id', extendedInsert[0].id);
          console.log('🧹 Registro de teste removido');
        }
      } else {
        console.log('✅ Inserção básica bem-sucedida!');
        console.log('📄 Dados inseridos:', JSON.stringify(insertTest[0], null, 2));
        
        // Remover o registro de teste
        await supabase
          .from('imagens_clientes')
          .delete()
          .eq('id', insertTest[0].id);
        console.log('🧹 Registro de teste removido');
      }
    } else {
      console.log('✅ Colunas da tabela:', columns);
    }

    // 3. Verificar storage buckets
    console.log('\n📦 3. Verificando storage buckets...');
    const { data: buckets, error: bucketsError } = await supabase.storage.listBuckets();
    
    if (bucketsError) {
      console.log(`❌ Erro ao listar buckets: ${bucketsError.message}`);
    } else {
      console.log(`✅ Buckets encontrados: ${buckets.map(b => b.name).join(', ')}`);
      
      // Verificar bucket MCP
      const mcpBucket = buckets.find(b => b.name === 'MCP' || b.name === 'mcp');
      if (mcpBucket) {
        console.log(`📁 Bucket ${mcpBucket.name} encontrado`);
        
        // Listar arquivos no bucket
        const { data: files, error: filesError } = await supabase.storage
          .from(mcpBucket.name)
          .list('', { limit: 5 });
        
        if (filesError) {
          console.log(`❌ Erro ao listar arquivos: ${filesError.message}`);
        } else {
          console.log(`📄 Arquivos no bucket: ${files.length}`);
          if (files.length > 0) {
            files.forEach((file, index) => {
              console.log(`   ${index + 1}. ${file.name} (${file.metadata?.size || 'tamanho desconhecido'})`);
            });
          }
        }
      } else {
        console.log('❌ Bucket MCP não encontrado');
      }
    }

    // 4. Testar conectividade das APIs
    console.log('\n🌐 4. Testando conectividade das APIs...');
    
    // Testar list-images
    const listResponse = await fetch('http://localhost:3001/api/list-images');
    console.log(`📊 list-images status: ${listResponse.status}`);
    
    // Testar save-client-image
    const saveResponse = await fetch('http://localhost:3001/api/save-client-image');
    console.log(`📊 save-client-image status: ${saveResponse.status}`);
    
    if (listResponse.status === 401 && saveResponse.status === 401) {
      console.log('✅ APIs estão respondendo e requerem autenticação (comportamento esperado)');
    } else {
      console.log('ℹ️ Status inesperado das APIs - verificar implementação');
    }

    // 5. Verificar imagens existentes
    console.log('\n📸 5. Verificando imagens existentes...');
    const { data: existingImages, error: imagesError } = await supabase
      .from('imagens_clientes')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(5);

    if (imagesError) {
      console.log(`❌ Erro ao buscar imagens: ${imagesError.message}`);
    } else {
      console.log(`✅ Imagens encontradas: ${existingImages.length}`);
      if (existingImages.length > 0) {
        console.log('📄 Últimas imagens:');
        existingImages.forEach((img, index) => {
          const name = img.nome || img.filename || img.original_name || 'sem nome';
          const size = img.file_size ? ` (${img.file_size} bytes)` : '';
          console.log(`   ${index + 1}. ${name}${size} - ${img.created_at}`);
        });
      }
    }

    // 6. Verificar usuários
    console.log('\n👥 6. Verificando usuários...');
    const { data: users, error: usersError } = await supabase.auth.admin.listUsers();
    
    if (usersError) {
      console.log(`❌ Erro ao buscar usuários: ${usersError.message}`);
    } else {
      console.log(`✅ Total de usuários: ${users.users.length}`);
      if (users.users.length > 0) {
        console.log('📧 Primeiros usuários:');
        users.users.slice(0, 3).forEach((user, index) => {
          console.log(`   ${index + 1}. ${user.email} - ${user.created_at}`);
        });
      }
    }

  } catch (error) {
    console.error('❌ Erro durante o teste:', error.message);
    console.error('Stack:', error.stack);
  }

  console.log('\n✅ Teste de processo de salvamento finalizado!');
  console.log('\n📋 PRÓXIMOS PASSOS:');
  console.log('   1. Execute os SQLs do arquivo INSTRUCOES-SQL-MANUAL.md no Supabase');
  console.log('   2. Teste o upload através da interface web em http://localhost:3000');
  console.log('   3. Verifique se as imagens são salvas corretamente no banco e storage');
}

testImageUploadSimple();