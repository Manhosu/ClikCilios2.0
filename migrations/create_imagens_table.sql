-- Criação da tabela imagens
CREATE TABLE IF NOT EXISTS public.imagens (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    nome_arquivo VARCHAR(255) NOT NULL,
    url_original TEXT NOT NULL,
    url_processada TEXT,
    estilo_aplicado VARCHAR(100),
    cliente_nome VARCHAR(255),
    observacoes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Índices para melhor performance
CREATE INDEX IF NOT EXISTS idx_imagens_user_id ON public.imagens(user_id);
CREATE INDEX IF NOT EXISTS idx_imagens_estilo ON public.imagens(estilo_aplicado);
CREATE INDEX IF NOT EXISTS idx_imagens_cliente ON public.imagens(cliente_nome);
CREATE INDEX IF NOT EXISTS idx_imagens_created_at ON public.imagens(created_at);

-- RLS (Row Level Security)
ALTER TABLE public.imagens ENABLE ROW LEVEL SECURITY;

-- Política para que usuários vejam apenas suas próprias imagens
CREATE POLICY "Usuários podem ver apenas suas próprias imagens" ON public.imagens
    FOR ALL USING (auth.uid() = user_id);

-- Política para que usuários possam inserir imagens para si mesmos
CREATE POLICY "Usuários podem inserir imagens para si mesmos" ON public.imagens
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Política para que usuários possam atualizar apenas suas próprias imagens
CREATE POLICY "Usuários podem atualizar apenas suas próprias imagens" ON public.imagens
    FOR UPDATE USING (auth.uid() = user_id);

-- Política para que usuários possam deletar apenas suas próprias imagens
CREATE POLICY "Usuários podem deletar apenas suas próprias imagens" ON public.imagens
    FOR DELETE USING (auth.uid() = user_id);

-- Trigger para atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = TIMEZONE('utc'::text, NOW());
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_imagens_updated_at BEFORE UPDATE ON public.imagens
    FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();