-- Script SQL para criar o bucket 'minhas-imagens' e configurar políticas RLS
-- Execute este script no SQL Editor do Dashboard do Supabase

-- 1. Criar o bucket
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'minhas-imagens', 
  'minhas-imagens', 
  true,
  10485760, -- 10MB em bytes
  ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif']
) 
ON CONFLICT (id) DO NOTHING;

-- 2. Política para permitir upload para usuários autenticados
-- Os arquivos são organizados por user_id: user_id/filename.jpg
CREATE POLICY IF NOT EXISTS "Usuários autenticados podem fazer upload" ON storage.objects
FOR INSERT TO authenticated
WITH CHECK (
  bucket_id = 'minhas-imagens' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- 3. Política para permitir leitura pública das imagens
CREATE POLICY IF NOT EXISTS "Leitura pública das imagens" ON storage.objects
FOR SELECT TO public
USING (bucket_id = 'minhas-imagens');

-- 4. Política para permitir usuários atualizarem suas próprias imagens
CREATE POLICY IF NOT EXISTS "Usuários podem atualizar suas próprias imagens" ON storage.objects
FOR UPDATE TO authenticated
USING (
  bucket_id = 'minhas-imagens' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- 5. Política para permitir usuários excluírem suas próprias imagens  
CREATE POLICY IF NOT EXISTS "Usuários podem excluir suas próprias imagens" ON storage.objects
FOR DELETE TO authenticated
USING (
  bucket_id = 'minhas-imagens' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Verificar se o bucket foi criado corretamente
SELECT * FROM storage.buckets WHERE name = 'minhas-imagens';

-- Verificar as políticas criadas
SELECT schemaname, tablename, policyname, permissive, cmd, qual 
FROM pg_policies 
WHERE tablename = 'objects' AND policyname ILIKE '%minhas-imagens%';