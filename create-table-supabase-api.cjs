const https = require('https');
require('dotenv').config();

async function createTableViaAPI() {
  try {
    console.log('🚀 Criando tabela imagens_clientes via API REST do Supabase...');
    
    const supabaseUrl = process.env.VITE_SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    
    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error('Variáveis de ambiente do Supabase não encontradas!');
    }
    
    const projectRef = supabaseUrl.replace('https://', '').replace('.supabase.co', '');
    
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
    
    const postData = JSON.stringify({
      query: createTableSQL
    });
    
    const options = {
      hostname: 'api.supabase.com',
      port: 443,
      path: `/v1/projects/${projectRef}/database/query`,
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${supabaseServiceKey}`,
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData)
      }
    };
    
    console.log('📡 Enviando requisição para API do Supabase...');
    
    const response = await new Promise((resolve, reject) => {
      const req = https.request(options, (res) => {
        let data = '';
        
        res.on('data', (chunk) => {
          data += chunk;
        });
        
        res.on('end', () => {
          resolve({
            statusCode: res.statusCode,
            data: data
          });
        });
      });
      
      req.on('error', (error) => {
        reject(error);
      });
      
      req.write(postData);
      req.end();
    });
    
    console.log('📊 Status da resposta:', response.statusCode);
    console.log('📄 Resposta:', response.data);
    
    if (response.statusCode === 200 || response.statusCode === 201) {
      console.log('✅ Tabela criada com sucesso!');
      
      // Testar se a tabela foi criada
      console.log('\n🧪 Testando tabela...');
      const { createClient } = require('@supabase/supabase-js');
      const supabase = createClient(supabaseUrl, supabaseServiceKey);
      
      const { data, error } = await supabase
        .from('imagens_clientes')
        .select('count')
        .limit(1);
      
      if (error) {
        console.error('❌ Erro ao testar tabela:', error.message);
      } else {
        console.log('✅ Tabela imagens_clientes funcionando perfeitamente!');
      }
    } else {
      console.error('❌ Erro ao criar tabela. Status:', response.statusCode);
      console.error('Resposta:', response.data);
    }
    
  } catch (error) {
    console.error('❌ Erro:', error.message);
    
    // Fallback: mostrar instruções manuais
    console.log('\n📋 INSTRUÇÕES MANUAIS PARA CRIAR A TABELA:');
    console.log('1. Acesse: https://supabase.com/dashboard/project/' + process.env.VITE_SUPABASE_URL.replace('https://', '').replace('.supabase.co', ''));
    console.log('2. Vá em "SQL Editor"');
    console.log('3. Execute o SQL abaixo:');
    console.log('\n' + createTableSQL);
  }
}

createTableViaAPI();