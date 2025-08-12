const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: '.env.local' });

/**
 * Script para criar tabelas usando SQL direto via PostgREST
 */
async function createTablesAdmin() {
  console.log('🚀 Criando tabelas via PostgREST...');
  
  try {
    // SQL simplificado para criar as tabelas essenciais
    const createTablesSQL = [
      // Extensão UUID
      'CREATE EXTENSION IF NOT EXISTS "pgcrypto"',
      
      // Tabela pre_users
      `CREATE TABLE IF NOT EXISTS public.pre_users (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        username TEXT NOT NULL UNIQUE,
        email TEXT NOT NULL UNIQUE,
        password_hash TEXT,
        status TEXT NOT NULL DEFAULT 'available',
        metadata JSONB DEFAULT '{}'::jsonb,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
      )`,
      
      // Tabela user_assignments
      `CREATE TABLE IF NOT EXISTS public.user_assignments (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        pre_user_id UUID,
        buyer_email TEXT,
        buyer_name TEXT,
        hotmart_transaction_id TEXT,
        hotmart_notification_id TEXT UNIQUE,
        event TEXT,
        assigned_at TIMESTAMPTZ DEFAULT NOW(),
        expires_at TIMESTAMPTZ,
        note TEXT
      )`,
      
      // Índices básicos
      'CREATE INDEX IF NOT EXISTS idx_pre_users_status ON public.pre_users(status)',
      'CREATE INDEX IF NOT EXISTS idx_pre_users_username ON public.pre_users(username)'
    ];
    
    console.log(`📊 Total de comandos SQL: ${createTablesSQL.length}`);
    
    // Tentar executar via query direta
    for (let i = 0; i < createTablesSQL.length; i++) {
      const sql = createTablesSQL[i];
      console.log(`\n🔄 Executando comando ${i + 1}/${createTablesSQL.length}...`);
      console.log(`📝 ${sql.substring(0, 60)}...`);
      
      try {
        // Tentar via query direta no PostgREST
        const response = await fetch(`${process.env.VITE_SUPABASE_URL}/rest/v1/`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/vnd.pgrst.object+json',
            'apikey': process.env.VITE_SUPABASE_ANON_KEY,
            'Authorization': `Bearer ${process.env.VITE_SUPABASE_ANON_KEY}`,
            'Prefer': 'return=minimal'
          },
          body: JSON.stringify({ query: sql })
        });
        
        console.log(`📊 Status: ${response.status}`);
        
        if (response.ok) {
          console.log('✅ Comando executado!');
        } else {
          const error = await response.text();
          console.log(`⚠️  Resposta: ${error.substring(0, 100)}...`);
        }
      } catch (error) {
        console.log(`❌ Erro: ${error.message}`);
      }
    }
    
    console.log('\n🔍 Verificando se as tabelas foram criadas...');
    
    // Tentar verificar se a tabela pre_users existe
    try {
      const response = await fetch(`${process.env.VITE_SUPABASE_URL}/rest/v1/pre_users?limit=1`, {
        method: 'GET',
        headers: {
          'apikey': process.env.VITE_SUPABASE_ANON_KEY,
          'Authorization': `Bearer ${process.env.VITE_SUPABASE_ANON_KEY}`
        }
      });
      
      if (response.ok) {
        console.log('✅ Tabela pre_users existe e está acessível!');
        return true;
      } else {
        const error = await response.text();
        console.log(`❌ Tabela não acessível: ${error}`);
      }
    } catch (error) {
      console.log(`❌ Erro ao verificar tabela: ${error.message}`);
    }
    
    console.log('\n📋 As tabelas precisam ser criadas manualmente.');
    console.log('\n🔧 Instruções:');
    console.log('1. Acesse o Supabase Dashboard');
    console.log('2. Vá para SQL Editor');
    console.log('3. Execute o seguinte SQL:');
    console.log('\n```sql');
    createTablesSQL.forEach(sql => {
      console.log(sql + ';');
    });
    console.log('```\n');
    
    return false;
    
  } catch (error) {
    console.error('❌ Erro durante a execução:', error);
    return false;
  }
}

// Executa o script
if (require.main === module) {
  createTablesAdmin().then(success => {
    if (success) {
      console.log('\n🎉 Tabelas criadas com sucesso!');
    } else {
      console.log('\n⚠️  Criação manual necessária.');
    }
  }).catch(console.error);
}

module.exports = { createTablesAdmin };