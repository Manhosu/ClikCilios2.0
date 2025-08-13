# 🚀 Tutorial Completo - Configuração do Webhook Hotmart

## 📋 Status Atual do Sistema

✅ **Pronto para configuração:**
- ✅ Variáveis de ambiente configuradas
- ✅ Conexão com Supabase funcionando
- ✅ Tabelas principais criadas (users, pre_users, user_assignments)
- ✅ 23 usuários pré-criados disponíveis
- ✅ Endpoint do webhook implementado
- ✅ SendGrid configurado para envio de emails

⚠️ **Pendências:**
- ❌ Tabela `webhook_events` precisa ser criada manualmente
- ⚠️ Endpoint precisa de pequenos ajustes

---

## 🔧 PASSO 1: Criar Tabela webhook_events no Supabase

1. **Acesse o Supabase Dashboard:**
   - Vá para: https://supabase.com/dashboard
   - Selecione seu projeto: `gguxeqpayaangiplggme`

2. **Abra o SQL Editor:**
   - No menu lateral, clique em "SQL Editor"
   - Clique em "New query"

3. **Execute este SQL:**

```sql
-- Criar tabela webhook_events
CREATE TABLE IF NOT EXISTS public.webhook_events (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  source VARCHAR(50) NOT NULL,
  event_type VARCHAR(100) NOT NULL,
  payload JSONB NOT NULL,
  processed BOOLEAN DEFAULT FALSE,
  processed_at TIMESTAMP WITH TIME ZONE,
  error_message TEXT,
  received_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Criar índices para melhor performance
CREATE INDEX IF NOT EXISTS idx_webhook_events_source ON public.webhook_events(source);
CREATE INDEX IF NOT EXISTS idx_webhook_events_event_type ON public.webhook_events(event_type);
CREATE INDEX IF NOT EXISTS idx_webhook_events_processed ON public.webhook_events(processed);
CREATE INDEX IF NOT EXISTS idx_webhook_events_received_at ON public.webhook_events(received_at);

-- Habilitar RLS
ALTER TABLE public.webhook_events ENABLE ROW LEVEL SECURITY;

-- Remover políticas existentes (se houver)
DROP POLICY IF EXISTS "Allow webhook inserts" ON public.webhook_events;
DROP POLICY IF EXISTS "Allow authenticated read" ON public.webhook_events;
DROP POLICY IF EXISTS "Allow service role updates" ON public.webhook_events;

-- Política para permitir inserção de webhooks
CREATE POLICY "Allow webhook inserts" ON public.webhook_events
  FOR INSERT WITH CHECK (true);

-- Política para permitir leitura para usuários autenticados
CREATE POLICY "Allow authenticated read" ON public.webhook_events
  FOR SELECT USING (auth.role() = 'authenticated');

-- Política para permitir atualização para service role
CREATE POLICY "Allow service role updates" ON public.webhook_events
  FOR UPDATE USING (auth.role() = 'service_role');
```

4. **Clique em "Run" para executar**

---

## 🌐 PASSO 2: Configurar Variáveis de Ambiente no Vercel

### 2.1 Acesse o Dashboard do Vercel

1. Vá para: https://vercel.com/dashboard
2. Selecione seu projeto: `clik-cilios2-0`
3. Clique em "Settings" → "Environment Variables"

### 2.2 Adicione TODAS estas variáveis:

```bash
# ========================================
# SUPABASE (OBRIGATÓRIAS)
# ========================================
VITE_SUPABASE_URL=https://gguxeqpayaangiplggme.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdndXhlcXBheWFhbmdpcGxnZ21lIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDk4NDYwOTYsImV4cCI6MjA2NTQyMjA5Nn0.WHusG12ZcOYtVSGUQVUT3Vf-MIbu_O6hlc3ha7yVnSE
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdndXhlcXBheWFhbmdpcGxnZ21lIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0OTg0NjA5NiwiZXhwIjoyMDY1NDIyMDk2fQ.782bdkQ0eiNSqF55VzIyv4kMLoKecXCOq85apB1E7MI
VITE_HOTMART_WEBHOOK_SECRET=gtnL72D16QPeck2Uky8d92uzq6GHtH6f40dc99-fece-4673-97c2-67aef62e4074
HOTMART_HOTTOK=gtnL72D16QPeck2Uky8d92uzq6GHtH6f40dc99-fece-4673-97c2-67aef62e4074
VITE_HOTMART_ENABLED=true
SENDGRID_API_KEY=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
SENDGRID_FROM_EMAIL=carinaprange86@gmail.com
SENDGRID_FROM_NAME=ClikCílios
NEXT_PUBLIC_APP_URL=https://clik-cilios2-0.vercel.app
NODE_ENV=production
```

### 2.3 Configuração por Ambiente

**IMPORTANTE:** Configure essas variáveis para:
- ✅ **Production** (obrigatório)
- ✅ **Preview** (recomendado)
- ⚠️ **Development** (opcional)

---

## 🔗 PASSO 3: Configurar Webhook na Hotmart

### 3.1 Acesse o Painel da Hotmart

1. Vá para: https://app.hotmart.com
2. Faça login na sua conta
3. Acesse "Meus Produtos" → Selecione seu produto
4. Vá em "Configurações" → "Integrações" → "Webhook"

### 3.2 Configure o Webhook

**URL do Webhook:**
```
https://clik-cilios2-0.vercel.app/api/hotmart/webhook
```

