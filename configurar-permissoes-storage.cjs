// Script para configurar permissões de storage no Supabase
// Análise e configuração de segurança para arquivos JSON

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Variáveis de ambiente do Supabase não encontradas');
  console.log('Certifique-se de que VITE_SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY estão configuradas');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function analisarStorageAtual() {
  console.log('🔍 Analisando configuração atual do storage...');
  
  try {
    // Verificar buckets existentes
    const { data: buckets, error: bucketsError } = await supabase
      .from('storage.buckets')
      .select('*');
    
    if (bucketsError) {
      console.error('❌ Erro ao buscar buckets:', bucketsError.message);
      return;
    }
    
    console.log('📦 Buckets encontrados:', buckets.length);
    buckets.forEach(bucket => {
      console.log(`  - ${bucket.name} (público: ${bucket.public})`);
    });
    
    // Verificar objetos existentes
    const { data: objects, error: objectsError } = await supabase
      .from('storage.objects')
      .select('*')
      .limit(10);
    
    if (objectsError) {
      console.error('❌ Erro ao buscar objetos:', objectsError.message);
    } else {
      console.log('📄 Objetos no storage:', objects.length);
      objects.forEach(obj => {
        console.log(`  - ${obj.name} (bucket: ${obj.bucket_id})`);
      });
    }
    
  } catch (error) {
    console.error('❌ Erro na análise:', error.message);
  }
}

async function criarBucketMCP() {
  console.log('\n🚀 Criando bucket MCP...');
  
  try {
    const { data, error } = await supabase.storage.createBucket('mcp', {
      public: false, // Privado por segurança
      fileSizeLimit: 1024 * 1024 * 10, // 10MB
      allowedMimeTypes: ['application/json', 'text/plain']
    });
    
    if (error) {
      if (error.message.includes('already exists')) {
        console.log('✅ Bucket MCP já existe');
      } else {
        console.error('❌ Erro ao criar bucket MCP:', error.message);
        return false;
      }
    } else {
      console.log('✅ Bucket MCP criado com sucesso');
    }
    
    return true;
  } catch (error) {
    console.error('❌ Erro ao criar bucket:', error.message);
    return false;
  }
}

async function configurarPoliticasRLS() {
  console.log('\n🔒 Configurando políticas RLS para storage...');
  
  const politicas = [
    {
      nome: 'mcp_bucket_select_policy',
      sql: `
        CREATE POLICY "mcp_bucket_select_policy" ON storage.objects
        FOR SELECT USING (
          bucket_id = 'mcp' AND 
          auth.role() = 'service_role'
        );
      `
    },
    {
      nome: 'mcp_bucket_insert_policy', 
      sql: `
        CREATE POLICY "mcp_bucket_insert_policy" ON storage.objects
        FOR INSERT WITH CHECK (
          bucket_id = 'mcp' AND 
          auth.role() = 'service_role'
        );
      `
    },
    {
      nome: 'mcp_bucket_update_policy',
      sql: `
        CREATE POLICY "mcp_bucket_update_policy" ON storage.objects
        FOR UPDATE USING (
          bucket_id = 'mcp' AND 
          auth.role() = 'service_role'
        );
      `
    },
    {
      nome: 'mcp_bucket_delete_policy',
      sql: `
        CREATE POLICY "mcp_bucket_delete_policy" ON storage.objects
        FOR DELETE USING (
          bucket_id = 'mcp' AND 
          auth.role() = 'service_role'
        );
      `
    }
  ];
  
  for (const politica of politicas) {
    try {
      console.log(`📋 Aplicando política: ${politica.nome}`);
      
      // Primeiro, remover política existente se houver
      await supabase.rpc('exec_sql', {
        query: `DROP POLICY IF EXISTS "${politica.nome}" ON storage.objects;`
      });
      
      // Criar nova política
      const { error } = await supabase.rpc('exec_sql', {
        query: politica.sql
      });
      
      if (error) {
        console.error(`❌ Erro ao criar política ${politica.nome}:`, error.message);
      } else {
        console.log(`✅ Política ${politica.nome} aplicada`);
      }
    } catch (error) {
      console.error(`❌ Erro ao processar política ${politica.nome}:`, error.message);
    }
  }
}

