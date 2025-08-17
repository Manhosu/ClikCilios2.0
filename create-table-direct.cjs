const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

async function createTable() {
  try {
    console.log('🚀 Criando tabela imagens_clientes diretamente...');
    
    const supabaseUrl = process.env.VITE_SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    
    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error('Variáveis de ambiente do Supabase não encontradas!');
    }
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    console.log('📄 Criando tabela imagens_clientes...');
    
    // Criar a tabela diretamente
    const createTableSQL = `
      CREATE TABLE IF NOT EXISTS public.imagens_clientes (
        id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
        cliente_id VARCHAR(255),
        user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
        nome VARCHAR(255) NOT NULL,
        url TEXT NOT NULL,
        tipo VARCHAR(50),
        descricao TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
    `;
    
    // Usar uma query direta ao PostgreSQL
    const { data, error } = await supabase
      .from('_temp_check')
      .select('*')
      .limit(1);
    
    // Se chegou até aqui, vamos tentar criar a tabela usando uma abordagem diferente
    console.log('📝 Tentando criar tabela via SQL direto...');
    
    // Vamos usar o cliente para fazer uma inserção que force a criação da estrutura
    try {
      // Primeiro, vamos verificar se a tabela já existe
      const { data: existingData, error: existingError } = await supabase
        .from('imagens_clientes')
        .select('id')
        .limit(1);
      
      if (!existingError) {
        console.log('✅ Tabela imagens_clientes já existe!');
        return;
      }
      
      console.log('❌ Tabela não existe. Erro:', existingError.message);
      
      // Se a tabela não existe, vamos criá-la usando uma abordagem manual
      console.log('🔧 Criando estrutura manualmente...');
      
      // Como não podemos executar DDL diretamente, vamos usar o dashboard do Supabase
      console.log('\n📋 INSTRUÇÕES MANUAIS:');
      console.log('1. Acesse o dashboard do Supabase: https://supabase.com/dashboard');
      console.log('2. Vá para o seu projeto');
      console.log('3. Acesse "SQL Editor"');
      console.log('4. Execute o seguinte SQL:');
      console.log('\n' + createTableSQL);
      console.log('\n5. Depois execute também:');
      console.log(`
        -- Criar índices
        CREATE INDEX IF NOT EXISTS idx_imagens_clientes_user_id ON public.imagens_clientes(user_id);
        CREATE INDEX IF NOT EXISTS idx_imagens_clientes_cliente_id ON public.imagens_clientes(cliente_id);
        
        -- Habilitar RLS
        ALTER TABLE public.imagens_clientes ENABLE ROW LEVEL SECURITY;
        
        -- Políticas RLS
        CREATE POLICY "Users can view own images" ON public.imagens_clientes
          FOR SELECT USING (auth.uid() = user_id);
        
        CREATE POLICY "Users can insert own images" ON public.imagens_clientes
          FOR INSERT WITH CHECK (auth.uid() = user_id);
        
        CREATE POLICY "Users can update own images" ON public.imagens_clientes
          FOR UPDATE USING (auth.uid() = user_id);
        
        CREATE POLICY "Users can delete own images" ON public.imagens_clientes
          FOR DELETE USING (auth.uid() = user_id);
      `);
      
    } catch (tableError) {
      console.error('❌ Erro ao verificar tabela:', tableError.message);
    }
    
  } catch (error) {
    console.error('❌ Erro geral:', error.message);
  }
}

createTable();