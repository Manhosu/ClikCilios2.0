# 🪣 Configuração do Bucket Supabase Storage

## ❌ Problema Identificado
O bucket `minhas-imagens` não existe no Supabase Storage, causando erro 400 nos uploads.

## ✅ Solução: Criar o Bucket

### Opção 1: Dashboard do Supabase (Recomendado)
1. Acesse o [Dashboard do Supabase](https://supabase.com/dashboard)
2. Selecione seu projeto
3. Vá para **Storage** > **Buckets** 
4. Clique em **"New bucket"**
5. Configure:
   - **Nome**: `minhas-imagens`
   - **Public bucket**: ✅ **Habilitado** (importante para URLs públicas)
   - **File size limit**: `10 MB`
   - **Allowed MIME types**: 
     - `image/jpeg`
     - `image/jpg` 
     - `image/png`
     - `image/webp`
     - `image/gif`

### Opção 2: SQL Editor
1. Vá para **SQL Editor** no Dashboard
2. Execute o script `create-bucket-sql.sql`:

```sql
-- Criar o bucket
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'minhas-imagens', 
  'minhas-imagens', 
  true,
  10485760, -- 10MB
  ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif']
) ON CONFLICT (id) DO NOTHING;
```

## 🔐 Configurar Políticas RLS

Execute no SQL Editor para permitir uploads:

```sql
-- Usuários podem fazer upload nas suas próprias pastas
CREATE POLICY "Upload próprias imagens" ON storage.objects
FOR INSERT TO authenticated
WITH CHECK (
  bucket_id = 'minhas-imagens' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Leitura pública
CREATE POLICY "Leitura pública" ON storage.objects
FOR SELECT TO public
USING (bucket_id = 'minhas-imagens');

-- Usuários podem excluir suas próprias imagens
CREATE POLICY "Excluir próprias imagens" ON storage.objects
FOR DELETE TO authenticated
USING (
  bucket_id = 'minhas-imagens' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);
```

## 🧪 Testar Configuração
Depois de criar o bucket, execute:

```bash
node test-bucket.cjs
```

## 📁 Estrutura de Arquivos
As imagens são organizadas como:
```
minhas-imagens/
├── user-id-1/
│   ├── uuid1.jpg
│   └── uuid2.png
├── user-id-2/
│   └── uuid3.webp
└── ...
```

## 🚨 Solução de Problemas

### Erro: "Bucket not found"
- ✅ Criar o bucket conforme instruções acima

### Erro: "new row violates row-level security policy"  
- ✅ Configurar as políticas RLS conforme scripts acima

### Erro 400 no upload
- ✅ Verificar se o bucket é público
- ✅ Verificar políticas RLS
- ✅ Verificar tamanho do arquivo (< 10MB)

### Upload funciona mas imagem não aparece
- ✅ Verificar se bucket está marcado como público
- ✅ Testar URL pública no navegador

## ✅ Verificação Final
Após a configuração, você deve ver:
- ✅ Bucket `minhas-imagens` listado no Storage
- ✅ Status "public" habilitado  
- ✅ Políticas RLS configuradas
- ✅ Uploads funcionando sem erro 400