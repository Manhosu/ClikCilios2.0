-- Migração para consolidar sistema de usuários para Hotmart
-- Adiciona campos necessários na tabela users e migra dados de pre_users

-- 1. Adicionar campos necessários na tabela users
ALTER TABLE public.users 
ADD COLUMN IF NOT EXISTS username TEXT UNIQUE,
ADD COLUMN IF NOT EXISTS password_hash TEXT,
ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'available' CHECK (status IN ('available', 'occupied', 'suspended')),
ADD COLUMN IF NOT EXISTS hotmart_buyer_email TEXT,
ADD COLUMN IF NOT EXISTS hotmart_buyer_name TEXT,
ADD COLUMN IF NOT EXISTS hotmart_transaction_id TEXT,
ADD COLUMN IF NOT EXISTS hotmart_notification_id TEXT,
ADD COLUMN IF NOT EXISTS assigned_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS expires_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}'::jsonb;

-- 2. Criar índices para performance
CREATE INDEX IF NOT EXISTS idx_users_status ON public.users(status);
CREATE INDEX IF NOT EXISTS idx_users_username ON public.users(username);
CREATE INDEX IF NOT EXISTS idx_users_hotmart_notification_id ON public.users(hotmart_notification_id);
CREATE INDEX IF NOT EXISTS idx_users_hotmart_transaction_id ON public.users(hotmart_transaction_id);
CREATE INDEX IF NOT EXISTS idx_users_assigned_at ON public.users(assigned_at);

-- 3. Migrar dados existentes de pre_users para users (se a tabela existir)
DO $$
BEGIN
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'pre_users') THEN
        -- Migrar usuários de pre_users para users
        INSERT INTO public.users (
            id,
            username,
            email,
            password_hash,
            status,
            nome,
            is_admin,
            onboarding_completed,
            metadata,
            created_at,
            updated_at
        )
        SELECT 
            gen_random_uuid() as id,
            username,
            email,
            password_hash,
            status,
            COALESCE(SPLIT_PART(email, '@', 1), username) as nome,
            false as is_admin,
            false as onboarding_completed,
            COALESCE(metadata, '{}'::jsonb) as metadata,
            created_at,
            updated_at
        FROM public.pre_users
        WHERE NOT EXISTS (
            SELECT 1 FROM public.users WHERE users.email = pre_users.email
        );
        
        RAISE NOTICE 'Dados migrados de pre_users para users';
    END IF;
END $$;

-- 4. Criar usuários pré-configurados para Hotmart (200 usuários)
DO $$
DECLARE
    i INTEGER;
    username_val TEXT;
    email_val TEXT;
    password_val TEXT;
BEGIN
    FOR i IN 1..200 LOOP
        username_val := 'user' || LPAD(i::text, 4, '0');
        email_val := username_val || '@ciliosclick.com';
        
        -- Gerar senha aleatória com letras e números
        password_val := (
            SELECT string_agg(
                CASE 
                    WHEN random() < 0.5 THEN chr(65 + (random() * 25)::int) -- A-Z
                    ELSE (random() * 9)::int::text -- 0-9
                END, 
                ''
            )
            FROM generate_series(1, 8)
        );
        
        INSERT INTO public.users (
            id,
            username,
            email,
            password_hash,
            nome,
            status,
            is_admin,
            onboarding_completed,
            metadata,
            created_at,
            updated_at
        ) VALUES (
            gen_random_uuid(),
            username_val,
            email_val,
            crypt(password_val, gen_salt('bf')), -- Hash da senha
            'Usuário ' || i,
            'available',
            false,
            false,
            jsonb_build_object('original_password', password_val, 'created_for', 'hotmart'),
            NOW(),
            NOW()
        )
        ON CONFLICT (email) DO NOTHING;
    END LOOP;
    
    RAISE NOTICE 'Criados 200 usuários pré-configurados para Hotmart';
END $$;

-- 5. Configurar usuários administrativos específicos
INSERT INTO public.users (
    id,
    username,
    email,
    nome,
    status,
    is_admin,
    onboarding_completed,
    created_at,
    updated_at
) VALUES 
(
    gen_random_uuid(),
    'eduardo_admin',
    'eduardogelista@gmail.com',
    'Eduardo Gelista',
    'occupied', -- Admin sempre ocupado
    true,
    true,
    NOW(),
    NOW()
),
(
    gen_random_uuid(),
    'carina_admin', 
    'carinaprange86@gmail.com',
    'Carina Prange',
    'occupied', -- Admin sempre ocupado
    true,
    true,
    NOW(),
    NOW()
)
ON CONFLICT (email) DO UPDATE SET
    is_admin = true,
    status = 'occupied',
    onboarding_completed = true,
    updated_at = NOW();

