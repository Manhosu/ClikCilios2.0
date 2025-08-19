const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

async function recreateConfiguracoesTable() {
  console.log('🚀 Recriando tabela configuracoes_usuario\n');

  // Configurar cliente Supabase com service role
  const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    console.error('❌ Variáveis de ambiente não encontradas');
    return;
  }

  const supabase = createClient(supabaseUrl, serviceRoleKey);

  try {
    console.log('🗑️ Fazendo backup dos dados existentes...');
    
    // Fazer backup dos dados existentes
    const { data: backupData, error: backupError } = await supabase
      .from('configuracoes_usuario')
      .select('*');
    
    if (backupError) {
      console.log('⚠️ Erro no backup (tabela pode não existir):', backupError.message);
    } else {
      console.log(`📦 Backup realizado: ${backupData?.length || 0} registros`);
    }

    console.log('\n🗑️ Removendo tabela existente...');
    
    // Remover tabela existente
    const dropTableSQL = `
      DROP TABLE IF EXISTS public.configuracoes_usuario CASCADE;
    `;
    
    const { error: dropError } = await supabase.rpc('exec_sql', { sql: dropTableSQL });
    
    if (dropError) {
      console.log('⚠️ Erro ao remover tabela:', dropError.message);
    } else {
      console.log('✅ Tabela removida');
    }

    console.log('\n🏗️ Criando nova tabela...');
    
    // Criar nova tabela com estrutura completa
    const createTableSQL = `
      CREATE TABLE public.configuracoes_usuario (
        id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
        user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
        tema TEXT DEFAULT 'claro' CHECK (tema IN ('claro', 'escuro')),
        notificacoes_email BOOLEAN DEFAULT true,
        notificacoes_push BOOLEAN DEFAULT true,
        idioma TEXT DEFAULT 'pt-BR' CHECK (idioma IN ('pt-BR', 'en-US', 'es-ES')),
        timezone TEXT DEFAULT 'America/Sao_Paulo',
        formato_data TEXT DEFAULT 'DD/MM/YYYY' CHECK (formato_data IN ('DD/MM/YYYY', 'MM/DD/YYYY', 'YYYY-MM-DD')),
        formato_hora TEXT DEFAULT '24h' CHECK (formato_hora IN ('12h', '24h')),
        moeda TEXT DEFAULT 'BRL' CHECK (moeda IN ('BRL', 'USD', 'EUR')),
        backup_automatico BOOLEAN DEFAULT true,
        backup_frequencia TEXT DEFAULT 'semanal' CHECK (backup_frequencia IN ('diario', 'semanal', 'mensal')),
        created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
        UNIQUE(user_id)
      );
    `;
    
    const { error: createError } = await supabase.rpc('exec_sql', { sql: createTableSQL });
    
    if (createError) {
      console.log('❌ Erro ao criar tabela:', createError.message);
      return;
    }
    
    console.log('✅ Tabela criada');

    console.log('\n🔐 Configurando RLS e políticas...');
    
    // Configurar RLS e políticas
    const rlsSQL = `
      -- Habilitar RLS
      ALTER TABLE public.configuracoes_usuario ENABLE ROW LEVEL SECURITY;
      
      -- Criar índice
      CREATE INDEX idx_configuracoes_usuario_user_id ON public.configuracoes_usuario(user_id);
      
      -- Políticas RLS
      CREATE POLICY "users_can_view_own_config" ON public.configuracoes_usuario
        FOR SELECT USING (auth.uid() = user_id);
      
      CREATE POLICY "users_can_insert_own_config" ON public.configuracoes_usuario
        FOR INSERT WITH CHECK (auth.uid() = user_id);
      
      CREATE POLICY "users_can_update_own_config" ON public.configuracoes_usuario
        FOR UPDATE USING (auth.uid() = user_id);
      
      CREATE POLICY "users_can_delete_own_config" ON public.configuracoes_usuario
        FOR DELETE USING (auth.uid() = user_id);
    `;
    
    const { error: rlsError } = await supabase.rpc('exec_sql', { sql: rlsSQL });
    
    if (rlsError) {
      console.log('⚠️ Erro ao configurar RLS:', rlsError.message);
    } else {
      console.log('✅ RLS e políticas configuradas');
    }

    console.log('\n🧪 Testando nova estrutura...');
    
    // Testar inserção
    const testUserId = '00000000-0000-0000-0000-000000000001';
    const testConfig = {
      user_id: testUserId,
      tema: 'claro',
      notificacoes_email: true,
      notificacoes_push: true,
      idioma: 'pt-BR',
      timezone: 'America/Sao_Paulo',
      formato_data: 'DD/MM/YYYY',
      formato_hora: '24h',
      moeda: 'BRL',
      backup_automatico: true,
      backup_frequencia: 'semanal'
    };

    const { data: insertData, error: insertError } = await supabase
      .from('configuracoes_usuario')
      .insert(testConfig)
      .select();

    if (insertError) {
      console.log('❌ Erro no teste de inserção:', insertError.message);
    } else {
      console.log('✅ Teste de inserção bem-sucedido!');
      console.log('📊 Dados inseridos:', insertData[0]);
      
      // Limpar dados de teste
      await supabase
        .from('configuracoes_usuario')
        .delete()
        .eq('user_id', testUserId);
      
      console.log('🧹 Dados de teste removidos');
    }

    // Restaurar dados do backup se existirem
    if (backupData && backupData.length > 0) {
      console.log('\n📥 Restaurando dados do backup...');
      
      const { error: restoreError } = await supabase
        .from('configuracoes_usuario')
        .insert(backupData);
      
      if (restoreError) {
        console.log('⚠️ Erro ao restaurar backup:', restoreError.message);
        console.log('💾 Dados do backup salvos em backup-configuracoes.json');
        require('fs').writeFileSync('backup-configuracoes.json', JSON.stringify(backupData, null, 2));
      } else {
        console.log(`✅ ${backupData.length} registros restaurados`);
      }
    }

    console.log('\n✅ Tabela configuracoes_usuario recriada com sucesso!');
    console.log('\n📋 Estrutura final:');
    console.log('   - id (UUID, PK)');
    console.log('   - user_id (UUID, FK)');
    console.log('   - tema (TEXT)');
    console.log('   - notificacoes_email (BOOLEAN)');
    console.log('   - notificacoes_push (BOOLEAN)');
    console.log('   - idioma (TEXT)');
    console.log('   - timezone (TEXT)');
    console.log('   - formato_data (TEXT)');
    console.log('   - formato_hora (TEXT)');
    console.log('   - moeda (TEXT)');
    console.log('   - backup_automatico (BOOLEAN)');
    console.log('   - backup_frequencia (TEXT)');
    console.log('   - created_at (TIMESTAMP)');
    console.log('   - updated_at (TIMESTAMP)');
    
  } catch (error) {
    console.error('❌ Erro durante a recriação:', error.message);
  }
}

recreateConfiguracoesTable();