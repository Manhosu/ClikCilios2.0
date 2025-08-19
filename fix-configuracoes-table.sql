-- Script para corrigir a tabela configuracoes_usuario
-- Adiciona colunas faltantes identificadas no teste

-- Verificar se a tabela existe
SELECT 'Verificando tabela configuracoes_usuario...' as status;

-- Adicionar colunas faltantes se não existirem
ALTER TABLE public.configuracoes_usuario 
ADD COLUMN IF NOT EXISTS tema TEXT DEFAULT 'claro' CHECK (tema IN ('claro', 'escuro'));

ALTER TABLE public.configuracoes_usuario 
ADD COLUMN IF NOT EXISTS notificacoes_email BOOLEAN DEFAULT true;

ALTER TABLE public.configuracoes_usuario 
ADD COLUMN IF NOT EXISTS notificacoes_push BOOLEAN DEFAULT true;

ALTER TABLE public.configuracoes_usuario 
ADD COLUMN IF NOT EXISTS idioma TEXT DEFAULT 'pt-BR' CHECK (idioma IN ('pt-BR', 'en-US', 'es-ES'));

ALTER TABLE public.configuracoes_usuario 
ADD COLUMN IF NOT EXISTS timezone TEXT DEFAULT 'America/Sao_Paulo';

ALTER TABLE public.configuracoes_usuario 
ADD COLUMN IF NOT EXISTS formato_data TEXT DEFAULT 'DD/MM/YYYY' CHECK (formato_data IN ('DD/MM/YYYY', 'MM/DD/YYYY', 'YYYY-MM-DD'));

ALTER TABLE public.configuracoes_usuario 
ADD COLUMN IF NOT EXISTS formato_hora TEXT DEFAULT '24h' CHECK (formato_hora IN ('12h', '24h'));

ALTER TABLE public.configuracoes_usuario 
ADD COLUMN IF NOT EXISTS moeda TEXT DEFAULT 'BRL' CHECK (moeda IN ('BRL', 'USD', 'EUR'));

ALTER TABLE public.configuracoes_usuario 
ADD COLUMN IF NOT EXISTS backup_automatico BOOLEAN DEFAULT true;

ALTER TABLE public.configuracoes_usuario 
ADD COLUMN IF NOT EXISTS backup_frequencia TEXT DEFAULT 'semanal' CHECK (backup_frequencia IN ('diario', 'semanal', 'mensal'));

-- Adicionar colunas de timestamp se não existirem
ALTER TABLE public.configuracoes_usuario 
ADD COLUMN IF NOT EXISTS created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW());

ALTER TABLE public.configuracoes_usuario 
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW());

-- Criar índice se não existir
CREATE INDEX IF NOT EXISTS idx_configuracoes_usuario_user_id ON public.configuracoes_usuario(user_id);

-- Garantir que RLS está habilitado
ALTER TABLE public.configuracoes_usuario ENABLE ROW LEVEL SECURITY;

-- Remover políticas existentes para evitar conflitos
DROP POLICY IF EXISTS "users_can_view_own_config" ON public.configuracoes_usuario;
DROP POLICY IF EXISTS "users_can_insert_own_config" ON public.configuracoes_usuario;
DROP POLICY IF EXISTS "users_can_update_own_config" ON public.configuracoes_usuario;
DROP POLICY IF EXISTS "users_can_delete_own_config" ON public.configuracoes_usuario;

-- Criar políticas RLS
CREATE POLICY "users_can_view_own_config" ON public.configuracoes_usuario
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "users_can_insert_own_config" ON public.configuracoes_usuario
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "users_can_update_own_config" ON public.configuracoes_usuario
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "users_can_delete_own_config" ON public.configuracoes_usuario
  FOR DELETE USING (auth.uid() = user_id);

-- Verificar estrutura final da tabela
SELECT column_name, data_type, is_nullable, column_default 
FROM information_schema.columns 
WHERE table_name = 'configuracoes_usuario' 
AND table_schema = 'public'
ORDER BY ordinal_position;

SELECT 'Tabela configuracoes_usuario corrigida com sucesso!' as resultado;