-- 6. Função para atribuir usuário disponível (versão atualizada para tabela users)
CREATE OR REPLACE FUNCTION public.assign_user_hotmart(
    p_buyer_email TEXT,
    p_buyer_name TEXT,
    p_hotmart_transaction_id TEXT,
    p_hotmart_notification_id TEXT,
    p_password_hash TEXT
) RETURNS TABLE(user_id UUID, username TEXT, success BOOLEAN, message TEXT) AS $$
DECLARE
    selected_user RECORD;
BEGIN
    -- Verificar se a notificação já foi processada
    IF EXISTS(SELECT 1 FROM public.users WHERE hotmart_notification_id = p_hotmart_notification_id) THEN
        RETURN QUERY SELECT NULL::UUID, NULL::TEXT, false, 'Notificação já processada';
        RETURN;
    END IF;

    -- Selecionar um usuário disponível com lock exclusivo
    SELECT id, username INTO selected_user
    FROM public.users
    WHERE status = 'available' 
        AND is_admin = false
        AND hotmart_buyer_email IS NULL
    ORDER BY created_at
    FOR UPDATE SKIP LOCKED
    LIMIT 1;

    -- Se não encontrou usuário disponível
    IF selected_user.id IS NULL THEN
        RETURN QUERY SELECT NULL::UUID, NULL::TEXT, false, 'Nenhum usuário disponível';
        RETURN;
    END IF;

    -- Atualizar o usuário selecionado
    UPDATE public.users
    SET 
        status = 'occupied',
        password_hash = p_password_hash,
        hotmart_buyer_email = p_buyer_email,
        hotmart_buyer_name = p_buyer_name,
        hotmart_transaction_id = p_hotmart_transaction_id,
        hotmart_notification_id = p_hotmart_notification_id,
        assigned_at = NOW(),
        updated_at = NOW()
    WHERE id = selected_user.id;

    -- Retornar sucesso
    RETURN QUERY SELECT selected_user.id, selected_user.username, true, 'Usuário atribuído com sucesso';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 7. Função para liberar usuário (cancelamento/reembolso)
CREATE OR REPLACE FUNCTION public.release_user_hotmart(
    p_hotmart_transaction_id TEXT,
    p_hotmart_notification_id TEXT
) RETURNS TABLE(user_id UUID, username TEXT, success BOOLEAN, message TEXT) AS $$
DECLARE
    selected_user RECORD;
    new_password TEXT;
BEGIN
    -- Encontrar o usuário pela transação
    SELECT id, username INTO selected_user
    FROM public.users
    WHERE hotmart_transaction_id = p_hotmart_transaction_id
        AND status = 'occupied'
    LIMIT 1;

    -- Se não encontrou o usuário
    IF selected_user.id IS NULL THEN
        RETURN QUERY SELECT NULL::UUID, NULL::TEXT, false, 'Usuário não encontrado ou já liberado';
        RETURN;
    END IF;

    -- Gerar nova senha aleatória
    SELECT string_agg(
        CASE 
            WHEN random() < 0.5 THEN chr(65 + (random() * 25)::int) -- A-Z
            ELSE (random() * 9)::int::text -- 0-9
        END, 
        ''
    ) INTO new_password
    FROM generate_series(1, 8);

    -- Liberar o usuário e gerar nova senha
    UPDATE public.users
    SET 
        status = 'available',
        password_hash = crypt(new_password, gen_salt('bf')),
        hotmart_buyer_email = NULL,
        hotmart_buyer_name = NULL,
        hotmart_transaction_id = NULL,
        hotmart_notification_id = NULL,
        assigned_at = NULL,
        expires_at = NULL,
        metadata = jsonb_set(
            COALESCE(metadata, '{}'::jsonb),
            '{last_release}',
            to_jsonb(NOW())
        ),
        updated_at = NOW()
    WHERE id = selected_user.id;

    -- Retornar sucesso
    RETURN QUERY SELECT selected_user.id, selected_user.username, true, 'Usuário liberado com nova senha';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 8. Função para obter estatísticas dos usuários
CREATE OR REPLACE FUNCTION public.get_users_hotmart_stats()
RETURNS JSON AS $$
DECLARE
    result JSON;
