require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Variáveis de ambiente do Supabase não configuradas');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function applySQLMigration() {
  console.log('🔧 Aplicando migração SQL para adicionar colunas faltantes...');
  
  try {
    // SQL para adicionar colunas
    const addColumnsSQL = `
      ALTER TABLE imagens_clientes
      ADD COLUMN IF NOT EXISTS filename TEXT,
      ADD COLUMN IF NOT EXISTS original_name TEXT,
      ADD COLUMN IF NOT EXISTS file_size BIGINT,
      ADD COLUMN IF NOT EXISTS mime_type TEXT,
      ADD COLUMN IF NOT EXISTS width INTEGER,
      ADD COLUMN IF NOT EXISTS height INTEGER,
      ADD COLUMN IF NOT EXISTS storage_path TEXT;
    `;
    
    console.log('📋 1. Adicionando colunas...');
    const { data: addResult, error: addError } = await supabase.rpc('exec_sql', {
      sql: addColumnsSQL
    });
    
    if (addError) {
      console.log('⚠️ Erro ao adicionar colunas (pode ser que já existam):', addError.message);
    } else {
      console.log('✅ Colunas adicionadas com sucesso!');
    }
    
    // SQL para atualizar dados existentes
    const updateDataSQL = `
      UPDATE imagens_clientes SET
        filename = COALESCE(filename, nome || '.jpg'),
        original_name = COALESCE(original_name, nome),
        file_size = COALESCE(file_size, 0),
        mime_type = COALESCE(mime_type, 'image/jpeg'),
        width = COALESCE(width, 800),
        height = COALESCE(height, 600),
        storage_path = COALESCE(storage_path, 'MCP/' || id || '.jpg')
      WHERE filename IS NULL OR original_name IS NULL OR file_size IS NULL 
         OR mime_type IS NULL OR width IS NULL OR height IS NULL OR storage_path IS NULL;
    `;
    
    console.log('📋 2. Atualizando dados existentes...');
    const { data: updateResult, error: updateError } = await supabase.rpc('exec_sql', {
      sql: updateDataSQL
    });
    
    if (updateError) {
      console.log('⚠️ Erro ao atualizar dados:', updateError.message);
    } else {
      console.log('✅ Dados atualizados com sucesso!');
    }
    
    // SQL para criar índices
    const createIndexesSQL = `
      CREATE INDEX IF NOT EXISTS idx_imagens_clientes_filename ON imagens_clientes(filename);
      CREATE INDEX IF NOT EXISTS idx_imagens_clientes_mime_type ON imagens_clientes(mime_type);
      CREATE INDEX IF NOT EXISTS idx_imagens_clientes_storage_path ON imagens_clientes(storage_path);
    `;
    
    console.log('📋 3. Criando índices...');
    const { data: indexResult, error: indexError } = await supabase.rpc('exec_sql', {
      sql: createIndexesSQL
    });
    
    if (indexError) {
      console.log('⚠️ Erro ao criar índices:', indexError.message);
    } else {
      console.log('✅ Índices criados com sucesso!');
    }
    
    // Testar inserção com todas as colunas
    console.log('📋 4. Testando inserção completa...');
    const testData = {
      cliente_id: 'test-migration-' + Date.now(),
      user_id: '1b26b095-efef-40f9-a5b2-6f9306f755ef', // Usuário que sabemos que existe
      nome: 'teste-migração-completa',
      url: 'https://example.com/test-migration.jpg',
      filename: 'test-migration.jpg',
      original_name: 'test-migration-original.jpg',
      file_size: 2048,
      mime_type: 'image/jpeg',
      width: 1024,
      height: 768,
      storage_path: 'MCP/test-migration.jpg'
    };
    
    const { data: insertData, error: insertError } = await supabase
      .from('imagens_clientes')
      .insert(testData)
      .select();
    
    if (insertError) {
      console.log('❌ Erro na inserção de teste:', insertError.message);
    } else {
      console.log('✅ Inserção completa funcionou! Migração bem-sucedida!');
      console.log('📄 Dados inseridos:', insertData[0]);
      
      // Limpar dados de teste
      await supabase
        .from('imagens_clientes')
        .delete()
        .eq('id', insertData[0].id);
      
      console.log('🧹 Dados de teste removidos.');
    }
    
    console.log('\n✅ Migração SQL concluída!');
    
  } catch (error) {
    console.error('❌ Erro geral na migração:', error);
  }
}

applySQLMigration();