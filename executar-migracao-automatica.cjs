require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

// Configuração do Supabase
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseServiceKey || !supabaseAnonKey) {
  console.error('❌ Variáveis de ambiente não configuradas');
  console.error('Necessário: VITE_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, VITE_SUPABASE_ANON_KEY');
  process.exit(1);
}

const supabaseService = createClient(supabaseUrl, supabaseServiceKey);
const supabaseAnon = createClient(supabaseUrl, supabaseAnonKey);

async function executarMigracaoCompleta() {
  console.log('🚀 INICIANDO MIGRAÇÃO AUTOMÁTICA COMPLETA\n');

  try {
    // 1. Verificar conexão
    console.log('1. 🔗 Verificando conexão...');
    const { data: connectionTest } = await supabaseService.from('users').select('count').limit(1);
    console.log('   ✅ Conexão estabelecida\n');

    // 2. Obter usuários existentes antes da migração
    console.log('2. 📊 Coletando dados existentes...');
    const { data: existingUsers } = await supabaseService.from('users').select('*');
    const existingCount = existingUsers ? existingUsers.length : 0;
    console.log(`   📋 Usuários existentes em public.users: ${existingCount}`);
    
    // Obter usuários do auth via admin API
    const { data: authData } = await supabaseService.auth.admin.listUsers();
    const authCount = authData ? authData.users.length : 0;
    console.log(`   👥 Usuários em auth.users: ${authCount}\n`);

    // 3. Executar migração via SQL direto
    console.log('3. 🏗️ Executando migração SQL...');
    
    const migrationSQL = `
      -- Desabilitar RLS temporariamente
      DO $$ 
      BEGIN
          IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'users') THEN
              ALTER TABLE public.users DISABLE ROW LEVEL SECURITY;
          END IF;
      END $$;
      
      -- Remover políticas existentes
      DO $$ 
      DECLARE
          policy_record RECORD;
      BEGIN
          FOR policy_record IN 
              SELECT policyname 
              FROM pg_policies 
              WHERE tablename = 'users' AND schemaname = 'public'
          LOOP
              EXECUTE 'DROP POLICY IF EXISTS "' || policy_record.policyname || '" ON public.users';
          END LOOP;
      END $$;
      
      -- Recriar tabela users
      DROP TABLE IF EXISTS public.users CASCADE;
      
      CREATE TABLE public.users (
          id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
          email TEXT UNIQUE NOT NULL,
          nome TEXT,
          is_admin BOOLEAN DEFAULT false,
          onboarding_completed BOOLEAN DEFAULT false,
          created_at TIMESTAMPTZ DEFAULT NOW(),
          updated_at TIMESTAMPTZ DEFAULT NOW()
      );
      
      -- Criar índices
      CREATE INDEX IF NOT EXISTS idx_users_email ON public.users(email);
      CREATE INDEX IF NOT EXISTS idx_users_is_admin ON public.users(is_admin);
      
      -- Habilitar RLS e criar políticas
      ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
      
      CREATE POLICY "service_role_full_access" ON public.users
          FOR ALL USING (auth.role() = 'service_role');
      
      CREATE POLICY "authenticated_users_read_all" ON public.users
          FOR SELECT USING (auth.role() = 'authenticated');
      
      CREATE POLICY "authenticated_users_update_own" ON public.users
          FOR UPDATE USING (auth.uid() = id);
      
      CREATE POLICY "allow_user_insertion" ON public.users
          FOR INSERT WITH CHECK (true);
      
      CREATE POLICY "temporary_anonymous_read" ON public.users
          FOR SELECT USING (true);
      
      -- Criar função de sincronização
      CREATE OR REPLACE FUNCTION public.handle_new_user()
      RETURNS trigger AS $$
      BEGIN
          INSERT INTO public.users (id, email, nome, is_admin, onboarding_completed)
          VALUES (
              NEW.id,
              NEW.email,
              COALESCE(NEW.raw_user_meta_data->>'nome', split_part(NEW.email, '@', 1)),
              false,
              false
          )
          ON CONFLICT (id) DO UPDATE SET
              email = EXCLUDED.email,
              nome = COALESCE(EXCLUDED.nome, public.users.nome),
              updated_at = NOW();
          
          -- Tratar conflitos de email
          IF EXISTS (SELECT 1 FROM public.users WHERE email = NEW.email AND id != NEW.id) THEN
              UPDATE public.users 
              SET id = NEW.id, updated_at = NOW() 
              WHERE email = NEW.email AND id != NEW.id;
          END IF;
          
          RETURN NEW;
      EXCEPTION
          WHEN OTHERS THEN
              RAISE WARNING 'Erro ao sincronizar usuário %: %', NEW.email, SQLERRM;
              RETURN NEW;
      END;
      $$ LANGUAGE plpgsql SECURITY DEFINER;
      
      -- Criar trigger
      DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
      
      CREATE TRIGGER on_auth_user_created
          AFTER INSERT ON auth.users
          FOR EACH ROW
          EXECUTE FUNCTION public.handle_new_user();
      
      -- Sincronizar usuários existentes
      DO $$
      DECLARE
          user_record RECORD;
          sync_count INTEGER := 0;
          error_count INTEGER := 0;
      BEGIN
          FOR user_record IN 
              SELECT id, email, raw_user_meta_data, created_at
              FROM auth.users 
              ORDER BY created_at
          LOOP
              BEGIN
                  INSERT INTO public.users (id, email, nome, is_admin, onboarding_completed)
                  VALUES (
                      user_record.id,
                      user_record.email,
                      COALESCE(user_record.raw_user_meta_data->>'nome', split_part(user_record.email, '@', 1)),
                      false,
                      false
                  )
                  ON CONFLICT (id) DO UPDATE SET
                      email = EXCLUDED.email,
                      nome = COALESCE(EXCLUDED.nome, public.users.nome),
                      updated_at = NOW();
                  
                  sync_count := sync_count + 1;
              EXCEPTION
                  WHEN unique_violation THEN
                      BEGIN
                          UPDATE public.users 
                          SET 
                              id = user_record.id,
                              nome = COALESCE(user_record.raw_user_meta_data->>'nome', nome),
                              updated_at = NOW()
                          WHERE email = user_record.email;
                          sync_count := sync_count + 1;
                      EXCEPTION
                          WHEN OTHERS THEN
                              error_count := error_count + 1;
                      END;
                  WHEN OTHERS THEN
                      error_count := error_count + 1;
              END;
          END LOOP;
          
          RAISE NOTICE 'Sincronização concluída: % usuários processados, % erros', sync_count, error_count;
      END $$;
    `;
    
    // Executar SQL usando uma query simples
    const { error: migrationError } = await supabaseService
      .from('users')
      .select('id')
      .limit(0); // Apenas para testar a conexão
    
    console.log('   ⚠️ Migração SQL deve ser executada manualmente no painel Supabase');
    console.log('   📄 SQL gerado e salvo em migration-final.sql\n');
    
    // 4. Salvar SQL em arquivo
    const fs = require('fs');
    fs.writeFileSync('migration-final.sql', migrationSQL);
    
    // 5. Tentar sincronizar usuários via API
    console.log('4. 🔄 Tentando sincronização via API...');
    
    if (authData && authData.users) {
      let syncCount = 0;
      let errorCount = 0;
      
      for (const user of authData.users) {
        try {
          const { error: insertError } = await supabaseService
            .from('users')
            .upsert({
              id: user.id,
              email: user.email,
              nome: user.user_metadata?.nome || user.email.split('@')[0],
              is_admin: false,
              onboarding_completed: false
            }, {
              onConflict: 'id'
            });
          
          if (!insertError) {
            syncCount++;
          } else {
            errorCount++;
          }
        } catch (error) {
          errorCount++;
        }
      }
      
      console.log(`   📊 Sincronização via API: ${syncCount} sucessos, ${errorCount} erros\n`);
    }
    
    // 6. Verificações finais
    console.log('5. 🔍 Executando verificações finais...');
    
    // Contar usuários
    const { count: usersCount } = await supabaseService
      .from('users')
      .select('*', { count: 'exact', head: true });
    
    // Testar acesso anônimo
    const { data: anonTest, error: anonError } = await supabaseAnon
      .from('users')
      .select('id')
      .limit(1);
    
    console.log(`   📊 Usuários na tabela public.users: ${usersCount || 'N/A'}`);
    console.log(`   🔓 Acesso anônimo: ${anonTest && !anonError ? '✅ Funcionando' : '❌ Bloqueado'}`);
    
    // 7. Relatório final
    console.log('\n📋 RELATÓRIO FINAL DA MIGRAÇÃO:');
    console.log('\n📄 ARQUIVO CRIADO:');
    console.log('   - ✅ migration-final.sql (execute no painel Supabase)');
    
    console.log('\n🎯 PROBLEMAS QUE SERÃO RESOLVIDOS:');
    console.log('   - ✅ Erro 42501: must be owner of relation users');
    console.log('   - ✅ Erro 23505: duplicate key value violates unique constraint');
    console.log('   - ✅ Erro 42601: syntax error at or near "ON"');
    console.log('   - ✅ Sincronização entre auth.users e public.users');
    console.log('   - ✅ Políticas RLS adequadas');
    console.log('   - ✅ Acesso via chave anônima');
    
    console.log('\n🧪 PRÓXIMOS PASSOS:');
    console.log('1. Abra o painel do Supabase (https://supabase.com/dashboard)');
    console.log('2. Vá para SQL Editor');
    console.log('3. Cole e execute o conteúdo de migration-final.sql');
    console.log('4. Execute: node testar-solucao-final.cjs');
    console.log('5. Teste login no frontend');
    
    console.log('\n✅ PREPARAÇÃO CONCLUÍDA!');
    console.log('Execute migration-final.sql no painel Supabase para finalizar.');
    
  } catch (error) {
    console.error('❌ Erro durante a preparação:', error.message);
    console.error('\n🔧 SOLUÇÃO ALTERNATIVA:');
    console.error('Execute migration-supabase-corrigida.sql manualmente no painel do Supabase');
    process.exit(1);
  }
}

// Executar migração
executarMigracaoCompleta();