-- Script para limpeza e otimização do banco de dados
-- Remove tabelas obsoletas após consolidação do sistema Hotmart

-- 1. Remover tabela user_assignments (funcionalidade integrada na tabela users)
DROP TABLE IF EXISTS user_assignments CASCADE;

-- 2. Remover tabela pre_users (substituída pela tabela users consolidada)
DROP TABLE IF EXISTS pre_users CASCADE;

-- 3. Verificar se existem outras tabelas relacionadas ao sistema antigo
DROP TABLE IF EXISTS hotmart_pre_users CASCADE;
DROP TABLE IF EXISTS hotmart_assignments CASCADE;

-- 4. Criar índices para otimizar performance da tabela users consolidada
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_is_admin ON users(is_admin);
CREATE INDEX IF NOT EXISTS idx_users_hotmart_email ON users(email) WHERE email LIKE 'hotmart%@clikcilios.com';
CREATE INDEX IF NOT EXISTS idx_users_status ON users(status) WHERE status IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_users_hotmart_transaction ON users(hotmart_transaction_id) WHERE hotmart_transaction_id IS NOT NULL;

-- 5. Atualizar estatísticas das tabelas para melhor performance
ANALYZE users;
ANALYZE clientes;
ANALYZE cupons;
ANALYZE usos_cupons;

-- 6. Comentários para documentação
COMMENT ON TABLE users IS 'Tabela consolidada de usuários - inclui usuários regulares, Hotmart e administrativos';
COMMENT ON COLUMN users.username IS 'Nome de usuário único para login (usado principalmente por usuários Hotmart)';
COMMENT ON COLUMN users.password_hash IS 'Hash da senha para autenticação (usado principalmente por usuários Hotmart)';
COMMENT ON COLUMN users.status IS 'Status do usuário: active, suspended, expired (usado principalmente por usuários Hotmart)';
COMMENT ON COLUMN users.hotmart_buyer_email IS 'Email do comprador no Hotmart';
COMMENT ON COLUMN users.hotmart_buyer_name IS 'Nome do comprador no Hotmart';
COMMENT ON COLUMN users.hotmart_transaction_id IS 'ID da transação no Hotmart';
COMMENT ON COLUMN users.hotmart_notification_id IS 'ID da notificação do webhook Hotmart';
COMMENT ON COLUMN users.assigned_at IS 'Data de atribuição do usuário Hotmart';
COMMENT ON COLUMN users.expires_at IS 'Data de expiração do acesso (se aplicável)';
COMMENT ON COLUMN users.metadata IS 'Dados adicionais em formato JSON';

-- Verificar resultado da limpeza
SELECT 
    'users' as tabela,
    COUNT(*) as total_registros,
    COUNT(*) FILTER (WHERE email LIKE 'hotmart%@clikcilios.com') as usuarios_hotmart,
    COUNT(*) FILTER (WHERE is_admin = true) as administradores,
    COUNT(*) FILTER (WHERE email NOT LIKE 'hotmart%@clikcilios.com' AND is_admin = false) as usuarios_regulares
FROM users

UNION ALL

SELECT 
    'cupons' as tabela,
    COUNT(*) as total_registros,
    NULL as usuarios_hotmart,
    NULL as administradores,
    NULL as usuarios_regulares
FROM cupons

UNION ALL

SELECT 
    'usos_cupons' as tabela,
    COUNT(*) as total_registros,
    NULL as usuarios_hotmart,
    NULL as administradores,
    NULL as usuarios_regulares
FROM usos_cupons

UNION ALL

SELECT 
    'clientes' as tabela,
    COUNT(*) as total_registros,
    NULL as usuarios_hotmart,
    NULL as administradores,
    NULL as usuarios_regulares
FROM clientes

UNION ALL

SELECT 
    'imagens' as tabela,
    COUNT(*) as total_registros,
    NULL as usuarios_hotmart,
    NULL as administradores,
    NULL as usuarios_regulares
FROM imagens;

-- Verificar se as tabelas obsoletas foram removidas
SELECT 
    table_name,
    table_type
FROM information_schema.tables 
WHERE table_schema = 'public' 
    AND table_name IN ('pre_users', 'user_assignments', 'hotmart_pre_users', 'hotmart_assignments')
ORDER BY table_name;