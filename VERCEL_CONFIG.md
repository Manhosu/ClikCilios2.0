# Configuração do Vercel - CíliosClick

Este documento explica como configurar as variáveis de ambiente no Vercel para que o webhook da Hotmart funcione corretamente e envie emails com credenciais para os clientes.

## 🔧 Variáveis de Ambiente Obrigatórias

Acesse o painel do Vercel → Settings → Environment Variables e adicione:

### 1. Supabase (Database)

```bash
VITE_SUPABASE_URL=https://gguxeqpayaangiplggme.supabase.co
VITE_SUPABASE_ANON_KEY=<sua-anon-key>
SUPABASE_SERVICE_ROLE_KEY=<sua-service-role-key>
```

### 2. Hotmart (Webhook)

```bash
HOTMART_TOKEN=gtnL72D16QPeck2Uky8d92uzq6GHtH6f40dc99-fece-4673-97c2-67aef62e4074
```

⚠️ **IMPORTANTE**: Este token deve ser configurado no painel da Hotmart:
- Acesse: Hotmart → Configurações → Webhooks
- Cole o mesmo token em **HOTMART_TOKEN** no Vercel
- A Hotmart envia esse token no header `X-Hotmart-Hottok`

### 3. SendGrid (Email)

```bash
SENDGRID_API_KEY=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
SENDGRID_FROM_EMAIL=carinaprange86@gmail.com
SENDGRID_FROM_NAME=ClikCílios
```

⚠️ **ATENÇÃO**: Verifique se o email `carinaprange86@gmail.com` está verificado no SendGrid.

### 4. URLs da Aplicação

```bash
NEXT_PUBLIC_APP_URL=https://clik-cilios2-0.vercel.app
VITE_APP_URL=https://clik-cilios2-0.vercel.app
```

Substitua pela URL real do seu deploy no Vercel.

---

## 📋 Checklist de Configuração

### Passo 1: Configurar Variáveis no Vercel

1. Acesse: https://vercel.com/seu-usuario/clik-cilios2-0/settings/environment-variables
2. Adicione TODAS as variáveis acima
3. Selecione os ambientes: `Production`, `Preview`, `Development`
4. Clique em **Save**

### Passo 2: Configurar SendGrid

1. Acesse: https://app.sendgrid.com/
2. Vá em **Settings** → **Sender Authentication**
3. Verifique o email `carinaprange86@gmail.com`
4. Confirme a verificação pelo email recebido
5. Crie uma API Key em **Settings** → **API Keys** (se ainda não tiver)

### Passo 3: Configurar Hotmart Webhook

1. Acesse: https://app.hotmart.com
2. Vá em **Ferramentas** → **Webhooks**
3. Adicione nova URL: `https://clik-cilios2-0.vercel.app/api/hotmart-webhook`
4. Cole o token: `gtnL72D16QPeck2Uky8d92uzq6GHtH6f40dc99-fece-4673-97c2-67aef62e4074`
5. Selecione eventos:
   - ✅ `PURCHASE_APPROVED`
   - ✅ `PURCHASE_COMPLETE`
   - ✅ `PURCHASE_CANCELED` (opcional)
6. Salve e teste enviando um evento de teste

### Passo 4: Redeploy da Aplicação

1. Após adicionar as variáveis, faça um novo deploy:
   ```bash
   git add .
   git commit -m "fix: configurar webhook hotmart e envio de emails"
   git push origin main
   ```
2. Aguarde o deploy automático no Vercel
3. Verifique os logs em: https://vercel.com/seu-usuario/clik-cilios2-0/deployments

---

## 🧪 Como Testar

### Teste Local

Execute o script de teste:

```bash
node test-webhook-hotmart-real.cjs
```

Você deve ver nos logs:
- ✅ Token validado
- ✅ Usuário criado
- ✅ Email enviado com sucesso

### Teste em Produção

1. Vá até o painel da Hotmart
2. Envie um evento de teste do webhook
3. Verifique os logs no Vercel:
   - Acesse: Deployments → Último deploy → Functions
   - Clique em `api/hotmart-webhook`
   - Verifique se há erros

4. Verifique o email:
   - O cliente deve receber um email com o assunto: **"🎉 Sua conta CíliosClick foi criada! - Credenciais de acesso"**
   - O email deve conter: login e senha funcional

---

## ❌ Problemas Comuns

### Problema 1: Cliente não recebe email

**Causas possíveis:**
- SendGrid API Key inválida ou não configurada
- Email não verificado no SendGrid
- Variáveis com prefixo errado (`VITE_` vs sem prefixo)

**Solução:**
1. Verifique se `SENDGRID_API_KEY` (SEM VITE_) está configurado no Vercel
2. Verifique se o email está verificado no SendGrid
3. Verifique logs no Vercel para ver erro específico

### Problema 2: Webhook retorna erro 401

**Causa:**
- Token do header `X-Hotmart-Hottok` não bate com `HOTMART_TOKEN`

**Solução:**
1. Verifique se `HOTMART_TOKEN` está configurado no Vercel
2. Verifique se o mesmo token está configurado na Hotmart
3. Cole o token exato: `gtnL72D16QPeck2Uky8d92uzq6GHtH6f40dc99-fece-4673-97c2-67aef62e4074`

### Problema 3: Usuário criado mas senha não funciona

**Causa:**
- Senha temporária foi gerada mas não foi enviada no email

**Solução:**
1. Verifique logs do Vercel para confirmar se email foi enviado
2. Verifique se SendGrid retornou erro
3. Teste manualmente resetando a senha do usuário no Supabase

---

## 🔍 Logs Importantes

### Webhook bem-sucedido:

```
🔍 Verificando token hottok...
🔑 Token de onde veio: HEADER
🔑 Token recebido: gtnL72D16QPeck2Uky8d92uzq6GHtH6f40dc99-fece-4673-97c2-67aef62e4074
✅ Token hottok validado com sucesso!
✅ Processando compra aprovada...
✅ Usuário criado: cliente@email.com
✅ Email enviado com sucesso para cliente@email.com
```

### Webhook com erro de email:

```
✅ Usuário criado: cliente@email.com
❌ Erro ao enviar email: 401 Unauthorized
```

Isso significa que a API Key do SendGrid está errada ou não configurada.

---

## 📞 Suporte

Se após seguir todos os passos o problema persistir:

1. Verifique os logs completos no Vercel
2. Copie o erro específico
3. Entre em contato com suporte técnico

---

**Última atualização:** 2025-01-24
