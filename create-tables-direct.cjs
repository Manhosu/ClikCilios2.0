const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: '.env.local' });

/**
 * Script para criar tabelas diretamente via API REST do Supabase
 */
async function createTables() {
  console.log('🚀 Criando tabelas via API REST do Supabase...');
  
  try {
    // Ler o arquivo SQL
    const sqlPath = path.join(__dirname, 'migrations', 'create_hotmart_integration_complete.sql');
    const sqlContent = fs.readFileSync(sqlPath, 'utf8');
    
    console.log('📋 Arquivo SQL carregado com sucesso!');
    
    // Dividir em comandos individuais
    const commands = sqlContent
      .split(';')
      .map(cmd => cmd.trim())
      .filter(cmd => cmd.length > 0 && !cmd.startsWith('--'));
    
    console.log(`🔍 Total de comandos: ${commands.length}`);
    
    // Executar comandos básicos de criação de tabela
    const basicCommands = commands.filter(cmd => 
      cmd.includes('CREATE TABLE') || 
      cmd.includes('CREATE EXTENSION') ||
      (cmd.includes('CREATE INDEX') && cmd.includes('IF NOT EXISTS'))
    );
    
    console.log(`📊 Comandos básicos a executar: ${basicCommands.length}`);
    
    for (let i = 0; i < basicCommands.length; i++) {
      const command = basicCommands[i];
      console.log(`\n🔄 Executando comando ${i + 1}/${basicCommands.length}...`);
      console.log(`📝 ${command.substring(0, 80)}...`);
      
      try {
        const response = await fetch(`${process.env.VITE_SUPABASE_URL}/rest/v1/rpc/exec_sql`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'apikey': process.env.VITE_SUPABASE_ANON_KEY,
            'Authorization': `Bearer ${process.env.VITE_SUPABASE_ANON_KEY}`
          },
          body: JSON.stringify({
            sql: command
          })
        });
        
        if (response.ok) {
          console.log('✅ Comando executado com sucesso!');
        } else {
          const error = await response.text();
          console.log(`⚠️  Comando falhou: ${error}`);
        }
      } catch (error) {
        console.log(`❌ Erro na execução: ${error.message}`);
      }
    }
    
    console.log('\n🎯 Tentando criar tabelas com SQL simplificado...');
    
    // SQL simplificado para criar apenas as tabelas essenciais
    const simplifiedSQL = `
      CREATE EXTENSION IF NOT EXISTS "pgcrypto";
      
      CREATE TABLE IF NOT EXISTS public.pre_users (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        username TEXT NOT NULL UNIQUE,
        password_hash TEXT,
        status TEXT NOT NULL DEFAULT 'available',
        metadata JSONB DEFAULT '{}'::jsonb,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
      );
      
      CREATE TABLE IF NOT EXISTS public.user_assignments (
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
      );
    `;
    
    console.log('📝 Executando SQL simplificado...');
    
    try {
      const response = await fetch(`${process.env.VITE_SUPABASE_URL}/rest/v1/rpc/exec_sql`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': process.env.VITE_SUPABASE_ANON_KEY,
          'Authorization': `Bearer ${process.env.VITE_SUPABASE_ANON_KEY}`
        },
        body: JSON.stringify({
          sql: simplifiedSQL
        })
      });
      
      if (response.ok) {
        console.log('✅ Tabelas criadas com sucesso!');
        return true;
      } else {
        const error = await response.text();
        console.log(`❌ Falha na criação: ${error}`);
      }
    } catch (error) {
      console.log(`❌ Erro na execução: ${error.message}`);
    }
    
    console.log('\n📋 Instruções manuais:');
    console.log('1. Acesse: https://supabase.com/dashboard');
    console.log('2. Faça login e acesse seu projeto');
    console.log('3. Vá para SQL Editor');
    console.log('4. Cole e execute o conteúdo de migrations/create_hotmart_integration_complete.sql');
    
    return false;
    
  } catch (error) {
    console.error('❌ Erro durante a execução:', error);
    return false;
  }
}

// Executa o script
if (require.main === module) {
  createTables().then(success => {
    if (success) {
      console.log('\n🎉 Processo concluído com sucesso!');
    } else {
      console.log('\n⚠️  Processo concluído com avisos.');
    }
  }).catch(console.error);
}

module.exports = { createTables };