# 🚨 INSTRUÇÕES PARA CRIAR AS TABELAS NO SUPABASE

## ❌ PROBLEMA CONFIRMADO: Tabelas NÃO existem

### 🔍 Status Atual
- ❌ Tabela `pre_users`: NÃO EXISTE (erro 42P01 no SELECT)
- ❌ Tabela `user_assignments`: NÃO EXISTE (erro 42P01)
- ⚠️ COUNT retornou sucesso porém com count = null (inconsistente)
- ❌ INSERT falhou

### Por que não foram criadas via API
As tabelas `pre_users` e `user_assignments` não foram criadas automaticamente via API porque o Supabase não permite criação de tabelas usando a chave anônima por questões de segurança. Operações DDL exigem privilégios administrativos; o método correto é usar o SQL Editor do Dashboard.

➡️ Você precisa executar o SQL manualmente no SQL Editor do Supabase (veja a seção '✅ SOLUÇÃO' abaixo).

## ✅ SOLUÇÃO: CRIAR MANUALMENTE NO DASHBOARD

### PASSO 1: Acessar o SQL Editor
1. Acesse: https://supabase.com/dashboard/project/pdkhcvioaiopwsrburxp/sql
2. Faça login com: `carolineprange86@gmail.com`
3. Use a senha: `#Prange1986`

### PASSO 2: Executar o SQL
Copie e cole o código SQL abaixo no editor e clique em "Run":

```sql
-- Criar tabela pre_users
CREATE TABLE IF NOT EXISTS public.pre_users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(255) UNIQUE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Criar tabela user_assignments
CREATE TABLE IF NOT EXISTS public.user_assignments (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES public.pre_users(id) ON DELETE CASCADE,
    assignment_data JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Habilitar RLS (Row Level Security)
ALTER TABLE public.pre_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_assignments ENABLE ROW LEVEL SECURITY;

-- Remover políticas existentes se houver (para evitar conflitos)
DROP POLICY IF EXISTS "Enable all operations for authenticated users" ON public.pre_users;
DROP POLICY IF EXISTS "Enable all operations for authenticated users" ON public.user_assignments;

-- Criar políticas básicas (permitir tudo por enquanto)
CREATE POLICY "Enable all operations for authenticated users" ON public.pre_users
    FOR ALL USING (true);

CREATE POLICY "Enable all operations for authenticated users" ON public.user_assignments
    FOR ALL USING (true);

-- Inserir dados de teste
INSERT INTO public.pre_users (username) VALUES 
    ('usuario_teste_1'),
    ('usuario_teste_2')
ON CONFLICT (username) DO NOTHING;
```

### PASSO 3: Verificar Criação
Após executar o SQL, execute este comando no terminal para verificar:

```bash
node teste-simples-tabelas.cjs
```

## 🔧 DIAGNÓSTICO REALIZADO

### ✅ O que funciona:
- Conexão com Supabase estabelecida
- Tabela `users` (do auth) existe e é acessível
- Variáveis de ambiente configuradas corretamente

### ❌ O que não funciona:
- Tabelas `pre_users` e `user_assignments` não existem
- Função `exec_sql` não está disponível na API
- Chave anônima não tem permissões para DDL (Data Definition Language)

### 💡 Por que a API não funciona:
1. **Segurança**: Supabase não permite criação de tabelas via API com chave anônima
2. **Arquitetura**: DDL operations requerem privilégios administrativos
3. **Método correto**: SQL Editor no Dashboard é a forma oficial

## 🎯 PRÓXIMOS PASSOS

1. **EXECUTE O SQL MANUALMENTE** no Dashboard (passos acima)
2. **VERIFIQUE** com `node teste-simples-tabelas.cjs`
3. **CONFIRME** que as tabelas foram criadas com sucesso
4. **CONTINUE** com o desenvolvimento da aplicação

---

**⚠️ IMPORTANTE**: Este é o método oficial e recomendado pelo Supabase para criação de tabelas. A API REST é destinada apenas para operações CRUD (Create, Read, Update, Delete) em dados, não para modificações de schema.