BEGIN
    SELECT json_build_object(
        'usuarios_disponiveis', COUNT(*) FILTER (WHERE status = 'available' AND is_admin = false),
        'usuarios_ocupados', COUNT(*) FILTER (WHERE status = 'occupied' AND is_admin = false),
        'usuarios_suspensos', COUNT(*) FILTER (WHERE status = 'suspended' AND is_admin = false),
        'usuarios_admin', COUNT(*) FILTER (WHERE is_admin = true),
        'total_usuarios', COUNT(*) FILTER (WHERE is_admin = false),
        'total_geral', COUNT(*),
        'ultima_atribuicao', MAX(assigned_at) FILTER (WHERE assigned_at IS NOT NULL),
        'usuarios_com_hotmart', COUNT(*) FILTER (WHERE hotmart_buyer_email IS NOT NULL)
    ) INTO result
    FROM public.users;
    
    RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 9. Conceder permissões
GRANT EXECUTE ON FUNCTION public.assign_user_hotmart(TEXT, TEXT, TEXT, TEXT, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.assign_user_hotmart(TEXT, TEXT, TEXT, TEXT, TEXT) TO service_role;
GRANT EXECUTE ON FUNCTION public.release_user_hotmart(TEXT, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.release_user_hotmart(TEXT, TEXT) TO service_role;
GRANT EXECUTE ON FUNCTION public.get_users_hotmart_stats() TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_users_hotmart_stats() TO service_role;

-- 10. Atualizar políticas RLS para incluir novos campos
DROP POLICY IF EXISTS "Users can view own data" ON public.users;
DROP POLICY IF EXISTS "Users can update own data" ON public.users;
DROP POLICY IF EXISTS "Admins can view all users" ON public.users;
DROP POLICY IF EXISTS "Admins can manage all users" ON public.users;

-- Política para usuários verem seus próprios dados
CREATE POLICY "Users can view own data" ON public.users
    FOR SELECT USING (
        auth.uid() = id OR 
        EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND is_admin = true)
    );

-- Política para usuários atualizarem seus próprios dados
CREATE POLICY "Users can update own data" ON public.users
    FOR UPDATE USING (
        auth.uid() = id OR 
        EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND is_admin = true)
    );

-- Política para admins gerenciarem todos os usuários
CREATE POLICY "Admins can manage all users" ON public.users
    FOR ALL USING (
        EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND is_admin = true)
    );

-- 11. Comentários para documentação
COMMENT ON COLUMN public.users.username IS 'Username único para login (usado no sistema Hotmart)';
COMMENT ON COLUMN public.users.status IS 'Status do usuário: available (disponível), occupied (ocupado), suspended (suspenso)';
COMMENT ON COLUMN public.users.hotmart_buyer_email IS 'Email do comprador Hotmart que recebeu este usuário';
COMMENT ON COLUMN public.users.hotmart_buyer_name IS 'Nome do comprador Hotmart';
COMMENT ON COLUMN public.users.hotmart_transaction_id IS 'ID da transação Hotmart';
COMMENT ON COLUMN public.users.hotmart_notification_id IS 'ID da notificação Hotmart (para evitar duplicatas)';
COMMENT ON COLUMN public.users.assigned_at IS 'Data/hora da atribuição do usuário';
COMMENT ON COLUMN public.users.expires_at IS 'Data/hora de expiração (se aplicável)';

COMMENT ON FUNCTION public.assign_user_hotmart IS 'Atribui um usuário disponível para um comprador Hotmart';
COMMENT ON FUNCTION public.release_user_hotmart IS 'Libera um usuário ocupado (cancelamento/reembolso) e gera nova senha';
COMMENT ON FUNCTION public.get_users_hotmart_stats IS 'Retorna estatísticas dos usuários para o painel Hotmart';

-- 12. Log da migração
INSERT INTO public.users (
    id,
    username,
    email,
    nome,
    status,
    is_admin,
    onboarding_completed,
    metadata
) VALUES (
    gen_random_uuid(),
    'system_migration',
    'system@ciliosclick.com',
    'Sistema - Migração Hotmart',
    'suspended',
    false,
    true,
    jsonb_build_object(
        'migration_date', NOW(),
        'migration_type', 'consolidate_users_hotmart',
        'description', 'Migração para consolidar sistema de usuários para Hotmart'
    )
) ON CONFLICT (email) DO UPDATE SET
    metadata = jsonb_set(
        COALESCE(users.metadata, '{}'::jsonb),
        '{last_migration}',
        to_jsonb(NOW())
    );

RAISE NOTICE 'Migração concluída: Sistema consolidado para Hotmart com 200 usuários pré-criados';