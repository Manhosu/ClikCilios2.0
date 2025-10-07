# 🚀 Guia Completo - Configurar Variáveis no Vercel

## 📋 Pré-requisitos

Antes de começar, você precisa ter:
- ✅ Conta no [Vercel](https://vercel.com)
- ✅ Projeto ClikCilios2.0 conectado ao GitHub no Vercel
- ✅ API Key do SendGrid (gerada e ativa)
- ✅ Email remetente verificado no SendGrid
- ✅ Credenciais do Supabase (URL + Service Role Key)

---

## 🔧 Passo a Passo Completo

### 1. Acessar Vercel Dashboard

1. Acesse: https://vercel.com/dashboard
2. Faça login com sua conta
3. Localize o projeto **clik-cilios2-0** (ou nome do seu projeto)
4. Clique no projeto para abrir

### 2. Ir para Configurações

1. No menu superior do projeto, clique em **"Settings"**
2. No menu lateral esquerdo, clique em **"Environment Variables"**

Você verá uma página com uma lista de variáveis de ambiente já configuradas (se houver).

### 3. Adicionar Variáveis de Ambiente

Para cada variável abaixo, clique em **"Add New"** e preencha:

---

#### 📧 **SendGrid** (Envio de Emails) - CRÍTICAS

Estas são as variáveis **mais importantes** para que os emails sejam enviados:

```
Name: SENDGRID_API_KEY
Value: [sua-sendgrid-api-key-aqui]
Environment: ✓ Production  ✓ Preview  ✓ Development
```

```
Name: SENDGRID_FROM_EMAIL
Value: carinaprange86@gmail.com
Environment: ✓ Production  ✓ Preview  ✓ Development
```

```
Name: SENDGRID_FROM_NAME
Value: CíliosClick
Environment: ✓ Production  ✓ Preview  ✓ Development
```

> ⚠️ **IMPORTANTE**: Certifique-se de marcar **todos os ambientes** (Production, Preview, Development)

---

#### 🗄️ **Supabase** (Banco de Dados) - OBRIGATÓRIAS

```
Name: VITE_SUPABASE_URL
Value: https://gguxeqpayaangiplggme.supabase.co
Environment: ✓ Production  ✓ Preview  ✓ Development
```

```
Name: VITE_SUPABASE_ANON_KEY
Value: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdndXhlcXBheWFhbmdpcGxnZ21lIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDk4NDYwOTYsImV4cCI6MjA2NTQyMjA5Nn0.WHusG12ZcOYtVSGUQVUT3Vf-MIbu_O6hlc3ha7yVnSE
Environment: ✓ Production  ✓ Preview  ✓ Development
```

```
Name: SUPABASE_SERVICE_ROLE_KEY
Value: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdndXhlcXBheWFhbmdpcGxnZ21lIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0OTg0NjA5NiwiZXhwIjoyMDY1NDIyMDk2fQ.782bdkQ0eiNSqF55VzIyv4kMLoKecXCOq85apB1E7MI
Environment: ✓ Production  ✓ Preview  ✓ Development
```

---

#### 🔗 **Hotmart** (Webhook) - OBRIGATÓRIA

```
Name: HOTMART_TOKEN
Value: test-token-123
Environment: ✓ Production  ✓ Preview  ✓ Development
```

> ⚠️ **ATENÇÃO**: Este token deve corresponder ao token configurado no painel da Hotmart. Se você configurou outro token na Hotmart, use o mesmo valor aqui.

---

#### 🌐 **Aplicação** (URLs) - OPCIONAL mas Recomendada

```
Name: NEXT_PUBLIC_APP_URL
Value: https://clik-cilios2-0.vercel.app
Environment: ✓ Production  ✓ Preview  ✓ Development
```

> 💡 **Dica**: Substitua pelo domínio real do seu projeto se for diferente.

---

### 4. Verificar Variáveis Configuradas

Após adicionar todas as variáveis, você deve ver uma lista similar a esta:

```
✅ SENDGRID_API_KEY              (Production, Preview, Development)
✅ SENDGRID_FROM_EMAIL            (Production, Preview, Development)
✅ SENDGRID_FROM_NAME             (Production, Preview, Development)
✅ VITE_SUPABASE_URL              (Production, Preview, Development)
✅ VITE_SUPABASE_ANON_KEY         (Production, Preview, Development)
✅ SUPABASE_SERVICE_ROLE_KEY      (Production, Preview, Development)
✅ HOTMART_TOKEN                  (Production, Preview, Development)
✅ NEXT_PUBLIC_APP_URL            (Production, Preview, Development)
```

---

### 5. Re-Deploy

Após adicionar/atualizar variáveis, você **DEVE** fazer um novo deploy:

**Opção 1: Deploy Automático (Recomendado)**
```bash
# No seu computador
git add .
git commit -m "chore: update environment variables"
git push origin main
```

O Vercel detectará o push e fará deploy automaticamente.

**Opção 2: Redeploy Manual**
1. No Vercel Dashboard, vá para a aba **"Deployments"**
2. Clique nos 3 pontinhos do último deploy
3. Clique em **"Redeploy"**
4. Confirme **"Redeploy"**

---

### 6. Verificar Configuração

Após o deploy finalizar (aguarde ~2-3 minutos):

**Teste 1: Verificar Variáveis**

Acesse via browser:
```
https://clik-cilios2-0.vercel.app/api/verificar-config
```

**Resposta esperada**:
```json
{
  "status": "OK",
  "message": "Todas as variáveis críticas estão configuradas",
  "webhookStatus": {
    "canReceiveWebhooks": true,
    "canCreateUsers": true,
    "canSendEmails": true,
    "canValidateToken": true
  }
}
```

Se retornar `"status": "ERROR"`, verifique quais variáveis estão faltando em `issues.critical.missing`.

---

**Teste 2: Testar Webhook**

Use Postman, Insomnia ou curl:

```bash
curl -X POST https://clik-cilios2-0.vercel.app/api/hotmart-webhook \
  -H "Content-Type: application/json" \
  -H "X-Hotmart-Hottok: test-token-123" \
  -d '{
    "event": "PURCHASE_APPROVED",
    "data": {
      "buyer": {
        "email": "seuemail@teste.com",
        "name": "Seu Nome"
      }
    }
  }'
```

**Resultado esperado**:
- Status 200
- Mensagem: "Compra processada, usuário criado e email enviado"
- Email recebido em `seuemail@teste.com`

---

**Teste 3: Verificar Logs**

1. Acesse Vercel Dashboard → Deployments → [último deploy]
2. Clique na aba **"Logs"**
3. Procure por:
   ```
   ✅ Token hottok validado com sucesso!
   ✅ Usuário criado: seuemail@teste.com
   ✅ Email enviado com sucesso para seuemail@teste.com
   ```

Se ver erros, leia a mensagem e corrija conforme as instruções.

---

## ⚠️ Troubleshooting

### Problema: "canSendEmails": false

**Causa**: SENDGRID_API_KEY não configurada ou inválida

**Solução**:
1. Verifique se adicionou a variável `SENDGRID_API_KEY`
2. Verifique se o valor está correto (começa com `SG.`)
3. Verifique se marcou todos os ambientes (Production, Preview, Development)
4. Re-deploy após correção

---

### Problema: Email não chega na caixa de entrada

**Causas possíveis**:
1. Email remetente não verificado no SendGrid
2. Email na pasta de spam
3. SendGrid API key sem permissão "Mail Send - Full Access"

**Soluções**:

**1. Verificar email remetente no SendGrid**:
- Acesse: https://app.sendgrid.com/settings/sender_auth/senders
- Procure por: `carinaprange86@gmail.com`
- Status deve ser: **✅ Verified**
- Se não estiver verificado:
  1. Clique em "Create New Sender"
  2. Preencha os dados
  3. Verifique o email recebido na caixa de entrada

**2. Verificar permissões da API Key**:
- Acesse: https://app.sendgrid.com/settings/api_keys
- Procure pela key "carina"
- Permissões: **Mail Send = Full Access**
- Se não tiver Full Access, crie uma nova key com essa permissão

**3. Verificar Activity Feed**:
- Acesse: https://app.sendgrid.com/email_activity
- Procure por emails enviados para seu destinatário
- Verifique se há bounces ou rejeições

---

### Problema: Webhook retorna 401 "Token inválido"

**Causa**: Token do Hotmart não corresponde ao configurado no Vercel

**Solução**:
1. Verifique o valor da variável `HOTMART_TOKEN` no Vercel
2. Verifique o token configurado no painel Hotmart
3. Os dois devem ser **exatamente iguais**
4. Atualize um dos dois se necessário
5. Re-deploy após correção

---

### Problema: Usuário criado mas email não enviado

**Logs esperados**:
```
✅ Usuário criado: email@cliente.com
⚠️ SENDGRID_API_KEY não configurada - email não será enviado
```

**Solução**:
1. Adicione a variável `SENDGRID_API_KEY` no Vercel
2. Re-deploy
3. Use o script de reenvio para clientes afetados:
   ```bash
   node reenviar-credenciais.cjs email@cliente.com
   ```

---

## ✅ Checklist Final

Antes de considerar a configuração completa:

- [ ] Todas as 8 variáveis adicionadas no Vercel
- [ ] Todos os ambientes marcados (Production, Preview, Development)
- [ ] Re-deploy realizado
- [ ] Endpoint `/api/verificar-config` retorna "OK"
- [ ] Teste de webhook realizado com sucesso
- [ ] Email de teste recebido na caixa de entrada
- [ ] Logs do Vercel sem erros
- [ ] SendGrid Activity Feed mostra emails enviados

---

## 🎯 Resumo Visual

```
┌─────────────────────────────────────────────────────┐
│  1. Acessar Vercel Dashboard                        │
│     https://vercel.com/dashboard                    │
└─────────────────────────────────────────────────────┘
                      ↓
┌─────────────────────────────────────────────────────┐
│  2. Settings → Environment Variables                │
└─────────────────────────────────────────────────────┘
                      ↓
┌─────────────────────────────────────────────────────┐
│  3. Adicionar 8 variáveis                           │
│     • SENDGRID_API_KEY                              │
│     • SENDGRID_FROM_EMAIL                           │
│     • SENDGRID_FROM_NAME                            │
│     • VITE_SUPABASE_URL                             │
│     • VITE_SUPABASE_ANON_KEY                        │
│     • SUPABASE_SERVICE_ROLE_KEY                     │
│     • HOTMART_TOKEN                                 │
│     • NEXT_PUBLIC_APP_URL                           │
└─────────────────────────────────────────────────────┘
                      ↓
┌─────────────────────────────────────────────────────┐
│  4. Re-deploy                                       │
│     git push ou Redeploy manual                     │
└─────────────────────────────────────────────────────┘
                      ↓
┌─────────────────────────────────────────────────────┐
│  5. Verificar                                       │
│     GET /api/verificar-config                       │
│     POST /api/hotmart-webhook (teste)               │
└─────────────────────────────────────────────────────┘
                      ↓
┌─────────────────────────────────────────────────────┐
│  6. Monitorar                                       │
│     • Vercel Logs                                   │
│     • SendGrid Activity Feed                        │
└─────────────────────────────────────────────────────┘
```

---

## 📞 Suporte

Se após seguir todos os passos ainda houver problemas:

1. **Verificar documentação completa**: [SOLUCAO_EMAIL_CREDENCIAIS.md](SOLUCAO_EMAIL_CREDENCIAIS.md)
2. **Executar script de verificação local**:
   ```bash
   node verificar-sendgrid.cjs
   ```
3. **Verificar logs do Vercel** em detalhes
4. **Verificar SendGrid Activity Feed** para ver se emails estão sendo enviados

---

**Última atualização**: 07/10/2025
**Versão**: 1.0
**API Key em uso**: Configurada no `.env` (não exposta por segurança)
