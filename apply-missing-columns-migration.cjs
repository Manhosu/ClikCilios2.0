const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

async function applyMigration() {
  console.log('🔧 Testando e corrigindo estrutura da tabela imagens_clientes...');
  
  const supabaseUrl = process.env.VITE_SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  
  if (!supabaseUrl || !supabaseServiceKey) {
    console.error('❌ Variáveis de ambiente do Supabase não configuradas');
    return;
  }
  
  const supabase = createClient(supabaseUrl, supabaseServiceKey);
  
  try {
    console.log('📋 1. Testando inserção com colunas atuais...');
    
    // Testar inserção básica
    const testData = {
      cliente_id: 'test-cliente',
      user_id: '00000000-0000-0000-0000-000000000000', // UUID válido
      nome: 'teste-migração',
      url: 'https://example.com/test.jpg',
      tipo: 'teste',
      descricao: 'Teste de migração'
    };
    
    const { data: insertResult, error: insertError } = await supabase
      .from('imagens_clientes')
      .insert(testData)
      .select();
    
    if (insertError) {
      console.log('⚠️ Erro na inserção básica:', insertError.message);
      
      if (insertError.message.includes('foreign key constraint')) {
        console.log('📝 Problema: user_id não existe na tabela auth.users');
        
        // Buscar um user_id válido usando uma query direta
        const { data: users, error: usersError } = await supabase
          .from('imagens_clientes')
          .select('user_id')
          .limit(1);
        
        if (usersError) {
          console.error('❌ Erro ao buscar usuários:', usersError);
          return;
        }
        
        if (users && users.length > 0) {
           testData.user_id = users[0].user_id;
          console.log(`✅ Usando user_id válido: ${testData.user_id}`);
          
          const { data: retryResult, error: retryError } = await supabase
            .from('imagens_clientes')
            .insert(testData)
            .select();
          
          if (retryError) {
            console.log('⚠️ Erro na segunda tentativa:', retryError.message);
          } else {
            console.log('✅ Inserção básica funcionou!');
            
            // Limpar o teste
            await supabase
              .from('imagens_clientes')
              .delete()
              .eq('id', retryResult[0].id);
          }
        }
      }
    } else {
      console.log('✅ Inserção básica funcionou!');
      
      // Limpar o teste
      if (insertResult && insertResult.length > 0) {
        await supabase
          .from('imagens_clientes')
          .delete()
          .eq('id', insertResult[0].id);
      }
    }
    
    console.log('📋 2. Testando inserção com colunas estendidas...');
    
    // Buscar um user_id válido para o teste
     const { data: validUsers, error: validUsersError } = await supabase
       .from('imagens_clientes')
       .select('user_id')
       .limit(1);
    
    if (validUsersError || !validUsers || validUsers.length === 0) {
      console.error('❌ Não foi possível encontrar usuários válidos');
      return;
    }
    
    const extendedTestData = {
      cliente_id: 'test-cliente-extended',
      user_id: validUsers[0].user_id,
      nome: 'teste-migração-extended',
      url: 'https://example.com/test-extended.jpg',
      tipo: 'teste',
      descricao: 'Teste de migração com colunas estendidas',
      filename: 'test-extended.jpg',
      original_name: 'test-extended-original.jpg',
      file_size: 12345,
      mime_type: 'image/jpeg',
      width: 800,
      height: 600,
      storage_path: 'MCP/test-extended.jpg'
    };
    
    const { data: extendedResult, error: extendedError } = await supabase
      .from('imagens_clientes')
      .insert(extendedTestData)
      .select();
    
    if (extendedError) {
      console.log('❌ Erro na inserção estendida:', extendedError.message);
      
      if (extendedError.message.includes('Could not find')) {
        console.log('📝 Confirmado: Colunas estendidas não existem na tabela');
        console.log('📋 Colunas faltantes detectadas: filename, original_name, file_size, mime_type, width, height, storage_path');
        
        console.log('\n📝 INSTRUÇÕES PARA CORRIGIR:');
        console.log('1. Acesse o painel do Supabase: https://supabase.com/dashboard');
        console.log('2. Vá para SQL Editor');
        console.log('3. Execute o seguinte SQL:');
        console.log('\n-- Adicionar colunas faltantes');
        console.log('ALTER TABLE imagens_clientes ');
        console.log('ADD COLUMN IF NOT EXISTS filename TEXT,');
        console.log('ADD COLUMN IF NOT EXISTS original_name TEXT,');
        console.log('ADD COLUMN IF NOT EXISTS file_size BIGINT,');
        console.log('ADD COLUMN IF NOT EXISTS mime_type TEXT,');
        console.log('ADD COLUMN IF NOT EXISTS width INTEGER,');
        console.log('ADD COLUMN IF NOT EXISTS height INTEGER,');
        console.log('ADD COLUMN IF NOT EXISTS storage_path TEXT;');
        console.log('\n-- Atualizar dados existentes');
        console.log('UPDATE imagens_clientes SET ');
        console.log('  filename = COALESCE(filename, nome || \'.jpg\'),');
        console.log('  original_name = COALESCE(original_name, nome),');
        console.log('  file_size = COALESCE(file_size, 0),');
        console.log('  mime_type = COALESCE(mime_type, \'image/jpeg\'),');
        console.log('  width = COALESCE(width, 800),');
        console.log('  height = COALESCE(height, 600),');
        console.log('  storage_path = COALESCE(storage_path, \'MCP/\' || id || \'.jpg\')\nWHERE filename IS NULL OR original_name IS NULL OR file_size IS NULL OR mime_type IS NULL OR width IS NULL OR height IS NULL OR storage_path IS NULL;');
        console.log('\n-- Criar índices');
        console.log('CREATE INDEX IF NOT EXISTS idx_imagens_clientes_filename ON imagens_clientes(filename);');
        console.log('CREATE INDEX IF NOT EXISTS idx_imagens_clientes_mime_type ON imagens_clientes(mime_type);');
        console.log('CREATE INDEX IF NOT EXISTS idx_imagens_clientes_storage_path ON imagens_clientes(storage_path);');
        
      }
    } else {
      console.log('✅ Inserção estendida funcionou! Todas as colunas existem.');
      
      // Limpar o teste
      if (extendedResult && extendedResult.length > 0) {
        await supabase
          .from('imagens_clientes')
          .delete()
          .eq('id', extendedResult[0].id);
      }
    }
    
    console.log('\n📊 3. Verificando imagens existentes...');
    const { data: existingImages, error: existingError } = await supabase
      .from('imagens_clientes')
      .select('id, nome, url, created_at')
      .order('created_at', { ascending: false })
      .limit(5);
    
    if (existingError) {
      console.error('❌ Erro ao buscar imagens:', existingError);
    } else {
      console.log(`✅ Total de imagens encontradas: ${existingImages.length}`);
      if (existingImages.length > 0) {
        console.log('📄 Últimas imagens:');
        existingImages.forEach((img, index) => {
          console.log(`   ${index + 1}. ${img.nome} - ${img.created_at}`);
        });
      }
    }
    
    console.log('\n✅ Diagnóstico concluído!');
    
  } catch (error) {
    console.error('❌ Erro geral:', error);
  }
}

applyMigration();