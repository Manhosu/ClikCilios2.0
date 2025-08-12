# Instruções para Configuração do Sistema Hotmart

## Passo 1: Aplicar Migrações SQL no Supabase

1. **Acesse o Supabase Dashboard:**
   - Vá para: https://supabase.com/dashboard
   - Faça login com sua conta

2. **Navegue para o SQL Editor:**
   - No painel lateral, clique em "SQL Editor"
   - Ou acesse diretamente: https://supabase.com/dashboard/project/[SEU_PROJECT_ID]/sql

3. **Execute o Script SQL:**
   - Abra o arquivo `create-minimal-tables.sql` que foi criado
   - Copie todo o conteúdo do arquivo
   - Cole no SQL Editor do Supabase
   - Clique em "Run" para executar

## Passo 2: Verificar se as Tabelas foram Criadas

Após executar o SQL, você deve ter as seguintes tabelas criadas:
- `public.pre_users` - Usuários pré-criados
- `public.user_assignments` - Atribuições de usuários
- Funções: `get_pre_users_stats()`, `assign_pre_user()`, `release_pre_user()`

## Passo 3: Executar o Script de População

Após aplicar as migrações, execute:

```bash
node populate-pre-users.cjs
```

Este script irá:
- Verificar se as tabelas existem
- Popular a tabela `pre_users` com usuários de exemplo
- Mostrar estatísticas dos usuários criados

## Passo 4: Testar a Integração

Após a configuração, você pode testar:

1. **Verificar usuários disponíveis:**
   ```sql
   SELECT * FROM get_pre_users_stats();
   ```

2. **Atribuir um usuário:**
   ```sql
   SELECT * FROM assign_pre_user('teste@email.com', 'Nome Teste');
   ```

3. **Liberar um usuário:**
   ```sql
   SELECT * FROM release_pre_user('notification_id_123');
   ```

## Arquivos Importantes

- `create-minimal-tables.sql` - Script SQL completo para criar as tabelas
- `populate-pre-users.cjs` - Script para popular usuários
- `migrations/create_hotmart_integration_complete.sql` - Migração completa original

## Troubleshooting

Se encontrar erros:

1. **Erro de permissão:** Certifique-se de estar usando o projeto correto no Supabase
2. **Tabelas já existem:** O script usa `IF NOT EXISTS`, então é seguro executar múltiplas vezes
3. **Extensão pgcrypto:** Se der erro, execute apenas: `CREATE EXTENSION IF NOT EXISTS "pgcrypto";`

## Próximos Passos

Após a configuração:
1. Configure os webhooks do Hotmart para apontar para sua API
2. Teste o fluxo completo de compra/cancelamento
3. Monitore os logs para garantir que tudo está funcionando