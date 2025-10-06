# Webhook Hotmart - Configuração Corrigida ✅

## 🔧 Correções Aplicadas

### Problemas Resolvidos
1. ✅ **Erro 401 "Token inválido"** - Arquivo `pages/api/hotmart/webhook.ts` usava variável errada (`HOTMART_HOTTOK` ao invés de `HOTMART_TOKEN`)
2. ✅ **Webhooks conflitantes** - Múltiplas implementações foram consolidadas
3. ✅ **Falta de email** - Agora envia email automático com credenciais após criação do usuário

### Arquivos Modificados
- ✅ `api/hotmart-webhook.ts` - **WEBHOOK PRINCIPAL** (consolidado e corrigido)
- 🗑️ `pages/api/hotmart/webhook.ts` → renomeado para `.old` (conflitante)
- 🗑️ `api/hotmart/webhook.ts` → renomeado para `.old` (conflitante)

---

## 📋 Configuração no Vercel

### 1. Variáveis de Ambiente OBRIGATÓRIAS

Acesse: **Vercel Dashboard** → **Settings** → **Environment Variables**

```bash
# ✅ OBRIGATÓRIAS
HOTMART_TOKEN=gtnL72D16QPeck2Uky8d92uzq6GHtH6f40dc99-fece-4673-97c2-67aef62e4074
VITE_SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=sua_service_role_key_aqui
```

### 2. Variáveis de Ambiente OPCIONAIS (para envio de email)

```bash
# 📧 OPCIONAIS - Para envio de email com credenciais
SENDGRID_API_KEY=SG.xxxxxxxxxxxxxxxxxxxxx
SENDGRID_FROM_EMAIL=noreply@ciliosclick.com
SENDGRID_FROM_NAME=CíliosClick
NEXT_PUBLIC_APP_URL=https://clik-cilios2-0.vercel.app
```

> **⚠️ IMPORTANTE**: Se `SENDGRID_API_KEY` não estiver configurada, o webhook funcionará mas NÃO enviará emails.

---

## 🔌 Configuração na Hotmart

### 1. URL do Webhook
Configure no painel Hotmart:
```
https://clik-cilios2-0.vercel.app/api/hotmart-webhook
```

### 2. Formato do Payload
Certifique-se que o webhook Hotmart envia o campo `hottok` no JSON:

```json
{
  "hottok": "gtnL72D16QPeck2Uky8d92uzq6GHtH6f40dc99-fece-4673-97c2-67aef62e4074",
  "event": "approved",
  "data": {
    "purchase": {
      "order_id": "HP123456789",
      "buyer": {
        "name": "Nome do Cliente",
        "email": "cliente@email.com"
      },
      "price": {
        "value": 97.00
      }
    }
  }
}
```

---

## 📊 Eventos Suportados

| Evento Hotmart | Ação do Webhook |
|----------------|-----------------|
| `approved` | ✅ Cria usuário + Envia email |
| `PURCHASE_APPROVED` | ✅ Cria usuário + Envia email |
| `complete` | ✅ Cria usuário + Envia email |
| `PURCHASE_CANCELED` | 📝 Apenas log (não cria) |
| `PURCHASE_CANCELLED` | 📝 Apenas log (não cria) |
| `PURCHASE_REFUNDED` | 📝 Apenas log (não cria) |
| `PURCHASE_CHARGEBACK` | 📝 Apenas log (não cria) |

---

## 📧 Fluxo de Email

### Quando o usuário é criado:
1. ✅ Cria usuário no Supabase Auth
2. ✅ Cria perfil na tabela `users`
3. ✅ Gera senha temporária aleatória
4. ✅ **Envia email** com:
   - Email de login
   - Senha gerada
   - Link direto para login
   - Template HTML bonito

### Se usuário já existe:
1. ✅ Atualiza senha do usuário
2. ✅ **Envia email** com nova senha

### Template do Email
```
Assunto: 🎉 Sua conta CíliosClick foi criada! - Credenciais de acesso

Conteúdo:
- Nome do cliente
- Email de login
- Senha gerada
- Botão "Acessar Plataforma"
- Dica para trocar senha após primeiro acesso
```

---

## 🧪 Como Testar

### Teste Local (opcional)
Se quiser testar localmente antes do deploy:

```bash
# 1. Iniciar servidor de desenvolvimento
npm run dev

# 2. Em outro terminal, executar teste
node test-webhook-corrigido.cjs
```

### Teste em Produção
Após fazer deploy no Vercel:

1. **Obter a URL do webhook**:
   ```
   https://clik-cilios2-0.vercel.app/api/hotmart-webhook
   ```

