const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_ANON_KEY
);

async function verificarTabelaClientes() {
  console.log('🔍 VERIFICANDO TABELA CLIENTES');
  console.log('==============================');
  
  console.log('\n1. Verificando se a tabela existe...');
  try {
    const { data, error } = await supabase
      .from('clientes')
      .select('*')
      .limit(0);
    
    if (error) {
      console.log('❌ Tabela não existe ou não é acessível:', error.message);
      return;
    } else {
      console.log('✅ Tabela clientes existe e é acessível');
    }
  } catch (error) {
    console.log('❌ Erro:', error.message);
    return;
  }
  
  console.log('\n2. Verificando se a tabela foi criada corretamente...');
  console.log('\n📋 DIAGNÓSTICO:');
  console.log('O erro "new row violates row-level security policy" indica que:');
  console.log('\n❌ PROBLEMA IDENTIFICADO:');
  console.log('- A tabela clientes tem RLS (Row Level Security) habilitado');
  console.log('- As políticas RLS exigem que auth.uid() = user_id');
  console.log('- Mas você não está autenticado via Supabase Auth');
  console.log('- Está usando apenas a chave anônima');
  
  console.log('\n🔧 SOLUÇÕES POSSÍVEIS:');
  console.log('\n1. CRIAR A TABELA CLIENTES MANUALMENTE:');
  console.log('   Execute este SQL no Supabase Dashboard > SQL Editor:');
  console.log('');
  console.log('   -- Remover tabela existente se houver');
  console.log('   DROP TABLE IF EXISTS public.clientes CASCADE;');
  console.log('');
  console.log('   -- Criar tabela clientes');
  console.log('   CREATE TABLE IF NOT EXISTS public.clientes (');
  console.log('       id UUID DEFAULT gen_random_uuid() PRIMARY KEY,');
  console.log('       user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,');
  console.log('       nome VARCHAR(255) NOT NULL,');
  console.log('       email VARCHAR(255),');
  console.log('       telefone VARCHAR(50),');
  console.log('       data_nascimento DATE,');
  console.log('       observacoes TEXT,');
  console.log('       created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),');
  console.log('       updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()');
  console.log('   );');
  console.log('');
  console.log('   -- Habilitar RLS');
  console.log('   ALTER TABLE public.clientes ENABLE ROW LEVEL SECURITY;');
  console.log('');
  console.log('   -- Criar políticas RLS');
  console.log('   CREATE POLICY "Usuários podem ver seus clientes" ON public.clientes');
  console.log('       FOR SELECT USING (auth.uid() = user_id);');
  console.log('');
  console.log('   CREATE POLICY "Usuários podem inserir clientes" ON public.clientes');
  console.log('       FOR INSERT WITH CHECK (auth.uid() = user_id);');
  console.log('');
  console.log('   CREATE POLICY "Usuários podem atualizar seus clientes" ON public.clientes');
  console.log('       FOR UPDATE USING (auth.uid() = user_id);');
  console.log('');
  console.log('   CREATE POLICY "Usuários podem deletar seus clientes" ON public.clientes');
  console.log('       FOR DELETE USING (auth.uid() = user_id);');
  
  console.log('\n2. VERIFICAR AUTENTICAÇÃO:');
  console.log('   - Certifique-se de que o usuário está logado');
  console.log('   - O user.id deve ser um UUID válido do Supabase Auth');
  console.log('   - Não use UUIDs fictícios');
  
  console.log('\n3. TESTAR COM USUÁRIO REAL:');
  console.log('   - Faça login na aplicação');
  console.log('   - Use o user.id real retornado pelo useAuth()');
  console.log('   - Tente criar o cliente novamente');
  
  console.log('\n==============================');
  console.log('🏁 VERIFICAÇÃO CONCLUÍDA');
}

verificarTabelaClientes().catch(console.error);