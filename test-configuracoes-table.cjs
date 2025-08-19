const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Credenciais do Supabase não encontradas');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function testConfiguracoesTable() {
  console.log('🔍 Verificando estrutura da tabela configuracoes_usuario...');
  
  try {
    // Tentar verificar se a tabela existe
    const { data: tables, error: tablesError } = await supabase
      .from('information_schema.tables')
      .select('table_name')
      .eq('table_name', 'configuracoes_usuario')
      .eq('table_schema', 'public');
    
    if (tablesError) {
      console.log('⚠️ Não foi possível verificar tabelas via information_schema');
      console.log('Erro:', tablesError.message);
    } else {
      console.log('📋 Tabelas encontradas:', tables);
    }
    
    // Tentar fazer uma consulta simples na tabela
    console.log('\n🔍 Testando consulta na tabela configuracoes_usuario...');
    const { data: testData, error: testError } = await supabase
      .from('configuracoes_usuario')
      .select('*')
      .limit(1);
    
    if (testError) {
      console.log('❌ Erro ao consultar configuracoes_usuario:');
      console.log('Código:', testError.code);
      console.log('Mensagem:', testError.message);
      console.log('Detalhes:', testError.details);
      
      if (testError.message.includes('does not exist')) {
        console.log('\n💡 A tabela configuracoes_usuario não existe!');
        console.log('Será necessário criar a tabela.');
      }
    } else {
      console.log('✅ Tabela configuracoes_usuario existe');
      console.log('Dados de exemplo:', testData);
    }
    
    // Tentar inserir dados de teste para verificar colunas
    console.log('\n🧪 Testando inserção de configurações...');
    const testConfig = {
      user_id: '00000000-0000-0000-0000-000000000000', // UUID fictício
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
      console.log('❌ Erro ao inserir configurações de teste:');
      console.log('Código:', insertError.code);
      console.log('Mensagem:', insertError.message);
      console.log('Detalhes:', insertError.details);
      
      if (insertError.message.includes('column') && insertError.message.includes('does not exist')) {
        console.log('\n💡 Problema identificado: Coluna inexistente!');
        const match = insertError.message.match(/column "([^"]+)" of relation/);
        if (match) {
          console.log(`A coluna "${match[1]}" não existe na tabela.`);
        }
      }
    } else {
      console.log('✅ Inserção de teste bem-sucedida:', insertData);
      
      // Limpar dados de teste
      await supabase
        .from('configuracoes_usuario')
        .delete()
        .eq('user_id', '00000000-0000-0000-0000-000000000000');
      console.log('🧹 Dados de teste removidos');
    }
    
  } catch (error) {
    console.error('❌ Erro geral:', error);
  }
}

// Função para criar a tabela se não existir
async function createConfiguracoesTable() {
  console.log('\n🔨 Criando tabela configuracoes_usuario...');
  
  const createTableSQL = `
    CREATE TABLE IF NOT EXISTS public.configuracoes_usuario (
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
    
    -- Índices
    CREATE INDEX IF NOT EXISTS idx_configuracoes_usuario_user_id ON public.configuracoes_usuario(user_id);
    
    -- RLS
    ALTER TABLE public.configuracoes_usuario ENABLE ROW LEVEL SECURITY;
    
    -- Políticas RLS
    DROP POLICY IF EXISTS "users_can_view_own_config" ON public.configuracoes_usuario;
    DROP POLICY IF EXISTS "users_can_insert_own_config" ON public.configuracoes_usuario;
    DROP POLICY IF EXISTS "users_can_update_own_config" ON public.configuracoes_usuario;
    DROP POLICY IF EXISTS "users_can_delete_own_config" ON public.configuracoes_usuario;
    
    CREATE POLICY "users_can_view_own_config" ON public.configuracoes_usuario
      FOR SELECT USING (auth.uid() = user_id);
    
    CREATE POLICY "users_can_insert_own_config" ON public.configuracoes_usuario
      FOR INSERT WITH CHECK (auth.uid() = user_id);
    
    CREATE POLICY "users_can_update_own_config" ON public.configuracoes_usuario
      FOR UPDATE USING (auth.uid() = user_id);
    
    CREATE POLICY "users_can_delete_own_config" ON public.configuracoes_usuario
      FOR DELETE USING (auth.uid() = user_id);
  `;
  
  console.log('📝 SQL para criar tabela:');
  console.log(createTableSQL);
  console.log('\n💡 Execute este SQL no painel do Supabase (SQL Editor)');
}

async function main() {
  console.log('🚀 Iniciando verificação da tabela configuracoes_usuario\n');
  
  await testConfiguracoesTable();
  await createConfiguracoesTable();
  
  console.log('\n✅ Verificação concluída!');
}

main().catch(console.error);