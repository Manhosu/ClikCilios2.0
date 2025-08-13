# 🚨 Diagnóstico: Erro 500 no Webhook Hotmart

## Erro Identificado

**Status:** `500 - Internal Server Error`  
**Mensagem:** `FUNCTION_INVOCATION_FAILED`  
**Data:** 08/12/2025 22:07:00  

## 🔍 Possíveis Causas

### 1. **Variáveis de Ambiente Faltando**

O webhook precisa das seguintes variáveis no Vercel:

```bash
# OBRIGATÓRIAS
NEXT_PUBLIC_SUPABASE_URL=https://seu-projeto.supabase.co
SUPABASE_SERVICE_ROLE_KEY=sua-service-role-key
HOTMART_HOTTOK=seu-token-hotmart

# PARA EMAIL
SENDGRID_API_KEY=sua-sendgrid-key
SENDGRID_FROM_EMAIL=noreply@ciliosclick.com
SENDGRID_FROM_NAME=CíliosClick

# URL DA APP
NEXT_PUBLIC_APP_URL=https://clik-cilios2-0-three.vercel.app
```

### 2. **Tabela webhook_events Não Existe**

Verifique se a tabela foi criada no Supabase:

```sql
SELECT * FROM webhook_events LIMIT 1;
```

### 3. **Problemas de Importação**

O código importa serviços que podem não estar funcionando:
- `hotmartUsersService`
- `EmailService`

### 4. **Token Hotmart Incorreto**

O header `X-Hotmart-Hottok` pode estar incorreto.

## 🛠️ Soluções

### **Solução 1: Verificar Variáveis de Ambiente**

1. Acesse o Vercel Dashboard
2. Vá em **Settings** → **Environment Variables**
3. Verifique se todas as variáveis estão configuradas
4. Faça **Redeploy** após adicionar

### **Solução 2: Criar Tabela webhook_events**

1. Acesse o Supabase
2. Vá em **SQL Editor**
3. Execute o SQL do arquivo `criar-webhook-events-limpo.sql`

### **Solução 3: Verificar Logs Detalhados**

1. No Vercel, vá em **Functions**
2. Clique em `/api/hotmart/webhook`
3. Veja **Function Logs** para detalhes do erro

### **Solução 4: Teste Local**

Crie um script para testar localmente:

```javascript
// teste-webhook-local.js
const fetch = require('node-fetch');

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

async function testarWebhook() {
  try {
    const response = await fetch('https://clik-cilios2-0-three.vercel.app/api/hotmart/webhook', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Hotmart-Hottok': 'SEU_TOKEN_AQUI' // Substitua pelo token real
      },
      body: JSON.stringify(payload)
    });

    console.log('Status:', response.status);
    console.log('Headers:', response.headers.raw());
    
    const text = await response.text();
    console.log('Response:', text);
    
  } catch (error) {
    console.error('Erro:', error);
  }
}

testarWebhook();
```

## 🔧 Checklist de Verificação

### ✅ No Vercel:
- [ ] Variável `NEXT_PUBLIC_SUPABASE_URL` configurada
- [ ] Variável `SUPABASE_SERVICE_ROLE_KEY` configurada
- [ ] Variável `HOTMART_HOTTOK` configurada
- [ ] Variável `SENDGRID_API_KEY` configurada
- [ ] Variável `NEXT_PUBLIC_APP_URL` configurada
- [ ] Redeploy feito após configurar variáveis

### ✅ No Supabase:
- [ ] Tabela `webhook_events` existe
- [ ] Tabela `hotmart_users` existe
- [ ] Tabela `pre_users` existe
- [ ] RLS configurado corretamente
- [ ] Service Role Key tem permissões

### ✅ No Hotmart:
- [ ] Webhook URL correta: `https://clik-cilios2-0-three.vercel.app/api/hotmart/webhook`
- [ ] Token configurado corretamente
- [ ] Eventos selecionados: PURCHASE_APPROVED, PURCHASE_CANCELED
- [ ] Webhook ativo

## 🚀 Próximos Passos

1. **Verificar variáveis de ambiente** (mais provável)
2. **Testar com script local**
3. **Verificar logs do Vercel**
4. **Confirmar estrutura do banco**
5. **Testar novamente no Hotmart**

## 📞 Se o Problema Persistir

1. Copie os logs completos do Vercel
2. Verifique se todas as dependências estão instaladas
3. Considere criar uma versão simplificada do webhook para teste
4. Verifique se o domínio do Vercel está acessível

---

**💡 Dica:** O erro `FUNCTION_INVOCATION_FAILED` geralmente indica problema de configuração ou dependências faltando, não erro de código.