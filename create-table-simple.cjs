const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

async function createTableSimple() {
  try {
    console.log('🚀 Verificando e criando tabela imagens_clientes...');
    
    const supabaseUrl = process.env.VITE_SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    
    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error('Variáveis de ambiente do Supabase não encontradas!');
    }
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    console.log('🔍 Verificando se a tabela já existe...');
    
    // Tentar fazer uma consulta simples para verificar se a tabela existe
    const { data, error } = await supabase
      .from('imagens_clientes')
      .select('id')
      .limit(1);
    
    if (!error) {
      console.log('✅ Tabela imagens_clientes já existe e está funcionando!');
      return;
    }
    
    if (error.code === 'PGRST116' || error.message.includes('does not exist')) {
      console.log('❌ Tabela não existe. Erro:', error.message);
      console.log('\n📋 VOCÊ PRECISA CRIAR A TABELA MANUALMENTE:');
      console.log('\n1. Acesse o dashboard do Supabase:');
      console.log('   https://supabase.com/dashboard');
      console.log('\n2. Selecione seu projeto');
      console.log('\n3. Vá em "SQL Editor"');
      console.log('\n4. Execute o seguinte SQL:');
      
      const createTableSQL = `
-- Criar tabela imagens_clientes
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
`;
      
      console.log(createTableSQL);
      console.log('\n5. Clique em "Run" para executar');
      console.log('\n6. Após criar a tabela, execute novamente este script para testar');
      
    } else {
      console.error('❌ Erro inesperado:', error);
    }
    
  } catch (error) {
    console.error('❌ Erro geral:', error.message);
  }
}

createTableSimple();