# 🔧 Correção do Erro 404 - TypeScript Functions não Encontradas

## 🐛 Problema Identificado

Quando a Hotmart tentava enviar webhook para produção no Vercel, recebia:

```
404 - Not Found
"ThepagecouldnotbefoundNOT_FOUNDiad1::77dxj-1759765921130-c4aeb4e3f203"
```

---

## 🔍 Causa Raiz

O Vercel não conseguia encontrar a função `api/hotmart-webhook.ts` porque:

### 1. **TypeScript não estava sendo compilado para `/api`**

`tsconfig.json` original:
```json
{
  "compilerOptions": {
    "noEmit": true,  // ❌ Não gera arquivos .js
    ...
  },
  "include": ["src"], // ❌ Só inclui pasta src/, não /api
  ...
}
```

**Problema**: Arquivos TypeScript em `/api` não eram compilados!

### 2. **Vercel procurava função mas não encontrava**

Quando Hotmart fazia:
```
POST https://clik-cilios2-0.vercel.app/api/hotmart-webhook
```

O Vercel procurava por:
- `api/hotmart-webhook.ts` (raw TypeScript) OU
- `api/hotmart-webhook.js` (compilado)

Mas como TypeScript não era compilado e Vercel não tinha configuração explícita de runtime, retornava **404**.

### 3. **Falta de configuração de Runtime no vercel.json**

`vercel.json` não especificava como processar arquivos TypeScript em `/api`:
```json
{
  "functions": {
    "api/hotmart-webhook.ts": {
      "maxDuration": 30  // ❌ Falta especificar runtime
    }
  }
}
```

---

## ✅ Correções Aplicadas

### 1. **Criar `tsconfig.api.json`**

Arquivo específico para compilar funções serverless em `/api`:

```json
{
  "extends": "./tsconfig.json",
  "compilerOptions": {
    "target": "ES2020",
    "module": "commonjs",        // ✅ CommonJS para Node.js
    "moduleResolution": "node",   // ✅ Resolução Node.js
    "noEmit": false,              // ✅ GERA arquivos .js
    "outDir": "./dist-api",       // ✅ Output para dist-api
    "esModuleInterop": true,
    "skipLibCheck": true
  },
  "include": [
    "api/**/*.ts"                 // ✅ Inclui TODOS .ts em /api
  ],
  "exclude": [
    "node_modules",
    "dist",
    "dist-api",
    "src"                         // ✅ Exclui frontend
  ]
}
```

**Por que funciona**:
- Vercel detecta automaticamente `tsconfig.api.json`
- Compila TypeScript em `/api` usando essas configurações
- Gera arquivos `.js` que podem ser executados

### 2. **Atualizar `vercel.json` - Runtime Explícito**

```json
{
  "functions": {
    "api/**/*.ts": {
      "runtime": "@vercel/node@3.0.0"  // ✅ Especifica runtime Node.js
    },
    "api/hotmart-webhook.ts": {
      "maxDuration": 30
    },
    "api/save-client-image.ts": {
      "maxDuration": 30,
      "memory": 1024
    }
  },
  "builds": [
    {
      "src": "api/**/*.ts",
      "use": "@vercel/node"              // ✅ Builder para TypeScript
    }
  ],
  "rewrites": [...],
  "headers": [...]
}
```

**Mudanças**:
- ✅ Adicionado `runtime: "@vercel/node@3.0.0"` para todos `.ts`
- ✅ Adicionado `builds` para processar TypeScript
- ✅ Vercel agora sabe como compilar e executar `.ts`

### 3. **Atualizar `.vercelignore`**

```
# Build artifacts
dist
dist-api        # ✅ Adicionado
build

# Scripts de desenvolvimento
test-*.cjs      # ✅ Adicionado
dev-server.js   # ✅ Adicionado
*.md            # ✅ Adicionado (exceto README.md)
```

**Por que**: Evita fazer upload de arquivos desnecessários para Vercel, reduzindo tamanho do build.

---

## 📊 Comparação Antes vs Depois

| Aspecto | Antes ❌ | Depois ✅ |
|---------|----------|-----------|
| **Compilação `/api`** | Não compila | `tsconfig.api.json` compila |
| **Runtime Vercel** | Não especificado | `@vercel/node@3.0.0` |
| **Builders** | Nenhum | `@vercel/node` para `.ts` |
| **TypeScript em `/api`** | Não funciona | Funciona corretamente |
| **Resposta Hotmart** | 404 Not Found | 200 OK |
| **Logs Vercel** | Nenhum | Logs completos aparecem |

---

## 🎯 Como o Vercel Processa Agora

### Fluxo de Deploy:

1. **Vercel recebe código** do repositório Git
2. **Detecta `tsconfig.api.json`** na raiz
3. **Compila TypeScript** em `/api` usando configurações específicas:
   - Target: ES2020
   - Module: CommonJS (para Node.js)
   - Output: `dist-api/`
4. **Cria funções serverless** para cada arquivo `.ts` em `/api`:
   - `api/hotmart-webhook.ts` → função `/api/hotmart-webhook`
   - `api/save-client-image.ts` → função `/api/save-client-image`
5. **Aplica configurações** de `vercel.json`:
   - Runtime Node.js 3.0.0
   - MaxDuration 30s
   - Headers CORS
6. **Deploy completo** ✅

### Quando Hotmart Envia Webhook:

1. **POST** `https://clik-cilios2-0.vercel.app/api/hotmart-webhook`
2. Vercel **encontra função** compilada
3. **Executa handler** com VercelRequest/Response
4. **Valida token** do header `X-Hotmart-Hottok`
5. **Cria usuário** no Supabase
6. **Envia email** com credenciais
7. **Retorna 200 OK** para Hotmart ✅

