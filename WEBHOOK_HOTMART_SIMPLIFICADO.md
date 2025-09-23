# Webhook Hotmart Simplificado

## Resumo das Mudanças

O webhook da Hotmart foi **completamente simplificado** para usar validação por token ao invés da complexa validação HMAC por headers.

### ✅ O que foi REMOVIDO:
- ❌ Validação HMAC baseada no header `x-hotmart-signature`
- ❌ Import do módulo `crypto` para HMAC
- ❌ Função `validarAssinatura()` complexa
- ❌ Variáveis de ambiente `HOTMART_WEBHOOK_SECRET` e `VITE_HOTMART_WEBHOOK_SECRET`

### ✅ O que foi ADICIONADO:
- ✅ Validação simples baseada no campo `hottok` no payload JSON
- ✅ Nova variável de ambiente `HOTMART_TOKEN`
- ✅ Logs detalhados da validação de token
- ✅ Interface atualizada `HotmartWebhookPayload` incluindo campo `hottok`

## Nova Lógica de Validação

### 1. Estrutura do Payload Esperado
```json
{
  "hottok": "gtnL72D16QPeck2Uky8d92uzq6GHtH6f40dc99-fece-4673-97c2-67aef62e4074",
  "id": "webhook-id",
  "event": "approved",
  "data": {
    "purchase": {
      "order_id": "HP123456789",
      "buyer": {
        "name": "Cliente Nome",
        "email": "cliente@email.com"
      },
      ...
    }
  }
}
```

### 2. Fluxo de Validação
1. **Verificar presença do campo `hottok`**
   - Se ausente: retorna `401` com `{"error": "Token inválido"}`

2. **Comparar com variável de ambiente `HOTMART_TOKEN`**
   - Se não configurada: aceita qualquer token (desenvolvimento)
   - Se diferente: retorna `401` com `{"error": "Token inválido"}`

3. **Continuar processamento normal**
   - Validar estrutura do payload
   - Processar eventos (approved, canceled, refunded)
   - **SEMPRE retornar 200** em caso de sucesso

## Configuração Necessária

### No Vercel (Produção)
Adicionar a variável de ambiente:
```
HOTMART_TOKEN=gtnL72D16QPeck2Uky8d92uzq6GHtH6f40dc99-fece-4673-97c2-67aef62e4074
```

### Na Hotmart
Configurar o webhook para enviar o campo `hottok` com o valor correspondente no payload JSON.

## Eventos Suportados

| Evento Original | Evento Normalizado | Ação |
|----------------|-------------------|------|
| `approved` | `PURCHASE_APPROVED` | Cria usuário |
| `complete` | `PURCHASE_COMPLETE` | Cria usuário |
| `canceled` | `PURCHASE_CANCELED` | Log apenas |
| `cancelled` | `PURCHASE_CANCELED` | Log apenas |
| `refunded` | `PURCHASE_REFUNDED` | Log apenas |
| `chargeback` | `PURCHASE_CHARGEBACK` | Log apenas |

## Arquivos Modificados

1. **`api/hotmart-webhook.ts`** - Endpoint principal do Vercel
2. **`api/hotmart/webhook.ts`** - Endpoint para dev-server local
3. **`.env.example`** - Documentação da nova variável `HOTMART_TOKEN`

## Teste

Execute o script de teste:
```bash
node test-webhook-hotmart-token.cjs
```

O script testa:
- ✅ Token válido (deve retornar 200)
- ❌ Token inválido (deve retornar 401)
- ❌ Token ausente (deve retornar 401)
- ✅ Eventos de cancelamento (deve retornar 200)

## Resultado Esperado

### ✅ Teste da Hotmart
- Todos os eventos devem retornar **HTTP 200**
- Indicador verde no painel da Hotmart
- Logs detalhados para debug

### ✅ Funcionalidade
- Compras aprovadas criam usuários automaticamente
- Eventos de cancelamento são registrados
- Sistema robusto de logs
- Validação de token simples e eficaz

## Exemplo de Log

```
📨 Webhook recebido da Hotmart
📋 Headers: {...}
📄 Payload preview: {"hottok":"gtnL72D16QPeck2Uky8d92uzq6GHtH6f40dc99-fece-4673-97c2-67aef62e4074",...}
✅ Token hottok validado com sucesso
🔄 Processando evento: approved → PURCHASE_APPROVED
👤 Comprador: cliente@email.com
💳 Order ID: HP123456789
✅ Processando compra aprovada
⏱️ Processamento concluído em 150ms
📤 Resultado: {"success":true,"message":"Compra processada com sucesso",...}
```

## Benefícios da Simplificação

1. **🔧 Mais Simples**: Elimina complexidade de HMAC/crypto
2. **🐛 Menos Erros**: Validação direta sem edge cases
3. **📊 Melhor Debug**: Logs claros e objetivos
4. **⚡ Mais Rápido**: Processamento otimizado
5. **🎯 Mais Confiável**: Sempre retorna 200 para Hotmart