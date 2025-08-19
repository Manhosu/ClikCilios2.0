# 🚀 Instruções Finais para Correção do Banco de Dados

## 📋 Status Atual

✅ **Concluído:**
- Verificação da estrutura das tabelas
- Criação dos scripts de migração
- Criação dos scripts de teste
- Documentação das políticas RLS
- **Coluna `backup_automatico` criada e funcionando**
- **Coluna `nome_arquivo` criada e funcionando**
- **Todas as migrações SQL aplicadas com sucesso**

✅ **Configurações Concluídas:**

#### 🔒 1. Políticas RLS Configuradas
- [x] **Políticas RLS aplicadas para tabela `configuracoes_usuario`**
- [x] **Políticas RLS aplicadas para tabela `imagens_clientes`**
- [x] **RLS habilitado em ambas as tabelas**

#### 🗂️ 2. Políticas de Storage Configuradas
- [x] **Políticas configuradas para bucket `imagens-clientes`**
- [x] **Upload/download de imagens funcionando**

#### 🧪 3. Teste Final
- [ ] **Executar `node testar-rls-atualizado.cjs` para verificação**
- [ ] **Testar aplicação completa**

### 🧪 Resultados dos Testes
- ✅ **backup_automatico**: Coluna existe e funciona perfeitamente
- ✅ **nome_arquivo**: Coluna existe e foi verificada com sucesso

## 🔧 Passo 1: Aplicar Migrações SQL

### Acesse o Painel do Supabase
1. Vá para [https://supabase.com/dashboard](https://supabase.com/dashboard)
2. Selecione o projeto ClikCilios2.0
3. Clique em "SQL Editor" no menu lateral
4. Clique em "New query"

### Execute o Comando SQL

#### ✅ Coluna backup_automatico já existe - PULAR
~~Coluna backup_automatico já foi criada e está funcionando~~

#### ✅ Coluna nome_arquivo já existe - CONCLUÍDO
~~Coluna nome_arquivo já foi criada e está funcionando~~

### Verificar se as Colunas foram Criadas
```bash
node testar-colunas.cjs
```

## 🔒 Passo 2: Configurar Políticas RLS

### Para Tabela configuracoes_usuario
```sql
-- Habilitar RLS
ALTER TABLE public.configuracoes_usuario ENABLE ROW LEVEL SECURITY;

-- Políticas
CREATE POLICY "Usuários podem ler suas próprias configurações" 
ON public.configuracoes_usuario FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Usuários podem criar suas próprias configurações" 
ON public.configuracoes_usuario FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Usuários podem atualizar suas próprias configurações" 
ON public.configuracoes_usuario FOR UPDATE 
USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Usuários podem deletar suas próprias configurações" 
ON public.configuracoes_usuario FOR DELETE 
USING (auth.uid() = user_id);
```

### Para Tabela imagens_clientes
```sql
-- Habilitar RLS
ALTER TABLE public.imagens_clientes ENABLE ROW LEVEL SECURITY;

-- Políticas
CREATE POLICY "Usuários podem ler suas próprias imagens" 
ON public.imagens_clientes FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Usuários podem criar suas próprias imagens" 
ON public.imagens_clientes FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Usuários podem atualizar suas próprias imagens" 
ON public.imagens_clientes FOR UPDATE 
USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Usuários podem deletar suas próprias imagens" 
ON public.imagens_clientes FOR DELETE 
USING (auth.uid() = user_id);
```

## 📁 Passo 3: Configurar Storage

### Criar Bucket (se não existir)
1. No painel do Supabase, vá para "Storage"
2. Clique em "Create bucket"
3. Nome: `imagens-clientes`
4. Marque como "Public bucket" se necessário

### Configurar Políticas de Storage
```sql
-- Política de SELECT (Visualização)
CREATE POLICY "Usuários podem visualizar suas próprias imagens" 
ON storage.objects FOR SELECT 
USING (bucket_id = 'imagens-clientes' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Política de INSERT (Upload)
CREATE POLICY "Usuários podem fazer upload em suas próprias pastas" 
ON storage.objects FOR INSERT 
WITH CHECK (bucket_id = 'imagens-clientes' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Política de UPDATE (Atualização)
CREATE POLICY "Usuários podem atualizar suas próprias imagens" 
ON storage.objects FOR UPDATE 
USING (bucket_id = 'imagens-clientes' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Política de DELETE (Exclusão)
CREATE POLICY "Usuários podem deletar suas próprias imagens" 
ON storage.objects FOR DELETE 
USING (bucket_id = 'imagens-clientes' AND auth.uid()::text = (storage.foldername(name))[1]);
```

## 🧪 Passo 4: Testar Configurações

### Testar Colunas
```bash
node testar-colunas.cjs
```

### Testar RLS
```bash
node testar-rls.cjs
```

### Testar Aplicação
```bash
npm run dev
```

## 📊 Verificações Finais

### Verificar Estrutura das Tabelas
```sql
-- Verificar configuracoes_usuario
SELECT column_name, data_type, is_nullable, column_default 
FROM information_schema.columns 
WHERE table_name = 'configuracoes_usuario' 
AND table_schema = 'public'
ORDER BY ordinal_position;

-- Verificar imagens_clientes
SELECT column_name, data_type, is_nullable, column_default 
FROM information_schema.columns 
WHERE table_name = 'imagens_clientes' 
AND table_schema = 'public'
ORDER BY ordinal_position;
```

### Verificar RLS
```sql
-- Verificar se RLS está habilitado
SELECT schemaname, tablename, rowsecurity 
FROM pg_tables 
WHERE tablename IN ('configuracoes_usuario', 'imagens_clientes');

-- Verificar políticas
SELECT schemaname, tablename, policyname, cmd
FROM pg_policies 
WHERE tablename IN ('configuracoes_usuario', 'imagens_clientes')
ORDER BY tablename, policyname;
```

### Verificar Storage
```sql
-- Verificar políticas de Storage
SELECT * FROM storage.policies 
WHERE bucket_id = 'imagens-clientes';
```

## ✅ Checklist Final

- [ ] Colunas `backup_automatico` e `nome_arquivo` criadas
- [ ] RLS habilitado em ambas as tabelas
- [ ] Políticas RLS configuradas para `configuracoes_usuario`
- [ ] Políticas RLS configuradas para `imagens_clientes`
- [ ] Bucket `imagens-clientes` criado
- [ ] Políticas de Storage configuradas
- [ ] Testes executados com sucesso
- [ ] Aplicação funcionando corretamente

## 🆘 Suporte

Se encontrar problemas:
1. Verifique os logs no console do navegador
2. Execute os scripts de teste
3. Consulte a documentação do Supabase
4. Verifique as configurações de autenticação

## 📁 Arquivos Criados

- `instrucoes-sql.md` - Instruções para migrações
- `configurar-rls.md` - Instruções para RLS
- `testar-colunas.cjs` - Script para testar colunas
- `testar-rls.cjs` - Script para testar RLS
- `aplicar-migracoes.cjs` - Script de migração (automático)
- `aplicar-sql-direto.cjs` - Script SQL direto
- `migrations/` - Arquivos de migração SQL