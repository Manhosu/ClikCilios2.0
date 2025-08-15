-- Script para verificar e corrigir políticas RLS da tabela clientes

-- 1. Verificar se RLS está habilitado
SELECT 
    schemaname,
    tablename,
    rowsecurity,
    hasrls
FROM pg_tables 
LEFT JOIN pg_class ON pg_class.relname = pg_tables.tablename
WHERE tablename = 'clientes';

-- 2. Verificar políticas existentes
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
WHERE tablename = 'clientes';

-- 3. Verificar estrutura da tabela
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'clientes' 
AND table_schema = 'public'
ORDER BY ordinal_position;

-- 4. Habilitar RLS se não estiver habilitado
ALTER TABLE clientes ENABLE ROW LEVEL SECURITY;

-- 5. Remover políticas existentes (se houver)
DROP POLICY IF EXISTS "Usuários podem ver seus próprios clientes" ON clientes;
DROP POLICY IF EXISTS "Usuários podem criar clientes" ON clientes;
DROP POLICY IF EXISTS "Usuários podem atualizar seus próprios clientes" ON clientes;
DROP POLICY IF EXISTS "Usuários podem deletar seus próprios clientes" ON clientes;

-- 6. Criar políticas RLS corretas

-- Política para SELECT (usuários podem ver seus próprios clientes)
CREATE POLICY "Usuários podem ver seus próprios clientes" ON clientes
    FOR SELECT 
    USING (auth.uid() = user_id);

-- Política para INSERT (usuários podem criar clientes para si mesmos)
CREATE POLICY "Usuários podem criar clientes" ON clientes
    FOR INSERT 
    WITH CHECK (auth.uid() = user_id);

-- Política para UPDATE (usuários podem atualizar seus próprios clientes)
CREATE POLICY "Usuários podem atualizar seus próprios clientes" ON clientes
    FOR UPDATE 
    USING (auth.uid() = user_id) 
    WITH CHECK (auth.uid() = user_id);

-- Política para DELETE (usuários podem deletar seus próprios clientes)
CREATE POLICY "Usuários podem deletar seus próprios clientes" ON clientes
    FOR DELETE 
    USING (auth.uid() = user_id);

-- 7. Verificar se as políticas foram criadas
SELECT 
    policyname,
    cmd,
    permissive,
    roles,
    qual,
    with_check
FROM pg_policies 
WHERE tablename = 'clientes'
ORDER BY policyname;

-- 8. Testar função auth.uid()
SELECT auth.uid() as current_user_id;

-- 9. Verificar se existem clientes na tabela
SELECT 
    COUNT(*) as total_clientes,
    COUNT(DISTINCT user_id) as usuarios_com_clientes
FROM clientes;

-- 10. Mostrar alguns clientes de exemplo (apenas IDs)
SELECT 
    id,
    user_id,
    nome,
    created_at
FROM clientes 
ORDER BY created_at DESC 
LIMIT 5;

-- Comentários finais
COMMENT ON TABLE clientes IS 'Tabela de clientes com RLS habilitado - usuários só podem acessar seus próprios clientes';
COMMENT ON COLUMN clientes.user_id IS 'ID do usuário proprietário do cliente - deve corresponder a auth.uid()';