require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function criarTabelasBasicas() {
  console.log('🚀 CRIANDO TABELAS BÁSICAS DIRETAMENTE');
  console.log('URL:', supabaseUrl);
  console.log('');
  
  console.log('⚠️  IMPORTANTE: Este script não pode criar tabelas via JavaScript.');
  console.log('As tabelas devem ser criadas manualmente no Supabase Dashboard.');
  console.log('');
  
  console.log('📋 INSTRUÇÕES DETALHADAS:');
  console.log('1. Acesse: https://supabase.com/dashboard/project/pdkhcvioaiopwsrburxp');
  console.log('2. Faça login na sua conta Supabase');
  console.log('3. Vá para "SQL Editor" no menu lateral');
  console.log('4. Cole e execute APENAS este SQL básico:');
  console.log('');
  console.log('-- SQL BÁSICO PARA COPIAR E COLAR:');
  console.log('-- =====================================');
  console.log('');
  console.log('CREATE TABLE IF NOT EXISTS public.pre_users (');
  console.log('    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,');
  console.log('    username TEXT UNIQUE NOT NULL,');
  console.log('    email TEXT UNIQUE NOT NULL,');
  console.log('    password_hash TEXT,');
  console.log('    status TEXT NOT NULL DEFAULT \'available\' CHECK (status IN (\'available\', \'occupied\', \'suspended\')),');
  console.log("    metadata JSONB DEFAULT '{}'::jsonb,");
  console.log('    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),');
  console.log('    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()');
  console.log(');');
  console.log('');
  console.log('CREATE TABLE IF NOT EXISTS public.user_assignments (');
  console.log('    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,');
  console.log('    pre_user_id UUID REFERENCES public.pre_users(id) ON DELETE CASCADE,');
  console.log('    assigned_to TEXT NOT NULL,');
  console.log('    assigned_by TEXT NOT NULL,');
  console.log('    assigned_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),');
  console.log('    expires_at TIMESTAMP WITH TIME ZONE,');
  console.log('    notes TEXT');
  console.log(');');
  console.log('');
  console.log('-- =====================================');
  console.log('');
  console.log('5. Clique em "Run" para executar');
  console.log('6. Verifique se aparece "Success. No rows returned" ou similar');
  console.log('7. Execute novamente: node teste-simples-tabelas.cjs');
  console.log('');
  
  console.log('🔍 Testando conexão atual...');
  try {
    const { data, error } = await supabase.auth.getSession();
    console.log('✅ Conexão com Supabase OK');
  } catch (e) {
    console.log('❌ Erro de conexão:', e.message);
  }
  
  console.log('');
  console.log('💡 DICA: Se mesmo após executar o SQL as tabelas não aparecerem,');
  console.log('   verifique se você está logado na conta correta do Supabase.');
}

criarTabelasBasicas();