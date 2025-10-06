# 🎯 Webhook Hotmart - Estrutura REAL Corrigida

## ⚠️ IMPORTANTE: Baseado em Payloads Reais da Hotmart

Este documento descreve o webhook **corrigido** para funcionar com a estrutura EXATA que a Hotmart envia.

---

## 🔍 Descobertas Importantes

### Como a Hotmart REALMENTE envia os dados:

1. **Token de Autenticação**: Via **HEADER HTTP** `X-Hotmart-Hottok`
   - ❌ NÃO vem no body JSON como `payload.hottok`
   - ✅ Vem no header da requisição HTTP

2. **Dados do Comprador**: Em `data.buyer`
   - ❌ NÃO está em `data.purchase.buyer`
   - ✅ Está diretamente em `data.buyer`

3. **Nomes dos Eventos**: Uppercase com underscore
   - ❌ NÃO usa `approved`, `canceled` (lowercase)
   - ✅ Usa `PURCHASE_APPROVED`, `PURCHASE_CANCELED` (uppercase)

---

## 📦 Estrutura REAL do Payload Hotmart

### Exemplo: PURCHASE_APPROVED

```json
{
  "id": "0096289e-8277-41a7-9fe1-bf4d25f20a33",
  "creation_date": 1758660642845,
  "event": "PURCHASE_APPROVED",
  "version": "2.0.0",
  "data": {
    "product": {
      "id": 0,
      "ucode": "fb056612-bcc6-4217-9e6d-2a5d1110ac2f",
      "name": "Produto test postback2",
      "warranty_date": "2017-12-27T00:00:00Z"
    },
    "buyer": {
      "email": "cliente@example.com",
      "name": "Nome do Cliente",
      "first_name": "Nome",
      "last_name": "Cliente",
      "checkout_phone": "99999999900",
      "document": "12345678900",
      "document_type": "CPF",
      "address": {
        "city": "São Paulo",
        "state": "SP",
        "country": "Brasil"
      }
    },
    "purchase": {
      "approved_date": 1511783346000,
      "order_date": 1511783344000,
      "status": "APPROVED",
      "transaction": "HP16015479281022",
      "full_price": {
        "value": 1500,
        "currency_value": "BRL"
      },
      "price": {
        "value": 1500,
        "currency_value": "BRL"
      },
      "payment": {
        "installments_number": 12,
        "type": "CREDIT_CARD"
      }
    }
  }
}
```

### Exemplo: PURCHASE_CANCELED

```json
{
  "id": "05146749-94c4-4822-ba1e-192fdb415ae0",
  "creation_date": 1758660642747,
  "event": "PURCHASE_CANCELED",
  "version": "2.0.0",
  "data": {
    "buyer": {
      "email": "cliente@example.com",
      "name": "Nome do Cliente"
    },
    "purchase": {
      "status": "CANCELED",
      "transaction": "HP16015479281022"
    }
  }
}
```

### Headers HTTP que a Hotmart envia:

```
X-Hotmart-Hottok: gtnL72D16QPeck2Uky8d92uzq6GHtH6f40dc99-fece-4673-97c2-67aef62e4074
Content-Type: application/json
```

---

## ✅ Correções Aplicadas no Webhook

### 1. Validação do Token

**Antes** (ERRADO):
```typescript
const hottok = payload.hottok  // ❌ Procurava no body
if (!hottok) return 401
```

**Depois** (CORRETO):
```typescript
// ✅ Procura no header HTTP (onde a Hotmart realmente envia)
const hottok =
  req.headers['x-hotmart-hottok'] ||
  req.headers['X-Hotmart-Hottok'] ||
  req.headers['hottok'] ||
  payload.hottok  // Fallback para testes manuais

if (!hottok) return 401
```

### 2. Extração dos Dados do Comprador

**Antes** (ERRADO):
```typescript
const buyer = payload.data?.purchase?.buyer  // ❌ Caminho errado
```

**Depois** (CORRETO):
```typescript
// ✅ Hotmart envia em data.buyer (não data.purchase.buyer)
const buyer = payload.data?.buyer
const buyerFallback = payload.data?.purchase?.buyer  // Fallback
const finalBuyer = buyer || buyerFallback
```

### 3. Normalização dos Eventos

**Antes** (ERRADO):
```typescript
if (evento === 'approved' || evento === 'complete') {  // ❌ Nomes errados
```

