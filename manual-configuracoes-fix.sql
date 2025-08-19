-- =====================================================
-- SCRIPT PARA CORRIGIR TABELA CONFIGURACOES_USUARIO
-- Execute este SQL no SQL Editor do Supabase
-- =====================================================

-- 1. Fazer backup dos dados existentes (se houver)
CREATE TABLE IF NOT EXISTS configuracoes_usuario_backup AS 
SELECT * FROM public.configuracoes_usuario;

-- 2. Remover tabela existente
DROP TABLE IF EXISTS public.configuracoes_usuario CASCADE;

-- 3. Criar nova tabela com estrutura completa
CREATE TABLE public.configuracoes_usuario (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  tema TEXT DEFAULT 'claro' CHECK (tema IN ('claro', 'escuro')),
  notificacoes_email BOOLEAN DEFAULT true,
  notificacoes_push BOOLEAN DEFAULT true,
  idioma TEXT DEFAULT 'pt-BR' CHECK (idioma IN ('pt-BR', 'en-US', 'es-ES')),
  timezone TEXT DEFAULT 'America/Sao_Paulo',
  formato_data TEXT DEFAULT 'DD/MM/YYYY' CHECK (formato_data IN ('DD/MM/YYYY', 'MM/DD/YYYY', 'YYYY-MM-DD')),
  formato_hora TEXT DEFAULT '24h' CHECK (formato_hora IN ('12h', '24h')),
  moeda TEXT DEFAULT 'BRL' CHECK (moeda IN ('BRL', 'USD', 'EUR')),
  backup_automatico BOOLEAN DEFAULT true,
  backup_frequencia TEXT DEFAULT 'semanal' CHECK (backup_frequencia IN ('diario', 'semanal', 'mensal')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  UNIQUE(user_id)
);

-- 4. Criar índice
CREATE INDEX idx_configuracoes_usuario_user_id ON public.configuracoes_usuario(user_id);

-- 5. Habilitar RLS
ALTER TABLE public.configuracoes_usuario ENABLE ROW LEVEL SECURITY;

-- 6. Criar políticas RLS
CREATE POLICY "users_can_view_own_config" ON public.configuracoes_usuario
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "users_can_insert_own_config" ON public.configuracoes_usuario
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "users_can_update_own_config" ON public.configuracoes_usuario
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "users_can_delete_own_config" ON public.configuracoes_usuario
  FOR DELETE USING (auth.uid() = user_id);

-- 7. Restaurar dados do backup (se existirem) com conversão de tipos
INSERT INTO public.configuracoes_usuario (
  id,
  user_id,
  tema,
  notificacoes_email,
  notificacoes_push,
  idioma,
  timezone,
  formato_data,
  formato_hora,
  moeda,
  backup_automatico,
  backup_frequencia,
  created_at,
  updated_at
)
SELECT 
  id,
  user_id,
  COALESCE(tema, 'claro'),
  CASE 
    WHEN notificacoes_email::text = 'true' THEN true
    WHEN notificacoes_email::text = 'false' THEN false
    ELSE true
  END,
  CASE 
    WHEN notificacoes_push::text = 'true' THEN true
    WHEN notificacoes_push::text = 'false' THEN false
    ELSE true
  END,
  COALESCE(idioma, 'pt-BR'),
  COALESCE(timezone, 'America/Sao_Paulo'),
  COALESCE(formato_data, 'DD/MM/YYYY'),
  COALESCE(formato_hora, '24h'),
  COALESCE(moeda, 'BRL'),
  CASE 
    WHEN backup_automatico::text = 'true' THEN true
    WHEN backup_automatico::text = 'false' THEN false
    ELSE true
  END,
  COALESCE(backup_frequencia, 'semanal'),
  COALESCE(created_at, NOW()),
  COALESCE(updated_at, NOW())
FROM configuracoes_usuario_backup 
WHERE EXISTS (SELECT 1 FROM configuracoes_usuario_backup);

-- 8. Remover tabela de backup
DROP TABLE IF EXISTS configuracoes_usuario_backup;

-- 9. Verificar estrutura final
SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_name = 'configuracoes_usuario' 
AND table_schema = 'public'
ORDER BY ordinal_position;

-- 10. Teste de inserção
INSERT INTO public.configuracoes_usuario (
  user_id,
  tema,
  notificacoes_email,
  notificacoes_push,
  idioma,
  timezone,
  formato_data,
  formato_hora,
  moeda,
  backup_automatico,
  backup_frequencia
) VALUES (
  '00000000-0000-0000-0000-000000000001',
  'claro',
  true,
  true,
  'pt-BR',
  'America/Sao_Paulo',
  'DD/MM/YYYY',
  '24h',
  'BRL',
  true,
  'semanal'
);

-- 11. Verificar inserção
SELECT * FROM public.configuracoes_usuario 
WHERE user_id = '00000000-0000-0000-0000-000000000001';

-- 12. Limpar dados de teste
DELETE FROM public.configuracoes_usuario 
WHERE user_id = '00000000-0000-0000-0000-000000000001';

-- =====================================================
-- SUCESSO! Tabela configuracoes_usuario corrigida
-- =====================================================