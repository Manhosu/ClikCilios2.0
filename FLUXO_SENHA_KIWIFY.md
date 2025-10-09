# 🔐 Fluxo de Senha - Kiwify Integration

## 📋 Visão Geral

O sistema CíliosClick utiliza um fluxo simplificado de autenticação onde:
- **Kiwify** gerencia emails de compra
- **Sistema** cria usuários silenciosamente
- **Usuário** define sua própria senha via "Esqueci minha senha"

---

## 🔄 Fluxo Completo

### 1️⃣ Cliente Realiza a Compra no Kiwify

```
Cliente preenche dados → Kiwify processa pagamento → Email de confirmação (Kiwify)
```

**Responsável pelos emails**: Kiwify (não o sistema)

---

### 2️⃣ Webhook Kiwify Cria Usuário

**Endpoint**: `https://www.ciliosclick.com.br/api/kiwify-webhook`

**Token de validação**: `esra6so5axp`

**O que o webhook faz**:
1. Recebe notificação de compra aprovada do Kiwify
2. Extrai email e nome do cliente
3. Cria usuário no Supabase Auth com senha temporária (gerada automaticamente)
4. Cria perfil na tabela `users`
5. **NÃO envia email** (usuário define própria senha)

**Código relevante** (api/kiwify-webhook.ts):
```typescript
// EMAIL REMOVIDO: Usuário deve usar "Esqueci minha senha" para definir sua própria senha
// await enviarEmailCredenciais(email, nome, novaSenha)

console.log('✅ Usuário criado! Use "Esqueci minha senha" para definir sua senha.')

return {
  success: true,
  message: 'Usuário criado com sucesso (use Esqueci minha senha para definir senha)',
  userId: authUser.user.id,
  senha: senha // Apenas para logs
}
```

---

### 3️⃣ Cliente Acessa o Site

**URL**: `https://www.ciliosclick.com.br/login`

Cliente vê:
- Campo de email e senha
- Link **"🔑 Esqueci minha senha"**
- Mensagem informativa: _"Primeira vez acessando? Use 'Esqueci minha senha' para configurar"_

---

### 4️⃣ Cliente Clica em "Esqueci minha senha"

**Rota**: `/forgot-password`

**Componente**: `ForgotPasswordPage.tsx`

**Processo**:
1. Cliente digita o **email usado na compra**
2. Sistema verifica se email existe na tabela `users`:
   ```typescript
   const { data: users, error: checkError } = await supabase
     .from('users')
     .select('email')
     .eq('email', email)
     .single()
   ```
3. Se não existir: **"Email não encontrado. Verifique se você já realizou a compra do acesso."**
4. Se existir: Supabase Auth envia email de recuperação:
   ```typescript
   await supabase.auth.resetPasswordForEmail(email, {
     redirectTo: `${window.location.origin}/reset-password`
   })
   ```

**Importante**: O email é enviado pelo **Supabase Auth**, não pelo sistema!

---

### 5️⃣ Cliente Recebe Email do Supabase

**Remetente**: Supabase (configurado no painel do Supabase)

**Conteúdo**: Link para redefinir senha (válido por 1 hora)

**Formato do link**:
```
https://www.ciliosclick.com.br/reset-password#access_token=xxx&type=recovery
```

---

### 6️⃣ Cliente Define Nova Senha

**Rota**: `/reset-password`

**Componente**: `ResetPasswordPage.tsx`

**Processo**:
1. Página detecta token de recuperação na URL (hash)
2. Cliente digita nova senha (mínimo 6 caracteres)
3. Cliente confirma senha
4. Sistema atualiza senha via Supabase Auth:
   ```typescript
   await supabase.auth.updateUser({
     password: password
   })
   ```
5. Sucesso: Redireciona para `/login` após 3 segundos

---

### 7️⃣ Cliente Faz Login

Cliente usa:
- **Email**: Mesmo da compra
- **Senha**: Definida no passo anterior

Sistema valida via Supabase Auth e redireciona para `/dashboard`

---

## 🎯 Pontos Importantes

### ✅ O que o sistema FAZ:
- Cria usuários automaticamente via webhook Kiwify
- Valida se email existe antes de permitir recuperação
- Permite definição de senha via Supabase Auth
- Gerencia autenticação e sessões

