# 📧 Guia de Implementação - Sistema de Email

## Visão Geral

Este guia explica como implementar e configurar o sistema de envio de emails para credenciais de acesso após compras no Hotmart.

## 🎯 Funcionalidades Implementadas

### 1. Templates de Email
- ✅ **Template de Credenciais**: Email com login e senha após compra
- ✅ **Template de Boas-vindas**: Email de boas-vindas personalizado
- ✅ **Template de Parceira**: Notificação para parceiras sobre vendas

### 2. Serviço de Email
- ✅ **EmailService**: Classe para envio via SendGrid
- ✅ **Integração com Webhook**: Envio automático após compra
- ✅ **Tratamento de Erros**: Logs detalhados e fallbacks

### 3. API de Email
- ✅ **Endpoint `/api/send-email`**: Para envio manual de emails
- ✅ **Suporte a todos os tipos**: Credenciais, boas-vindas, parceiras
- ✅ **Validações de entrada**: Verificação de dados obrigatórios
- ✅ **Respostas estruturadas**: JSON com status e mensagens

### 4. Webhook Hotmart
- ✅ **Processamento de Compras**: Detecção automática de vendas
- ✅ **Geração de Credenciais**: Senhas seguras automáticas
- ✅ **Envio de Email**: Integração completa com EmailService

### 5. Scripts de Teste
- ✅ **Teste do serviço**: Validação direta do EmailService
- ✅ **Teste da API**: Validação do endpoint de email
- ✅ **Validação de configurações**: Verificação de variáveis de ambiente

## 🔧 Configuração

### 1. Configurar SendGrid

1. **Criar conta no SendGrid**:
   - Acesse: https://sendgrid.com/
   - Crie uma conta gratuita (até 100 emails/dia)

2. **Obter API Key**:
   ```bash
   # No painel do SendGrid:
   # Settings > API Keys > Create API Key
   # Escolha "Full Access" ou "Restricted Access" com permissões de envio
   ```

3. **Verificar domínio de email**:
   ```bash
   # No painel do SendGrid:
   # Settings > Sender Authentication
   # Verifique o domínio ou email que será usado como remetente
   ```

### 2. Configurar Variáveis de Ambiente

**Arquivo `.env.local` (desenvolvimento)**:
```env
# Configurações de Email (SendGrid)
SENDGRID_API_KEY=SG.xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
SENDGRID_FROM_EMAIL=noreply@ciliosclick.com
SENDGRID_FROM_NAME=CíliosClick

# URL da aplicação
NEXT_PUBLIC_APP_URL=https://ciliosclick.com
```

**Vercel (produção)**:
```bash
# No painel do Vercel:
# Settings > Environment Variables

SENDGRID_API_KEY=SG.xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
SENDGRID_FROM_EMAIL=noreply@ciliosclick.com
SENDGRID_FROM_NAME=CíliosClick
NEXT_PUBLIC_APP_URL=https://ciliosclick.com
```

### 3. Testar Configuração

```bash
# Executar teste de email
node testar-envio-email.cjs
```

## 📁 Arquivos Criados/Modificados

### Novos Arquivos:
- `src/services/emailService.ts` - Serviço principal de email
- `api/send-email.ts` - Endpoint de API para envio de emails
- `testar-envio-email.cjs` - Script de teste do serviço
- `testar-api-email.cjs` - Script de teste da API
- `GUIA_IMPLEMENTACAO_EMAIL.md` - Este guia

### Arquivos Modificados:
- `src/services/emailTemplates.ts` - Adicionado template de credenciais
- `api/hotmart/webhook.ts` - Integração com EmailService
- `.env.example` - Adicionadas variáveis de email

## 🔄 Fluxo de Funcionamento

### 1. Compra Aprovada no Hotmart
```
1. Webhook recebe notificação de compra
2. Sistema gera senha segura aleatória
3. Usuário é criado/atribuído no banco
4. Email com credenciais é enviado automaticamente
5. Logs são registrados para auditoria
```

