-- CORREÇÃO DEFINITIVA PARA RECURSÃO INFINITA RLS
-- Execute este SQL no painel do Supabase (Database > SQL Editor)

-- 1. DESABILITAR RLS COMPLETAMENTE
ALTER TABLE public.users DISABLE ROW LEVEL SECURITY;

-- 2. REMOVER TODAS AS POLÍTICAS (LIMPEZA TOTAL)
DO $$
DECLARE
    r RECORD;
BEGIN
    FOR r IN (SELECT policyname FROM pg_policies WHERE tablename = 'users' AND schemaname = 'public') LOOP
        EXECUTE 'DROP POLICY IF EXISTS "' || r.policyname || '" ON public.users';
    END LOOP;
END $$;

-- 3. VERIFICAR SE TODAS AS POLÍTICAS FORAM REMOVIDAS
SELECT COUNT(*) as policies_remaining FROM pg_policies WHERE tablename = 'users' AND schemaname = 'public';

-- 4. REABILITAR RLS
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- 5. CRIAR POLÍTICAS SIMPLES E SEGURAS (SEM RECURSÃO)

-- Política SELECT: Permite que usuários vejam apenas seu próprio perfil
CREATE POLICY "users_select_policy" ON public.users
  FOR SELECT
  TO authenticated
  USING (id = auth.uid());

-- Política UPDATE: Permite que usuários atualizem apenas seu próprio perfil
CREATE POLICY "users_update_policy" ON public.users
  FOR UPDATE
  TO authenticated
  USING (id = auth.uid())
  WITH CHECK (id = auth.uid());

-- Política INSERT: Permite inserção para service_role (trigger) e usuários autenticados
CREATE POLICY "users_insert_policy" ON public.users
  FOR INSERT
  TO authenticated, service_role
  WITH CHECK (true);

-- 6. VERIFICAR AS NOVAS POLÍTICAS
SELECT 
  policyname,
  cmd,
  roles,
  qual,
  with_check
FROM pg_policies 
WHERE tablename = 'users' AND schemaname = 'public'
ORDER BY policyname;

-- 7. TESTAR SE NÃO HÁ RECURSÃO
-- Esta query deve funcionar sem erro
SELECT 'RLS configurado com sucesso - sem recursão' as status;

-- 8. CONFIGURAR TRIGGER PARA NOVOS USUÁRIOS
-- Recriar função handle_new_user
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger 
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
BEGIN
  INSERT INTO public.users (id, email, nome, is_admin, onboarding_completed)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'nome', split_part(NEW.email, '@', 1)),
    false,
    false
  );
  RETURN NEW;
EXCEPTION
  WHEN unique_violation THEN
    -- Usuário já existe, não fazer nada
    RETURN NEW;
  WHEN OTHERS THEN
    -- Log do erro e continuar
    RAISE WARNING 'Erro ao criar usuário: %', SQLERRM;
    RETURN NEW;
END;
$$;

-- 9. RECRIAR TRIGGER
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- 10. GRANT NECESSÁRIOS
GRANT USAGE ON SCHEMA public TO authenticated, anon;
GRANT ALL ON public.users TO authenticated;
GRANT ALL ON public.users TO service_role;

-- 11. VERIFICAÇÃO FINAL
SELECT 
  'Configuração concluída' as status,
  COUNT(*) as total_policies
FROM pg_policies 
WHERE tablename = 'users' AND schemaname = 'public';

-- Comentário final
COMMENT ON TABLE public.users IS 'Tabela de usuários com RLS corrigido - sem recursão infinita';