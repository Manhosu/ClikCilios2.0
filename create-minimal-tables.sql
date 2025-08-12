-- Script SQL mínimo para criar as tabelas essenciais do sistema Hotmart
-- Execute este script no SQL Editor do Supabase Dashboard

-- Habilitar extensão para UUID
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Tabela de usuários pré-criados
CREATE TABLE IF NOT EXISTS public.pre_users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    username TEXT NOT NULL UNIQUE,
    email TEXT NOT NULL UNIQUE,
    password_hash TEXT,
    status TEXT NOT NULL DEFAULT 'available',
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices para pre_users
CREATE INDEX IF NOT EXISTS idx_pre_users_status ON public.pre_users(status);
CREATE INDEX IF NOT EXISTS idx_pre_users_username ON public.pre_users(username);

-- Tabela de atribuições de usuários
CREATE TABLE IF NOT EXISTS public.user_assignments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    pre_user_id UUID REFERENCES public.pre_users(id) ON DELETE SET NULL,
    buyer_email TEXT,
    buyer_name TEXT,
    hotmart_transaction_id TEXT,
    hotmart_notification_id TEXT UNIQUE,
    event TEXT,
    assigned_at TIMESTAMPTZ DEFAULT NOW(),
    expires_at TIMESTAMPTZ,
    note TEXT
);

-- Índices para user_assignments
CREATE INDEX IF NOT EXISTS idx_user_assignments_pre_user_id ON public.user_assignments(pre_user_id);
CREATE INDEX IF NOT EXISTS idx_user_assignments_buyer_email ON public.user_assignments(buyer_email);
CREATE INDEX IF NOT EXISTS idx_user_assignments_hotmart_transaction_id ON public.user_assignments(hotmart_transaction_id);
CREATE INDEX IF NOT EXISTS idx_user_assignments_hotmart_notification_id ON public.user_assignments(hotmart_notification_id);

-- Função para obter estatísticas dos usuários pré-criados
CREATE OR REPLACE FUNCTION get_pre_users_stats()
RETURNS JSON AS $$
DECLARE
    result JSON;
BEGIN
    SELECT json_build_object(
        'available', COALESCE((SELECT COUNT(*) FROM public.pre_users WHERE status = 'available'), 0),
        'occupied', COALESCE((SELECT COUNT(*) FROM public.pre_users WHERE status = 'occupied'), 0),
        'suspended', COALESCE((SELECT COUNT(*) FROM public.pre_users WHERE status = 'suspended'), 0),
        'total_assignments', COALESCE((SELECT COUNT(*) FROM public.user_assignments), 0),
        'active_assignments', COALESCE((SELECT COUNT(*) FROM public.user_assignments WHERE event NOT IN ('PURCHASE_CANCELED', 'PURCHASE_REFUNDED')), 0),
        'cancelled_assignments', COALESCE((SELECT COUNT(*) FROM public.user_assignments WHERE event IN ('PURCHASE_CANCELED', 'PURCHASE_REFUNDED')), 0)
    ) INTO result;
    
    RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Função para atribuir um usuário pré-criado
CREATE OR REPLACE FUNCTION assign_pre_user(
    p_buyer_email TEXT,
    p_buyer_name TEXT DEFAULT NULL,
    p_hotmart_transaction_id TEXT DEFAULT NULL,
    p_hotmart_notification_id TEXT DEFAULT NULL,
    p_event TEXT DEFAULT 'PURCHASE_COMPLETED'
)
RETURNS JSON AS $$
DECLARE
    v_user_id UUID;
    v_username TEXT;
    result JSON;
BEGIN
    -- Buscar um usuário disponível e marcar como ocupado atomicamente
    UPDATE public.pre_users 
    SET status = 'occupied', updated_at = NOW()
    WHERE id = (
        SELECT id FROM public.pre_users 
        WHERE status = 'available' 
        ORDER BY created_at 
        LIMIT 1 
        FOR UPDATE SKIP LOCKED
    )
    RETURNING id, username INTO v_user_id, v_username;
    
    -- Se não encontrou usuário disponível
    IF v_user_id IS NULL THEN
        SELECT json_build_object(
            'success', false,
            'error', 'Nenhum usuário pré-criado disponível',
            'username', null,
            'user_id', null
        ) INTO result;
        RETURN result;
    END IF;
    
    -- Registrar a atribuição
    INSERT INTO public.user_assignments (
        pre_user_id,
        buyer_email,
        buyer_name,
        hotmart_transaction_id,
        hotmart_notification_id,
        event
    ) VALUES (
        v_user_id,
        p_buyer_email,
        p_buyer_name,
        p_hotmart_transaction_id,
        p_hotmart_notification_id,
        p_event
    );
    
    -- Retornar resultado de sucesso
    SELECT json_build_object(
        'success', true,
        'username', v_username,
        'user_id', v_user_id,
        'message', 'Usuário atribuído com sucesso'
    ) INTO result;
    
    RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Função para liberar um usuário pré-criado