### 2. Estrutura do Email de Credenciais
```
📧 Assunto: 🔐 Suas credenciais de acesso - CíliosClick

📋 Conteúdo:
- Saudação personalizada
- Dados de acesso (email + senha)
- Link direto para login
- Instruções de primeiros passos
- Recomendação de segurança
- Informações de suporte
```

## 🧪 Testes

### 1. Teste do Serviço de Email
```bash
# Executar o script de teste do serviço
node testar-envio-email.cjs
```

### 2. Teste da API de Email
```bash
# Executar o script de teste da API
node testar-api-email.cjs
```

### 3. Teste Manual via API
```bash
# Enviar email de credenciais
curl -X POST https://ciliosclick.com/api/send-email \
  -H "Content-Type: application/json" \
  -d '{
    "type": "credentials",
    "data": {
      "email": "teste@exemplo.com",
      "userName": "João Silva",
      "password": "TempPass123!",
      "loginUrl": "https://ciliosclick.com/login"
    }
  }'
```

### 4. Teste via Webhook
```bash
# Simular compra no Hotmart (ambiente de teste)
# Verificar logs do webhook
# Confirmar recebimento do email
```

### 3. Verificações
- ✅ Email chegou na caixa de entrada
- ✅ Template está formatado corretamente
- ✅ Credenciais estão corretas
- ✅ Link de login funciona
- ✅ Logs estão sendo registrados

## 🚨 Troubleshooting

### Problemas Comuns

**1. Email não enviado**
```bash
# Verificar:
- API key do SendGrid está correta
- Email remetente está verificado
- Não atingiu limite de envios
- Conexão com internet está funcionando
```

**2. Email vai para spam**
```bash
# Soluções:
- Verificar domínio no SendGrid
- Configurar SPF/DKIM
- Usar domínio próprio verificado
- Evitar palavras que ativam filtros de spam
```

**3. Template quebrado**
```bash
# Verificar:
- Caracteres especiais estão escapados
- HTML está bem formado
- CSS inline está correto
- Teste em diferentes clientes de email
```

### Logs de Debug
```bash
# Verificar logs do webhook
console.log no terminal do Vercel

# Verificar logs do SendGrid
Painel SendGrid > Activity
```

## 📊 Monitoramento

### Métricas Importantes
- Taxa de entrega de emails
- Taxa de abertura
- Emails que vão para spam
- Erros de envio
- Tempo de processamento

### Ferramentas
- **SendGrid Analytics**: Estatísticas detalhadas
- **Vercel Logs**: Logs de execução
- **Supabase Logs**: Logs do banco de dados

## 🔒 Segurança

### Boas Práticas
- ✅ API keys em variáveis de ambiente
- ✅ Senhas geradas aleatoriamente
- ✅ Logs não expõem senhas
- ✅ HTTPS obrigatório
- ✅ Validação de entrada

### Recomendações
- Rotacionar API keys periodicamente
- Monitorar tentativas de envio suspeitas
- Implementar rate limiting se necessário
- Backup das configurações

## 🚀 Deploy

### Checklist de Produção
- [ ] SendGrid configurado e verificado
- [ ] Variáveis de ambiente configuradas no Vercel
- [ ] Domínio de email verificado
- [ ] Teste de envio realizado
- [ ] Webhook do Hotmart configurado
- [ ] Monitoramento ativo

### Comandos de Deploy
```bash
# Deploy no Vercel
vercel --prod

# Verificar variáveis
vercel env ls

# Testar webhook
curl -X POST https://seu-dominio.vercel.app/api/hotmart/webhook
```

## 📞 Suporte

### Documentação
- [SendGrid Docs](https://docs.sendgrid.com/)
- [Hotmart Webhook](https://developers.hotmart.com/docs/pt-BR/v1/webhooks/)
- [Vercel Environment Variables](https://vercel.com/docs/concepts/projects/environment-variables)

### Contato
- Email técnico: dev@ciliosclick.com
- Suporte Hotmart: suporte@hotmart.com
- Suporte SendGrid: support@sendgrid.com

---

**Status**: ✅ Implementação completa e pronta para produção
**Última atualização**: $(date)