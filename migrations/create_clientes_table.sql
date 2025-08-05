-- Criação da tabela clientes
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

-- Índices para melhor performance
CREATE INDEX IF NOT EXISTS idx_clientes_user_id ON public.clientes(user_id);
CREATE INDEX IF NOT EXISTS idx_clientes_nome ON public.clientes(nome);
CREATE INDEX IF NOT EXISTS idx_clientes_email ON public.clientes(email);

-- RLS (Row Level Security)
ALTER TABLE public.clientes ENABLE ROW LEVEL SECURITY;

-- Política para que usuários vejam apenas seus próprios clientes
CREATE POLICY "Usuários podem ver apenas seus próprios clientes" ON public.clientes
    FOR ALL USING (auth.uid() = user_id);

-- Política para que usuários possam inserir clientes para si mesmos
CREATE POLICY "Usuários podem inserir clientes para si mesmos" ON public.clientes
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Política para que usuários possam atualizar apenas seus próprios clientes
CREATE POLICY "Usuários podem atualizar apenas seus próprios clientes" ON public.clientes
    FOR UPDATE USING (auth.uid() = user_id);

-- Política para que usuários possam deletar apenas seus próprios clientes
CREATE POLICY "Usuários podem deletar apenas seus próprios clientes" ON public.clientes
    FOR DELETE USING (auth.uid() = user_id);

-- Trigger para atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = TIMEZONE('utc'::text, NOW());
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_clientes_updated_at BEFORE UPDATE ON public.clientes
    FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column(); 