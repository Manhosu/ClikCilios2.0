-- Script alternativo para configurar trigger sem modificar auth.users
-- Execute este SQL no painel do Supabase (Database > SQL Editor)
-- Este script contorna o erro de permissão na tabela auth.users

-- 1. Criar ou substituir a função handle_new_user
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
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Configurar RLS na tabela users (se ainda não estiver habilitado)
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- 3. Remover políticas existentes
DROP POLICY IF EXISTS "Users can view own profile" ON public.users;
DROP POLICY IF EXISTS "Users can update own profile" ON public.users;
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON public.users;
DROP POLICY IF EXISTS "Allow service role full access" ON public.users;

-- 4. Criar políticas RLS mais permissivas
-- Política para visualizar próprio perfil
CREATE POLICY "Users can view own profile" ON public.users
  FOR SELECT USING (auth.uid() = id OR auth.role() = 'service_role');

-- Política para atualizar próprio perfil
CREATE POLICY "Users can update own profile" ON public.users
  FOR UPDATE USING (auth.uid() = id OR auth.role() = 'service_role');

-- Política para permitir inserção automática
CREATE POLICY "Enable insert for authenticated users only" ON public.users
  FOR INSERT WITH CHECK (auth.uid() = id OR auth.role() = 'service_role');

-- Política para service role ter acesso total
CREATE POLICY "Allow service role full access" ON public.users
  FOR ALL USING (auth.role() = 'service_role');

-- 5. Verificar se a função foi criada
SELECT 'Função criada com sucesso' as status, routine_name 
FROM information_schema.routines 
WHERE routine_schema = 'public' AND routine_name = 'handle_new_user';

-- 6. Verificar políticas RLS
SELECT 'Política criada: ' || policyname as status
FROM pg_policies 
WHERE tablename = 'users' AND schemaname = 'public';

-- 7. Testar inserção manual de usuário (opcional)
-- Descomente as linhas abaixo para testar:
-- INSERT INTO public.users (id, email, nome, is_admin, onboarding_completed)
-- VALUES ('test-user-id', 'teste@exemplo.com', 'Usuário Teste', false, false)
-- ON CONFLICT (id) DO NOTHING;

-- 8. Comentários para documentação
COMMENT ON FUNCTION public.handle_new_user() IS 'Automatically creates a user profile when a new user signs up via Supabase Auth - Version without auth.users trigger';

-- INSTRUÇÕES IMPORTANTES:
-- 1. Este script não cria o trigger na tabela auth.users devido a limitações de permissão
-- 2. O trigger deve ser configurado manualmente no painel do Supabase:
--    - Vá para Database > Triggers
--    - Clique em "Create a new trigger"
--    - Nome: on_auth_user_created
--    - Table: auth.users
--    - Events: Insert
--    - Type: After
--    - Function: public.handle_new_user
-- 3. Alternativamente, use a extensão supabase_auth_admin se disponível

SELECT 'Script executado com sucesso! Configure o trigger manualmente no painel.' as resultado;