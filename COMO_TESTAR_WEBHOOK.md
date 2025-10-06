# 🧪 Como Testar o Webhook Hotmart com Payloads Reais

Este guia mostra como testar o webhook Hotmart usando os **payloads EXATOS** fornecidos.

---

## 📋 Pré-requisitos

1. **Variáveis de ambiente configuradas**:
   ```bash
   HOTMART_TOKEN=gtnL72D16QPeck2Uky8d92uzq6GHtH6f40dc99-fece-4673-97c2-67aef62e4074
   VITE_SUPABASE_URL=sua_url_supabase
   SUPABASE_SERVICE_ROLE_KEY=sua_service_role_key
   SENDGRID_API_KEY=sua_api_key (opcional)
   ```

2. **Servidor rodando**:
   ```bash
   npm run dev
   ```
   O servidor deve estar em: `http://localhost:3001`

---

## 🚀 Opção 1: Teste Automatizado (Recomendado)

### Executar Script de Teste

```bash
node test-webhook-hotmart-real-completo.cjs
```

### O que o script testa:

1. ✅ **PURCHASE_APPROVED com token válido**
   - Envia header: `X-Hotmart-Hottok: token`
   - Payload completo real da Hotmart
   - Deve retornar: **200 OK**
   - Deve criar usuário: `testeComprador271101postman15@example.com`
   - Deve enviar email com credenciais

2. ✅ **PURCHASE_CANCELED com token válido**
   - Envia header: `X-Hotmart-Hottok: token`
   - Payload completo real da Hotmart
   - Deve retornar: **200 OK**
   - NÃO deve criar usuário
   - Apenas log do evento

3. ❌ **PURCHASE_APPROVED sem token**
   - NÃO envia header `X-Hotmart-Hottok`
   - Deve retornar: **401 Unauthorized**
   - Mensagem: "Token inválido"

4. ❌ **PURCHASE_APPROVED com token inválido**
   - Envia header com token errado
   - Deve retornar: **401 Unauthorized**
   - Mensagem: "Token inválido"

### Resultado Esperado:

```
==========================================================================================
✅ TODOS OS TESTES CONCLUÍDOS!
==========================================================================================

📊 RESUMO DOS RESULTADOS:

   ✅ Teste 1: Status 200 (450ms)
   ✅ Teste 2: Status 200 (320ms)
   ✅ Teste 3: Status 401 (50ms)
   ✅ Teste 4: Status 401 (45ms)
```

---

## 🔧 Opção 2: Teste Manual com Postman/Insomnia

### Teste 1: PURCHASE_APPROVED com Token

```http
POST http://localhost:3001/api/hotmart-webhook

Headers:
X-Hotmart-Hottok: gtnL72D16QPeck2Uky8d92uzq6GHtH6f40dc99-fece-4673-97c2-67aef62e4074
Content-Type: application/json

Body (JSON):
{
  "id": "0096289e-8277-41a7-9fe1-bf4d25f20a33",
  "creation_date": 1758660642845,
  "event": "PURCHASE_APPROVED",
  "version": "2.0.0",
  "data": {
    "product": {
      "id": 0,
      "name": "Produto test postback2"
    },
    "buyer": {
      "email": "testeComprador271101postman15@example.com",
      "name": "Teste Comprador",
      "first_name": "Teste",
      "last_name": "Comprador"
    },
    "purchase": {
      "transaction": "HP16015479281022",
      "status": "APPROVED",
      "price": {
        "value": 1500,
        "currency_value": "BRL"
      }
    }
  }
}
```

**Resposta Esperada (200 OK)**:
```json
{
  "success": true,
  "message": "Compra processada, usuário criado e email enviado",
  "data": {
    "user_created": true,
    "user_id": "uuid-do-usuario",
    "email": "testeComprador271101postman15@example.com",
    "email_sent": true,
    "event": "PURCHASE_APPROVED"
  },
  "timestamp": "2025-10-06T15:00:00.000Z",
  "processing_time_ms": 450
}
```

