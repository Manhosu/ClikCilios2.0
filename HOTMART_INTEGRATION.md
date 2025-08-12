# 🔗 Integração Hotmart - CíliosClick 2.0

Este documento descreve como configurar e usar a integração completa entre Hotmart e o sistema CíliosClick.

## 📋 Visão Geral

A integração permite:
- ✅ Processamento automático de webhooks da Hotmart
- ✅ Alocação automática de usuários pré-criados
- ✅ Envio de credenciais por email
- ✅ Controle de concorrência e idempotência
- ✅ Liberação automática em cancelamentos/reembolsos
- ✅ Painel administrativo completo

## 🚀 Configuração Inicial

### 1. Configurar Banco de Dados

```bash
# Execute o script de migração
node aplicar-migracoes-hotmart.cjs
```

Ou aplique manualmente via Supabase Dashboard:
```sql
-- Copie e execute o conteúdo de:
-- migrations/create_hotmart_integration_complete.sql
```

### 2. Configurar Variáveis de Ambiente

```bash
# Copie o arquivo de exemplo
cp .env.hotmart.example .env.local

# Edite e preencha as credenciais
nano .env.local
```

**Variáveis obrigatórias:**
```env
VITE_HOTMART_ENABLED=true
VITE_HOTMART_CLIENT_ID=seu_client_id
VITE_HOTMART_CLIENT_SECRET=seu_client_secret
VITE_HOTMART_BASIC_TOKEN=seu_basic_token
VITE_HOTMART_WEBHOOK_TOKEN=seu_webhook_token
```

### 3. Configurar Webhook na Hotmart

1. Acesse o painel de desenvolvedor da Hotmart
2. Configure o webhook para:
   - **URL:** `https://seudominio.com/api/webhook-hotmart`
   - **Eventos:** `PURCHASE_APPROVED`, `PURCHASE_CANCELLED`, `PURCHASE_REFUNDED`
   - **Token:** Use o mesmo valor de `VITE_HOTMART_WEBHOOK_TOKEN`

### 4. Criar Usuários Pré-criados

1. Acesse `/admin/hotmart` no sistema
2. Vá para a aba "Criar Usuários"
3. Configure quantidade e prefixo
4. Clique em "Criar usuários"

## 📊 Painel Administrativo

Acesse `/admin/hotmart` para:

### Visão Geral
- 📈 Estatísticas em tempo real
- ⚠️ Alertas de poucos usuários disponíveis
- 📊 Métricas de webhooks processados

### Usuários Pré-criados
- 👥 Lista completa de usuários
- 🟢 Status: Disponível/Ocupado/Suspenso
- 📅 Datas de criação e atualização

### Atribuições
- 📋 Histórico de alocações
- 👤 Dados dos compradores
- 🔄 Eventos processados

### Criar Usuários
- ➕ Criação em lote
- 🎯 Prefixo personalizável
- 👀 Preview dos usuários

## 🔄 Fluxo de Funcionamento

### Compra Aprovada
1. Hotmart envia webhook `PURCHASE_APPROVED`
2. Sistema valida assinatura HMAC-SHA256
3. Verifica idempotência (mesmo `notification_id`)
4. Aloca usuário disponível (com lock de concorrência)
5. Gera senha única e segura
6. Salva hash da senha no banco
7. Envia email com credenciais
8. Marca webhook como processado

### Cancelamento/Reembolso
1. Hotmart envia webhook `PURCHASE_CANCELLED`/`PURCHASE_REFUNDED`
2. Sistema localiza atribuição
3. Libera usuário (status volta para "available")
4. Registra evento no histórico

## 🛡️ Segurança

### Validação de Webhooks
- ✅ Assinatura HMAC-SHA256
- ✅ Verificação de timestamp
- ✅ Validação de estrutura de dados

### Controle de Concorrência
- 🔒 Lock de transação no banco
- ⚡ Função `allocate_available_user()` atômica
- 🔄 Retry automático em caso de conflito

### Idempotência
- 🆔 Chave única: `hotmart_notification_id`
- 🚫 Mesmo webhook nunca processa duas vezes
- 📝 Log completo de eventos

### Senhas
- 🔐 Geração criptograficamente segura
- 🧂 Hash com bcrypt (salt automático)
- ❌ Senha pura nunca armazenada

## 📧 Configuração de Email

### SMTP (Recomendado)
```env
VITE_SMTP_HOST=smtp.gmail.com
VITE_SMTP_PORT=587
VITE_SMTP_USER=seu_email@gmail.com
VITE_SMTP_PASS=sua_senha_app
VITE_SMTP_FROM=noreply@ciliosclick.com
```

### Fallback (Desenvolvimento)
Se SMTP não configurado, emails são logados no console.

## 🧪 Testes

### Testar Webhook Localmente
```bash
# Use ngrok para expor localhost
ngrok http 5173

# Configure webhook para:
# https://abc123.ngrok.io/api/webhook-hotmart
```

### Simular Compra
```bash
curl -X POST http://localhost:5173/api/webhook-hotmart \
  -H "Content-Type: application/json" \
  -H "X-Hotmart-Hottok: seu_token" \
  -d '{
    "id": "test-123",
    "event": "PURCHASE_APPROVED",
    "data": {
      "buyer": {
        "email": "teste@email.com",
        "name": "Teste Usuario"
      },
      "purchase": {
        "transaction": "TXN123"
      }
    }
  }'
```

## 📈 Monitoramento

### Logs Importantes
- ✅ Webhooks recebidos e processados
- ❌ Erros de validação ou processamento
- 🔄 Alocações e liberações de usuários
- 📧 Envios de email

### Métricas
- 👥 Usuários disponíveis vs ocupados
- 📊 Taxa de sucesso de webhooks
- ⏱️ Tempo de processamento
- 📧 Taxa de entrega de emails

## 🚨 Troubleshooting

### Webhook não está sendo recebido
1. ✅ Verifique URL configurada na Hotmart
2. ✅ Confirme que servidor está acessível
3. ✅ Verifique logs de firewall/proxy

### Erro de assinatura inválida
1. ✅ Confirme `VITE_HOTMART_WEBHOOK_TOKEN`
2. ✅ Verifique se token na Hotmart é o mesmo
3. ✅ Confirme encoding UTF-8

### Usuários não sendo alocados
1. ✅ Verifique se há usuários disponíveis
2. ✅ Confirme migração do banco aplicada
3. ✅ Verifique logs de erro no console

### Emails não sendo enviados
1. ✅ Confirme configuração SMTP
2. ✅ Teste credenciais de email
3. ✅ Verifique logs de erro

## 🔧 Manutenção

### Criar mais usuários
```sql
-- Via SQL (exemplo para 50 usuários)
SELECT create_pre_users_batch(50, 'user');
```

### Liberar usuário manualmente
```sql
-- Em caso de problema
SELECT release_user('transaction_id_aqui');
```

### Verificar estatísticas
```sql
SELECT 
  COUNT(*) FILTER (WHERE status = 'available') as disponivel,
  COUNT(*) FILTER (WHERE status = 'occupied') as ocupado,
  COUNT(*) FILTER (WHERE status = 'suspended') as suspenso
FROM pre_users;
```

## 📞 Suporte

Em caso de problemas:
1. 📋 Verifique logs do sistema
2. 🔍 Consulte este documento
3. 🧪 Teste em ambiente de desenvolvimento
4. 📧 Entre em contato com suporte técnico

---

**⚠️ Importante:** Sempre teste a integração em ambiente de desenvolvimento antes de usar em produção!