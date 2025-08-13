# Guia de Teste: Webhook Hotmart

## Como Testar se o Webhook Está Funcionando

### 1. Teste Básico - Ping do Hotmart

**No painel do Hotmart:**
1. Vá em **Ferramentas** → **Hotmart Webhooks**
2. Clique no webhook que você criou
3. Clique em **"Testar"**
4. Selecione o evento **"PURCHASE_APPROVED"**
5. Clique em **"Enviar Teste"**

**Resultado esperado:**
- Status: `200 OK`
- Tempo de resposta: < 5 segundos

### 2. Verificar no Supabase

**Acesse o Supabase:**
1. Vá para https://app.supabase.com
2. Selecione seu projeto
3. Vá em **Table Editor** → **webhook_events**
4. Verifique se apareceu um novo registro

**Dados esperados no registro:**
```sql
SELECT 
  id,
  source,           -- deve ser 'hotmart'
  event_type,       -- deve ser 'PURCHASE_APPROVED'
  processed,        -- deve ser true
  received_at,      -- timestamp recente
  error_message     -- deve ser null
FROM webhook_events 
ORDER BY received_at DESC 
LIMIT 5;
```

### 3. Verificar Logs no Vercel

**No Vercel Dashboard:**
1. Vá para seu projeto
2. Clique em **Functions**
3. Procure por `/api/hotmart/webhook`
4. Clique em **"View Function Logs"**

**Logs esperados:**
```
[timestamp] Webhook recebido: PURCHASE_APPROVED
[timestamp] Dados salvos na tabela webhook_events
[timestamp] Processamento concluído com sucesso
```

### 4. Teste com Compra Real (Opcional)

**⚠️ CUIDADO:** Só faça isso se tiver certeza!

1. Crie um produto de teste no Hotmart (valor R$ 1,00)
2. Faça uma compra real
3. Verifique se o webhook foi disparado
4. Cancele a compra para testar o cancelamento

### 5. Script de Teste Automático

Crie um arquivo `testar-webhook.js` para testar localmente:

```javascript
// testar-webhook.js
const crypto = require('crypto');

// Simular payload do Hotmart
const payload = {
  "id": "test-123",
  "event": "PURCHASE_APPROVED",
  "version": "v1",
  "data": {
    "product": {
      "id": 123456,
      "name": "ClikCilios - Teste"
    },
    "buyer": {
      "email": "teste@email.com",
      "name": "Usuario Teste"
    },
    "purchase": {
      "transaction": "HP123456789",
      "status": "APPROVED",
      "approved_date": new Date().toISOString()
    }
  }
};

// Sua URL do webhook
const webhookUrl = 'https://SEU_DOMINIO.vercel.app/api/hotmart/webhook';

// Função para testar
async function testarWebhook() {
  try {
    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Hotmart-Hottok': 'SEU_TOKEN_AQUI'
      },
      body: JSON.stringify(payload)
    });

    console.log('Status:', response.status);
    console.log('Response:', await response.text());
  } catch (error) {
    console.error('Erro:', error);
  }
}

testarWebhook();
```

**Para executar:**
```bash
node testar-webhook.js
```

### 6. Monitoramento Contínuo

**Criar query para monitorar:**
```sql
-- Verificar últimos webhooks recebidos
SELECT 
  event_type,
  processed,
  error_message,
  received_at
FROM webhook_events 
WHERE received_at > NOW() - INTERVAL '24 hours'
ORDER BY received_at DESC;

-- Verificar webhooks com erro
SELECT 
  event_type,
  error_message,
  payload,
  received_at
FROM webhook_events 
WHERE error_message IS NOT NULL
ORDER BY received_at DESC;

-- Estatísticas dos últimos 7 dias
SELECT 
  event_type,
  COUNT(*) as total,
  COUNT(CASE WHEN processed = true THEN 1 END) as processados,
  COUNT(CASE WHEN error_message IS NOT NULL THEN 1 END) as com_erro
FROM webhook_events 
WHERE received_at > NOW() - INTERVAL '7 days'
GROUP BY event_type;
```

### 7. Checklist de Verificação

**✅ Antes de considerar funcionando:**
- [ ] Webhook responde com status 200
- [ ] Dados são salvos na tabela `webhook_events`
- [ ] Campo `processed` fica como `true`
- [ ] Não há mensagens de erro nos logs
- [ ] Teste com diferentes tipos de evento funciona
- [ ] Token de segurança está validando corretamente

**✅ Problemas comuns e soluções:**
- **Status 500:** Verificar variáveis de ambiente
- **Status 401:** Token incorreto ou ausente
- **Status 404:** URL do webhook incorreta
- **Timeout:** Função muito lenta, otimizar código
- **Dados não salvos:** Problema de conexão com Supabase

### 8. Alertas Recomendados

**Configure alertas para:**
- Webhooks com erro por mais de 1 hora
- Taxa de erro > 5%
- Nenhum webhook recebido por mais de 24h (se esperado)
- Tempo de resposta > 10 segundos

---

**💡 Dica:** Mantenha este guia sempre atualizado conforme você descobre novos cenários de teste!