# Solução - Emails de Credenciais Não Enviados

## 🔍 Problema Identificado

Clientes que compraram no Hotmart recebem:
- ✅ Email de boas-vindas do Hotmart Club
- ✅ Acesso à área de membros do Hotmart
- ❌ **NÃO recebem** email com credenciais do app CíliosClick

## 🎯 Causa Raiz

O webhook do Hotmart pode estar:
1. Não configurado ou inativo
2. Configurado mas sem as variáveis de ambiente no Vercel
3. Disparando mas falhando no envio do email (SendGrid não configurado)

---

## 📋 Checklist de Diagnóstico

### 1. Verificar Configuração do Vercel

**Acesse**: Vercel Dashboard → Settings → Environment Variables

Variáveis **OBRIGATÓRIAS**:
```bash
✅ VITE_SUPABASE_URL=https://gguxeqpayaangiplggme.supabase.co
✅ SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
✅ HOTMART_TOKEN=test-token-123 (ou o token correto da Hotmart)
```

Variáveis **CRÍTICAS** para envio de email:
```bash
✅ SENDGRID_API_KEY=SG.YDQbAhSlRDmqo40CdpKLJw...
✅ SENDGRID_FROM_EMAIL=carinaprange86@gmail.com
✅ SENDGRID_FROM_NAME=ClikCílios
✅ NEXT_PUBLIC_APP_URL=https://clik-cilios2-0.vercel.app
```

### 2. Testar Configuração com Endpoint de Verificação

Acesse via browser ou Postman:
```
GET https://clik-cilios2-0.vercel.app/api/verificar-config
```

**Resposta esperada (sucesso)**:
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

**Se retornar erro**:
- Verifique a lista de variáveis faltantes em `issues.critical.missing`
- Configure as variáveis no Vercel
- Faça re-deploy

### 3. Verificar Logs do Vercel

**Acesse**: Vercel → Deployments → [último deploy] → Logs

**Procure por**:
- Requisições ao endpoint `/api/hotmart-webhook`
- Mensagens de erro ou avisos
- Status do envio de email

**Logs esperados (sucesso)**:
```
📨 Webhook Hotmart recebido
✅ Token hottok validado com sucesso!
✅ Processando compra aprovada...
✅ Usuário criado: cliente@email.com
✅ Email enviado com sucesso para cliente@email.com
```

**Logs de erro comum**:
```
⚠️ SENDGRID_API_KEY não configurada - email não será enviado
```

### 4. Verificar Configuração na Hotmart

**URL do Webhook**:
```
https://clik-cilios2-0.vercel.app/api/hotmart-webhook
```

**Eventos que devem disparar o webhook**:
- ✅ Compra Aprovada (PURCHASE_APPROVED)
- ✅ Compra Completa (PURCHASE_COMPLETE)

**Token de autenticação (hottok)**:
- Deve ser enviado no header `X-Hotmart-Hottok` ou no body como `hottok`
- Valor deve corresponder à variável `HOTMART_TOKEN` no Vercel

---

## 🛠️ Soluções

### Solução 1: Reenviar Email com Credenciais (IMEDIATO)

Use o script administrativo para reenviar credenciais para clientes específicos:

```bash
# No terminal, execute:
node reenviar-credenciais.cjs email@cliente.com
```

**O que o script faz**:
1. Busca o usuário no banco de dados
2. Gera uma nova senha temporária
3. Atualiza a senha no Supabase Auth
4. Envia email com as credenciais

**Exemplo de uso**:
```bash
node reenviar-credenciais.cjs carinaprange86@gmail.com
```

**Saída esperada**:
```
🔄 Iniciando reenvio de credenciais...

🔍 Buscando usuário: carinaprange86@gmail.com
✅ Usuário encontrado:
   ID: abc123...
   Nome: Carina Prange
   Email: carinaprange86@gmail.com

🔐 Gerando nova senha temporária...
🔄 Atualizando senha no Supabase Auth...
✅ Senha atualizada com sucesso

📧 Enviando email com credenciais...
✅ Email enviado com sucesso para carinaprange86@gmail.com

✅ Processo concluído com sucesso!

📋 Resumo:
   Usuário: Carina Prange
   Email: carinaprange86@gmail.com
   Nova senha: Ab3$xK9pLm2Q
   Email enviado: Sim
```

