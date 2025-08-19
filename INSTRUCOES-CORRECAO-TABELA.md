# Instruções para Correção da Tabela configuracoes_usuario

## Problema
A tabela `configuracoes_usuario` está com problemas de schema cache e conversão de tipos, causando o erro:
```
ERROR: 42804: column "notificacoes_push" is of type boolean but expression is of type text
```

## Solução
Executar o SQL de correção manualmente no Supabase Dashboard.

## Passos para Execução

### 1. Acessar o Supabase Dashboard
- Acesse: https://supabase.com/dashboard
- Faça login na sua conta
- Selecione o projeto: `gguxeqpayaangiplggme`

### 2. Abrir o SQL Editor
- No menu lateral, clique em "SQL Editor"
- Clique em "New query" para criar uma nova consulta

### 3. Executar o SQL de Correção
Copie e cole o conteúdo do arquivo `manual-configuracoes-fix.sql` no editor SQL e execute.

**IMPORTANTE:** Execute o SQL em blocos separados, não tudo de uma vez:

#### Bloco 1: Backup e Remoção
```sql
-- 1. Criar backup da tabela atual
CREATE TABLE configuracoes_usuario_backup AS 
SELECT * FROM configuracoes_usuario;

-- 2. Remover tabela atual
DROP TABLE IF EXISTS configuracoes_usuario CASCADE;
```

#### Bloco 2: Recriação da Tabela
```sql
-- 3. Recriar tabela com estrutura correta
CREATE TABLE configuracoes_usuario (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    tema VARCHAR(20) DEFAULT 'claro' CHECK (tema IN ('claro', 'escuro')),
    idioma VARCHAR(10) DEFAULT 'pt-BR',
    formato_data VARCHAR(20) DEFAULT 'DD/MM/YYYY',
    formato_hora VARCHAR(20) DEFAULT '24h',
    fuso_horario VARCHAR(50) DEFAULT 'America/Sao_Paulo',
    notificacoes_email BOOLEAN DEFAULT true,
    notificacoes_push BOOLEAN DEFAULT true,
    notificacoes_sms BOOLEAN DEFAULT false,
    auto_backup BOOLEAN DEFAULT true,
    frequencia_backup VARCHAR(20) DEFAULT 'diario',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

#### Bloco 3: Índices e RLS
```sql
-- 4. Criar índice único
CREATE UNIQUE INDEX idx_configuracoes_usuario_user_id ON configuracoes_usuario(user_id);

-- 5. Habilitar RLS
ALTER TABLE configuracoes_usuario ENABLE ROW LEVEL SECURITY;
```

#### Bloco 4: Políticas RLS
```sql
-- 6. Criar políticas RLS
CREATE POLICY "Usuários podem ver suas próprias configurações" ON configuracoes_usuario
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Usuários podem inserir suas próprias configurações" ON configuracoes_usuario
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Usuários podem atualizar suas próprias configurações" ON configuracoes_usuario
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Usuários podem deletar suas próprias configurações" ON configuracoes_usuario
    FOR DELETE USING (auth.uid() = user_id);
```

#### Bloco 5: Restauração de Dados (Opcional)
```sql
-- 7. Restaurar dados do backup (apenas se necessário)
-- ATENÇÃO: Execute apenas se houver dados importantes no backup
INSERT INTO configuracoes_usuario (
    user_id, tema, idioma, formato_data, formato_hora, fuso_horario,
    notificacoes_email, notificacoes_push, notificacoes_sms,
    auto_backup, frequencia_backup, created_at, updated_at
)
SELECT 
    user_id,
    COALESCE(tema, 'claro'),
    COALESCE(idioma, 'pt-BR'),
    COALESCE(formato_data, 'DD/MM/YYYY'),
    COALESCE(formato_hora, '24h'),
    COALESCE(fuso_horario, 'America/Sao_Paulo'),
    COALESCE(notificacoes_email::boolean, true),
    COALESCE(notificacoes_push::boolean, true),
    COALESCE(notificacoes_sms::boolean, false),
    COALESCE(auto_backup::boolean, true),
    COALESCE(frequencia_backup, 'diario'),
    COALESCE(created_at, NOW()),
    COALESCE(updated_at, NOW())
FROM configuracoes_usuario_backup;
```

#### Bloco 6: Limpeza
```sql
-- 8. Remover backup (após confirmar que tudo está funcionando)
DROP TABLE IF EXISTS configuracoes_usuario_backup;
```

### 4. Verificar a Correção
Após executar o SQL, teste se a tabela está funcionando:

```sql
-- Verificar estrutura da tabela
SELECT column_name, data_type, is_nullable, column_default 
FROM information_schema.columns 
WHERE table_name = 'configuracoes_usuario' 
ORDER BY ordinal_position;

-- Testar inserção (substitua pelo seu user_id real)
INSERT INTO configuracoes_usuario (user_id) 
VALUES ('00000000-0000-0000-0000-000000000000');

-- Limpar teste
DELETE FROM configuracoes_usuario 
WHERE user_id = '00000000-0000-0000-0000-000000000000';
```

## Resultado Esperado
Após a execução bem-sucedida:
- A tabela `configuracoes_usuario` terá a estrutura correta
- Todas as colunas terão os tipos de dados corretos
- As políticas RLS estarão ativas
- O erro de conversão de tipos será resolvido

## Próximos Passos
Após corrigir a tabela, execute o script de teste:
```bash
node test-after-fix.cjs
```

Este script verificará se a correção foi bem-sucedida e testará outras funcionalidades da aplicação.