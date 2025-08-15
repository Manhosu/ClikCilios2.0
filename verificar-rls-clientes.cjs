require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

// Cliente admin para verificar políticas
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

async function verificarRLSClientes() {
  console.log('🔍 VERIFICANDO POLÍTICAS RLS DA TABELA CLIENTES\n');

  try {
    // 1. Verificar se RLS está habilitado
    console.log('1. 🔒 Verificando se RLS está habilitado...');
    
    const { data: tableInfo, error: tableError } = await supabaseAdmin
      .from('pg_class')
      .select('relname, relrowsecurity')
      .eq('relname', 'clientes')
      .single();

    if (tableError) {
      console.log(`   ❌ Erro ao verificar tabela: ${tableError.message}`);
    } else {
      console.log(`   📋 RLS habilitado: ${tableInfo.relrowsecurity ? 'SIM' : 'NÃO'}`);
    }

    // 2. Listar políticas existentes
    console.log('\n2. 📋 Listando políticas existentes...');
    
    const { data: policies, error: policiesError } = await supabaseAdmin
      .from('pg_policies')
      .select('*')
      .eq('tablename', 'clientes');

    if (policiesError) {
      console.log(`   ❌ Erro ao buscar políticas: ${policiesError.message}`);
    } else if (policies.length === 0) {
      console.log('   ⚠️ Nenhuma política encontrada!');
    } else {
      console.log(`   ✅ ${policies.length} política(s) encontrada(s):`);
      policies.forEach((policy, index) => {
        console.log(`\n   📋 Política ${index + 1}:`);
        console.log(`      Nome: ${policy.policyname}`);
        console.log(`      Comando: ${policy.cmd}`);
        console.log(`      Permissiva: ${policy.permissive}`);
        console.log(`      Roles: ${policy.roles}`);
        console.log(`      Qual: ${policy.qual}`);
        console.log(`      With Check: ${policy.with_check}`);
      });
    }

    // 3. Verificar estrutura da tabela clientes
    console.log('\n3. 🏗️ Verificando estrutura da tabela clientes...');
    
    const { data: columns, error: columnsError } = await supabaseAdmin
      .from('information_schema.columns')
      .select('column_name, data_type, is_nullable, column_default')
      .eq('table_name', 'clientes')
      .eq('table_schema', 'public');

    if (columnsError) {
      console.log(`   ❌ Erro ao verificar colunas: ${columnsError.message}`);
    } else {
      console.log('   ✅ Colunas da tabela:');
      columns.forEach(col => {
        console.log(`      ${col.column_name}: ${col.data_type} (${col.is_nullable === 'YES' ? 'NULL' : 'NOT NULL'})`);
      });
    }

    // 4. Testar acesso direto com diferentes contextos
    console.log('\n4. 🧪 Testando acesso com diferentes contextos...');
    
    // Teste 1: Service role (deve funcionar)
    console.log('\n   🔑 Teste com service role:');
    const { data: testService, error: serviceError } = await supabaseAdmin
      .from('clientes')
      .select('count')
      .single();
    
    if (serviceError) {
      console.log(`      ❌ Erro: ${serviceError.message}`);
    } else {
      console.log('      ✅ Acesso permitido com service role');
    }

    // Teste 2: Anon role
    console.log('\n   👤 Teste com anon role:');
    const supabaseAnon = createClient(supabaseUrl, process.env.VITE_SUPABASE_ANON_KEY);
    
    const { data: testAnon, error: anonError } = await supabaseAnon
      .from('clientes')
      .select('count')
      .single();
    
    if (anonError) {
      console.log(`      ❌ Erro: ${anonError.message}`);
    } else {
      console.log('      ✅ Acesso permitido com anon role');
    }

    // 5. Verificar se existe função auth.uid()
    console.log('\n5. 🔐 Verificando função auth.uid()...');
    
    const { data: authUid, error: authError } = await supabaseAdmin
      .rpc('auth.uid')
      .catch(err => ({ data: null, error: err }));
    
    if (authError) {
      console.log(`   ❌ Erro ao chamar auth.uid(): ${authError.message}`);
    } else {
      console.log(`   ✅ auth.uid() retornou: ${authUid || 'null'}`);
    }

    // 6. Criar política de teste se necessário
    console.log('\n6. 🔧 Verificando necessidade de criar políticas...');
    
    if (!policies || policies.length === 0) {
      console.log('\n   ⚠️ NENHUMA POLÍTICA ENCONTRADA!');
      console.log('   💡 SOLUÇÃO: Criar políticas RLS para a tabela clientes');
      
      console.log('\n   🔧 Criando políticas básicas...');
      
      // Política para SELECT
      const selectPolicy = `
        CREATE POLICY "Usuários podem ver seus próprios clientes" ON clientes
        FOR SELECT USING (auth.uid() = user_id);
      `;
      
      // Política para INSERT
      const insertPolicy = `
        CREATE POLICY "Usuários podem criar clientes" ON clientes
        FOR INSERT WITH CHECK (auth.uid() = user_id);
      `;
      
      // Política para UPDATE
      const updatePolicy = `
        CREATE POLICY "Usuários podem atualizar seus próprios clientes" ON clientes
        FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
      `;
      
      // Política para DELETE
      const deletePolicy = `
        CREATE POLICY "Usuários podem deletar seus próprios clientes" ON clientes
        FOR DELETE USING (auth.uid() = user_id);
      `;
      
      console.log('\n   📋 Políticas que devem ser criadas:');
      console.log('   1. SELECT:', selectPolicy.trim());
      console.log('   2. INSERT:', insertPolicy.trim());
      console.log('   3. UPDATE:', updatePolicy.trim());
      console.log('   4. DELETE:', deletePolicy.trim());
      
      // Executar criação das políticas
      try {
        await supabaseAdmin.rpc('exec_sql', { sql: selectPolicy });
        console.log('   ✅ Política SELECT criada');
        
        await supabaseAdmin.rpc('exec_sql', { sql: insertPolicy });
        console.log('   ✅ Política INSERT criada');
        
        await supabaseAdmin.rpc('exec_sql', { sql: updatePolicy });
        console.log('   ✅ Política UPDATE criada');
        
        await supabaseAdmin.rpc('exec_sql', { sql: deletePolicy });
        console.log('   ✅ Política DELETE criada');
        
      } catch (policyError) {
        console.log(`   ❌ Erro ao criar políticas: ${policyError.message}`);
        console.log('   💡 Execute manualmente no SQL Editor do Supabase');
      }
    }

    console.log('\n📋 RESUMO DO DIAGNÓSTICO:');
    
    if (!policies || policies.length === 0) {
      console.log('\n❌ PROBLEMA IDENTIFICADO: Faltam políticas RLS');
      console.log('\n🔧 SOLUÇÃO: Criar políticas RLS para permitir CRUD baseado em auth.uid()');
    } else {
      console.log('\n✅ Políticas RLS existem');
      console.log('\n🔍 VERIFICAR: Se as políticas estão corretas e se auth.uid() funciona');
    }

  } catch (error) {
    console.error('❌ Erro durante verificação:', error.message);
  }
}

// Executar verificação
verificarRLSClientes();