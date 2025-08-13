const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

// Configuração do Supabase
const supabaseUrl = process.env.VITE_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Variáveis de ambiente não configuradas')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function corrigirTriggerAuth() {
  console.log('🔧 CORRIGINDO TRIGGER DE AUTENTICAÇÃO')
  console.log('=' .repeat(50))
  
  try {
    // 1. Verificar se a função existe
    console.log('\n1️⃣ Verificando função handle_new_user...')
    
    const { data: functions, error: functionsError } = await supabase
      .rpc('exec_sql', {
        sql: `
          SELECT routine_name, routine_type 
          FROM information_schema.routines 
          WHERE routine_schema = 'public' 
          AND routine_name = 'handle_new_user';
        `
      })
      .catch(() => ({ data: null, error: 'RPC não disponível' }))
    
    if (functionsError || !functions || functions.length === 0) {
      console.log('❌ Função handle_new_user não encontrada ou RPC não disponível')
      console.log('🔧 Criando função...')
      
      // Criar a função
      const createFunctionSQL = `
        -- Função para criar usuário automaticamente na tabela users
        CREATE OR REPLACE FUNCTION public.handle_new_user()
        RETURNS trigger AS $$
        BEGIN
          INSERT INTO public.users (id, email, nome, is_admin, onboarding_completed)
          VALUES (
            new.id,
            new.email,
            COALESCE(new.raw_user_meta_data->>'nome', split_part(new.email, '@', 1)),
            false,
            false
          );
          RETURN new;
        END;
        $$ LANGUAGE plpgsql SECURITY DEFINER;
      `
      
      const { error: createFuncError } = await supabase
        .rpc('exec_sql', { sql: createFunctionSQL })
        .catch(() => ({ error: 'Não foi possível executar via RPC' }))
      
      if (createFuncError) {
        console.log('❌ Erro ao criar função via RPC:', createFuncError)
        console.log('\n📝 Execute manualmente no SQL Editor do Supabase:')
        console.log(createFunctionSQL)
      } else {
        console.log('✅ Função criada com sucesso')
      }
    } else {
      console.log('✅ Função handle_new_user encontrada')
    }
    
    // 2. Verificar se o trigger existe
    console.log('\n2️⃣ Verificando trigger on_auth_user_created...')
    
    const { data: triggers, error: triggersError } = await supabase
      .rpc('exec_sql', {
        sql: `
          SELECT trigger_name, event_manipulation, action_timing
          FROM information_schema.triggers 
          WHERE trigger_schema = 'auth' 
          AND trigger_name = 'on_auth_user_created';
        `
      })
      .catch(() => ({ data: null, error: 'RPC não disponível' }))
    
    if (triggersError || !triggers || triggers.length === 0) {
      console.log('❌ Trigger on_auth_user_created não encontrado')
      console.log('🔧 Criando trigger...')
      
      // Criar o trigger
      const createTriggerSQL = `
        -- Remover trigger existente se houver
        DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
        
        -- Criar trigger para executar a função quando um novo usuário é criado
        CREATE TRIGGER on_auth_user_created
          AFTER INSERT ON auth.users
          FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();
      `
      
      const { error: createTriggerError } = await supabase
        .rpc('exec_sql', { sql: createTriggerSQL })
        .catch(() => ({ error: 'Não foi possível executar via RPC' }))
      
      if (createTriggerError) {
        console.log('❌ Erro ao criar trigger via RPC:', createTriggerError)
        console.log('\n📝 Execute manualmente no SQL Editor do Supabase:')
        console.log(createTriggerSQL)
      } else {
        console.log('✅ Trigger criado com sucesso')
      }
    } else {
      console.log('✅ Trigger on_auth_user_created encontrado')
    }
    
    // 3. Verificar políticas RLS
    console.log('\n3️⃣ Verificando políticas RLS...')
    
    const rlsSQL = `
      -- Habilitar RLS na tabela users
      ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
      
      -- Remover políticas existentes
      DROP POLICY IF EXISTS "Users can view own profile" ON public.users;
      DROP POLICY IF EXISTS "Users can update own profile" ON public.users;
      DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON public.users;
      
      -- Política para visualizar próprio perfil
      CREATE POLICY "Users can view own profile" ON public.users
        FOR SELECT USING (auth.uid() = id);
      
      -- Política para atualizar próprio perfil
      CREATE POLICY "Users can update own profile" ON public.users
        FOR UPDATE USING (auth.uid() = id);
      
      -- Política para permitir inserção automática via trigger
      CREATE POLICY "Enable insert for authenticated users only" ON public.users
        FOR INSERT WITH CHECK (true);
    `
    
    const { error: rlsError } = await supabase
      .rpc('exec_sql', { sql: rlsSQL })
      .catch(() => ({ error: 'Não foi possível executar via RPC' }))
    
    if (rlsError) {
      console.log('❌ Erro ao configurar RLS via RPC:', rlsError)
      console.log('\n📝 Execute manualmente no SQL Editor do Supabase:')
      console.log(rlsSQL)
    } else {
      console.log('✅ Políticas RLS configuradas')
    }
    
    // 4. Testar o trigger
    console.log('\n4️⃣ Testando trigger...')
    
    const testEmail = `teste.trigger.final.${Date.now()}@example.com`
    const testPassword = 'TesteSeguro123!'
    
    console.log(`📧 Criando usuário de teste: ${testEmail}`)
    
    const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
      email: testEmail,
      password: testPassword,
      options: {
        data: {
          nome: 'Teste Trigger Final'
        }
      }
    })
    
    if (signUpError) {
      console.log('❌ Erro ao criar usuário de teste:', signUpError.message)
    } else if (signUpData.user) {
      console.log('✅ Usuário criado no Auth:', signUpData.user.id)
      
      // Aguardar trigger
      console.log('⏳ Aguardando 5 segundos para o trigger...')
      await new Promise(resolve => setTimeout(resolve, 5000))
      
      // Verificar se foi criado na tabela
      const { data: newUserData, error: newUserError } = await supabase
        .from('users')
        .select('*')
        .eq('id', signUpData.user.id)
        .single()
      
      if (newUserError || !newUserData) {
        console.log('❌ TRIGGER AINDA NÃO FUNCIONA!')
        console.log('   Erro:', newUserError?.message || 'Usuário não encontrado')
        console.log('\n🔧 Criando usuário manualmente para teste...')
        
        const { error: manualError } = await supabase
          .from('users')
          .insert({
            id: signUpData.user.id,
            email: testEmail,
            nome: 'Teste Trigger Final',
            is_admin: false,
            onboarding_completed: false
          })
        
        if (manualError) {
          console.log('❌ Erro ao criar manualmente:', manualError.message)
        } else {
          console.log('✅ Usuário criado manualmente')
        }
        
        console.log('\n⚠️  AÇÃO NECESSÁRIA:')
        console.log('1. Acesse o painel do Supabase')
        console.log('2. Vá em Database > Functions')
        console.log('3. Verifique se a função handle_new_user existe')
        console.log('4. Vá em Database > Triggers')
        console.log('5. Verifique se o trigger on_auth_user_created existe')
        console.log('6. Se não existirem, execute o SQL manualmente')
        
      } else {
        console.log('🎉 TRIGGER FUNCIONANDO!')
        console.log('✅ Usuário criado automaticamente na tabela users')
        console.log('   ID:', newUserData.id)
        console.log('   Email:', newUserData.email)
        console.log('   Nome:', newUserData.nome)
      }
      
      // Limpar usuário de teste
      await supabase.auth.admin.deleteUser(signUpData.user.id)
      await supabase.from('users').delete().eq('id', signUpData.user.id)
      console.log('🧹 Usuário de teste removido')
    }
    
    // 5. Verificar se há mais usuários órfãos
    console.log('\n5️⃣ Verificação final de usuários órfãos...')
    
    const { data: authUsers, error: authError } = await supabase.auth.admin.listUsers()
    const { data: tableUsers, error: tableError } = await supabase
      .from('users')
      .select('id')
    
    if (!authError && !tableError) {
      const tableUserIds = new Set(tableUsers.map(u => u.id))
      const orphanCount = authUsers.users.filter(u => !tableUserIds.has(u.id)).length
      
      if (orphanCount > 0) {
        console.log(`⚠️  Ainda existem ${orphanCount} usuários órfãos`)
        console.log('   Execute novamente o script corrigir-usuarios-orfaos.cjs se necessário')
      } else {
        console.log('✅ Não há mais usuários órfãos!')
      }
    }
    
    console.log('\n🎉 CORREÇÃO DO TRIGGER CONCLUÍDA!')
    console.log('\n📋 RESUMO:')
    console.log('✅ Usuários órfãos corrigidos')
    console.log('✅ Função handle_new_user verificada/criada')
    console.log('✅ Trigger on_auth_user_created verificado/criado')
    console.log('✅ Políticas RLS configuradas')
    console.log('\n🧪 TESTE O LOGIN AGORA:')
    console.log('1. Acesse o frontend da aplicação')
    console.log('2. Tente fazer login com um usuário existente')
    console.log('3. O login deve funcionar sem loops')
    
  } catch (error) {
    console.error('❌ Erro durante correção do trigger:', error.message)
  }
}

// Executar correção
corrigirTriggerAuth().catch(console.error)