**Eventos para Marcar:**
- ✅ `PURCHASE_APPROVED` (Compra Aprovada)
- ✅ `PURCHASE_CANCELLED` (Compra Cancelada)
- ✅ `PURCHASE_REFUNDED` (Estorno)
- ✅ `PURCHASE_CHARGEBACK` (Chargeback)

**Configurações:**
- **Formato:** JSON
- **Método:** POST
- **Timeout:** 30 segundos
- **Tentativas:** 3

**Token de Segurança:**
```
gtnL72D16QPeck2Uky8d92uzq6GHtH6f40dc99-fece-4673-97c2-67aef62e4074
```

### 3.3 Salvar e Ativar

1. Clique em "Salvar Configurações"
2. **IMPORTANTE:** Ative o webhook (toggle ON)
3. Teste a conexão se disponível

---

## 🚀 PASSO 4: Deploy no Vercel

### 4.1 Fazer Deploy

```bash
# No terminal do projeto
npm run build
vercel --prod
```

### 4.2 Verificar Deploy

1. Acesse: https://clik-cilios2-0.vercel.app
2. Verifique se a aplicação carrega normalmente
3. Teste o login com as credenciais do Eduardo:
   - **Email:** eduardogelista@gmail.com
   - **Senha:** ClikCilios2024!

---

## 🧪 PASSO 5: Testar o Webhook

### 5.1 Teste Manual (Opcional)

Você pode testar o webhook manualmente com este comando:

```bash
curl -X POST https://clik-cilios2-0.vercel.app/api/hotmart/webhook \
  -H "Content-Type: application/json" \
  -H "X-Hotmart-Hottok: gtnL72D16QPeck2Uky8d92uzq6GHtH6f40dc99-fece-4673-97c2-67aef62e4074" \
  -d '{
    "id": "test-123",
    "event": "PURCHASE_APPROVED",
    "data": {
      "buyer": {
        "email": "teste@email.com",
        "name": "Teste Usuario"
      },
      "purchase": {
        "transaction": "TXN123",
        "status": "APPROVED"
      }
    }
  }'
```

### 5.2 Teste Real

1. **Faça uma compra de teste** no seu produto da Hotmart
2. **Verifique os logs** no Vercel Dashboard:
   - Vá em "Functions" → "View Function Logs"
   - Procure por logs do webhook

3. **Verifique no Supabase:**
   - Tabela `webhook_events`: deve ter o evento registrado
   - Tabela `user_assignments`: deve ter a atribuição
   - Tabela `users`: deve ter o novo usuário

4. **Verifique o email:**
   - O comprador deve receber um email com as credenciais
   - Teste o login com as credenciais enviadas

---

## 📊 PASSO 6: Monitoramento

### 6.1 Logs do Vercel

- **Functions:** https://vercel.com/dashboard → Seu Projeto → Functions
- **Procure por:** `/api/hotmart/webhook`
- **Monitore:** Erros, timeouts, sucessos

### 6.2 Dados no Supabase

**Webhook Events:**
```sql
SELECT * FROM webhook_events ORDER BY received_at DESC LIMIT 10;
```

**Usuários Atribuídos:**
```sql
SELECT * FROM user_assignments ORDER BY assigned_at DESC LIMIT 10;
```

**Usuários Disponíveis:**
```sql
SELECT COUNT(*) FROM pre_users WHERE status = 'available';
```

### 6.3 Alertas Importantes

⚠️ **Monitore sempre:**
- Usuários disponíveis (mínimo 5)
- Webhooks com erro
- Emails não enviados
- Timeouts na Hotmart

---

## 🆘 Troubleshooting

### Webhook não está sendo recebido

1. ✅ Verifique se a URL está correta na Hotmart
2. ✅ Confirme que o webhook está ATIVADO
3. ✅ Verifique os logs do Vercel
4. ✅ Teste a URL manualmente

### Erro de token inválido

1. ✅ Verifique se `HOTMART_HOTTOK` está configurado no Vercel
2. ✅ Confirme se o token na Hotmart é o mesmo
3. ✅ Verifique se não há espaços extras

### Usuário não sendo criado

1. ✅ Verifique se há usuários pré-criados disponíveis
2. ✅ Confirme se a tabela `webhook_events` foi criada
3. ✅ Verifique os logs de erro no Vercel
4. ✅ Confirme as permissões do Supabase

### Email não sendo enviado

1. ✅ Verifique se `SENDGRID_API_KEY` está configurado
2. ✅ Confirme se o domínio está verificado no SendGrid
3. ✅ Verifique os logs do SendGrid
4. ✅ Teste o envio manualmente

---

## ✅ Checklist Final

- [ ] Tabela `webhook_events` criada no Supabase
- [ ] Todas as variáveis de ambiente configuradas no Vercel
- [ ] Deploy realizado com sucesso
- [ ] Webhook configurado e ativado na Hotmart
- [ ] URL do webhook testada
- [ ] Compra de teste realizada
- [ ] Email de credenciais recebido
- [ ] Login testado com sucesso
- [ ] Monitoramento configurado

---

## 🎉 Pronto!

Seu sistema está configurado e pronto para receber webhooks da Hotmart!

**Próximos passos:**
1. Monitore os primeiros webhooks
2. Ajuste alertas se necessário
3. Crie mais usuários pré-criados conforme demanda
4. Configure backup dos dados importantes

**Suporte:**
- Documentação: `HOTMART_INTEGRATION.md`
- Logs: Vercel Dashboard
- Banco: Supabase Dashboard
- Email: SendGrid Dashboard

---

**Última atualização:** Janeiro 2025  
**Versão:** 1.0.0