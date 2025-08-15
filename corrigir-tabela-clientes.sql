-- Script para corrigir a tabela clientes
-- Execute este SQL no Supabase Dashboard > SQL Editor

-- 1. Remover tabela existente se houver problemas
DROP TABLE IF EXISTS public.clientes CASCADE;

-- 2. Criar tabela clientes com estrutura correta
CREATE TABLE IF NOT EXISTS public.clientes (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    nome VARCHAR(255) NOT NULL,
    email VARCHAR(255),
    telefone VARCHAR(50),
    data_nascimento DATE,
    observacoes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- 3. Criar índices para melhor performance
CREATE INDEX IF NOT EXISTS idx_clientes_user_id ON public.clientes(user_id);
CREATE INDEX IF NOT EXISTS idx_clientes_nome ON public.clientes(nome);
CREATE INDEX IF NOT EXISTS idx_clientes_email ON public.clientes(email);

-- 4. Habilitar RLS (Row Level Security)
ALTER TABLE public.clientes ENABLE ROW LEVEL SECURITY;

-- 5. Remover políticas existentes se houver
DROP POLICY IF EXISTS "Usuários podem ver apenas seus próprios clientes" ON public.clientes;
DROP POLICY IF EXISTS "Usuários podem inserir clientes para si mesmos" ON public.clientes;
DROP POLICY IF EXISTS "Usuários podem atualizar apenas seus próprios clientes" ON public.clientes;
DROP POLICY IF EXISTS "Usuários podem deletar apenas seus próprios clientes" ON public.clientes;
DROP POLICY IF EXISTS "Usuários podem ver seus clientes" ON public.clientes;
DROP POLICY IF EXISTS "Usuários podem inserir clientes" ON public.clientes;
DROP POLICY IF EXISTS "Usuários podem atualizar seus clientes" ON public.clientes;
DROP POLICY IF EXISTS "Usuários podem deletar seus clientes" ON public.clientes;

-- 6. Criar políticas RLS corretas
CREATE POLICY "Usuários podem ver apenas seus próprios clientes" ON public.clientes
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Usuários podem inserir clientes para si mesmos" ON public.clientes
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Usuários podem atualizar apenas seus próprios clientes" ON public.clientes
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Usuários podem deletar apenas seus próprios clientes" ON public.clientes
    FOR DELETE USING (auth.uid() = user_id);

-- 7. Criar função para atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = TIMEZONE('utc'::text, NOW());
    RETURN NEW;
END;
$$ language 'plpgsql';

-- 8. Criar trigger para atualizar updated_at
DROP TRIGGER IF EXISTS update_clientes_updated_at ON public.clientes;
CREATE TRIGGER update_clientes_updated_at 
    BEFORE UPDATE ON public.clientes
    FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

-- 9. Comentário para documentação
COMMENT ON TABLE public.clientes IS 'Tabela de clientes com RLS corrigido para autenticação via Supabase Auth';

-- 10. Verificar se a tabela foi criada corretamente
SELECT 
    'Tabela clientes criada com sucesso!' as status,
    COUNT(*) as total_clientes
FROM public.clientes;