-- VERSÃO ALTERNATIVA - Para quando não temos permissões de proprietário
-- Este SQL deve ser executado por um administrador do Supabase

-- 1. Primeiro, vamos criar a função (se não existir)
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
EXCEPTION
  WHEN others THEN
    -- Se der erro, apenas retorna sem falhar
    RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Configurar RLS mais permissivo temporariamente
-- (Isso pode precisar ser feito pelo administrador)
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- 3. Políticas mais permissivas para desenvolvimento
DROP POLICY IF EXISTS "Allow all for development" ON public.users;
CREATE POLICY "Allow all for development" ON public.users
  FOR ALL USING (true) WITH CHECK (true);

-- 4. Comentário
COMMENT ON FUNCTION public.handle_new_user() IS 'Automatically creates a user profile when a new user signs up via Supabase Auth - Alternative version';

-- INSTRUÇÕES:
-- 1. Se este SQL também falhar, execute apenas as partes que funcionam
-- 2. O trigger precisa ser criado por um administrador do Supabase
-- 3. Como alternativa, podemos usar uma abordagem via código JavaScript