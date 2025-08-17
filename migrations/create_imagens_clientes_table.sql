-- Criação da tabela imagens_clientes
-- Esta tabela é usada pelo imagensService.ts

CREATE TABLE IF NOT EXISTS public.imagens_clientes (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    cliente_id UUID NOT NULL,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    nome TEXT NOT NULL,
    url TEXT NOT NULL,
    tipo TEXT NOT NULL CHECK (tipo IN ('antes', 'depois', 'processo')),
    descricao TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Índices para melhor performance
CREATE INDEX IF NOT EXISTS idx_imagens_clientes_user_id ON public.imagens_clientes(user_id);
CREATE INDEX IF NOT EXISTS idx_imagens_clientes_cliente_id ON public.imagens_clientes(cliente_id);
CREATE INDEX IF NOT EXISTS idx_imagens_clientes_tipo ON public.imagens_clientes(tipo);
CREATE INDEX IF NOT EXISTS idx_imagens_clientes_created_at ON public.imagens_clientes(created_at DESC);

-- RLS (Row Level Security)
ALTER TABLE public.imagens_clientes ENABLE ROW LEVEL SECURITY;

-- Política para que usuários vejam apenas suas próprias imagens
CREATE POLICY "Usuários podem ver apenas suas próprias imagens de clientes" ON public.imagens_clientes
    FOR ALL USING (auth.uid() = user_id);

-- Política para que usuários possam inserir imagens para si mesmos
CREATE POLICY "Usuários podem inserir imagens de clientes para si mesmos" ON public.imagens_clientes
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Política para que usuários possam atualizar apenas suas próprias imagens
CREATE POLICY "Usuários podem atualizar apenas suas próprias imagens de clientes" ON public.imagens_clientes
    FOR UPDATE USING (auth.uid() = user_id);

-- Política para que usuários possam deletar apenas suas próprias imagens
CREATE POLICY "Usuários podem deletar apenas suas próprias imagens de clientes" ON public.imagens_clientes
    FOR DELETE USING (auth.uid() = user_id);

-- Comentários para documentação
COMMENT ON TABLE public.imagens_clientes IS 'Tabela para armazenar imagens dos clientes processadas pelo sistema';
COMMENT ON COLUMN public.imagens_clientes.cliente_id IS 'ID do cliente associado à imagem';
COMMENT ON COLUMN public.imagens_clientes.user_id IS 'ID do usuário que fez o upload da imagem';
COMMENT ON COLUMN public.imagens_clientes.nome IS 'Nome da imagem';
COMMENT ON COLUMN public.imagens_clientes.url IS 'URL da imagem armazenada';
COMMENT ON COLUMN public.imagens_clientes.tipo IS 'Tipo da imagem: antes, depois ou processo';
COMMENT ON COLUMN public.imagens_clientes.descricao IS 'Descrição opcional da imagem';

SELECT 'Tabela imagens_clientes criada com sucesso!' as resultado;