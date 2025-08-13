-- Script para configurar trigger de criação automática de usuários
-- Execute este SQL no painel do Supabase (Database > SQL Editor)

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
  );
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Remover trigger existente se houver
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- 3. Criar trigger para executar a função quando um novo usuário é criado
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- 4. Configurar RLS na tabela users
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- 5. Remover políticas existentes
DROP POLICY IF EXISTS "Users can view own profile" ON public.users;
DROP POLICY IF EXISTS "Users can update own profile" ON public.users;
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON public.users;

-- 6. Criar políticas RLS
-- Política para visualizar próprio perfil
CREATE POLICY "Users can view own profile" ON public.users
  FOR SELECT USING (auth.uid() = id);

-- Política para atualizar próprio perfil
CREATE POLICY "Users can update own profile" ON public.users
  FOR UPDATE USING (auth.uid() = id);

-- Política para permitir inserção automática via trigger
CREATE POLICY "Enable insert for authenticated users only" ON public.users
  FOR INSERT WITH CHECK (true);

-- 7. Adicionar comentários para documentação
COMMENT ON FUNCTION public.handle_new_user() IS 'Automatically creates a user profile when a new user signs up via Supabase Auth';
COMMENT ON TRIGGER on_auth_user_created ON auth.users IS 'Trigger to automatically create user profile in public.users table';

-- Verificar se tudo foi criado corretamente
SELECT 'Função criada' as status, routine_name 
FROM information_schema.routines 
WHERE routine_schema = 'public' AND routine_name = 'handle_new_user'
UNION ALL
SELECT 'Trigger criado' as status, trigger_name 
FROM information_schema.triggers 
WHERE trigger_schema = 'auth' AND trigger_name = 'on_auth_user_created';