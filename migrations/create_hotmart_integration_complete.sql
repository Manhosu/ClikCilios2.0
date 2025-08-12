-- Habilitar extensão para UUID
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Tabela de usuários pré-criados
CREATE TABLE IF NOT EXISTS public.pre_users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    username TEXT NOT NULL UNIQUE,
    email TEXT NOT NULL UNIQUE,
    password_hash TEXT,
    status TEXT NOT NULL DEFAULT 'available', -- available | occupied | suspended
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índice para status dos usuários
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

-- Tabela de eventos de webhook
CREATE TABLE IF NOT EXISTS public.webhook_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    hotmart_notification_id TEXT,
    event_type TEXT,
    raw_payload JSONB,
    processed BOOLEAN DEFAULT FALSE,
    response_code INT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices para webhook_events
CREATE INDEX IF NOT EXISTS idx_webhook_events_notification_id ON public.webhook_events(hotmart_notification_id);
CREATE INDEX IF NOT EXISTS idx_webhook_events_event_type ON public.webhook_events(event_type);
CREATE INDEX IF NOT EXISTS idx_webhook_events_processed ON public.webhook_events(processed);
CREATE INDEX IF NOT EXISTS idx_webhook_events_created_at ON public.webhook_events(created_at);

-- RLS (Row Level Security)
ALTER TABLE public.pre_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.webhook_events ENABLE ROW LEVEL SECURITY;

-- Políticas de segurança para pre_users (apenas admins podem gerenciar)
CREATE POLICY "Admins podem gerenciar usuários pré-criados" ON public.pre_users
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.users 
            WHERE id = auth.uid() AND is_admin = true
        )
    );

-- Políticas de segurança para user_assignments (apenas admins podem ver)
CREATE POLICY "Admins podem ver atribuições" ON public.user_assignments
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.users 
            WHERE id = auth.uid() AND is_admin = true
        )
    );

-- Políticas de segurança para webhook_events (apenas admins podem ver)
CREATE POLICY "Admins podem ver eventos de webhook" ON public.webhook_events
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.users 
            WHERE id = auth.uid() AND is_admin = true
        )
    );

-- Trigger para atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_pre_users_updated_at 
    BEFORE UPDATE ON public.pre_users
    FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

-- Função para alocar usuário disponível (com controle de concorrência)
CREATE OR REPLACE FUNCTION allocate_available_user(
    p_buyer_email TEXT,
    p_buyer_name TEXT,
    p_hotmart_transaction_id TEXT,
    p_hotmart_notification_id TEXT,
    p_event TEXT DEFAULT 'purchase_approved'
)
RETURNS TABLE(
    allocated_user_id UUID,
    username TEXT,
    success BOOLEAN,
    message TEXT
) AS $$
DECLARE
    v_user_id UUID;
    v_username TEXT;
BEGIN
    -- Verificar se já foi processado (idempotência)
    IF EXISTS (
        SELECT 1 FROM public.user_assignments 
        WHERE hotmart_notification_id = p_hotmart_notification_id
    ) THEN
        -- Retornar usuário já alocado
        SELECT ua.pre_user_id, pu.username
        INTO v_user_id, v_username
        FROM public.user_assignments ua
        JOIN public.pre_users pu ON ua.pre_user_id = pu.id
        WHERE ua.hotmart_notification_id = p_hotmart_notification_id;
        
        RETURN QUERY SELECT v_user_id, v_username, true, 'Usuário já alocado anteriormente';
        RETURN;
    END IF;
    
    -- Alocar usuário disponível com lock para evitar concorrência
    UPDATE public.pre_users 
    SET status = 'occupied', updated_at = NOW()
    WHERE id = (
        SELECT id FROM public.pre_users 
        WHERE status = 'available' 
        ORDER BY created_at ASC 
        LIMIT 1 
        FOR UPDATE SKIP LOCKED
    )
    RETURNING id, username INTO v_user_id, v_username;
    
    -- Verificar se conseguiu alocar
    IF v_user_id IS NULL THEN
        RETURN QUERY SELECT NULL::UUID, NULL::TEXT, false, 'Nenhum usuário disponível';
        RETURN;
    END IF;
    
    -- Criar atribuição
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
    
    RETURN QUERY SELECT v_user_id, v_username, true, 'Usuário alocado com sucesso';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Função para liberar usuário (cancelamento/reembolso)
