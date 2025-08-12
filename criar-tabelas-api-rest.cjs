require('dotenv').config({ path: '.env.local' });
const https = require('https');

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Variáveis de ambiente não encontradas!');
  process.exit(1);
}

// SQL para criar as tabelas atualizadas
const createTablesSQL = `
-- Criar tabela pre_users (schema atualizado)
CREATE TABLE IF NOT EXISTS public.pre_users (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    username TEXT UNIQUE NOT NULL,
    email TEXT UNIQUE NOT NULL,
    status TEXT DEFAULT 'available' CHECK (status IN ('available', 'assigned', 'used')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Criar tabela user_assignments (schema atualizado)
CREATE TABLE IF NOT EXISTS public.user_assignments (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    pre_user_id UUID REFERENCES public.pre_users(id) ON DELETE CASCADE,
    assigned_to TEXT NOT NULL,
    assigned_by TEXT NOT NULL,
    assigned_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    expires_at TIMESTAMP WITH TIME ZONE,
    notes TEXT
);

-- Habilitar RLS (Row Level Security)
ALTER TABLE public.pre_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_assignments ENABLE ROW LEVEL SECURITY;

-- Políticas simples para testes (USAR COM CAUTELA EM PRODUÇÃO)
CREATE POLICY IF NOT EXISTS "pre_users_all_access" ON public.pre_users FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY IF NOT EXISTS "user_assignments_all_access" ON public.user_assignments FOR ALL USING (true) WITH CHECK (true);

-- Inserir dados de teste
INSERT INTO public.pre_users (username, email, status) VALUES 
    ('usuario_teste_1', 'usuario_teste_1@ciliosclick.com', 'available'),
    ('usuario_teste_2', 'usuario_teste_2@ciliosclick.com', 'available')
ON CONFLICT (username) DO NOTHING;
`;

function makeHttpsRequest(options, data = null) {
  return new Promise((resolve, reject) => {
    const req = https.request(options, (res) => {
      let responseData = '';
      
      res.on('data', (chunk) => {
        responseData += chunk;
      });
      
      res.on('end', () => {
        try {
          const parsed = JSON.parse(responseData);
          resolve({ statusCode: res.statusCode, data: parsed });
        } catch (e) {
          resolve({ statusCode: res.statusCode, data: responseData });
        }
      });
    });
    
    req.on('error', (error) => {
      reject(error);
    });
    
    if (data) {
      req.write(data);
    }
    
    req.end();
  });
}

async function criarTabelasViaAPI() {
  console.log('🚀 CRIANDO TABELAS VIA API REST DO SUPABASE');
  console.log('URL:', supabaseUrl);
  
  const url = new URL(supabaseUrl);
  const hostname = url.hostname;
  
  // Tentar diferentes endpoints da API
  const endpoints = [
    '/rest/v1/rpc/exec_sql',
    '/rest/v1/rpc/execute_sql',
    '/functions/v1/exec-sql',
    '/edge-functions/v1/exec-sql'
  ];
  
  for (const endpoint of endpoints) {
    console.log(`\n🔄 Tentando endpoint: ${endpoint}`);
    
    const options = {
      hostname: hostname,
      port: 443,
      path: endpoint,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${supabaseKey}`,
        'apikey': supabaseKey,
        'Prefer': 'return=minimal'
      }
    };
    
    const requestData = JSON.stringify({
      query: createTablesSQL
    });
    
    try {
      const response = await makeHttpsRequest(options, requestData);
      console.log(`📊 Status: ${response.statusCode}`);
      console.log(`📄 Resposta:`, response.data);
      
      if (response.statusCode === 200 || response.statusCode === 201) {
        console.log('✅ Sucesso! Tabelas criadas via', endpoint);
        return true;
      }
    } catch (error) {
      console.log(`❌ Erro no endpoint ${endpoint}:`, error.message);
    }
  }
  
  // Se nenhum endpoint funcionou, tentar criar via SQL direto
  console.log('\n🔄 Tentando abordagem alternativa...');
  
  const sqlCommands = createTablesSQL
    .split(';')
    .map(cmd => cmd.trim())
    .filter(cmd => cmd.length > 0 && !cmd.startsWith('--'));
  
  console.log(`📝 Executando ${sqlCommands.length} comandos SQL individuais...`);
  
  for (let i = 0; i < sqlCommands.length; i++) {
    const command = sqlCommands[i];
    console.log(`\n${i + 1}. Executando: ${command.substring(0, 50)}...`);
    
    const options = {
      hostname: hostname,
      port: 443,
      path: '/rest/v1/rpc/exec_sql',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${supabaseKey}`,
        'apikey': supabaseKey
      }
    };
    
    const requestData = JSON.stringify({
      sql: command + ';'
    });
    
    try {
      const response = await makeHttpsRequest(options, requestData);
      if (response.statusCode === 200 || response.statusCode === 201) {
        console.log(`✅ Comando ${i + 1} executado com sucesso`);
      } else {
        console.log(`⚠️  Comando ${i + 1} falhou:`, response.data);
      }
    } catch (error) {
      console.log(`❌ Erro no comando ${i + 1}:`, error.message);
    }
  }
  
  return false;
}

async function verificarCriacao() {
  console.log('\n🔍 VERIFICANDO SE AS TABELAS FORAM CRIADAS...');
  
  const { createClient } = require('@supabase/supabase-js');
  const supabase = createClient(supabaseUrl, supabaseKey);
  
  // Verificar pre_users
  const { data: preUsersData, error: preUsersError } = await supabase
    .from('pre_users')
    .select('id, username, email, status')
    .limit(1);
  
  if (preUsersError) {
    console.log('❌ Tabela pre_users ainda não existe:', preUsersError.code);
  } else {
    console.log('✅ Tabela pre_users criada com sucesso!');
    console.log('📊 Dados:', preUsersData);
  }
  
  // Verificar user_assignments
  const { data: assignmentsData, error: assignmentsError } = await supabase
    .from('user_assignments')
    .select('*')
    .limit(1);
  
  if (assignmentsError) {
    console.log('❌ Tabela user_assignments ainda não existe:', assignmentsError.code);
  } else {
    console.log('✅ Tabela user_assignments criada com sucesso!');
    console.log('📊 Dados:', assignmentsData);
  }
}

async function main() {
  try {
    await criarTabelasViaAPI();
    await new Promise(resolve => setTimeout(resolve, 2000));
    await verificarCriacao();
  } catch (error) {
    console.error('❌ Erro geral:', error.message);
  }
}

main();