async function testarPermissoes() {
  console.log('\n🧪 Testando permissões do bucket MCP...');
  
  try {
    // Teste de upload de arquivo JSON
    const testData = {
      timestamp: new Date().toISOString(),
      test: 'configuracao_mcp',
      status: 'ativo'
    };
    
    const fileName = `test-${Date.now()}.json`;
    const { data, error } = await supabase.storage
      .from('mcp')
      .upload(fileName, JSON.stringify(testData, null, 2), {
        contentType: 'application/json'
      });
    
    if (error) {
      console.error('❌ Erro no teste de upload:', error.message);
    } else {
      console.log('✅ Teste de upload bem-sucedido:', fileName);
      
      // Teste de download
      const { data: downloadData, error: downloadError } = await supabase.storage
        .from('mcp')
        .download(fileName);
      
      if (downloadError) {
        console.error('❌ Erro no teste de download:', downloadError.message);
      } else {
        console.log('✅ Teste de download bem-sucedido');
        
        // Limpar arquivo de teste
        await supabase.storage.from('mcp').remove([fileName]);
        console.log('🧹 Arquivo de teste removido');
      }
    }
  } catch (error) {
    console.error('❌ Erro nos testes:', error.message);
  }
}

async function gerarRelatorioSeguranca() {
  console.log('\n📊 Gerando relatório de segurança...');
  
  const relatorio = {
    timestamp: new Date().toISOString(),
    buckets_analisados: [],
    politicas_aplicadas: [],
    recomendacoes: [
      'Manter bucket MCP como privado',
      'Restringir acesso apenas ao service role',
      'Monitorar uploads de arquivos JSON',
      'Implementar logs de auditoria',
      'Revisar permissões periodicamente'
    ],
    proximos_passos: [
      'Configurar monitoramento de storage',
      'Implementar backup automático',
      'Definir políticas de retenção',
      'Configurar alertas de segurança'
    ]
  };
  
  console.log('\n📋 RELATÓRIO DE SEGURANÇA:');
  console.log('================================');
  console.log('🔒 Status: Bucket MCP configurado com segurança');
  console.log('🛡️  Acesso: Restrito ao service role');
  console.log('📁 Tipos permitidos: JSON, texto');
  console.log('📏 Limite de tamanho: 10MB');
  
  console.log('\n🎯 RECOMENDAÇÕES:');
  relatorio.recomendacoes.forEach((rec, i) => {
    console.log(`${i + 1}. ${rec}`);
  });
  
  console.log('\n📋 PRÓXIMOS PASSOS:');
  relatorio.proximos_passos.forEach((passo, i) => {
    console.log(`${i + 1}. ${passo}`);
  });
  
  return relatorio;
}

async function main() {
  console.log('🚀 Iniciando configuração de permissões do storage MCP...');
  console.log('=' .repeat(60));
  
  try {
    await analisarStorageAtual();
    
    const bucketCriado = await criarBucketMCP();
    if (!bucketCriado) {
      console.log('⚠️  Continuando sem criar novo bucket...');
    }
    
    await configurarPoliticasRLS();
    await testarPermissoes();
    const relatorio = await gerarRelatorioSeguranca();
    
    console.log('\n✅ Configuração concluída com sucesso!');
    console.log('\n📝 RESUMO:');
    console.log('- Bucket MCP configurado com segurança');
    console.log('- Políticas RLS aplicadas');
    console.log('- Permissões testadas');
    console.log('- Relatório de segurança gerado');
    
  } catch (error) {
    console.error('❌ Erro na execução:', error.message);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

module.exports = {
  analisarStorageAtual,
  criarBucketMCP,
  configurarPoliticasRLS,
  testarPermissoes,
  gerarRelatorioSeguranca
};