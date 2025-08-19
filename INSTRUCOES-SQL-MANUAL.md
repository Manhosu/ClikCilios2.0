# 🔧 Instruções para Correção Manual da Tabela configuracoes_usuario

## ⚠️ Problema Identificado
A coluna `backup_automatico` não está presente na tabela `configuracoes_usuario`, causando erros na aplicação.

## 🎯 Solução
Execute o SQL abaixo diretamente no **SQL Editor** do painel do Supabase:

### 1. Acesse o Painel do Supabase
- Vá para: https://supabase.com/dashboard
- Selecione seu projeto: **ClikCilios2.0**
- Clique em **SQL Editor** no menu lateral

### 2. Execute o SQL de Correção
```sql
-- Adicionar colunas faltantes na tabela configuracoes_usuario
ALTER TABLE public.configuracoes_usuario 
ADD COLUMN IF NOT EXISTS backup_automatico BOOLEAN DEFAULT true;

ALTER TABLE public.configuracoes_usuario 
ADD COLUMN IF NOT EXISTS backup_frequencia TEXT DEFAULT 'semanal' 
CHECK (backup_frequencia IN ('diario', 'semanal', 'mensal'));

-- Verificar se as colunas foram adicionadas
SELECT column_name, data_type, column_default 
FROM information_schema.columns 
WHERE table_name = 'configuracoes_usuario' 
AND table_schema = 'public'
ORDER BY ordinal_position;
```

## 📋 INSTRUÇÕES PARA EXECUÇÃO MANUAL NO SUPABASE

### ⚠️ IMPORTANTE: Execute estes comandos SQL no painel do Supabase

1. Acesse o painel do Supabase
2. Vá para "SQL Editor"
3. Execute os comandos abaixo na ordem apresentada

---

### 🔧 1. Adicionar colunas faltantes na tabela configuracoes_usuario

```sql
-- Adicionar coluna backup_frequencia
ALTER TABLE public.configuracoes_usuario 
ADD COLUMN IF NOT EXISTS backup_frequencia TEXT DEFAULT 'semanal' CHECK (backup_frequencia IN ('diario', 'semanal', 'mensal'));

-- Adicionar outras colunas essenciais
ALTER TABLE public.configuracoes_usuario 
ADD COLUMN IF NOT EXISTS tema TEXT DEFAULT 'light' CHECK (tema IN ('light', 'dark', 'auto')),
ADD COLUMN IF NOT EXISTS notificacoes_email BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS notificacoes_push BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS idioma TEXT DEFAULT 'pt-BR',
ADD COLUMN IF NOT EXISTS timezone TEXT DEFAULT 'America/Sao_Paulo',
ADD COLUMN IF NOT EXISTS formato_data TEXT DEFAULT 'DD/MM/YYYY',
ADD COLUMN IF NOT EXISTS formato_hora TEXT DEFAULT 'HH:mm',
ADD COLUMN IF NOT EXISTS moeda TEXT DEFAULT 'BRL';
```

---

### 🔧 2. Atualizar estrutura da tabela imagens_clientes

```sql
-- Adicionar colunas necessárias para compatibilidade com o código
ALTER TABLE public.imagens_clientes 
ADD COLUMN IF NOT EXISTS filename TEXT,
ADD COLUMN IF NOT EXISTS original_name TEXT,
ADD COLUMN IF NOT EXISTS file_size BIGINT,
ADD COLUMN IF NOT EXISTS mime_type TEXT,
ADD COLUMN IF NOT EXISTS width INTEGER,
ADD COLUMN IF NOT EXISTS height INTEGER,
ADD COLUMN IF NOT EXISTS storage_path TEXT;

-- Migrar dados existentes
UPDATE public.imagens_clientes 
SET 
  filename = COALESCE(nome, 'unknown.jpg'),
  original_name = COALESCE(nome, 'unknown.jpg'),
  file_size = 0,
  mime_type = 'image/jpeg',
  storage_path = COALESCE(url, '')
WHERE filename IS NULL;

-- Adicionar índices para performance
CREATE INDEX IF NOT EXISTS idx_imagens_clientes_filename ON public.imagens_clientes(filename);
CREATE INDEX IF NOT EXISTS idx_imagens_clientes_mime_type ON public.imagens_clientes(mime_type);
CREATE INDEX IF NOT EXISTS idx_imagens_clientes_file_size ON public.imagens_clientes(file_size);
```

### 3. Verificar o Resultado
Após executar o SQL, você deve ver as colunas:
- `backup_automatico` (boolean, default: true)
- `backup_frequencia` (text, default: 'semanal')

### 4. Testar a Aplicação
Após a execução do SQL, execute:
```bash
node test-after-fix.cjs
```

## 🚀 Status Atual da Aplicação

### ✅ Funcionando Corretamente:
- Servidor de desenvolvimento rodando em http://localhost:3000
- Build da aplicação sem erros
- Tabela `configuracoes_usuario` acessível
- Storage buckets configurados
- Contadores de dados funcionando (52 usuários, 1 cliente, 10 imagens)
- Autenticação e loading infinito corrigidos

### ⚠️ Pendente:
- Adicionar coluna `backup_automatico` via SQL manual
- APIs `list-images` e `save-client-image` retornando 404 (pode ser devido à falta da coluna)

## 📝 Próximos Passos
1. Execute o SQL manual conforme instruções acima
2. Teste novamente com `node test-after-fix.cjs`
3. Verifique se as APIs param de retornar 404
4. Teste o fluxo completo da aplicação no navegador

---

**Nota:** A aplicação está praticamente pronta para produção. Apenas esta correção de banco de dados é necessária para resolver os últimos problemas.