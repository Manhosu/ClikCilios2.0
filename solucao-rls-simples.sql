-- SOLUÇÃO SIMPLES PARA RLS - Execute no painel do Supabase
-- Esta é a solução mais simples que deve funcionar

-- 1. Desabilitar RLS temporariamente para permitir inserções
ALTER TABLE public.users DISABLE ROW LEVEL SECURITY;

-- OU (se preferir manter RLS ativo)
-- 2. Criar política mais permissiva
DROP POLICY IF EXISTS "Allow all operations" ON public.users;
CREATE POLICY "Allow all operations" ON public.users
  FOR ALL USING (true) WITH CHECK (true);

-- 3. Comentário
COMMENT ON TABLE public.users IS 'Tabela de usuários com RLS desabilitado para desenvolvimento';

-- INSTRUÇÕES:
-- Execute APENAS UMA das opções acima:
-- - Opção 1: Desabilita RLS completamente (mais simples)
-- - Opção 2: Mantém RLS mas permite todas as operações
-- 
-- Para produção, você pode reconfigurar RLS mais tarde com políticas específicas