### Teste 2: PURCHASE_CANCELED com Token

```http
POST http://localhost:3001/api/hotmart-webhook

Headers:
X-Hotmart-Hottok: gtnL72D16QPeck2Uky8d92uzq6GHtH6f40dc99-fece-4673-97c2-67aef62e4074
Content-Type: application/json

Body (JSON):
{
  "id": "05146749-94c4-4822-ba1e-192fdb415ae0",
  "event": "PURCHASE_CANCELED",
  "data": {
    "buyer": {
      "email": "testeComprador271101postman15@example.com",
      "name": "Teste Comprador"
    },
    "purchase": {
      "transaction": "HP16015479281022",
      "status": "CANCELED"
    }
  }
}
```

**Resposta Esperada (200 OK)**:
```json
{
  "success": true,
  "message": "Evento PURCHASE_CANCELED recebido e registrado (não processado)",
  "timestamp": "2025-10-06T15:00:00.000Z",
  "processing_time_ms": 50
}
```

### Teste 3: PURCHASE_APPROVED sem Token (401)

```http
POST http://localhost:3001/api/hotmart-webhook

Headers:
Content-Type: application/json
(SEM X-Hotmart-Hottok)

Body: (mesmo JSON do Teste 1)
```

**Resposta Esperada (401 Unauthorized)**:
```json
{
  "error": "Token inválido"
}
```

---

## 📝 Verificar Logs do Servidor

Enquanto executa os testes, observe o terminal onde o servidor está rodando (`npm run dev`):

### Logs Esperados para Teste 1 (PURCHASE_APPROVED):

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
      "email": "testeComprador271101postman15@example.com",
      "name": "Teste Comprador"
    }
  }
}
🔍 Verificando token hottok...
🔑 Token de onde veio: HEADER           ← ✅ Correto!
🔑 Token recebido: gtnL72D16QPeck2Uky8d92uzq6GHtH6f40dc99...
🔑 Token esperado: gtnL72D16QPeck2Uky8d92uzq6GHtH6f40dc99...
✅ Token hottok validado com sucesso!
🔄 Evento recebido: PURCHASE_APPROVED
✅ Processando compra aprovada...
👤 Dados do comprador (data.buyer): {   ← ✅ Correto!
  "email": "testeComprador271101postman15@example.com",
  "name": "Teste Comprador"
}
✅ Usuário criado: testeComprador271101postman15@example.com
✅ Email enviado com sucesso para testeComprador271101postman15@example.com
⏱️ Processamento concluído em 450ms
📤 Resposta final: {"success":true,...}
```

### Logs Esperados para Teste 2 (PURCHASE_CANCELED):

```
📨 Webhook Hotmart recebido
...
✅ Token hottok validado com sucesso!
🔄 Evento recebido: PURCHASE_CANCELED
📝 Evento de cancelamento recebido: PURCHASE_CANCELED
⏱️ Processamento concluído em 50ms
```

### Logs Esperados para Teste 3 (Sem Token):

```
📨 Webhook Hotmart recebido
🔍 Verificando token hottok...
🔑 Token de onde veio: AUSENTE          ← ✅ Correto!
🔑 Token recebido: AUSENTE
❌ Token hottok ausente (não encontrado no header nem no body)
```

---

## ✅ Checklist de Validação

Após executar os testes, verifique:

### No Terminal do Servidor:
- [ ] Logs aparecem com "Token de onde veio: HEADER"
- [ ] Logs mostram "Dados do comprador (data.buyer)"
- [ ] Mensagem "✅ Usuário criado: testeComprador..."
- [ ] Mensagem "✅ Email enviado com sucesso..."

### No Supabase:
- [ ] Abrir Supabase Dashboard
- [ ] Ir em Authentication > Users
- [ ] Procurar por: `testeComprador271101postman15@example.com`
- [ ] Verificar se usuário foi criado
- [ ] Verificar se tem `user_metadata.created_by = 'hotmart_webhook'`

### Na Tabela `users`:
- [ ] Abrir Supabase Dashboard
- [ ] Ir em Table Editor > users
- [ ] Procurar por email: `testeComprador271101postman15@example.com`
- [ ] Verificar campos:
  - `email`: testeComprador271101postman15@example.com
  - `nome`: Teste Comprador
  - `is_admin`: false
  - `onboarding_completed`: false

### No Email (se SENDGRID configurado):
- [ ] Verificar caixa de entrada: `testeComprador271101postman15@example.com`
- [ ] Email recebido com assunto: "🎉 Sua conta CíliosClick foi criada!"
- [ ] Email contém:
  - Nome do cliente
  - Email de login
  - Senha temporária
  - Botão "Acessar Plataforma"

### Testar Login:
- [ ] Ir para: `http://localhost:3000/login` ou URL de produção
- [ ] Usar email: `testeComprador271101postman15@example.com`
- [ ] Usar senha do email recebido
- [ ] Login deve funcionar ✅

