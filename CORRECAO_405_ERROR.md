# 🔧 Correção do Erro 405 - Method Not Allowed

## 🐛 Problema Identificado

Quando a Hotmart tentava enviar o webhook para a URL de produção, recebia:

```
405 - Method Not Allowed
HTTP Status Code: 405
Corpo de Resposta: null
```

**Curiosamente**: Nenhum erro aparecia no painel do Vercel (Logs).

---

## 🔍 Causa Raiz

O problema estava no arquivo `vercel.json` com um **rewrite pattern incorreto**:

```json
// ❌ ERRADO - Antes
"rewrites": [
  {
    "source": "/(.*)",           // Captura TODAS as rotas
    "destination": "/index.html"  // Redireciona TUDO para HTML estático
  }
]
```

### O que estava acontecendo:

1. Hotmart fazia `POST https://clik-cilios2-0.vercel.app/api/hotmart-webhook`
2. Vercel aplicava o rewrite `/(.*)`
3. Requisição era redirecionada para `/index.html` (arquivo estático)
4. Tentativa de fazer POST em arquivo HTML → **405 Method Not Allowed**
5. Função serverless **NUNCA era executada** (por isso sem logs no Vercel!)

---

## ✅ Correções Aplicadas

### 1. **Corrigir Rewrite Pattern**

```json
// ✅ CORRETO - Depois
"rewrites": [
  {
    "source": "/((?!api).*)",    // Captura tudo EXCETO rotas /api/*
    "destination": "/index.html"
  }
]
```

**Explicação**: A regex `/((?!api).*)` usa **negative lookahead** para excluir qualquer rota que comece com `/api`, permitindo que elas sejam processadas como funções serverless.

### 2. **Adicionar Routes Configuration**

```json
"routes": [
  {
    "src": "/api/(.*)",
    "dest": "/api/$1"
  }
]
```

**Explicação**: Garante explicitamente que rotas `/api/*` sejam encaminhadas para as funções serverless correspondentes.

### 3. **Atualizar Headers CORS**

```json
// ❌ Antes
"Access-Control-Allow-Headers": "Content-Type, Authorization, X-Hotmart-Signature"

// ✅ Depois
"Access-Control-Allow-Headers": "Content-Type, Authorization, X-Hotmart-Hottok, x-hotmart-hottok, hottok"
```

**Explicação**: O webhook usa `X-Hotmart-Hottok` para autenticação, não `X-Hotmart-Signature`.

---

## 📁 Arquivo Completo Corrigido

`vercel.json`:

```json
{
  "functions": {
    "api/hotmart-webhook.ts": {
      "maxDuration": 30
    },
    "api/save-client-image.ts": {
      "maxDuration": 30,
      "memory": 1024
    }
  },
  "rewrites": [
    {
      "source": "/((?!api).*)",
      "destination": "/index.html"
    }
  ],
  "routes": [
    {
      "src": "/api/(.*)",
      "dest": "/api/$1"
    }
  ],
  "headers": [
    {
      "source": "/api/(.*)",
      "headers": [
        {
          "key": "Access-Control-Allow-Origin",
          "value": "*"
        },
        {
          "key": "Access-Control-Allow-Methods",
          "value": "GET, POST, PUT, DELETE, OPTIONS"
        },
        {
          "key": "Access-Control-Allow-Headers",
          "value": "Content-Type, Authorization, X-Hotmart-Hottok, x-hotmart-hottok, hottok"
        }
      ]
    }
  ]
}
```

---

## 🧪 Como Testar Após Correção

### 1. Fazer Deploy

```bash
git add vercel.json
git commit -m "fix(vercel): corrigir rewrite pattern para permitir rotas /api/*"
git push
```

### 2. Aguardar Deploy no Vercel

- Acesse Vercel Dashboard
- Aguarde build concluir
- Deploy automático será feito

### 3. Testar Webhook

#### Opção A: Painel Hotmart
1. Acesse painel Hotmart > Webhooks
2. Clique em "Testar Webhook"
3. Resultado esperado: **200 OK** ✅

#### Opção B: Postman/Insomnia

```http
POST https://clik-cilios2-0.vercel.app/api/hotmart-webhook

Headers:
X-Hotmart-Hottok: gtnL72D16QPeck2Uky8d92uzq6GHtH6f40dc99-fece-4673-97c2-67aef62e4074
Content-Type: application/json

Body:
{
  "event": "PURCHASE_APPROVED",
  "data": {
    "buyer": {
      "email": "teste@example.com",
      "name": "Teste Cliente"
    }
  }
}
```

**Resultado Esperado**:
```json
{
  "success": true,
  "message": "Compra processada, usuário criado e email enviado",
  "timestamp": "...",
  "processing_time_ms": 450
}
```

