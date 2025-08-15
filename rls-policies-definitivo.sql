-- 🔐 CONFIGURAÇÃO DEFINITIVA DE RLS PARA TABELA CLIENTES
-- Execute este script no Supabase SQL Editor

-- 1. Remover todas as políticas existentes
DROP POLICY IF EXISTS "Users can view own clientes" ON "public"."clientes";
DROP POLICY IF EXISTS "Users can insert own clientes" ON "public"."clientes";
DROP POLICY IF EXISTS "Users can update own clientes" ON "public"."clientes";
DROP POLICY IF EXISTS "Users can delete own clientes" ON "public"."clientes";
DROP POLICY IF EXISTS "clientes_select_policy" ON "public"."clientes";
DROP POLICY IF EXISTS "clientes_insert_policy" ON "public"."clientes";
DROP POLICY IF EXISTS "clientes_update_policy" ON "public"."clientes";
DROP POLICY IF EXISTS "clientes_delete_policy" ON "public"."clientes";

-- 2. Habilitar RLS na tabela clientes
ALTER TABLE "public"."clientes" ENABLE ROW LEVEL SECURITY;

-- 3. Criar política SELECT - Usuários podem ver apenas seus próprios clientes
CREATE POLICY "Users can view own clientes" ON "public"."clientes"
AS PERMISSIVE FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- 4. Criar política INSERT - Usuários podem inserir apenas com seu próprio user_id
CREATE POLICY "Users can insert own clientes" ON "public"."clientes"
AS PERMISSIVE FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- 5. Criar política UPDATE - Usuários podem atualizar apenas seus próprios clientes
CREATE POLICY "Users can update own clientes" ON "public"."clientes"
AS PERMISSIVE FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- 6. Criar política DELETE - Usuários podem deletar apenas seus próprios clientes
CREATE POLICY "Users can delete own clientes" ON "public"."clientes"
AS PERMISSIVE FOR DELETE
TO authenticated
USING (auth.uid() = user_id);

-- 7. Verificar se RLS está habilitado
SELECT 
    schemaname,
    tablename,
    rowsecurity
FROM pg_tables 
WHERE tablename = 'clientes' AND schemaname = 'public';

-- 8. Listar políticas criadas
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
WHERE tablename = 'clientes' AND schemaname = 'public'
ORDER BY policyname;

-- 9. Teste de verificação (deve retornar 0 linhas se RLS estiver funcionando)
-- Este SELECT deve falhar ou retornar vazio quando executado sem autenticação
SELECT COUNT(*) as total_clientes_visiveis FROM "public"."clientes";

-- ✅ CONFIGURAÇÃO CONCLUÍDA!
-- Após executar este script:
-- 1. Verifique se RLS está habilitado (rowsecurity = true)
-- 2. Confirme que 4 políticas foram criadas
-- 3. Teste o acesso sem autenticação (deve ser bloqueado)
-- 4. Reverta os arquivos temporários no código