2. **Testar com Postman/Insomnia**:
   ```bash
   POST https://clik-cilios2-0.vercel.app/api/hotmart-webhook
   Content-Type: application/json

   {
     "hottok": "gtnL72D16QPeck2Uky8d92uzq6GHtH6f40dc99-fece-4673-97c2-67aef62e4074",
     "event": "approved",
     "data": {
       "purchase": {
         "order_id": "TEST123",
         "buyer": {
           "name": "Teste Cliente",
           "email": "seu-email@example.com"
         }
       }
     }
   }
   ```

3. **Verificar logs no Vercel**:
   - Acesse Vercel Dashboard → Deployments → [seu deploy] → Logs
   - Procure por:
     ```
     ✅ Token validado com sucesso!
     ✅ Usuário criado: seu-email@example.com
     ✅ Email enviado com sucesso para seu-email@example.com
     ```

4. **Verificar email**:
   - Checar caixa de entrada do email de teste
   - Se não receber, verificar spam/lixo eletrônico

---

## ⚠️ Troubleshooting

### Erro 401 - Token inválido
**Causa**: Variável `HOTMART_TOKEN` não configurada ou com valor diferente.

**Solução**:
1. Verificar no Vercel se `HOTMART_TOKEN` está configurada
2. Verificar se o valor é exatamente: `gtnL72D16QPeck2Uky8d92uzq6GHtH6f40dc99-fece-4673-97c2-67aef62e4074`
3. Re-deploy após adicionar/corrigir

### Usuário criado mas email não enviado
**Causa**: `SENDGRID_API_KEY` não configurada ou inválida.

**Solução**:
1. Verificar logs do Vercel: deve aparecer `⚠️ SENDGRID_API_KEY não configurada`
2. Configurar variável no Vercel
3. Re-deploy

### Webhook retorna 200 mas nada acontece
**Causa**: Estrutura do payload diferente do esperado.

**Solução**:
1. Verificar logs do Vercel
2. Procurar por `⚠️ Dados do comprador incompletos`
3. Verificar se payload tem campos `data.purchase.buyer.email` e `data.purchase.buyer.name`

---

## 📝 Logs Esperados (Sucesso)

```
📨 Webhook Hotmart recebido
🔍 Verificando token...
🔑 Token recebido: gtnL72D16QPeck2Uky8d92uzq6GHtH6f40dc99-fece-4673-97c2-67aef62e4074
🔑 Token esperado: gtnL72D16QPeck2Uky8d92uzq6GHtH6f40dc99-fece-4673-97c2-67aef62e4074
✅ Token validado com sucesso!
🔄 Evento recebido: approved
✅ Processando compra aprovada...
👤 Dados do comprador: {"name":"Cliente Teste","email":"cliente@email.com"}
✅ Usuário criado: cliente@email.com
✅ Email enviado com sucesso para cliente@email.com
⏱️ Processamento concluído em 350ms
📤 Resposta final: {"success":true,"message":"Compra processada, usuário criado e email enviado",...}
```

---

## ✅ Checklist de Deploy

Antes de fazer o deploy final:

- [ ] Variável `HOTMART_TOKEN` configurada no Vercel
- [ ] Variável `VITE_SUPABASE_URL` configurada no Vercel
- [ ] Variável `SUPABASE_SERVICE_ROLE_KEY` configurada no Vercel
- [ ] Variável `SENDGRID_API_KEY` configurada no Vercel (opcional mas recomendado)
- [ ] Arquivos conflitantes renomeados para `.old`
- [ ] Fazer commit e push das alterações
- [ ] Deploy automático no Vercel
- [ ] Testar webhook com Postman
- [ ] Configurar URL no painel Hotmart
- [ ] Fazer teste real de compra

---

## 🎯 Resultado Final

### O que acontece quando alguém compra:

1. 🛒 **Cliente compra na Hotmart**
2. 🌐 **Hotmart envia webhook** para `https://clik-cilios2-0.vercel.app/api/hotmart-webhook`
3. 🔐 **Webhook valida token** `hottok`
4. 👤 **Cria usuário** no Supabase (ou atualiza se já existe)
5. 🔑 **Gera senha temporária** aleatória
6. 📧 **Envia email** com credenciais para o cliente
7. ✅ **Cliente recebe email** e pode fazer login imediatamente
8. 🎉 **Hotmart recebe status 200** (sucesso)

---

## 📞 Suporte

Em caso de dúvidas ou problemas:
1. Verificar logs do Vercel
2. Executar script de teste local
3. Verificar configuração das variáveis de ambiente
4. Consultar este documento

**Última atualização**: 06/10/2025
**Versão do webhook**: 2.0 (Consolidada e corrigida)
