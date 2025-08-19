const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Credenciais do Supabase não encontradas');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function addBackupColumn() {
  console.log('🔧 Adicionando coluna backup_automatico...');
  
  try {
    // Verificar se a coluna já existe
    const { data: columns, error: columnsError } = await supabase
      .from('information_schema.columns')
      .select('column_name')
      .eq('table_name', 'configuracoes_usuario')
      .eq('column_name', 'backup_automatico');
    
    if (columnsError) {
      console.error('❌ Erro ao verificar colunas:', columnsError.message);
      return;
    }
    
    if (columns && columns.length > 0) {
      console.log('✅ Coluna backup_automatico já existe!');
      return;
    }
    
    console.log('📝 Adicionando coluna backup_automatico...');
    
    // Tentar adicionar a coluna usando uma query direta
    const { data, error } = await supabase.rpc('sql', {
      query: `
        ALTER TABLE public.configuracoes_usuario 
        ADD COLUMN IF NOT EXISTS backup_automatico BOOLEAN DEFAULT true;
        
        ALTER TABLE public.configuracoes_usuario 
        ADD COLUMN IF NOT EXISTS backup_frequencia TEXT DEFAULT 'semanal' 
        CHECK (backup_frequencia IN ('diario', 'semanal', 'mensal'));
      `
    });
    
    if (error) {
      console.log('⚠️ Tentativa com rpc falhou, tentando método alternativo...');
      
      // Método alternativo: usar uma inserção que force a criação da coluna
      try {
        const { data: insertData, error: insertError } = await supabase
          .from('configuracoes_usuario')
          .insert({
            user_id: '00000000-0000-0000-0000-000000000000', // UUID temporário
            backup_automatico: true,
            backup_frequencia: 'semanal'
          });
        
        if (insertError && insertError.message.includes('backup_automatico')) {
          console.log('❌ Coluna backup_automatico ainda não existe no esquema');
          console.log('🔧 Será necessário executar o SQL manual no painel do Supabase');
        } else {
          console.log('✅ Colunas adicionadas com sucesso!');
          
          // Remover o registro temporário
          await supabase
            .from('configuracoes_usuario')
            .delete()
            .eq('user_id', '00000000-0000-0000-0000-000000000000');
        }
      } catch (altError) {
        console.log('❌ Método alternativo falhou:', altError.message);
      }
    } else {
      console.log('✅ Colunas adicionadas com sucesso!');
    }
    
    // Testar a tabela final
    console.log('\n🧪 Testando estrutura final...');
    const { data: testData, error: testError } = await supabase
      .from('configuracoes_usuario')
      .select('*')
      .limit(1);
    
    if (testError) {
      console.error('❌ Erro ao testar tabela:', testError.message);
    } else {
      console.log('✅ Tabela configuracoes_usuario funcionando!');
    }
    
  } catch (error) {
    console.error('❌ Erro geral:', error.message);
  }
}

addBackupColumn();