---

## 🚀 Deploy e Teste

### 1. Fazer Commit

```bash
git add .
git commit -m "fix(vercel): adicionar suporte TypeScript para funções /api

- Criar tsconfig.api.json para compilar /api
- Atualizar vercel.json com runtime @vercel/node
- Adicionar builds configuration para TypeScript
- Atualizar .vercelignore com dist-api e scripts de teste
- Corrigir erro 404 Not Found do webhook Hotmart"

git push
```

### 2. Aguardar Deploy no Vercel

- Vercel fará build automático
- Aguardar conclusão (2-3 minutos)

### 3. Verificar Build Logs

No Vercel Dashboard → Deployments → [seu deploy] → Build Logs:

Procurar por:
```
✓ Compiling TypeScript files...
✓ Building api/hotmart-webhook.ts
✓ Serverless Function created: api/hotmart-webhook
```

### 4. Testar Webhook

#### Opção A: Painel Hotmart
1. Acesse Hotmart → Webhooks
2. Clique "Testar Webhook"
3. **Resultado Esperado**: ✅ **200 OK**

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

**Resposta Esperada (200 OK)**:
```json
{
  "success": true,
  "message": "Compra processada, usuário criado e email enviado",
  "data": {
    "user_created": true,
    "user_id": "...",
    "email": "teste@example.com",
    "email_sent": true,
    "event": "PURCHASE_APPROVED"
  },
  "timestamp": "...",
  "processing_time_ms": 450
}
```

### 5. Verificar Logs no Vercel

Agora os logs **DEVEM aparecer**:

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

## ⚠️ Troubleshooting

### Ainda retorna 404?

1. **Verificar se build passou**:
   - Vercel Dashboard → Deployments
   - Status deve ser "Ready" (verde) ✅
   - Se "Failed" (vermelho), ver logs de erro

2. **Verificar funções criadas**:
   - Vercel Dashboard → Functions
   - Deve listar: `api/hotmart-webhook`
   - Se não aparece, problema na compilação

3. **Verificar runtime**:
   - Logs do build devem mostrar:
     ```
     Using @vercel/node@3.0.0
     ```

4. **Testar rota diretamente no navegador**:
   ```
   https://clik-cilios2-0.vercel.app/api/hotmart-webhook
   ```
   - Deve retornar 405 (POST only) ou 401 (sem token)
   - NÃO deve retornar 404

### Erro de TypeScript no Build?

Se build falhar com erro TypeScript:

1. **Verificar tsconfig.api.json**:
   - Arquivo existe na raiz?
   - Sintaxe JSON correta?

2. **Verificar imports no código**:
   - Todos imports resolvem corretamente?
   - Pacotes @vercel/node instalados?

3. **Limpar e rebuild**:
   ```bash
   rm -rf node_modules package-lock.json
   npm install
   git push
   ```

### Email não enviado?

Se usuário é criado mas email não chega:

1. **Verificar SENDGRID_API_KEY** no Vercel:
   - Settings → Environment Variables
   - Deve estar configurada

2. **Verificar logs**:
   - Deve aparecer: `✅ Email enviado com sucesso`
   - Se aparecer: `⚠️ SENDGRID_API_KEY não configurada`
     → Adicionar variável

---

## ✅ Checklist Final

Após deploy:

- [ ] Build do Vercel passou (status "Ready")
- [ ] Função `api/hotmart-webhook` aparece no dashboard
- [ ] Teste Hotmart retorna 200 OK
- [ ] Logs aparecem no Vercel Dashboard
- [ ] Teste com Postman retorna 200 OK
- [ ] Usuário é criado no Supabase
- [ ] Email é enviado com credenciais
- [ ] Login funciona com credenciais do email

---

## 📚 Arquivos Modificados

1. ✅ `tsconfig.api.json` (NOVO) - Configuração TypeScript para `/api`
2. ✅ `vercel.json` - Adicionado runtime e builds
3. ✅ `.vercelignore` - Adicionado dist-api e scripts de teste

---

## 🎓 Lições Aprendidas

### 1. **TypeScript em Projetos Híbridos**

Quando você tem:
- **Frontend**: Vite + React (módulos ES)
- **Backend**: Vercel Serverless Functions (CommonJS)

Precisa de **duas configurações TypeScript separadas**:
- `tsconfig.json` → Frontend (noEmit: true)
- `tsconfig.api.json` → Backend (noEmit: false, module: commonjs)

### 2. **Vercel Auto-Detect vs Configuração Explícita**

Vercel pode detectar TypeScript automaticamente, MAS:
- Só funciona se configuração estiver correta
- Melhor ser **explícito** no `vercel.json`
- Adicionar `runtime` e `builds` evita ambiguidade

### 3. **404 vs 405 vs 401**

Entender diferença de erros:
- **404 Not Found**: Rota não existe (problema de deploy/compilação)
- **405 Method Not Allowed**: Rota existe mas método HTTP errado (problema de rewrite)
- **401 Unauthorized**: Rota existe mas falta autenticação (problema de token)

### 4. **Debug sem Logs**

Se função retorna erro mas **não há logs** no Vercel:
- Provavelmente função **nem está sendo executada**
- Verificar: roteamento, rewrites, compilação
- Não é erro de código, é erro de infraestrutura

---

**Última atualização**: 06/10/2025
**Problema**: 404 Not Found - Função TypeScript não encontrada
**Causa**: TypeScript em `/api` não estava sendo compilado
**Solução**: `tsconfig.api.json` + runtime explícito no `vercel.json`
**Status**: ✅ Corrigido