---

## 🔍 Troubleshooting

### Erro: "ECONNREFUSED"
**Causa**: Servidor não está rodando.
**Solução**: Execute `npm run dev` em outro terminal.

### Erro: 401 mesmo com token correto
**Causa**: Variável `HOTMART_TOKEN` não configurada.
**Solução**:
1. Verificar arquivo `.env` ou `.env.local`
2. Adicionar: `HOTMART_TOKEN=gtnL72D16QPeck2Uky8d92uzq6GHtH6f40dc99-fece-4673-97c2-67aef62e4074`
3. Reiniciar servidor

### Usuário criado mas email não enviado
**Causa**: `SENDGRID_API_KEY` não configurada.
**Solução**:
1. Logs devem mostrar: "⚠️ SENDGRID_API_KEY não configurada"
2. Adicionar variável no `.env`
3. Reiniciar servidor

### Token vindo do BODY ao invés do HEADER
**Causa**: Postman/Insomnia não está enviando header corretamente.
**Solução**:
1. Verificar se header está na aba "Headers"
2. Nome exato: `X-Hotmart-Hottok` (com hífen e maiúsculas)
3. Não colocar no body JSON

---

## 🎯 Resultados Esperados - Resumo

| Teste | Payload | Token | Status | Cria Usuário? | Envia Email? |
|-------|---------|-------|--------|---------------|--------------|
| 1 | PURCHASE_APPROVED | ✅ Válido (header) | 200 OK | ✅ Sim | ✅ Sim |
| 2 | PURCHASE_CANCELED | ✅ Válido (header) | 200 OK | ❌ Não | ❌ Não |
| 3 | PURCHASE_APPROVED | ❌ Ausente | 401 | ❌ Não | ❌ Não |
| 4 | PURCHASE_APPROVED | ❌ Inválido | 401 | ❌ Não | ❌ Não |

---

## 🚀 Próximos Passos

Após validar localmente:

1. **Commit e Push**:
   ```bash
   git add .
   git commit -m "test: validar webhook com payloads reais da Hotmart"
   git push
   ```

2. **Deploy no Vercel**:
   - Aguardar deploy automático
   - Verificar variáveis de ambiente no Vercel

3. **Testar em Produção**:
   - Alterar `WEBHOOK_URL` no script para URL do Vercel
   - Executar testes novamente
   - Ou testar diretamente no painel Hotmart

4. **Configurar na Hotmart**:
   - URL: `https://clik-cilios2-0.vercel.app/api/hotmart-webhook`
   - Hottok: `gtnL72D16QPeck2Uky8d92uzq6GHtH6f40dc99-fece-4673-97c2-67aef62e4074`
   - Testar webhook no painel

---

**Última atualização**: 06/10/2025
**Script de teste**: `test-webhook-hotmart-real-completo.cjs`
**Payloads**: Baseados em exemplos reais fornecidos pela Hotmart