**Depois** (CORRETO):
```typescript
// ✅ Hotmart usa UPPERCASE com UNDERSCORE
if (evento === 'PURCHASE_APPROVED' || evento === 'PURCHASE_COMPLETE') {
```

---

## 🔧 Configuração no Vercel

### Variáveis de Ambiente OBRIGATÓRIAS

```bash
HOTMART_TOKEN=gtnL72D16QPeck2Uky8d92uzq6GHtH6f40dc99-fece-4673-97c2-67aef62e4074
VITE_SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=sua_service_role_key_aqui
```

### Variáveis OPCIONAIS (para email)

```bash
SENDGRID_API_KEY=SG.xxxxxxxxxxxxxxxxxxxxx
SENDGRID_FROM_EMAIL=noreply@ciliosclick.com
SENDGRID_FROM_NAME=CíliosClick
NEXT_PUBLIC_APP_URL=https://clik-cilios2-0.vercel.app
```

---

## 🔌 Configuração na Hotmart

### 1. URL do Webhook
```
https://clik-cilios2-0.vercel.app/api/hotmart-webhook
```

### 2. Configurar Hottok na Hotmart

1. Acesse o painel Hotmart
2. Vá em **Ferramentas** > **Webhooks**
3. Configure o **Hottok** (token de verificação):
   ```
   gtnL72D16QPeck2Uky8d92uzq6GHtH6f40dc99-fece-4673-97c2-67aef62e4074
   ```
4. A Hotmart enviará este token automaticamente via header `X-Hotmart-Hottok`

### 3. Selecionar Eventos

Marque os eventos que deseja receber:
- ✅ **PURCHASE_APPROVED** - Compra aprovada
- ✅ **PURCHASE_CANCELED** - Compra cancelada
- ⚪ Outros conforme necessário

---

## 📊 Eventos Suportados

| Evento | O que faz | Cria Usuário? | Envia Email? |
|--------|-----------|---------------|--------------|
| `PURCHASE_APPROVED` | Compra aprovada | ✅ Sim | ✅ Sim |
| `PURCHASE_COMPLETE` | Compra completa | ✅ Sim | ✅ Sim |
| `PURCHASE_CANCELED` | Compra cancelada | ❌ Não | ❌ Não |
| `PURCHASE_CANCELLED` | Compra cancelada | ❌ Não | ❌ Não |
| `PURCHASE_REFUNDED` | Compra reembolsada | ❌ Não | ❌ Não |
| Outros | Outros eventos | ❌ Não | ❌ Não |

---

## 📧 Fluxo Completo (PURCHASE_APPROVED)

1. 🛒 **Cliente compra na Hotmart**
2. 🌐 **Hotmart envia webhook** para sua URL
   - Header: `X-Hotmart-Hottok: token`
   - Body: JSON com `data.buyer.email` e `data.buyer.name`
3. 🔐 **Webhook valida token** do header
4. ✅ **Token válido**: continua processamento
5. 👤 **Extrai dados**: `email` e `nome` de `data.buyer`
6. 🔍 **Verifica se usuário existe** no Supabase
7. 🆕 **Cria novo usuário** OU **atualiza senha** se já existe
8. 🔑 **Gera senha temporária** aleatória
9. 📧 **Envia email** com credenciais (via SendGrid)
10. ✅ **Retorna 200 OK** para Hotmart
11. 🎉 **Cliente recebe email** e pode fazer login

---

## 🧪 Como Testar

### Teste 1: Com Servidor Local

```bash
# 1. Iniciar servidor de desenvolvimento
npm run dev

# 2. Em outro terminal, executar teste com payloads reais
node test-webhook-hotmart-real.cjs
```

**O que o script testa:**
- ✅ PURCHASE_APPROVED com token válido via header
- ✅ PURCHASE_CANCELED com token válido via header
- ❌ PURCHASE_APPROVED sem token (deve retornar 401)
- ❌ PURCHASE_APPROVED com token inválido (deve retornar 401)

### Teste 2: Com Postman/Insomnia

```bash
POST https://clik-cilios2-0.vercel.app/api/hotmart-webhook

Headers:
X-Hotmart-Hottok: gtnL72D16QPeck2Uky8d92uzq6GHtH6f40dc99-fece-4673-97c2-67aef62e4074
Content-Type: application/json

Body (JSON):
{
  "event": "PURCHASE_APPROVED",
  "data": {
    "buyer": {
      "email": "seu-email@example.com",
      "name": "Seu Nome"
    }
  }
}
```

### Teste 3: Diretamente na Hotmart

