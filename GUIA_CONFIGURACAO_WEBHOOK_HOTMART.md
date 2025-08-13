# Guia Completo: Configuração do Webhook Hotmart

## Pré-requisitos
- Sistema já deployado no Vercel
- Tabela `webhook_events` criada no Supabase
- Conta de produtor no Hotmart

## Passo 1: Obter a URL do Webhook

Sua URL do webhook será:
```
https://SEU_DOMINIO_VERCEL.vercel.app/api/hotmart/webhook
```

**Exemplo:**
```
https://clik-cilios-2-0.vercel.app/api/hotmart/webhook
```

## Passo 2: Acessar o Painel do Hotmart

1. Acesse: https://app.hotmart.com
2. Faça login com sua conta de produtor
3. No menu lateral, vá em **"Ferramentas"** → **"Hotmart Webhooks"**

## Passo 3: Criar um Novo Webhook

1. Clique em **"Criar Webhook"**
2. Preencha os campos:
   - **Nome:** `ClikCilios Webhook`
   - **URL:** Sua URL do Vercel (do Passo 1)
   - **Versão:** Selecione `v1` (mais estável)

## Passo 4: Configurar os Eventos

Selecione os seguintes eventos (marque as caixas):

### ✅ Eventos Obrigatórios:
- **PURCHASE_APPROVED** - Compra aprovada
- **PURCHASE_CANCELED** - Compra cancelada
- **PURCHASE_REFUNDED** - Compra reembolsada
- **PURCHASE_CHARGEBACK** - Chargeback

### ✅ Eventos Recomendados:
- **PURCHASE_COMPLETE** - Compra completa
- **SUBSCRIPTION_CANCELLATION** - Cancelamento de assinatura
- **PURCHASE_DELAYED** - Compra atrasada

## Passo 5: Configurar Segurança

1. **Token de Segurança:** O Hotmart gerará automaticamente
2. **Método HTTP:** Deixe como `POST`
3. **Content-Type:** Deixe como `application/json`

## Passo 6: Salvar e Ativar

1. Clique em **"Salvar"**
2. Após salvar, clique em **"Ativar"** para ativar o webhook
3. **IMPORTANTE:** Anote o **Token de Segurança** gerado

## Passo 7: Configurar Variáveis de Ambiente no Vercel

1. Acesse seu projeto no Vercel: https://vercel.com
2. Vá em **Settings** → **Environment Variables**
3. Adicione as seguintes variáveis:

```
HOTMART_WEBHOOK_TOKEN=seu_token_aqui
HOTMART_WEBHOOK_SECRET=seu_secret_aqui
```

**Onde encontrar esses valores:**
- `HOTMART_WEBHOOK_TOKEN`: No painel do Hotmart, na configuração do webhook
- `HOTMART_WEBHOOK_SECRET`: Também no painel do Hotmart

## Passo 8: Fazer Redeploy no Vercel

Após adicionar as variáveis:
1. Vá na aba **Deployments**
2. Clique nos 3 pontinhos do último deploy
3. Clique em **"Redeploy"**

## Passo 9: Testar o Webhook

### Teste Manual no Hotmart:
1. No painel do Hotmart, vá no webhook criado
2. Clique em **"Testar"**
3. Selecione um evento (ex: `PURCHASE_APPROVED`)
4. Clique em **"Enviar Teste"**

### Verificar se Funcionou:
1. Acesse o Supabase
2. Vá na tabela `webhook_events`
3. Verifique se apareceu um novo registro

## Passo 10: Monitoramento

### No Hotmart:
- Vá em **"Ferramentas"** → **"Hotmart Webhooks"**
- Clique no webhook criado
- Veja a aba **"Logs"** para verificar tentativas de envio

### No Vercel:
- Vá em **Functions** → **View Function Logs**
- Procure por logs da função `/api/hotmart/webhook`

### No Supabase:
- Monitore a tabela `webhook_events`
- Verifique se `processed = true` após processamento

## Troubleshooting

### ❌ Webhook retorna erro 500:
- Verifique se as variáveis de ambiente estão corretas
- Verifique os logs no Vercel
- Confirme se a tabela `webhook_events` existe

### ❌ Webhook não recebe dados:
- Confirme se a URL está correta
- Verifique se o webhook está ativo no Hotmart
- Teste com o botão "Testar" do Hotmart

### ❌ Dados não são processados:
- Verifique os logs da função no Vercel
- Confirme se o token de segurança está correto
- Verifique se o Supabase está acessível

## URLs Importantes

- **Hotmart Webhooks:** https://app.hotmart.com/tools/webhooks
- **Vercel Dashboard:** https://vercel.com/dashboard
- **Supabase Dashboard:** https://app.supabase.com

## Próximos Passos

Após configurar o webhook:
1. Teste com uma compra real (valor baixo)
2. Monitore os logs por alguns dias
3. Configure alertas para falhas
4. Documente qualquer comportamento específico do seu produto

---

**⚠️ IMPORTANTE:** Mantenha o token do webhook seguro e nunca o compartilhe publicamente!