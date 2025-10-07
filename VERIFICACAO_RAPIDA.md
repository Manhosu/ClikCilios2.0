# ✅ Verificação Rápida - Sistema de Emails

## 📊 Status Atual (07/10/2025)

### ✅ O que JÁ está funcionando:
- ✅ Template de email bonito implementado (`credentialsEmail`)
- ✅ Webhook Hotmart configurado em `pages/api/hotmart-webhook.ts`
- ✅ SendGrid integrado no código
- ✅ Fluxo automático: Compra → Criar usuário → Enviar email

### ⚠️ O que PODE estar faltando:
- ⚠️ Variáveis de ambiente no Vercel (produção)
- ⚠️ Email remetente não verificado no SendGrid
- ⚠️ Token Hotmart diferente entre ambientes

---

## 🔍 Verificação em 3 Passos

### Passo 1: Verificar Configuração no Vercel

Acesse: **Vercel Dashboard → Settings → Environment Variables**

Confirme se TODAS estas variáveis estão configuradas:

```env
✅ VITE_SUPABASE_URL=https://gguxeqpayaangiplggme.supabase.co
✅ SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
✅ SENDGRID_API_KEY=SG.jHFAjkboQ_OM2PjsbEP1vg...
✅ SENDGRID_FROM_EMAIL=carinaprange86@gmail.com
✅ SENDGRID_FROM_NAME=ClikCílios
✅ HOTMART_TOKEN=test-token-123
✅ NEXT_PUBLIC_APP_URL=https://clik-cilios2-0.vercel.app
```

**Se alguma estiver faltando:**
1. Clique em "Add New"
2. Copie o nome e valor exatos
3. Selecione: Production, Preview, Development
4. Clique em "Save"
5. Faça re-deploy (Deployments → Redeploy)

---

### Passo 2: Verificar Email no SendGrid

Acesse: **SendGrid Dashboard → Settings → Sender Authentication**

**Verificar:**
1. O email `carinaprange86@gmail.com` está na lista?
2. Status é "Verified" (verde)?

**Se NÃO estiver verificado:**
1. Clique em "Verify a Single Sender"
2. Preencha com `carinaprange86@gmail.com`
3. Abra o email de verificação que o SendGrid enviará
4. Clique no link de confirmação
5. Aguarde status mudar para "Verified"

---

### Passo 3: Testar Envio de Email

No terminal local, execute:

```bash
node test-sendgrid-novo.cjs carinaprange86@gmail.com
```

**Resultado esperado (SUCESSO):**
```
✅ Email enviado com sucesso!
   Status: 202 Accepted
   Para: carinaprange86@gmail.com
```

**Se der erro:**
```
❌ Erro ao enviar email
   Status: 401 Unauthorized
   → Problema: API key inválida
```

---

## 🚨 Ação Imediata - Cliente Sem Acesso

Se a cliente já comprou mas não recebeu email:

### Opção 1: Reenviar Email Automaticamente

```bash
node reenviar-credenciais.cjs carinaprange86@gmail.com
```

**O que acontece:**
- Busca usuário no banco
- Gera nova senha temporária
- Atualiza no Supabase
- Envia email com credenciais

### Opção 2: Criar Usuário Manualmente (se não existir)

Se o script retornar "Usuário não encontrado":

1. **Acesse Supabase Dashboard:**
   - https://supabase.com/dashboard
   - Projeto: gguxeqpayaangiplggme

2. **Criar Usuário no Auth:**
   - Menu: Authentication → Users → Add User
   - Email: carinaprange86@gmail.com
   - Password: (gerar senha forte: `Ab3$xK9pLm2Q`)
   - ✅ Marcar "Auto Confirm User"
   - Clicar em "Create User"

3. **Criar Perfil na Tabela:**
   - Menu: Table Editor → users → Insert Row
   - id: (copiar UUID do Auth acima)
   - email: carinaprange86@gmail.com
   - name: Cristina (ou nome da cliente)
   - is_admin: false
   - onboarding_completed: false
   - Clicar em "Save"

4. **Enviar credenciais para a cliente:**
   ```
   Email: carinaprange86@gmail.com
   Senha: Ab3$xK9pLm2Q
   Link: https://clik-cilios2-0.vercel.app/login
   ```

---

## 🧪 Testar Webhook em Produção

Depois de configurar tudo no Vercel:

```bash
curl -X POST https://clik-cilios2-0.vercel.app/api/hotmart-webhook \
  -H "Content-Type: application/json" \
  -H "X-Hotmart-Hottok: test-token-123" \
  -d '{
    "event": "PURCHASE_APPROVED",
    "data": {
      "buyer": {
        "email": "teste@email.com",
        "name": "Teste Cliente"
      }
    }
  }'
```

**Verificar:**
1. Status: 200 OK
2. Email recebido em teste@email.com
3. Usuário criado no Supabase

---

## 📞 Mensagem para a Cliente

Se tudo estiver resolvido:

```
Olá, Cristina! 🎉

Sua compra foi aprovada e liberamos seu acesso ao CíliosClick!

📧 Email: carinaprange86@gmail.com
🔑 Senha: Ab3$xK9pLm2Q
🔗 Link: https://clik-cilios2-0.vercel.app/login

💡 Dica: Troque sua senha após o primeiro acesso para algo que você lembre facilmente.

Qualquer dúvida, estou à disposição! 💜
```

---

## 📋 Checklist Final

- [ ] Variáveis de ambiente no Vercel configuradas
- [ ] Email remetente verificado no SendGrid
- [ ] Re-deploy realizado no Vercel
- [ ] Teste de email local funcionando
- [ ] Teste de webhook produção funcionando
- [ ] Cliente recebeu credenciais
- [ ] Cliente conseguiu fazer login

---

## 📚 Documentação Completa

Para mais detalhes, consulte:
- [ACAO_IMEDIATA.md](ACAO_IMEDIATA.md) - Ações imediatas
- [SOLUCAO_EMAIL_CREDENCIAIS.md](SOLUCAO_EMAIL_CREDENCIAIS.md) - Solução completa
- [WEBHOOK_HOTMART_CONFIG.md](WEBHOOK_HOTMART_CONFIG.md) - Configuração Hotmart

---

**Última atualização**: 07/10/2025
**Prioridade**: 🚨 ALTA