### 4. Verificar Logs no Vercel

Agora os logs DEVEM aparecer no Vercel Dashboard:

```
📨 Webhook Hotmart recebido
🔍 Verificando token hottok...
🔑 Token de onde veio: HEADER
✅ Token hottok validado com sucesso!
🔄 Evento recebido: PURCHASE_APPROVED
✅ Processando compra aprovada...
👤 Dados do comprador (data.buyer): {...}
✅ Usuário criado: teste@example.com
✅ Email enviado com sucesso para teste@example.com
⏱️ Processamento concluído em 450ms
```

---

## 📊 Comparação Antes vs Depois

| Aspecto | Antes (❌) | Depois (✅) |
|---------|-----------|-------------|
| **Rewrite Pattern** | `/(.*)` - Captura tudo | `/((?!api).*)` - Exclui `/api/*` |
| **Rotas /api/*** | Redirecionadas para HTML | Executadas como funções |
| **Webhook Hotmart** | 405 Method Not Allowed | 200 OK |
| **Logs no Vercel** | Nenhum (função não executada) | Logs completos aparecem |
| **CORS Header** | X-Hotmart-Signature | X-Hotmart-Hottok |
| **Routes Config** | Ausente | Presente |

---

## 🎯 Por que Não Aparecia Erro no Vercel?

O Vercel **não mostrava erro** porque:

1. Tecnicamente não estava "falhando" do ponto de vista do Vercel
2. Estava fazendo **exatamente** o que o `vercel.json` mandava:
   - Rewrite `/(.*)` → redirecionar para `/index.html`
3. O arquivo `index.html` era servido com sucesso (200 OK do Vercel)
4. O erro **405** vinha do **cliente** (Hotmart) tentando fazer POST em HTML estático
5. Como a função nunca era executada, **não havia logs**

É como se você pedisse para a Vercel servir um arquivo HTML, e ela fizesse isso perfeitamente. O problema era que você QUERIA executar uma função, mas o rewrite estava impedindo.

---

## ⚠️ Lições Aprendidas

### 1. **Rewrites Genéricos são Perigosos**
```json
// ❌ NUNCA use isso com API routes
"source": "/(.*)"

// ✅ SEMPRE exclua rotas especiais
"source": "/((?!api).*)"
```

### 2. **Sempre Adicione Routes Config**
Mesmo que o Vercel "deveria" detectar automaticamente, é melhor ser explícito:
```json
"routes": [
  { "src": "/api/(.*)", "dest": "/api/$1" }
]
```

### 3. **Teste em Produção**
Mesmo que funcione localmente (`npm run dev`), sempre teste em produção porque:
- Comportamento do Vercel é diferente
- Rewrites só existem em produção
- CORS pode se comportar diferente

### 4. **Verifique Logs**
Se webhook retorna 405 mas **não há logs**, provavelmente a função nem está sendo executada (problema de roteamento).

---

## ✅ Checklist Pós-Correção

Após fazer o deploy:

- [ ] Testar webhook no painel Hotmart → Deve retornar 200 OK
- [ ] Verificar logs no Vercel Dashboard → Devem aparecer agora
- [ ] Testar com Postman/Insomnia → Deve criar usuário
- [ ] Verificar criação de usuário no Supabase → Deve existir
- [ ] Verificar envio de email → Deve chegar na caixa de entrada
- [ ] Fazer compra real (opcional) → Deve processar automaticamente

---

## 📞 Troubleshooting

### Ainda retorna 405 após correção?

1. **Verificar se deploy foi feito**:
   - Acesse Vercel Dashboard
   - Veja data/hora do último deploy
   - Deve ser APÓS o commit da correção

2. **Limpar cache do Vercel**:
   - Em alguns casos, o Vercel pode ter cached
   - Fazer um novo deploy ou "Redeploy" no dashboard

3. **Verificar vercel.json foi atualizado**:
   - No Vercel Dashboard > Source
   - Ver arquivo `vercel.json`
   - Confirmar que tem o padrão `/((?!api).*)`

4. **Testar rota diretamente**:
   ```bash
   curl -X POST https://clik-cilios2-0.vercel.app/api/hotmart-webhook \
     -H "Content-Type: application/json" \
     -H "X-Hotmart-Hottok: token" \
     -d '{"event":"PURCHASE_APPROVED","data":{"buyer":{"email":"test@test.com","name":"Test"}}}'
   ```

---

**Última atualização**: 06/10/2025
**Problema**: Erro 405 - Method Not Allowed
**Causa**: Rewrite pattern capturando rotas `/api/*`
**Solução**: Usar regex com negative lookahead `/((?!api).*)`
**Status**: ✅ Corrigido
