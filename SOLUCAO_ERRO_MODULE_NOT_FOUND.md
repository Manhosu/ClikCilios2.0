# Solução para Erros ERR_MODULE_NOT_FOUND e TypeError no Webhook Hotmart

## Problema Identificado

O webhook do Hotmart estava retornando erro 500 devido a três problemas principais:

1. **ERR_MODULE_NOT_FOUND**: Módulos TypeScript não estavam sendo encontrados no ambiente de produção Vercel
2. **TypeError**: `import.meta.env` não está disponível no contexto da API Vercel
3. **supabaseUrl is required**: Variáveis de ambiente não configuradas corretamente no Vercel

## Erro Original
```
Error [ERR_MODULE_NOT_FOUND]: Cannot find module '/var/task/src/services/hotmartUsersService' imported from /var/task/api/hotmart/webhook.js
```

## Causa Raiz

No Vercel, quando o TypeScript é compilado para JavaScript, as importações precisam incluir a extensão `.js` para que o Node.js possa resolver os módulos corretamente em ambiente de produção.

## Soluções Implementadas

### 1. Correção de Imports TypeScript (ERR_MODULE_NOT_FOUND)

**Problema**: No ambiente Vercel, os imports TypeScript precisam incluir a extensão `.js` para serem resolvidos corretamente.

**Arquivos modificados**:
- `api/hotmart/webhook.ts`
- `src/services/emailService.ts`
- `src/services/hotmartUsersService.ts`

**Mudanças realizadas**:
```typescript
// ANTES
import { hotmartUsersService } from '../../src/services/hotmartUsersService';
import { EmailService } from '../../src/services/emailService';

// DEPOIS
import { hotmartUsersService } from '../../src/services/hotmartUsersService.js';
import { EmailService } from '../../src/services/emailService.js';
```

### 2. Correção de Variáveis de Ambiente (TypeError)

**Problema**: `import.meta.env` não está disponível no contexto da API Vercel, causando `TypeError: Cannot read properties of undefined (reading 'VITE_SUPABASE_URL')`.

**Arquivo modificado**: `src/lib/supabase.ts`

**Solução**: Detecção dinâmica do ambiente para usar `process.env` ou `import.meta.env` conforme apropriado:

```typescript
// Detectar se estamos em ambiente de API (Vercel) ou frontend (Vite)
const isApiContext = typeof import.meta === 'undefined' || !import.meta.env

const supabaseUrl = isApiContext 
  ? process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.VITE_SUPABASE_URL
  : import.meta.env.VITE_SUPABASE_URL

const supabaseAnonKey = isApiContext 
  ? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY
  : import.meta.env.VITE_SUPABASE_ANON_KEY
```

### 3. Correção de Configuração Supabase no Webhook

**Problema**: O webhook estava tentando acessar variáveis de ambiente que não estavam configuradas no Vercel, causando "supabaseUrl is required".

**Arquivos modificados**:
- `api/hotmart/webhook.ts`
- `api/hotmart/webhook-teste.ts`

**Solução**: Implementação de fallbacks e validação adequada das variáveis de ambiente:

```typescript
// Configuração de variáveis de ambiente para Vercel
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl) {
  throw new Error('SUPABASE_URL não configurada. Configure NEXT_PUBLIC_SUPABASE_URL ou VITE_SUPABASE_URL no Vercel.');
}

if (!supabaseServiceKey) {
  throw new Error('SUPABASE_SERVICE_ROLE_KEY não configurada no Vercel.');
}
```

## Configuração Necessária no Vercel

Para que o webhook funcione corretamente, as seguintes variáveis de ambiente devem estar configuradas no Vercel:

- `NEXT_PUBLIC_SUPABASE_URL` ou `VITE_SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`
- `HOTMART_HOTTOK`
- `SENDGRID_API_KEY`

## Resultado

Após essas correções, o webhook do Hotmart deve funcionar corretamente no ambiente de produção Vercel, resolvendo todos os erros de módulo, variáveis de ambiente e configuração do Supabase.

## Arquivos Modificados

1. `api/hotmart/webhook.ts` - Correção de imports e configuração Supabase
2. `api/hotmart/webhook-teste.ts` - Correção de configuração Supabase
3. `src/services/emailService.ts` - Correção de imports
4. `src/services/hotmartUsersService.ts` - Correção de imports
5. `src/lib/supabase.ts` - Correção de variáveis de ambiente

## Status

✅ **RESOLVIDO** - Correções aplicadas em todos os arquivos afetados

---

**Data da correção**: 13/08/2025  
**Arquivos modificados**: 5  
**Tipo de erro**: Resolução de módulos, variáveis de ambiente e configuração Supabase em produção