### ❌ O que o sistema NÃO FAZ:
- NÃO envia emails de credenciais (webhook silencioso)
- NÃO envia emails de recuperação (Supabase Auth faz isso)
- NÃO envia confirmações de compra (Kiwify faz isso)

### 🔐 Segurança:
- Senhas nunca enviadas por email do sistema
- Token de recuperação expira em 1 hora
- Validação dupla: email existe + Supabase Auth
- HTTPS obrigatório em produção

---

## 📧 Configuração de Emails no Supabase

**IMPORTANTE**: Configure os templates de email no painel do Supabase!

1. Acesse: Supabase Dashboard → Authentication → Email Templates
2. Edite o template "Reset Password"
3. Configure:
   - **Subject**: "Defina sua senha de acesso - CíliosClick"
   - **Body**: Template personalizado (pode incluir logo e cores da marca)
   - **Redirect URL**: `https://www.ciliosclick.com.br/reset-password`

---

## 🚀 Deployment

### Variáveis de Ambiente (Vercel):

```bash
# Supabase
VITE_SUPABASE_URL=https://gguxeqpayaangiplggme.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# Kiwify
KIWIFY_WEBHOOK_SECRET=esra6so5axp

# App URL
NEXT_PUBLIC_APP_URL=https://www.ciliosclick.com.br

# SendGrid (opcional - não usado mais para credenciais)
SENDGRID_API_KEY=SG.xxx
SENDGRID_FROM_EMAIL=carinaprange86@gmail.com
SENDGRID_FROM_NAME=ClikCílios
```

### Configuração do Webhook no Kiwify:

1. Acesse: Kiwify Dashboard → Produto → Webhooks
2. Adicione webhook:
   - **URL**: `https://www.ciliosclick.com.br/api/kiwify-webhook`
   - **Token**: `esra6so5axp`
   - **Eventos**: `compra_aprovada`, `order.paid`, `order.complete`

---

## 🧪 Testando o Fluxo

### Teste Completo:

1. **Simular compra**:
   ```bash
   node test-kiwify-webhook.cjs teste@email.com "Nome Teste"
   ```

2. **Verificar criação de usuário**:
   - Acessar Supabase Dashboard → Authentication → Users
   - Confirmar que usuário foi criado
   - Verificar que NÃO recebeu email de credenciais

3. **Testar recuperação de senha**:
   - Acessar `https://www.ciliosclick.com.br/login`
   - Clicar em "Esqueci minha senha"
   - Digitar email do teste
   - Verificar recebimento de email do Supabase
   - Clicar no link
   - Definir nova senha
   - Fazer login

---

## 📝 Arquivos Modificados

### Webhooks (sem envio de email):
- `api/kiwify-webhook.ts`
- `pages/api/kiwify-webhook.ts`

### Páginas de Senha:
- `src/pages/LoginPage.tsx` - Adicionado link "Esqueci minha senha"
- `src/pages/ForgotPasswordPage.tsx` - Nova página (validação + Supabase Auth)
- `src/pages/ResetPasswordPage.tsx` - Nova página (definir senha)

### Rotas:
- `src/App.tsx` - Adicionadas rotas `/forgot-password` e `/reset-password`

---

## 💡 Benefícios do Novo Fluxo

1. **Segurança**: Usuário define própria senha (não enviada por email)
2. **Simplicidade**: Menos emails = menos confusão
3. **Controle**: Kiwify gerencia compras, sistema gerencia acesso
4. **UX**: Fluxo claro e intuitivo para clientes
5. **Manutenção**: Menos dependências (SendGrid opcional)

---

## 🆘 Troubleshooting

### Cliente não recebe email de recuperação:
1. Verificar configuração de email no Supabase Dashboard
2. Verificar pasta de SPAM
3. Confirmar que email existe na tabela `users`

### Webhook não cria usuário:
1. Verificar logs do Vercel (Functions)
2. Confirmar token: `esra6so5axp`
3. Testar endpoint manualmente com `test-kiwify-webhook.cjs`

### Link de recuperação inválido:
1. Token expira em 1 hora (solicitar novo)
2. Verificar `redirectTo` no Supabase Auth
3. Confirmar URL está correta: `https://www.ciliosclick.com.br/reset-password`

---

**Data**: Janeiro 2025
**Versão**: 2.0 (Kiwify Integration)
**Status**: ✅ Implementado e Testado
