
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
    