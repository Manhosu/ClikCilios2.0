# 🚀 Comandos para Executar AGORA

## Ordem de Execução

Execute os comandos nesta ordem para resolver o problema da cliente:

---

## 1️⃣ Verificar Configuração Local

```bash
node verificar-sendgrid.cjs
```

**O que faz**: Verifica se todas as variáveis estão configuradas corretamente no `.env`

**Resultado esperado**: Todas as verificações em verde ✅

**Se houver erros**: Corrija as variáveis no `.env` e execute novamente

---

## 2️⃣ Testar Envio de Email

```bash
node test-sendgrid-novo.cjs carinaprange86@gmail.com
```

**O que faz**: Envia um email de teste para verificar se o SendGrid está funcionando

**Resultado esperado**:
- ✅ Email enviado com sucesso
- Email recebido na caixa de entrada com template bonito

**Se não receber**:
1. Verifique a pasta de spam
2. Acesse SendGrid Dashboard → Activity → Email Activity
3. Verifique se o email remetente está verificado (próximo passo)

---

## 3️⃣ Verificar Email Remetente no SendGrid

**⚠️ PASSO CRÍTICO - Sem isso, nenhum email será enviado!**

### Opção A: Via Browser (Recomendado)

1. Acesse: https://app.sendgrid.com/settings/sender_auth/senders
2. Procure por: `carinaprange86@gmail.com`
3. Verifique o status:
   - ✅ **Verified** = Tudo certo, pule para o próximo passo
   - ❌ **Pending** ou não aparece = Continue abaixo

### Se não estiver verificado:

1. Clique em **"Create New Sender"**
2. Preencha:
   ```
   From Name: CíliosClick
   From Email Address: carinaprange86@gmail.com
   Reply To: carinaprange86@gmail.com
   Company Address: [seu endereço]
   City: [sua cidade]
   State: [seu estado]
   Zip Code: [seu CEP]
   Country: Brazil
   ```
3. Clique em **"Create"**
4. Verifique a caixa de entrada de `carinaprange86@gmail.com`
5. Procure por email do SendGrid com assunto "Please Verify Your Single Sender"
6. Clique no link de verificação no email
7. Aguarde confirmação

### Opção B: Via Script

```bash
node verificar-sendgrid.cjs
```

O script dirá se o email está verificado ou não.

---

## 4️⃣ Reenviar Credenciais para a Cliente

**Agora que tudo está configurado, reenvie as credenciais para a cliente:**

```bash
node reenviar-credenciais.cjs carinaprange86@gmail.com
```

**Resultado esperado**:
```
✅ Usuário encontrado:
   ID: abc123...
   Nome: Carina Prange
   Email: carinaprange86@gmail.com

✅ Senha atualizada com sucesso

✅ Email enviado com sucesso para carinaprange86@gmail.com

✅ Processo concluído com sucesso!

📋 Resumo:
   Usuário: Carina Prange
   Email: carinaprange86@gmail.com
   Nova senha: Ab3$xK9pLm2Q
   Email enviado: Sim
```

A cliente receberá um email bonito com as credenciais.

---

## 5️⃣ Configurar Vercel (Para Futuras Compras)

**Importante**: Isto é para garantir que futuras compras funcionem automaticamente.

### Acesse o Vercel

```
https://vercel.com/dashboard
```

### Siga o guia completo

Abra o arquivo: [CONFIGURAR_VERCEL.md](CONFIGURAR_VERCEL.md)

**Resumo rápido**:
1. Settings → Environment Variables
2. Adicionar `SENDGRID_API_KEY` = `SG.your-sendgrid-api-key-here`
3. Adicionar `SENDGRID_FROM_EMAIL` = `carinaprange86@gmail.com`
4. Adicionar `SENDGRID_FROM_NAME` = `CíliosClick`
5. Adicionar outras variáveis (veja o guia completo)
6. Re-deploy

---

## 6️⃣ Testar em Produção (Após Configurar Vercel)

### Verificar configuração

```bash
curl https://clik-cilios2-0.vercel.app/api/verificar-config
```

**Resultado esperado**: `"status": "OK"`

### Testar webhook

```bash
curl -X POST https://clik-cilios2-0.vercel.app/api/hotmart-webhook \
  -H "Content-Type: application/json" \
  -H "X-Hotmart-Hottok: test-token-123" \
  -d '{"event":"PURCHASE_APPROVED","data":{"buyer":{"email":"teste@email.com","name":"Teste Cliente"}}}'
```

