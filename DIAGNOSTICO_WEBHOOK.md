# 🔍 Diagnóstico - Webhook Hotmart Não Funciona

## 📊 Situação Atual (07/10/2025 19:21)

### ✅ O que funciona:
- Cliente compra no Hotmart
- Hotmart Club envia email de boas-vindas
- Cliente tem acesso à área de membros do Hotmart Club

### ❌ O que NÃO funciona:
- Webhook do CíliosClick não dispara
- Cliente não recebe email com credenciais do app
- Usuário não é criado no sistema

## 🎯 Causas Prováveis

### 1. Produto Configurado como "Curso" na Hotmart
**Problema**: Produtos tipo "Curso" na Hotmart são automaticamente integrados com Hotmart Club e podem **não disparar webhooks de terceiros**.

**Como identificar**:
- Na Hotmart, vá em: Produto → Configurações → Categoria
- Se estiver como "Curso", "Treinamento Online" ou similar, esse é o problema

**Solução A - Mudar categoria do produto**:
1. Hotmart → Produto → Configurações → Categoria
2. Mudar para: **"Software/Plugin"** ou **"Ferramenta"** ou **"Aplicação Web"**
3. Salvar mudanças
4. Reconfigurar webhook (ver seção "Configurar Webhook")

**Solução B - Criar novo produto**:
1. Criar novo produto na Hotmart
2. Categoria: **"Software/Plugin"** ou **"Ferramenta"**
3. Nome: "CíliosClick - Extensão de Cílios Profissional"
4. Configurar webhook desde o início

### 2. Webhook Não Configurado ou Inativo

**Verificar na Hotmart**:
1. Produto → Ferramentas → Webhooks
2. Verificar se existe webhook para: `https://clik-cilios2-0.vercel.app/api/hotmart-webhook`
3. Status deve estar: **Ativo** ✅

**Se não existe ou está inativo**:
- Criar/ativar webhook (ver seção "Configurar Webhook")

### 3. Eventos Não Configurados

**Problema**: Webhook pode estar configurado mas sem os eventos corretos.

**Eventos necessários**:
- ✅ `PURCHASE_APPROVED` (Compra Aprovada)
- ✅ `PURCHASE_COMPLETE` (Compra Completa)

**Verificar/Configurar**:
1. Hotmart → Webhooks → Editar
2. Marcar eventos: PURCHASE_APPROVED e PURCHASE_COMPLETE
3. Salvar

### 4. HOTMART_TOKEN Não Configurado no Vercel

**Verificar no Vercel**:
1. Vercel Dashboard → Settings → Environment Variables
2. Procurar por: `HOTMART_TOKEN`
3. Valor esperado: `gtnL72D16QPeck2Uky8d92uzq6GHtH6f40dc99-fece-4673-97c2-67aef62e4074`

**Se não existe**:
1. Add New
2. Name: `HOTMART_TOKEN`
3. Value: `gtnL72D16QPeck2Uky8d92uzq6GHtH6f40dc99-fece-4673-97c2-67aef62e4074`
4. Environments: Production, Preview, Development
5. Save
6. Redeploy

---

## 🛠️ Como Configurar Webhook Corretamente

### Passo 1: Acessar Configuração de Webhooks

1. Login na Hotmart
2. Selecionar produto: "CíliosClick - Extensão de Cílios Profissional"
3. Menu: **Ferramentas** → **Webhooks**

### Passo 2: Criar/Editar Webhook

**Configurações**:
```
URL: https://clik-cilios2-0.vercel.app/api/hotmart-webhook
Método: POST
Versão: 2 (ou mais recente)
Status: Ativo ✅
```

**Eventos para marcar**:
- ✅ PURCHASE_APPROVED (Compra Aprovada)
- ✅ PURCHASE_COMPLETE (Compra Completa)
- ✅ PURCHASE_REFUNDED (Compra Reembolsada) - opcional

**Token de Segurança (hottok)**:
```
gtnL72D16QPeck2Uky8d92uzq6GHtH6f40dc99-fece-4673-97c2-67aef62e4074
```

### Passo 3: Testar Webhook

**Opção A - Teste na Hotmart**:
1. Na tela de webhook, clicar em "Testar"
2. Verificar se retorna status 200 OK

