# 🥝 Guia Completo - Configurar CíliosClick com Kiwify

## 📋 Índice
1. [O que você precisa fazer no Kiwify](#1-o-que-fazer-no-kiwify)
2. [O que você precisa fazer no Vercel](#2-o-que-fazer-no-vercel)
3. [Como testar se está funcionando](#3-como-testar)
4. [Solução de problemas](#4-soluçãode-problemas)

---

## 1. O QUE FAZER NO KIWIFY

### Passo 1: Criar o Produto

1. **Acesse o Kiwify Dashboard:**
   - Login: https://dashboard.kiwify.com.br/login
   - Email: ciliosclick@gmail.com
   - Senha: @Carina86

2. **Criar Novo Produto:**
   - Menu lateral → **Produtos** → **Novo Produto**

   **Informações do Produto:**
   ```
   Nome: CíliosClick - Extensão de Cílios Profissional
   Descrição: Ferramenta com IA para simular extensão de cílios em fotos
   Tipo: Produto Digital
   Preço: R$ 97,00 (ou o valor que você definir)
   ```

3. **Configurar Checkout:**
   - Habilitar pagamento via PIX ✅
   - Habilitar pagamento via Cartão ✅
   - Boleto (opcional)

4. **Salvar Produto**

---

### Passo 2: Configurar Webhook (CRÍTICO!)

Este é o passo mais importante - é o webhook que envia as credenciais automaticamente!

1. **Acessar Configurações de Webhook:**
   - Menu lateral → **Integrações** → **Webhooks**
   - OU
   - Produto → Configurações → Webhooks

2. **Criar Novo Webhook:**

   Clique em **"Adicionar Webhook"** ou **"Novo Webhook"**

3. **Configurar o Webhook:**

   ```
   URL do Webhook: https://www.ciliosclick.com.br/api/kiwify-webhook

   Eventos para disparar:
   ✅ Compra Aprovada (compra_aprovada) - OBRIGATÓRIO
   ✅ Compra Completa (se disponível)

   Produtos:
   ✅ Selecione o produto "CíliosClick" criado acima

   Secret/Token:
   esra6so5axp
   ```

4. **Testar Webhook:**
   - Kiwify geralmente tem botão "Testar Webhook"
   - Clique e verifique se retorna status 200 OK

5. **Ativar Webhook:**
   - Certificar que o status está: **Ativo** ✅

---

### Passo 3: Onde Encontrar Informações do Kiwify

**Você NÃO precisa de API Key do Kiwify** para o webhook funcionar!

O webhook é automático - quando alguém compra, o Kiwify dispara para sua URL.

**Mas se precisar da API Key (para integrações futuras):**

1. Menu → **Configurações** → **Integrações** → **API**
2. Copie a **API Key**
3. Copie o **Account ID**

---

## 2. O QUE FAZER NO VERCEL

### Passo 1: Adicionar Variável de Ambiente

1. **Acessar Vercel Dashboard:**
   - https://vercel.com/dashboard
   - Projeto: **clik-cilios2-0**
   - Aba: **Settings** → **Environment Variables**

2. **Adicionar Nova Variável:**

   Clique em **"Add New"**

   ```
   Name: KIWIFY_WEBHOOK_SECRET
   Value: esra6so5axp
   Environments: ✅ Production  ✅ Preview  ✅ Development
   ```

   Clique em **Save**

3. **Verificar Variáveis Existentes:**

   Certifique-se que estas variáveis JÁ EXISTEM:

   ```
   ✅ VITE_SUPABASE_URL
   ✅ SUPABASE_SERVICE_ROLE_KEY
   ✅ SENDGRID_API_KEY
   ✅ SENDGRID_FROM_EMAIL
   ✅ SENDGRID_FROM_NAME
   ✅ NEXT_PUBLIC_APP_URL
   ```

   **Se alguma estiver faltando, adicione!**

### Passo 2: Fazer Redeploy

Após adicionar a variável `KIWIFY_WEBHOOK_SECRET`:

1. Aba **Deployments**
2. Clique no último deployment
3. Botão com 3 pontinhos (⋯) → **Redeploy**
4. Aguarde 2-3 minutos

---

## 3. COMO TESTAR

### Teste 1: Verificar se Webhook está Ativo

1. **Via Kiwify:**
   - Dashboard Kiwify → Webhooks
   - Clique em "Testar" no webhook criado
   - Deve retornar: **Status 200 OK**

2. **Se der erro 401:** Secret está errado no Vercel
3. **Se der erro 500:** Há problema no código (me avise)
4. **Se der timeout:** URL pode estar errada

---

### Teste 2: Compra de Teste Real

**IMPORTANTE:** Kiwify permite compras de teste!

1. **Acessar Link do Produto:**
   - Kiwify Dashboard → Produto → Copiar Link de Vendas

2. **Fazer Compra de Teste:**
   - Abrir link em aba anônima
   - Preencher dados (use email real para receber)
   - Escolher forma de pagamento: **PIX** (mais rápido)
   - Completar compra

3. **O que deve acontecer (em até 2 minutos):**
   - ✅ Kiwify dispara webhook
   - ✅ Sistema cria usuário no Supabase
   - ✅ Sistema envia email com credenciais
   - ✅ Cliente recebe email

4. **Verificar Email Recebido:**

   Deve chegar email assim:
   ```
   De: CíliosClick <carinaprange86@gmail.com>
   Assunto: 🔐 Suas credenciais de acesso - CíliosClick

   Olá, [Nome]!

   Sua conta foi criada com sucesso!

   🔑 SEUS DADOS DE ACESSO:
   Email: email@cliente.com
   Senha: Ab3$xK9pLm2Q

   🔗 Link: https://www.ciliosclick.com.br/login
   ```

5. **Verificar no Supabase:**
   - https://supabase.com/dashboard
   - Authentication → Users
   - Deve aparecer o usuário com email da compra

---

### Teste 3: Verificar Logs no Vercel

1. **Acessar Logs:**
   - Vercel Dashboard → Deployments → [último deploy] → **Logs**

2. **Procurar por:**
   ```
   📨 Webhook Kiwify recebido
   ✅ Compra aprovada! Processando...
   ✅ Usuário criado no Auth
   ✅ Email enviado com sucesso
   ```

3. **Se aparecer erro nos logs:**
   - Copie a mensagem de erro completa
   - Me envie para análise

---

## 4. SOLUÇÃO DE PROBLEMAS

### Problema: Cliente não recebe email

**Causas possíveis:**

1. **SendGrid não configurado:**
   - Verificar variáveis no Vercel
   - Testar: `node test-sendgrid-novo.cjs email@teste.com`

2. **Email foi para SPAM:**
   - Pedir cliente verificar pasta de spam
   - Adicionar remetente aos contatos

3. **Webhook não disparou:**
   - Verificar logs no Vercel (deve aparecer "Webhook Kiwify recebido")
   - Se não aparecer: webhook não está configurado no Kiwify

---

### Problema: Webhook retorna erro 401

**Causa:** Secret está diferente entre Kiwify e Vercel

**Solução:**
1. Verificar secret configurado no webhook do Kiwify
2. Verificar variável `KIWIFY_WEBHOOK_SECRET` no Vercel
3. Devem ser IDÊNTICOS
4. Redeploy no Vercel

---

### Problema: Webhook retorna erro 500

**Causa:** Erro no código ou variáveis faltando

**Solução:**
1. Verificar logs no Vercel para ver erro específico
2. Verificar se todas as variáveis estão configuradas
3. Me enviar logs para análise

---

### Problema: Usuário criado mas email não chega

**Causa:** SendGrid ou email remetente

**Solução:**
1. Verificar se `SENDGRID_API_KEY` está no Vercel
2. Verificar se `carinaprange86@gmail.com` está verificado no SendGrid
3. Usar script manual: `node criar-usuario-manual.cjs email@cliente.com "Nome"`

---

## 5. FLUXO COMPLETO (Como Funciona)

```
1. Cliente acessa link de venda do Kiwify
   ↓
2. Cliente preenche dados e paga (PIX/Cartão)
   ↓
3. Kiwify aprova pagamento
   ↓
4. Kiwify dispara webhook → https://www.ciliosclick.com.br/api/kiwify-webhook
   ↓
5. Sistema recebe webhook e extrai:
   - Email do cliente
   - Nome do cliente
   ↓
6. Sistema verifica se usuário já existe:
   - Se SIM: Gera nova senha
   - Se NÃO: Cria novo usuário
   ↓
7. Sistema salva no Supabase:
   - Tabela Auth: usuário + senha
   - Tabela users: perfil
   ↓
8. Sistema envia email via SendGrid:
   - Para: email do cliente
   - Assunto: Suas credenciais
   - Conteúdo: email, senha, link
   ↓
9. Cliente recebe email (2-5 minutos)
   ↓
10. Cliente acessa: https://www.ciliosclick.com.br/login
    ↓
11. Cliente faz login e usa o sistema ✅
```

---

## 6. CHECKLIST FINAL

Antes de liberar para vendas reais:

### No Kiwify:
- [ ] Produto criado
- [ ] Preço configurado
- [ ] Formas de pagamento ativas
- [ ] Webhook criado e ativo
- [ ] URL do webhook: `https://www.ciliosclick.com.br/api/kiwify-webhook`
- [ ] Evento "compra_aprovada" marcado
- [ ] Teste do webhook retornou 200 OK

### No Vercel:
- [ ] Variável `KIWIFY_WEBHOOK_SECRET` adicionada
- [ ] Variável `SENDGRID_API_KEY` configurada
- [ ] Variável `SENDGRID_FROM_EMAIL` configurada
- [ ] Deploy mais recente está online
- [ ] Logs mostram webhook funcionando

### Testes:
- [ ] Compra de teste realizada
- [ ] Email com credenciais recebido
- [ ] Login funcionando com credenciais recebidas
- [ ] Usuário aparece no Supabase

---

## 7. INFORMAÇÕES IMPORTANTES

### URLs do Sistema:
```
Webhook: https://www.ciliosclick.com.br/api/kiwify-webhook
Login: https://www.ciliosclick.com.br/login
App: https://www.ciliosclick.com.br
```

### Credenciais Kiwify:
```
Dashboard: https://dashboard.kiwify.com.br/login
Email: ciliosclick@gmail.com
Senha: @Carina86
```

### Secret do Webhook:
```
esra6so5axp
```

### Email Remetente:
```
De: CíliosClick <carinaprange86@gmail.com>
```

---

## 8. SUPORTE

Se algo não funcionar:

1. **Verificar logs no Vercel** (90% dos problemas aparecem lá)
2. **Testar webhook manualmente** no Kiwify
3. **Verificar variáveis de ambiente** estão todas configuradas
4. **Me enviar:**
   - Screenshot do erro
   - Logs do Vercel
   - Email que deveria ter chegado

---

**Sistema pronto para uso com Kiwify! 🚀**

**Última atualização:** 07/10/2025
**Versão:** 1.0 - Kiwify Integration