CREATE OR REPLACE FUNCTION release_pre_user(
    p_hotmart_notification_id TEXT,
    p_event TEXT DEFAULT 'PURCHASE_CANCELED'
)
RETURNS JSON AS $$
DECLARE
    v_user_id UUID;
    v_username TEXT;
    v_existing_assignment_id UUID;
    result JSON;
BEGIN
    -- Verificar se já existe uma atribuição com este notification_id
    SELECT id INTO v_existing_assignment_id
    FROM public.user_assignments
    WHERE hotmart_notification_id = p_hotmart_notification_id;
    
    -- Se já existe, não processar novamente
    IF v_existing_assignment_id IS NOT NULL THEN
        SELECT json_build_object(
            'success', false,
            'error', 'Notificação já processada',
            'username', null,
            'message', 'Esta notificação de cancelamento já foi processada anteriormente'
        ) INTO result;
        RETURN result;
    END IF;
    
    -- Buscar a atribuição mais recente para liberar o usuário
    SELECT ua.pre_user_id, pu.username INTO v_user_id, v_username
    FROM public.user_assignments ua
    JOIN public.pre_users pu ON ua.pre_user_id = pu.id
    WHERE ua.buyer_email = (
        SELECT buyer_email FROM public.user_assignments 
        WHERE hotmart_transaction_id = (
            SELECT hotmart_transaction_id FROM public.user_assignments 
            ORDER BY assigned_at DESC LIMIT 1
        )
        ORDER BY assigned_at DESC LIMIT 1
    )
    AND pu.status = 'occupied'
    ORDER BY ua.assigned_at DESC
    LIMIT 1;
    
    -- Se encontrou usuário para liberar
    IF v_user_id IS NOT NULL THEN
        -- Marcar usuário como disponível
        UPDATE public.pre_users 
        SET status = 'available', updated_at = NOW()
        WHERE id = v_user_id;
        
        -- Registrar o cancelamento
        INSERT INTO public.user_assignments (
            pre_user_id,
            hotmart_notification_id,
            event,
            note
        ) VALUES (
            v_user_id,
            p_hotmart_notification_id,
            p_event,
            'Usuário liberado por cancelamento/reembolso'
        );
        
        SELECT json_build_object(
            'success', true,
            'username', v_username,
            'user_id', v_user_id,
            'message', 'Usuário liberado com sucesso'
        ) INTO result;
    ELSE
        SELECT json_build_object(
            'success', false,
            'error', 'Nenhum usuário ocupado encontrado para liberar',
            'username', null,
            'message', 'Não foi possível encontrar um usuário para liberar'
        ) INTO result;
    END IF;
    
    RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Inserir alguns usuários de exemplo para teste
INSERT INTO public.pre_users (username, email, status) 
SELECT 'user' || LPAD(generate_series::text, 4, '0') AS username,
       'user' || LPAD(generate_series::text, 4, '0') || '@ciliosclick.com' AS email,
       'available' AS status
FROM generate_series(1, 10)
ON CONFLICT (username) DO NOTHING;

-- Comentários finais
COMMENT ON TABLE public.pre_users IS 'Tabela de usuários pré-criados para integração Hotmart';
COMMENT ON TABLE public.user_assignments IS 'Tabela de atribuições de usuários para compradores';
COMMENT ON FUNCTION get_pre_users_stats() IS 'Função para obter estatísticas dos usuários pré-criados';
COMMENT ON FUNCTION assign_pre_user(TEXT, TEXT, TEXT, TEXT, TEXT) IS 'Função para atribuir um usuário pré-criado a um comprador';
COMMENT ON FUNCTION release_pre_user(TEXT, TEXT) IS 'Função para liberar um usuário pré-criado após cancelamento';