**Opção B - Compra de Teste**:
1. Fazer uma compra de teste no produto
2. Verificar se recebe email com credenciais
3. Verificar logs no Vercel

---

## 🔬 Como Verificar se Webhook Está Funcionando

### 1. Verificar Logs do Vercel

1. Acesse: https://vercel.com/dashboard
2. Projeto: clik-cilios2-0
3. Aba: **Deployments** → [último deploy] → **Logs**
4. Procurar por mensagens de webhook:
   ```
   📨 Webhook Hotmart recebido
   ✅ Token hottok validado
   ✅ Processando compra aprovada
   ✅ Usuário criado
   ✅ Email enviado
   ```

**Se não aparecer nada**:
- Webhook não está sendo disparado pela Hotmart

**Se aparecer erro 401**:
- `HOTMART_TOKEN` não configurado ou inválido

**Se aparecer erro 500**:
- Problema no código (já corrigido na última atualização)

### 2. Verificar no Supabase

1. Acesse: https://supabase.com/dashboard
2. Projeto: gguxeqpayaangiplggme
3. Menu: **Authentication** → **Users**
4. Procurar por email da cliente: `morgancris67@gmail.com`

**Se usuário existe**:
- Webhook funcionou, problema é no envio de email

**Se usuário NÃO existe**:
- Webhook não disparou ou falhou antes de criar usuário

---

## 🚑 Soluções Imediatas para a Cliente

### Solução 1: Reenviar Credenciais (se usuário já existe)

```bash
node reenviar-credenciais.cjs morgancris67@gmail.com
```

### Solução 2: Criar Usuário Manualmente (se não existe)

**Via Supabase Dashboard**:

1. **Criar Auth User**:
   - Supabase → Authentication → Users → Add User
   - Email: `morgancris67@gmail.com`
   - Password: `Abc123!@#` (gerar senha forte)
   - ✅ Auto Confirm User
   - Create User

2. **Criar Perfil**:
   - Supabase → Table Editor → users → Insert Row
   - id: (copiar UUID do Auth User acima)
   - email: `morgancris67@gmail.com`
   - nome: `Cristina` (ou nome completo)
   - is_admin: `false`
   - onboarding_completed: `false`
   - Save

3. **Enviar Credenciais Manualmente**:
   ```
   Olá, Cristina! 🎉

   Sua compra foi aprovada! Aqui estão suas credenciais:

   📧 Email: morgancris67@gmail.com
   🔑 Senha: Abc123!@#
   🔗 Link: https://clik-cilios2-0.vercel.app/login

   💡 Recomendamos trocar sua senha após o primeiro acesso.

   Bem-vinda ao CíliosClick! 💜
   ```

---

## 📋 Checklist de Diagnóstico

### Verificações na Hotmart:
- [ ] Produto está como "Curso" ou "Software"?
- [ ] Webhook existe e está ativo?
- [ ] URL do webhook está correta?
- [ ] Eventos PURCHASE_APPROVED e PURCHASE_COMPLETE marcados?
- [ ] Token hottok configurado?

### Verificações no Vercel:
- [ ] Deploy mais recente está online?
- [ ] Variável `HOTMART_TOKEN` configurada?
- [ ] Variável `SENDGRID_API_KEY` configurada?
- [ ] Logs mostram requisições ao webhook?

### Verificações no Supabase:
- [ ] Usuário `morgancris67@gmail.com` existe?
- [ ] Status do usuário é "Confirmed"?

### Verificações de Email:
- [ ] SendGrid sender email verificado?
- [ ] Script de reenvio funciona localmente?

---

## 🎯 Recomendação Final

**Melhor solução (ordem de prioridade)**:

1. **Verificar categoria do produto na Hotmart**
   - Se for "Curso" → Mudar para "Software/Plugin" OU criar novo produto

2. **Adicionar HOTMART_TOKEN no Vercel** (se ainda não fez)
   - Essencial para webhook funcionar

3. **Reconfigurar webhook na Hotmart**
   - Garantir URL, eventos e token corretos

4. **Fazer compra de teste**
   - Validar que está funcionando

5. **Resolver caso da cliente atual**
   - Criar usuário manualmente + enviar credenciais

---

**Atualizado em**: 07/10/2025 19:25
**Status**: Aguardando verificação da categoria do produto
