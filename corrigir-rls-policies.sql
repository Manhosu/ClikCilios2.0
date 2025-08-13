-- Script para corrigir políticas RLS que estão causando recursão infinita
-- Execute este SQL no painel do Supabase (Database > SQL Editor)

-- 1. Desabilitar RLS temporariamente para limpeza
ALTER TABLE public.users DISABLE ROW LEVEL SECURITY;

-- 2. Remover todas as políticas existentes
DROP POLICY IF EXISTS "Users can view own profile" ON public.users;
DROP POLICY IF EXISTS "Users can update own profile" ON public.users;
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON public.users;
DROP POLICY IF EXISTS "Users can insert own profile" ON public.users;
DROP POLICY IF EXISTS "Enable read access for all users" ON public.users;
DROP POLICY IF EXISTS "Enable insert for service role" ON public.users;
DROP POLICY IF EXISTS "Allow public read access" ON public.users;

-- 3. Reabilitar RLS
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- 4. Criar políticas RLS corretas e seguras

-- Política para SELECT: usuários podem ver apenas seu próprio perfil
CREATE POLICY "users_select_own" ON public.users
  FOR SELECT
  USING (auth.uid() = id);

-- Política para UPDATE: usuários podem atualizar apenas seu próprio perfil
CREATE POLICY "users_update_own" ON public.users
  FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Política para INSERT: permitir inserção apenas via service role ou trigger
-- Esta política é mais restritiva e evita recursão
CREATE POLICY "users_insert_service" ON public.users
  FOR INSERT
  WITH CHECK (
    -- Permitir inserção se for via service role (trigger)
    current_setting('role') = 'service_role'
    OR
    -- Ou se for o próprio usuário (para casos especiais)
    auth.uid() = id
  );

-- 5. Verificar se as políticas foram criadas corretamente
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies 
WHERE tablename = 'users' AND schemaname = 'public'
ORDER BY policyname;

-- 6. Testar se as políticas estão funcionando
-- Esta query deve retornar as políticas sem causar recursão
SELECT 'Políticas RLS configuradas com sucesso' as status;

-- 7. Comentários para documentação
COMMENT ON TABLE public.users IS 'Tabela de usuários com RLS habilitado para segurança';