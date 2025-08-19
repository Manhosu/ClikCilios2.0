-- Atualização da estrutura da tabela imagens_clientes
-- Adicionando colunas necessárias para compatibilidade com o código

-- 1. Adicionar colunas que estão faltando
ALTER TABLE public.imagens_clientes 
ADD COLUMN IF NOT EXISTS filename TEXT,
ADD COLUMN IF NOT EXISTS original_name TEXT,
ADD COLUMN IF NOT EXISTS file_size BIGINT,
ADD COLUMN IF NOT EXISTS mime_type TEXT,
ADD COLUMN IF NOT EXISTS width INTEGER,
ADD COLUMN IF NOT EXISTS height INTEGER,
ADD COLUMN IF NOT EXISTS storage_path TEXT;

-- 2. Atualizar dados existentes (migração de dados)
-- Copiar dados das colunas antigas para as novas
UPDATE public.imagens_clientes 
SET 
  filename = COALESCE(nome, 'unknown.jpg'),
  original_name = COALESCE(nome, 'unknown.jpg'),
  file_size = 0,
  mime_type = 'image/jpeg',
  storage_path = COALESCE(url, '')
WHERE filename IS NULL;

-- 3. Adicionar constraints e índices
CREATE INDEX IF NOT EXISTS idx_imagens_clientes_filename ON public.imagens_clientes(filename);
CREATE INDEX IF NOT EXISTS idx_imagens_clientes_mime_type ON public.imagens_clientes(mime_type);
CREATE INDEX IF NOT EXISTS idx_imagens_clientes_file_size ON public.imagens_clientes(file_size);

-- 4. Verificar estrutura final
SELECT 
  column_name, 
  data_type, 
  is_nullable, 
  column_default
FROM information_schema.columns 
WHERE table_name = 'imagens_clientes' 
  AND table_schema = 'public' 
ORDER BY ordinal_position;

SELECT 'Tabela imagens_clientes atualizada com sucesso!' as resultado;