-- =====================================================
-- APLICAR POLÍTICAS RLS - APENAS TABELAS
-- =====================================================
-- Este arquivo contém APENAS as queries SQL executáveis
-- Para configurar Storage, use o dashboard do Supabase

-- =====================================================
-- 1. POLÍTICAS RLS PARA TABELA imagens_clientes
-- =====================================================

-- Remover políticas existentes se houver conflito
DROP POLICY IF EXISTS "Usuários podem ver apenas suas próprias imagens de clientes" ON public.imagens_clientes;
DROP POLICY IF EXISTS "Usuários podem inserir imagens de clientes para si mesmos" ON public.imagens_clientes;
DROP POLICY IF EXISTS "Usuários podem atualizar apenas suas próprias imagens de clientes" ON public.imagens_clientes;
DROP POLICY IF EXISTS "Usuários podem deletar apenas suas próprias imagens de clientes" ON public.imagens_clientes;

-- Garantir que RLS está habilitado
ALTER TABLE public.imagens_clientes ENABLE ROW LEVEL SECURITY;

-- Política para SELECT (visualizar apenas próprias imagens)
CREATE POLICY "users_can_view_own_images" ON public.imagens_clientes
    FOR SELECT USING (auth.uid() = user_id);

-- Política para INSERT (inserir imagens para si mesmo)
CREATE POLICY "users_can_insert_own_images" ON public.imagens_clientes
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Política para UPDATE (atualizar apenas próprias imagens)
CREATE POLICY "users_can_update_own_images" ON public.imagens_clientes
    FOR UPDATE USING (auth.uid() = user_id);

-- Política para DELETE (deletar apenas próprias imagens)
CREATE POLICY "users_can_delete_own_images" ON public.imagens_clientes
    FOR DELETE USING (auth.uid() = user_id);

-- =====================================================
-- 2. POLÍTICAS RLS PARA TABELA configuracoes_usuario
-- =====================================================

-- Remover políticas existentes se houver conflito
DROP POLICY IF EXISTS "Usuários podem visualizar apenas suas próprias configurações" ON public.configuracoes_usuario;
DROP POLICY IF EXISTS "Usuários podem atualizar apenas suas próprias configurações" ON public.configuracoes_usuario;
DROP POLICY IF EXISTS "Usuários podem inserir configuração para si mesmos" ON public.configuracoes_usuario;

-- Garantir que RLS está habilitado
ALTER TABLE public.configuracoes_usuario ENABLE ROW LEVEL SECURITY;

-- Política para SELECT (visualizar apenas próprias configurações)
CREATE POLICY "users_can_view_own_config" ON public.configuracoes_usuario
    FOR SELECT USING (auth.uid() = user_id);

-- Política para INSERT (inserir configuração para si mesmo)
CREATE POLICY "users_can_insert_own_config" ON public.configuracoes_usuario
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Política para UPDATE (atualizar apenas próprias configurações)
CREATE POLICY "users_can_update_own_config" ON public.configuracoes_usuario
    FOR UPDATE USING (auth.uid() = user_id);

-- =====================================================
-- 3. VERIFICAÇÃO DAS CONFIGURAÇÕES
-- =====================================================

-- Verificar se as políticas foram criadas corretamente
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
WHERE tablename IN ('imagens_clientes', 'configuracoes_usuario')
ORDER BY tablename, policyname;

-- Verificar se RLS está habilitado
SELECT 
    schemaname,
    tablename,
    rowsecurity
FROM pg_tables 
WHERE tablename IN ('imagens_clientes', 'configuracoes_usuario')
AND schemaname = 'public';

SELECT 'Políticas RLS aplicadas com sucesso!' as resultado;