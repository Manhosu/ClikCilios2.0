# 🚨 GUIA FINAL - CRIAÇÃO DAS TABELAS SUPABASE

## ❌ PROBLEMA CONFIRMADO
As tabelas `pre_users` e `user_assignments` **NÃO EXISTEM** no projeto Supabase.

## ✅ SOLUÇÃO DEFINITIVA

### PASSO 1: Acesse o Supabase Dashboard
1. Abra seu navegador
2. Acesse: **https://supabase.com/dashboard/project/pdkhcvioaiopwsrburxp**
3. Faça login na sua conta Supabase

### PASSO 2: Navegue para o SQL Editor
1. No menu lateral esquerdo, clique em **"SQL Editor"**
2. Clique em **"New query"** ou **"+"** para criar uma nova consulta

### PASSO 3: Execute o SQL
1. **APAGUE** todo o conteúdo que estiver no editor
2. **COLE EXATAMENTE** este SQL:

```sql
CREATE TABLE IF NOT EXISTS public.pre_users (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    username TEXT UNIQUE NOT NULL,
    status TEXT DEFAULT 'available' CHECK (status IN ('available', 'assigned', 'used')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.user_assignments (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    pre_user_id UUID REFERENCES public.pre_users(id) ON DELETE CASCADE,
    assigned_to TEXT NOT NULL,
    assigned_by TEXT NOT NULL,
    assigned_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    expires_at TIMESTAMP WITH TIME ZONE,
    notes TEXT
);
```

3. Clique no botão **"Run"** (ou pressione Ctrl+Enter)
4. **AGUARDE** a execução completar
5. Verifique se aparece uma mensagem de **SUCESSO** (como "Success. No rows returned")

### PASSO 4: Verificação
Após executar o SQL com sucesso, execute este comando no terminal:

```bash
node teste-simples-tabelas.cjs
```

**RESULTADO ESPERADO:**
- ✅ Teste 1 (SELECT): SUCESSO
- ✅ Teste 3 (INSERT): SUCESSO

### PASSO 5: População dos Usuários
Se a verificação passou, execute:

```bash
node populate-pre-users.cjs
```

## 🔍 POSSÍVEIS PROBLEMAS

### Se ainda der erro após executar o SQL:

1. **Verifique se você está logado na conta CORRETA**
   - O projeto `pdkhcvioaiopwsrburxp` deve aparecer na sua lista de projetos

2. **Verifique se o SQL foi executado no projeto CORRETO**
   - A URL deve mostrar: `...project/pdkhcvioaiopwsrburxp/sql/...`

3. **Verifique se não há erros no SQL**
   - Se houver erro, aparecerá uma mensagem vermelha
   - Copie e cole o SQL novamente

4. **Verifique permissões**
   - Você precisa ter permissões de administrador no projeto

## 📞 SE NADA FUNCIONAR

Se mesmo seguindo todos os passos as tabelas não forem criadas:

1. Tire uma captura de tela da tela do SQL Editor após executar
2. Tire uma captura de tela do resultado da execução
3. Execute `node teste-simples-tabelas.cjs` e copie o resultado

## 🎯 CONFIRMAÇÃO FINAL

Quando tudo estiver funcionando, você verá:

```
🧪 TESTE SIMPLES DE TABELAS
URL: https://pdkhcvioaiopwsrburxp.supabase.co

1. Testando SELECT na pre_users...
✅ SUCESSO! Dados: []

3. Testando INSERT na pre_users...
✅ SUCESSO! Usuário inserido: [...]
```

**Só então** o sistema estará pronto para uso!