CREATE OR REPLACE FUNCTION release_user(
    p_hotmart_notification_id TEXT,
    p_event TEXT DEFAULT 'purchase_cancelled'
)
RETURNS TABLE(
    released_user_id UUID,
    username TEXT,
    success BOOLEAN,
    message TEXT
) AS $$
DECLARE
    v_user_id UUID;
    v_username TEXT;
BEGIN
    -- Encontrar usuário alocado
    SELECT ua.pre_user_id, pu.username
    INTO v_user_id, v_username
    FROM public.user_assignments ua
    JOIN public.pre_users pu ON ua.pre_user_id = pu.id
    WHERE ua.hotmart_transaction_id = (
        SELECT hotmart_transaction_id 
        FROM public.user_assignments 
        WHERE hotmart_notification_id = p_hotmart_notification_id
    );
    
    IF v_user_id IS NULL THEN
        RETURN QUERY SELECT NULL::UUID, NULL::TEXT, false, 'Usuário não encontrado';
        RETURN;
    END IF;
    
    -- Liberar usuário
    UPDATE public.pre_users 
    SET status = 'available', password_hash = NULL, updated_at = NOW()
    WHERE id = v_user_id;
    
    -- Registrar evento de liberação
    INSERT INTO public.user_assignments (
        pre_user_id,
        buyer_email,
        buyer_name,
        hotmart_transaction_id,
        hotmart_notification_id,
        event,
        note
    ) 
    SELECT 
        pre_user_id,
        buyer_email,
        buyer_name,
        hotmart_transaction_id,
        p_hotmart_notification_id,
        p_event,
        'Usuário liberado devido a cancelamento/reembolso'
    FROM public.user_assignments 
    WHERE hotmart_notification_id = (
        SELECT hotmart_notification_id 
        FROM public.user_assignments 
        WHERE hotmart_transaction_id = (
            SELECT hotmart_transaction_id 
            FROM public.user_assignments 
            WHERE hotmart_notification_id = p_hotmart_notification_id
        )
        LIMIT 1
    );
    
    RETURN QUERY SELECT v_user_id, v_username, true, 'Usuário liberado com sucesso';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Inserir alguns usuários de exemplo
INSERT INTO public.pre_users (username, email) VALUES 
    ('user0001', 'user0001@ciliosclick.com'),
    ('user0002', 'user0002@ciliosclick.com'),
    ('user0003', 'user0003@ciliosclick.com'),
    ('user0004', 'user0004@ciliosclick.com'),
    ('user0005', 'user0005@ciliosclick.com'),
    ('user0006', 'user0006@ciliosclick.com'),
    ('user0007', 'user0007@ciliosclick.com'),
    ('user0008', 'user0008@ciliosclick.com'),
    ('user0009', 'user0009@ciliosclick.com'),
    ('user0010', 'user0010@ciliosclick.com')
ON CONFLICT (username) DO NOTHING;

-- Comentários para documentação
COMMENT ON TABLE public.pre_users IS 'Usuários pré-criados para alocação automática via Hotmart';
COMMENT ON TABLE public.user_assignments IS 'Atribuições de usuários para compradores da Hotmart';
COMMENT ON TABLE public.webhook_events IS 'Log de eventos de webhook da Hotmart';
COMMENT ON FUNCTION allocate_available_user IS 'Aloca um usuário disponível para um comprador com controle de concorrência';
COMMENT ON FUNCTION release_user IS 'Libera um usuário alocado em caso de cancelamento ou reembolso';