### Solução 2: Configurar Variáveis de Ambiente (PERMANENTE)

**Passo a passo**:

1. **Acessar Vercel Dashboard**
   - Vá para: https://vercel.com/dashboard
   - Selecione o projeto "clik-cilios2-0"
   - Clique em "Settings"

2. **Ir para Environment Variables**
   - No menu lateral, clique em "Environment Variables"

3. **Adicionar/Verificar Variáveis**

   Clique em "Add New" e adicione cada uma das seguintes:

   **Supabase** (obrigatórias):
   ```
   Name: VITE_SUPABASE_URL
   Value: https://gguxeqpayaangiplggme.supabase.co
   Environment: Production, Preview, Development
   ```

   ```
   Name: SUPABASE_SERVICE_ROLE_KEY
   Value: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdndXhlcXBheWFhbmdpcGxnZ21lIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0OTg0NjA5NiwiZXhwIjoyMDY1NDIyMDk2fQ.782bdkQ0eiNSqF55VzIyv4kMLoKecXCOq85apB1E7MI
   Environment: Production, Preview, Development
   ```

   **SendGrid** (críticas para email):
   ```
   Name: SENDGRID_API_KEY
   Value: [sua-sendgrid-api-key-aqui]
   Environment: Production, Preview, Development
   ```

   ```
   Name: SENDGRID_FROM_EMAIL
   Value: carinaprange86@gmail.com
   Environment: Production, Preview, Development
   ```

   ```
   Name: SENDGRID_FROM_NAME
   Value: ClikCílios
   Environment: Production, Preview, Development
   ```

   **Hotmart** (obrigatória):
   ```
   Name: HOTMART_TOKEN
   Value: test-token-123
   Environment: Production, Preview, Development
   ```
   > ⚠️ **ATENÇÃO**: Substitua por o token correto fornecido pela Hotmart

   **App** (opcional mas recomendada):
   ```
   Name: NEXT_PUBLIC_APP_URL
   Value: https://clik-cilios2-0.vercel.app
   Environment: Production, Preview, Development
   ```

4. **Re-deploy**
   - Após adicionar todas as variáveis, faça um novo deploy
   - Opção 1: Commit + push para GitHub (deploy automático)
   - Opção 2: No Vercel Dashboard → Deployments → Redeploy

5. **Verificar configuração**
   - Após deploy, acesse: `https://clik-cilios2-0.vercel.app/api/verificar-config`
   - Confirme que todas as variáveis estão configuradas

### Solução 3: Configurar Webhook na Hotmart

**Passo a passo**:

1. **Acessar painel Hotmart**
   - Login no Hotmart
   - Vá para o produto "CíliosClick - Extensão de Cílios Profissional"

2. **Configurar Webhook**
   - Menu: Ferramentas → Webhooks
   - URL: `https://clik-cilios2-0.vercel.app/api/hotmart-webhook`
   - Método: POST
   - Eventos: Compra Aprovada, Compra Completa

3. **Token de Autenticação**
   - Campo "hottok" deve ser preenchido com o mesmo valor da variável `HOTMART_TOKEN` no Vercel
   - Exemplo: `test-token-123` (ou o token correto)

4. **Testar Webhook**
   - Use a função de teste da Hotmart
   - Ou faça uma compra de teste
   - Verifique os logs no Vercel

---

## 🧪 Como Testar

### Teste 1: Verificar Configuração

```bash
curl https://clik-cilios2-0.vercel.app/api/verificar-config
```

**Resultado esperado**: Status "OK" e todas as variáveis configuradas

### Teste 2: Simular Webhook Hotmart

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

**Resultado esperado**:
- Status 200
- Mensagem: "Compra processada, usuário criado e email enviado"
- Email recebido em teste@email.com

### Teste 3: Reenviar Credenciais

