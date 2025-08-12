require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Variáveis de ambiente não encontradas!');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function criarTabelas() {
  console.log('🔧 CRIANDO TABELAS DIRETAMENTE VIA SQL');
  console.log('URL:', supabaseUrl);
  
  try {
    // SQL para criar as tabelas
    const sql = `
      CREATE TABLE IF NOT EXISTS public.pre_users (
        id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
        username TEXT UNIQUE NOT NULL,
        email TEXT UNIQUE NOT NULL,
        status TEXT DEFAULT 'available' CHECK (status IN ('available', 'assigned', 'used')),
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
      
      CREATE TABLE IF NOT EXISTS public.user_assignments (
        id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
        pre_user_id UUID REFERENCES public.pre_users(id) ON DELETE CASCADE,
        assigned_to TEXT NOT NULL,
        assigned_by TEXT NOT NULL,
        assigned_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        expires_at TIMESTAMP WITH TIME ZONE,
        notes TEXT
      );
    `;
    
    console.log('\n📝 Executando SQL...');
    
    // Usar o método correto para executar SQL
    const { data, error } = await supabase
      .from('_supabase_migrations')
      .select('*')
      .limit(1);
    
    if (error && error.code === '42P01') {
      console.log('⚠️  Tabela de migrações não existe, tentando método alternativo...');
    }
    
    // Tentar executar via REST API diretamente
    const response = await fetch(`${supabaseUrl}/rest/v1/rpc/exec_sql`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${supabaseKey}`,
        'apikey': supabaseKey
      },
      body: JSON.stringify({ query: sql })
    });
    
    if (response.ok) {
      console.log('✅ SQL executado com sucesso via RPC!');
    } else {
      console.log('❌ Falha na execução via RPC, tentando método direto...');
      
      // Método alternativo: executar cada comando separadamente
      const commands = sql.split(';').filter(cmd => cmd.trim());
      
      for (const command of commands) {
        if (command.trim()) {
          console.log(`Executando: ${command.trim().substring(0, 50)}...`);
          
          const directResponse = await fetch(`${supabaseUrl}/rest/v1/`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/sql',
              'Authorization': `Bearer ${supabaseKey}`,
              'apikey': supabaseKey
            },
            body: command.trim()
          });
          
          if (directResponse.ok) {
            console.log('✅ Comando executado com sucesso');
          } else {
            const errorText = await directResponse.text();
            console.log('❌ Erro:', errorText);
          }
        }
      }
    }
    
    // Testar se as tabelas foram criadas
    console.log('\n🧪 Testando criação das tabelas...');
    
    const { data: testData, error: testError } = await supabase
      .from('pre_users')
      .select('count', { count: 'exact', head: true });
    
    if (testError) {
      console.log('❌ Tabela pre_users ainda não existe:', testError.message);
    } else {
      console.log('✅ Tabela pre_users criada com sucesso!');
    }
    
  } catch (error) {
    console.error('❌ Erro geral:', error.message);
  }
}

criarTabelas();