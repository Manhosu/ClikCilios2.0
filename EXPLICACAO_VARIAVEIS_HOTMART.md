# 📋 Explicação das Variáveis de Ambiente Hotmart

## 🤔 Variáveis que Você Não Reconhece

Você mencionou duas variáveis de ambiente do Hotmart que não reconhece:

### 1. `VITE_HOTMART_CLIENT_SECRET`
**O que é:** Client Secret da aplicação Hotmart  
**Para que serve:** Autenticação em chamadas à API da Hotmart  
**Status atual:** ⚠️ **OPCIONAL** - Não está sendo usado no webhook atual  

### 2. `VITE_HOTMART_BASIC_TOKEN`
**O que é:** Token básico de autenticação da Hotmart  
**Para que serve:** Autenticação alternativa para API da Hotmart  
**Status atual:** ⚠️ **OPCIONAL** - Não está sendo usado no webhook atual  

## ✅ Variáveis Realmente Necessárias para o Webhook

Para o webhook funcionar, você só precisa dessas variáveis:

### Essenciais:
```bash
# Supabase
VITE_SUPABASE_URL=sua-url-supabase
VITE_SUPABASE_ANON_KEY=sua-chave-publica-supabase
SUPABASE_SERVICE_ROLE_KEY=sua-chave-service-role

# Hotmart (apenas para webhook)
VITE_HOTMART_WEBHOOK_SECRET=seu-secret-hmac-da-hotmart
# OU (dependendo da configuração)
HOTMART_HOTTOK=seu-token-hotmart
```

### Opcionais (para funcionalidades futuras):
```bash
# SendGrid (para envio de emails)
SENDGRID_API_KEY=sua-chave-sendgrid

# Hotmart API (para integrações futuras)
VITE_HOTMART_CLIENT_ID=seu-client-id
VITE_HOTMART_CLIENT_SECRET=seu-client-secret
VITE_HOTMART_BASIC_TOKEN=seu-basic-token
```

## 🎯 Onde Essas Variáveis São Usadas

### No Código Atual:
- **`VITE_HOTMART_CLIENT_SECRET`** e **`VITE_HOTMART_BASIC_TOKEN`** estão definidas no arquivo `src/config/hotmart.ts`
- Elas fazem parte da função `getHotmartCredentials()` 
- **MAS** não são usadas em nenhuma chamada de API no momento
- São apenas preparação para funcionalidades futuras

### Funcionalidades Futuras (onde seriam usadas):
- Consultar dados de vendas via API Hotmart
- Buscar informações de afiliados
- Integração com relatórios da Hotmart
- Validação de produtos/ofertas

## 🚀 O Que Você Precisa Fazer Agora

### Para Resolver o Erro 500:
1. **Configure apenas as variáveis essenciais no Vercel:**
   ```bash
   VITE_SUPABASE_URL=sua-url-supabase
   VITE_SUPABASE_ANON_KEY=sua-chave-publica
   SUPABASE_SERVICE_ROLE_KEY=sua-chave-service-role
   VITE_HOTMART_WEBHOOK_SECRET=seu-secret-hmac
   ```

2. **Ignore por enquanto:**
   - `VITE_HOTMART_CLIENT_SECRET`
   - `VITE_HOTMART_BASIC_TOKEN`
   - `VITE_HOTMART_CLIENT_ID`

3. **Crie a tabela `webhook_events` no Supabase** (use o script `corrigir-webhook-automatico.cjs`)

4. **Redeploy no Vercel**

## 📝 Resumo

| Variável | Status | Necessária para Webhook? | Onde Conseguir |
|----------|--------|-------------------------|----------------|
| `VITE_HOTMART_WEBHOOK_SECRET` | ✅ Essencial | Sim | Painel Hotmart → Webhooks |
| `VITE_HOTMART_CLIENT_SECRET` | ⚠️ Opcional | Não | Painel Hotmart → API |
| `VITE_HOTMART_BASIC_TOKEN` | ⚠️ Opcional | Não | Painel Hotmart → API |
| `VITE_SUPABASE_URL` | ✅ Essencial | Sim | Painel Supabase |
| `VITE_SUPABASE_ANON_KEY` | ✅ Essencial | Sim | Painel Supabase |
| `SUPABASE_SERVICE_ROLE_KEY` | ✅ Essencial | Sim | Painel Supabase |

## 🔍 Como Identificar se Precisa

**Você SÓ precisa configurar `CLIENT_SECRET` e `BASIC_TOKEN` se:**
- Quiser fazer chamadas para a API da Hotmart (consultar vendas, etc.)
- Implementar funcionalidades de relatórios
- Buscar dados de afiliados via API

**Para o webhook funcionar, essas variáveis NÃO são necessárias.**

---

**Próximo passo:** Configure apenas as variáveis essenciais no Vercel e teste o webhook! 🚀