```bash
node reenviar-credenciais.cjs carinaprange86@gmail.com
```

**Resultado esperado**:
- Usuário encontrado
- Senha atualizada
- Email enviado

---

## 📊 Monitoramento

### Logs do Vercel

**Como acessar**:
1. Vercel Dashboard → Deployments
2. Clique no último deploy
3. Aba "Logs"

**O que procurar**:
- Requisições ao endpoint `/api/hotmart-webhook`
- Status do processamento (sucesso/erro)
- Mensagens sobre envio de email

### Logs do SendGrid

**Como acessar**:
1. Login no SendGrid: https://app.sendgrid.com
2. Menu: Activity → Email Activity

**O que verificar**:
- Emails enviados
- Emails entregues
- Bounces ou rejeições

---

## ⚠️ Troubleshooting

### Problema: Usuário não recebe email

**Possíveis causas**:
1. SendGrid não configurado → Configure variáveis
2. Email na lista de spam → Verificar reputação do domínio
3. SendGrid API key inválida → Gerar nova chave
4. Email do remetente não verificado → Verificar no SendGrid

**Solução rápida**:
```bash
# Reenviar email manualmente
node reenviar-credenciais.cjs email@cliente.com
```

### Problema: Webhook não dispara

**Possíveis causas**:
1. Webhook não configurado na Hotmart
2. URL incorreta
3. Token inválido
4. Evento não selecionado

**Solução**:
- Verificar configuração na Hotmart
- Testar webhook manualmente (curl)
- Verificar logs do Vercel

### Problema: Usuário criado mas email não enviado

**Causa**: SendGrid não configurado ou com erro

**Logs esperados**:
```
✅ Usuário criado: cliente@email.com
⚠️ SENDGRID_API_KEY não configurada - email não será enviado
```

**Solução**:
1. Configurar variáveis do SendGrid no Vercel
2. Re-deploy
3. Usar script de reenvio para clientes afetados

---

## 📞 Suporte

### Para Clientes que Não Receberam Email

**Mensagem padrão**:
```
Olá [Nome]!

Identificamos que o email com suas credenciais pode não ter sido enviado automaticamente.

Já geramos suas credenciais de acesso:

Email: [email@cliente.com]
Senha: [senha-temporaria]

Acesse a plataforma em: https://clik-cilios2-0.vercel.app/login

Por segurança, recomendamos que você altere sua senha após o primeiro acesso.

Qualquer dúvida, estamos à disposição!
```

### Para Administradores

**Script de reenvio em massa**:

Se houver vários clientes afetados, crie um arquivo `emails.txt` com um email por linha:
```
cliente1@email.com
cliente2@email.com
cliente3@email.com
```

Execute o script para cada email:
```bash
cat emails.txt | while read email; do
  echo "Processando: $email"
  node reenviar-credenciais.cjs "$email"
  sleep 2  # Aguardar 2 segundos entre cada email
done
```

---

## ✅ Checklist Final

Após implementar as soluções:

- [ ] Variáveis de ambiente configuradas no Vercel
- [ ] Re-deploy realizado
- [ ] Endpoint de verificação retorna "OK"
- [ ] Webhook configurado na Hotmart
- [ ] Teste de webhook realizado com sucesso
- [ ] Email de teste recebido
- [ ] Script de reenvio testado
- [ ] Credenciais reenviadas para clientes afetados
- [ ] Logs do Vercel verificados
- [ ] Logs do SendGrid verificados
- [ ] Documentação atualizada

---

## 📝 Observações Importantes

1. **Segurança**: Nunca compartilhe API keys ou service role keys publicamente
2. **Senhas**: Sempre gere senhas temporárias seguras (12+ caracteres)
3. **Logs**: Monitore os logs regularmente para identificar problemas
4. **Testes**: Sempre teste em ambiente de desenvolvimento antes de deploy
5. **Backup**: Mantenha backup das configurações e variáveis de ambiente

---

**Última atualização**: 07/10/2025
**Versão**: 1.0
**Responsável**: Sistema de Webhook Hotmart + SendGrid