**Resultado esperado**:
- Status 200
- Mensagem: "Compra processada, usuário criado e email enviado"
- Email recebido em `teste@email.com`

---

## 7️⃣ Verificar Logs do Vercel

1. Acesse: https://vercel.com/dashboard
2. Clique no projeto
3. Aba "Deployments"
4. Clique no último deploy
5. Aba "Logs"

**Procure por**:
```
✅ Token hottok validado com sucesso!
✅ Processando compra aprovada...
✅ Usuário criado: teste@email.com
✅ Email enviado com sucesso para teste@email.com
```

---

## 📊 Checklist de Verificação

Marque cada item após completar:

### Local (Desenvolvimento)

- [ ] `node verificar-sendgrid.cjs` - Tudo verde
- [ ] `node test-sendgrid-novo.cjs` - Email recebido
- [ ] Email remetente verificado no SendGrid
- [ ] `node reenviar-credenciais.cjs` - Cliente recebeu email

### Vercel (Produção)

- [ ] Variáveis configuradas no Vercel
- [ ] Re-deploy realizado
- [ ] `curl /api/verificar-config` - Status OK
- [ ] `curl /api/hotmart-webhook` (teste) - Email recebido
- [ ] Logs do Vercel sem erros

---

## ⚠️ Se Algo Não Funcionar

### Erro: "SENDGRID_API_KEY não configurada"

**Solução**: Verifique o arquivo `.env` e certifique-se que tem:
```env
SENDGRID_API_KEY="SG.your-sendgrid-api-key-here"
```

---

### Erro: "API key inválida ou expirada"

**Soluções**:
1. Verifique se copiou a API key completa (começa com `SG.`)
2. Acesse SendGrid Dashboard → Settings → API Keys
3. Verifique se a key "carina" está ativa
4. Se necessário, gere uma nova key com permissão "Mail Send - Full Access"

---

### Erro: "Email remetente não verificado"

**Solução**: Siga o **Passo 3** acima para verificar o email remetente

---

### Erro: "Usuário não encontrado no banco"

**Solução**: O usuário precisa ser criado primeiro:

1. Acesse Supabase Dashboard → Authentication → Users
2. Clique em "Add User" → "Create New User"
3. Preencha email e senha
4. Marque "Auto Confirm User"
5. Execute o script novamente

---

### Email não chega na caixa de entrada

**Soluções**:
1. Verifique a pasta de **spam**
2. Acesse SendGrid Activity Feed: https://app.sendgrid.com/email_activity
3. Procure pelo email enviado e veja o status (Delivered, Bounced, etc.)
4. Se aparecer "Bounced", pode ser que o Gmail bloqueou
5. Considere usar um domínio próprio ao invés de Gmail

---

## 🎯 Resumo dos Comandos

Copie e cole na ordem:

```bash
# 1. Verificar configuração
node verificar-sendgrid.cjs

# 2. Testar envio
node test-sendgrid-novo.cjs carinaprange86@gmail.com

# 3. (Verificar email remetente no browser - veja acima)

# 4. Reenviar para cliente
node reenviar-credenciais.cjs carinaprange86@gmail.com

# 5. (Configurar Vercel - veja guia CONFIGURAR_VERCEL.md)

# 6. Testar produção
curl https://clik-cilios2-0.vercel.app/api/verificar-config
```

---

## 📞 Precisa de Ajuda?

### Documentação Completa

- [ACAO_IMEDIATA.md](ACAO_IMEDIATA.md) - Guia rápido
- [CONFIGURAR_VERCEL.md](CONFIGURAR_VERCEL.md) - Guia do Vercel
- [SOLUCAO_EMAIL_CREDENCIAIS.md](SOLUCAO_EMAIL_CREDENCIAIS.md) - Documentação completa
- [RESUMO_ALTERACOES.md](RESUMO_ALTERACOES.md) - Lista de alterações

### Scripts Disponíveis

- `verificar-sendgrid.cjs` - Diagnóstico completo
- `test-sendgrid-novo.cjs` - Teste de envio
- `reenviar-credenciais.cjs` - Reenviar para cliente

---

**Última atualização**: 07/10/2025
**Prioridade**: 🚨 **EXECUTAR AGORA**
**Tempo estimado**: 10-15 minutos
