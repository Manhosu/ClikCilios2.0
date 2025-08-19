const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Configurações do Supabase
const supabaseUrl = 'https://gguxeqpayaangiplggme.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdndXhlcXBheWFhbmdpcGxnZ21lIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDk4NDYwOTYsImV4cCI6MjA2NTQyMjA5Nn0.WHusG12ZcOYtVSGUQVUT3Vf-MIbu_O6hlc3ha7yVnSE';
const serviceRoleKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdndXhlcXBheWFhbmdpcGxnZ21lIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0OTg0NjA5NiwiZXhwIjoyMDY1NDIyMDk2fQ.782bdkQ0eiNSqF55VzIyv4kMLoKecXCOq85apB1E7MI';

const supabase = createClient(supabaseUrl, supabaseKey);
const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey);

async function executeSQL(sql) {
  try {
    // Usar cliente admin para comandos DDL
    const { data, error } = await supabaseAdmin.rpc('exec_sql', { sql });
    if (error) throw error;
    return { success: true, data };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

async function applyFixedMigration() {
  console.log('🔧 Aplicando migração corrigida da tabela configuracoes_usuario...');
  
  // Comandos SQL individuais
  const commands = [
    // 1. Backup da tabela existente
    `CREATE TABLE IF NOT EXISTS configuracoes_usuario_backup AS 
     SELECT * FROM public.configuracoes_usuario;`,
    
    // 2. Remover tabela existente
    `DROP TABLE IF EXISTS public.configuracoes_usuario CASCADE;`,
    
    // 3. Criar nova tabela com estrutura correta
    `CREATE TABLE public.configuracoes_usuario (
      id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
      user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
      tema VARCHAR(20) DEFAULT 'claro' CHECK (tema IN ('claro', 'escuro')),
      notificacoes_email BOOLEAN DEFAULT true,
      notificacoes_push BOOLEAN DEFAULT true,
      idioma VARCHAR(10) DEFAULT 'pt-BR',
      timezone VARCHAR(50) DEFAULT 'America/Sao_Paulo',
      formato_data VARCHAR(20) DEFAULT 'DD/MM/YYYY',
      formato_hora VARCHAR(10) DEFAULT '24h',
      moeda VARCHAR(10) DEFAULT 'BRL',
      backup_automatico BOOLEAN DEFAULT true,
      backup_frequencia VARCHAR(20) DEFAULT 'semanal' CHECK (backup_frequencia IN ('diario', 'semanal', 'mensal')),
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      UNIQUE(user_id)
    );`,
    
    // 4. Criar índice
    `CREATE INDEX idx_configuracoes_usuario_user_id ON public.configuracoes_usuario(user_id);`,
    
    // 5. Habilitar RLS
    `ALTER TABLE public.configuracoes_usuario ENABLE ROW LEVEL SECURITY;`,
    
    // 6. Criar políticas RLS
    `CREATE POLICY "users_can_view_own_config" ON public.configuracoes_usuario
     FOR SELECT USING (auth.uid() = user_id);`,
    
    `CREATE POLICY "users_can_insert_own_config" ON public.configuracoes_usuario
     FOR INSERT WITH CHECK (auth.uid() = user_id);`,
    
    `CREATE POLICY "users_can_update_own_config" ON public.configuracoes_usuario
     FOR UPDATE USING (auth.uid() = user_id);`,
    
    `CREATE POLICY "users_can_delete_own_config" ON public.configuracoes_usuario
     FOR DELETE USING (auth.uid() = user_id);`
  ];
  
  let successCount = 0;
  let errorCount = 0;
  
  for (let i = 0; i < commands.length; i++) {
    const command = commands[i];
    console.log(`\n[${i + 1}/${commands.length}] Executando comando...`);
    
    const result = await executeSQL(command);
    
    if (result.success) {
      console.log(`✅ Comando ${i + 1} executado com sucesso`);
      successCount++;
    } else {
      console.error(`❌ Erro no comando ${i + 1}:`, result.error);
      errorCount++;
      
      // Continuar mesmo com erros
      if (result.error.includes('already exists') || 
          result.error.includes('does not exist')) {
        console.log('⚠️  Continuando...');
      }
    }
  }
  
  console.log(`\n📊 Resumo da migração:`);
  console.log(`✅ Sucessos: ${successCount}`);
  console.log(`❌ Erros: ${errorCount}`);
  
  // Testar inserção
  console.log('\n🧪 Testando inserção de configurações...');
  const testUserId = '00000000-0000-0000-0000-000000000001';
  
  const { data: insertData, error: insertError } = await supabase
    .from('configuracoes_usuario')
    .insert({
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
    })
    .select();
  
  if (insertError) {
    console.error('❌ Erro ao inserir configurações de teste:', insertError.message);
  } else {
    console.log('✅ Inserção de teste bem-sucedida!');
    
    // Limpar dados de teste
    await supabase
      .from('configuracoes_usuario')
      .delete()
      .eq('user_id', testUserId);
    
    console.log('🧹 Dados de teste removidos');
  }
  
  // Limpar backup
  await executeSQL('DROP TABLE IF EXISTS configuracoes_usuario_backup;');
  
  console.log('\n🎉 Migração concluída!');
}

// Executar migração
applyFixedMigration().catch(console.error);