1. Acesse **Webhooks** no painel Hotmart
2. Clique em **Testar Webhook**
3. Selecione evento **PURCHASE_APPROVED**
4. Clique em **Enviar Teste**
5. Verifique logs no Vercel

---

## 📝 Logs Esperados (Sucesso)

```
📨 Webhook Hotmart recebido
📋 Headers: {
  "x-hotmart-hottok": "gtnL72D16QPeck2Uky8d92uzq6GHtH6f40dc99...",
  "content-type": "application/json"
}
📄 Body completo: {
  "event": "PURCHASE_APPROVED",
  "data": {
    "buyer": {
      "email": "cliente@example.com",
      "name": "Cliente Teste"
    }
  }
}
🔍 Verificando token hottok...
🔑 Token de onde veio: HEADER
🔑 Token recebido: gtnL72D16QPeck2Uky8d92uzq6GHtH6f40dc99...
🔑 Token esperado: gtnL72D16QPeck2Uky8d92uzq6GHtH6f40dc99...
✅ Token hottok validado com sucesso!
🔄 Evento recebido: PURCHASE_APPROVED
✅ Processando compra aprovada...
👤 Dados do comprador (data.buyer): {
  "email": "cliente@example.com",
  "name": "Cliente Teste"
}
✅ Usuário criado: cliente@example.com
✅ Email enviado com sucesso para cliente@example.com
⏱️ Processamento concluído em 450ms
📤 Resposta final: {
  "success": true,
  "message": "Compra processada, usuário criado e email enviado",
  "data": {
    "user_created": true,
    "user_id": "uuid-do-usuario",
    "email": "cliente@example.com",
    "email_sent": true,
    "event": "PURCHASE_APPROVED"
  }
}
```

---

## ⚠️ Troubleshooting

### Erro: 401 - Token inválido

**Causa**: Token não encontrado no header ou valor incorreto

**Solução**:
1. Verificar se Hotmart está configurada para enviar o token
2. Verificar se `HOTMART_TOKEN` está configurada no Vercel
3. Verificar logs: deve aparecer "Token de onde veio: HEADER"
4. Se aparecer "AUSENTE", a Hotmart não está enviando o token

### Erro: Dados do comprador incompletos

**Causa**: Estrutura do payload diferente do esperado

**Solução**:
1. Verificar logs: "Estrutura payload.data"
2. Confirmar que buyer está em `data.buyer` (não `data.purchase.buyer`)
3. Verificar se tem os campos `email` e `name`

### Usuário criado mas email não enviado

**Causa**: `SENDGRID_API_KEY` não configurada

**Solução**:
1. Verificar logs: "⚠️ SENDGRID_API_KEY não configurada"
2. Adicionar variável no Vercel
3. Re-deploy

---

## ✅ Checklist Final

Antes de colocar em produção:

- [ ] Variável `HOTMART_TOKEN` configurada no Vercel
- [ ] Variável `VITE_SUPABASE_URL` configurada
- [ ] Variável `SUPABASE_SERVICE_ROLE_KEY` configurada
- [ ] Variável `SENDGRID_API_KEY` configurada (opcional mas recomendado)
- [ ] Webhook URL configurada na Hotmart
- [ ] Hottok configurado na Hotmart (mesmo valor da variável `HOTMART_TOKEN`)
- [ ] Eventos selecionados na Hotmart (PURCHASE_APPROVED)
- [ ] Testado com script `test-webhook-hotmart-real.cjs`
- [ ] Testado com Postman enviando token via header
- [ ] Testado diretamente na Hotmart (botão "Testar Webhook")
- [ ] Verificado logs no Vercel
- [ ] Verificado criação de usuário no Supabase
- [ ] Verificado recebimento de email

---

## 🎉 Resultado Final

Quando alguém comprar:

1. ✅ Hotmart envia webhook com token no header `X-Hotmart-Hottok`
2. ✅ Webhook valida token e processa evento `PURCHASE_APPROVED`
3. ✅ Extrai dados de `data.buyer.email` e `data.buyer.name`
4. ✅ Cria usuário no Supabase com senha temporária
5. ✅ Envia email HTML bonito com credenciais
6. ✅ Cliente recebe email e pode fazer login imediatamente
7. ✅ Hotmart recebe 200 OK (sucesso)

---

**Última atualização**: 06/10/2025
**Versão**: 3.0 (Estrutura Real Hotmart)
**Arquivo principal**: `api/hotmart-webhook.ts`
**Script de teste**: `test-webhook-hotmart-real.cjs`
