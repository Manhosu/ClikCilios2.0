# 🚨 Ação Imediata - Cliente Não Recebeu Email

## O que fazer AGORA para a cliente receber as credenciais

### Opção 1: Reenviar Email Automaticamente (RECOMENDADO)

No terminal, execute:

```bash
node reenviar-credenciais.cjs carinaprange86@gmail.com
```

**Isso vai**:
1. ✅ Buscar o usuário no banco
2. ✅ Gerar nova senha temporária
3. ✅ Atualizar no Supabase
4. ✅ Enviar email com credenciais

**Se funcionar**, a cliente receberá um email como este:
```
De: ClikCílios <carinaprange86@gmail.com>
Assunto: 🎉 Suas credenciais de acesso - CíliosClick

Olá, Cristina!

Suas credenciais de acesso:
Email: carinaprange86@gmail.com
Senha: Ab3$xK9pLm2Q

[Botão: Acessar Plataforma]
```

---

### Opção 2: Criar Credenciais Manualmente

Se o script não funcionar (por falta de SendGrid configurado), você verá:

```
⚠️ Senha atualizada mas email não foi enviado
   Configure SENDGRID_API_KEY para enviar emails

📋 Credenciais atualizadas:
   Email: carinaprange86@gmail.com
   Senha: Ab3$xK9pLm2Q
```

**Neste caso**:
1. ✅ Copie o email e senha exibidos
2. ✅ Envie manualmente para a cliente via WhatsApp/Email

**Modelo de mensagem**:
```
Olá, Cristina!

Sua compra foi aprovada! 🎉

Aqui estão suas credenciais de acesso ao CíliosClick:

Email: carinaprange86@gmail.com
Senha: Ab3$xK9pLm2Q

Acesse em: https://clik-cilios2-0.vercel.app/login

Por segurança, recomendo que você altere sua senha após o primeiro acesso.

Qualquer dúvida, estou à disposição!
```

---

## ⚠️ Se o Usuário Não Existir no Banco

Se o script retornar:
```
❌ Usuário não encontrado no banco de dados
   Email buscado: carinaprange86@gmail.com
```

**Significa**: O webhook nunca criou o usuário!

**Solução**: Criar usuário manualmente via Supabase Dashboard

### Passo a Passo - Criar Usuário Manualmente

1. **Acessar Supabase Dashboard**
   - URL: https://supabase.com/dashboard
   - Projeto: clik-cilios2-0

2. **Ir para Authentication**
   - Menu lateral → Authentication → Users

3. **Criar Novo Usuário**
   - Clique em "Add User" → "Create New User"
   - Preencha:
     ```
     Email: carinaprange86@gmail.com (ou email da cliente)
     Password: [gerar senha forte: Ab3$xK9pLm2Q]
     ✅ Auto Confirm User (marcar)
     ```
   - Clique em "Create User"

4. **Criar Perfil na Tabela Users**
   - Menu lateral → Table Editor → users
   - Clique em "Insert" → "Insert row"
   - Preencha:
     ```
     id: [copie o UUID do usuário criado no Auth]
     email: carinaprange86@gmail.com
     nome: Cristina (ou nome da cliente)
     is_admin: false
     onboarding_completed: false
     ```
   - Clique em "Save"

5. **Enviar Credenciais**
   - Copie o email e senha
   - Envie para a cliente (WhatsApp, Email, etc.)

---

## 🔍 Verificar se o Problema Foi Resolvido

### Teste 1: Cliente Consegue Fazer Login?

Peça para a cliente tentar fazer login em:
```
https://clik-cilios2-0.vercel.app/login
```

Com as credenciais enviadas.

**Se funcionar**: ✅ Problema resolvido!

**Se não funcionar**: Verifique os logs do browser (F12 → Console)

### Teste 2: Verificar no Supabase

1. Acesse Supabase Dashboard → Authentication → Users
2. Procure pelo email da cliente
3. Verifique se o status é "Confirmed"

---

## 📞 O Que Falar Para a Cliente

### Se tudo funcionou:

```
Olá, Cristina!

Sua compra foi aprovada! 🎉

Já liberamos seu acesso ao CíliosClick. Você receberá um email com suas
credenciais em instantes.

Se não receber em até 5 minutos, verifique a caixa de spam ou me avise
que envio diretamente por aqui.

Bem-vinda! 💜
```

### Se precisou enviar manualmente:

```
Olá, Cristina!

Sua compra foi aprovada! 🎉

Aqui estão suas credenciais de acesso ao CíliosClick:

📧 Email: carinaprange86@gmail.com
🔑 Senha: Ab3$xK9pLm2Q

🔗 Link: https://clik-cilios2-0.vercel.app/login

💡 Dica: Troque sua senha após o primeiro acesso para algo que você
lembre facilmente.

Qualquer dúvida, estou à disposição!

Bem-vinda! 💜
```

### Se houve algum problema:

```
Olá, Cristina!

Sua compra foi aprovada! 🎉

Estou liberando seu acesso agora manualmente. Em instantes você receberá
suas credenciais.

Obrigada pela compreensão! 💜
```

---

## 🛠️ Próximos Passos (Após Resolver o Problema Imediato)

Para evitar que isso aconteça de novo:

1. **Verificar Configuração do Vercel**
   ```bash
   # Acesse via browser:
   https://clik-cilios2-0.vercel.app/api/verificar-config
   ```

   Se retornar erros, configure as variáveis faltantes

2. **Verificar Logs do Webhook**
   - Vercel Dashboard → Deployments → Logs
   - Procure por erros relacionados ao webhook

3. **Testar Webhook**
   ```bash
   curl -X POST https://clik-cilios2-0.vercel.app/api/hotmart-webhook \
     -H "Content-Type: application/json" \
     -H "X-Hotmart-Hottok: test-token-123" \
     -d '{"event":"PURCHASE_APPROVED","data":{"buyer":{"email":"teste@email.com","name":"Teste"}}}'
   ```

4. **Consultar Documentação Completa**
   - Leia: `SOLUCAO_EMAIL_CREDENCIAIS.md`

---

## 📝 Resumo dos Comandos

```bash
# Reenviar email
node reenviar-credenciais.cjs email@cliente.com

# Verificar configuração
curl https://clik-cilios2-0.vercel.app/api/verificar-config

# Testar webhook
curl -X POST https://clik-cilios2-0.vercel.app/api/hotmart-webhook \
  -H "Content-Type: application/json" \
  -H "X-Hotmart-Hottok: test-token-123" \
  -d '{"event":"PURCHASE_APPROVED","data":{"buyer":{"email":"teste@email.com","name":"Teste"}}}'
```

---

**Última atualização**: 07/10/2025
**Prioridade**: 🚨 ALTA - Resolver imediatamente
