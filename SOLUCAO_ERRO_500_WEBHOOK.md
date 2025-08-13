# 🚨 SOLUÇÃO: Erro 500 no Webhook Hotmart

## ✅ Problema Identificado

O erro `500 - FUNCTION_INVOCATION_FAILED` foi confirmado através do teste de debug. As principais causas são:

1. **❌ Variáveis de ambiente faltando no Vercel**
2. **❌ Tabela `webhook_events` não existe no Supabase**
3. **❌ Configurações incorretas**

## 🔧 Solução Passo a Passo

### 1. Configurar Variáveis de Ambiente no Vercel

**Acesse:** https://vercel.com/dashboard

1. Encontre o projeto `clik-cilios2-0-three`
2. Vá em **Settings** → **Environment Variables**
3. Adicione as seguintes variáveis:

```bash
# Supabase
VITE_SUPABASE_URL=https://seu-projeto.supabase.co
VITE_SUPABASE_ANON_KEY=sua-chave-anonima
SUPABASE_SERVICE_ROLE_KEY=sua-service-role-key

# Hotmart
VITE_HOTMART_CLIENT_ID=seu-client-id
VITE_HOTMART_CLIENT_SECRET=seu-client-secret
VITE_HOTMART_BASIC_TOKEN=seu-basic-token
VITE_HOTMART_WEBHOOK_SECRET=seu-webhook-secret
VITE_HOTMART_ENABLED=true
HOTMART_HOTTOK=seu-token-hotmart

# Email
SENDGRID_API_KEY=sua-sendgrid-key
SENDGRID_FROM_EMAIL=noreply@ciliosclick.com
SENDGRID_FROM_NAME=CíliosClick

# App
NEXT_PUBLIC_APP_URL=https://clik-cilios2-0-three.vercel.app
```

### 2. Criar Tabela webhook_events no Supabase

**Acesse:** https://supabase.com/dashboard

1. Vá para seu projeto
2. Clique em **SQL Editor**
3. Execute o conteúdo do arquivo `criar-webhook-events-limpo.sql`:

```sql
-- Criar tabela webhook_events
CREATE TABLE IF NOT EXISTS webhook_events (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  event_type VARCHAR(50) NOT NULL,
  event_data JSONB NOT NULL,
  raw_payload TEXT,
  processed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Criar índices
CREATE INDEX IF NOT EXISTS idx_webhook_events_type ON webhook_events(event_type);
CREATE INDEX IF NOT EXISTS idx_webhook_events_created ON webhook_events(created_at);

-- Habilitar RLS
ALTER TABLE webhook_events ENABLE ROW LEVEL SECURITY;

-- Política para permitir inserção de webhooks
DROP POLICY IF EXISTS "Allow webhook inserts" ON webhook_events;
CREATE POLICY "Allow webhook inserts" ON webhook_events
  FOR INSERT WITH CHECK (true);

-- Política para leitura por usuários autenticados
DROP POLICY IF EXISTS "Allow authenticated read" ON webhook_events;
CREATE POLICY "Allow authenticated read" ON webhook_events
  FOR SELECT USING (auth.role() = 'authenticated');
```

### 3. Verificar Outras Tabelas

Certifique-se de que estas tabelas existem:

- ✅ `users`
- ✅ `pre_users` 
- ✅ `hotmart_users`

### 4. Redeployar no Vercel

Após configurar as variáveis:

1. Vá em **Deployments**
2. Clique em **Redeploy** na última versão
3. Aguarde o deploy finalizar

### 5. Testar o Webhook

Execute o teste novamente:

```bash
node testar-webhook-hotmart-debug.js
```

**Resultado esperado:** Status 200 ou 401 (não mais 500)

## 🔍 Verificação Final

### Teste 1: Verificar Tabelas
```bash
node verificar-webhook-events.cjs
```

### Teste 2: Webhook Debug
```bash
node testar-webhook-hotmart-debug.js
```

### Teste 3: Logs do Vercel
1. Acesse o projeto no Vercel
2. Vá em **Functions** → **View Function Logs**
3. Procure por erros recentes

## 📋 Checklist de Verificação

- [ ] Variáveis de ambiente configuradas no Vercel
- [ ] Tabela `webhook_events` criada no Supabase
- [ ] Projeto redeployado no Vercel
- [ ] Teste de debug retorna status diferente de 500
- [ ] Logs do Vercel não mostram erros

## 🆘 Se o Problema Persistir

1. **Verifique os logs detalhados do Vercel**
2. **Confirme as credenciais do Supabase**
3. **Teste localmente com `npm run dev`**
4. **Verifique se todas as dependências estão instaladas**

## 📞 Próximos Passos

Após resolver o erro 500:

1. Configure o webhook no painel do Hotmart
2. Use o token real do Hotmart
3. Teste com uma compra real ou simulação
4. Monitore os logs para garantir funcionamento

---

**🎯 Objetivo:** Transformar o erro 500 em sucesso (200) ou erro de autenticação (401), eliminando o `FUNCTION_INVOCATION_FAILED`.