# 🚨 DIAGNÓSTICO: Erro 500 em Produção (Vercel)

## 📋 Situação Atual

- **Status:** Erro 500 - FUNCTION_INVOCATION_FAILED
- **Local:** Webhook Hotmart em produção (Vercel)
- **Confirmado:** Todas as variáveis de ambiente estavam corretas

## 🔍 Possíveis Causas do Erro 500 (Com Variáveis Corretas)

### 1. **Tabela `webhook_events` Não Existe no Supabase**

**Mais Provável** - O webhook tenta inserir dados na tabela `webhook_events` logo no início:

```typescript
const { error: webhookError } = await supabase
  .from('webhook_events')
  .insert({
    source: 'hotmart',
    event_type: payload.event,
    payload: payload,
    received_at: new Date().toISOString()
  });
```

**✅ Como Verificar:**
1. Acesse: https://supabase.com/dashboard
2. Vá para seu projeto
3. Clique em **Table Editor**
4. Procure pela tabela `webhook_events`

**✅ Como Corrigir:**
1. Vá para **SQL Editor**
2. Execute o conteúdo do arquivo `criar-webhook-events-limpo.sql`

### 2. **Problemas com Importações de Serviços**

O webhook importa serviços que podem estar falhando:

```typescript
import { hotmartUsersService } from '../../src/services/hotmartUsersService';
import { EmailService } from '../../src/services/emailService';
```

**Possíveis problemas:**
- Caminho de importação incorreto no Vercel
- Dependências faltando
- Erro nos próprios serviços

### 3. **Timeout da Função Vercel**

O webhook pode estar demorando muito para processar:
- Limite padrão: 10 segundos (Hobby plan)
- Operações pesadas: bcrypt, email, database

### 4. **Erro no `hotmartUsersService.assignUser()`**

O serviço principal pode estar falhando:

```typescript
const result = await hotmartUsersService.assignUser(
  buyer.email,
  buyer.name,
  purchase.transaction,
  payload.id,
  passwordHash
);
```

### 5. **Problemas com Dependências**

- `bcryptjs` - Para hash da senha
- `crypto` - Para geração de senha
- `@supabase/supabase-js` - Cliente Supabase

## 🛠️ Plano de Diagnóstico

### **Passo 1: Verificar Tabela webhook_events**

1. Acesse Supabase Dashboard
2. Verifique se a tabela `webhook_events` existe
3. Se não existir, execute `criar-webhook-events-limpo.sql`

### **Passo 2: Verificar Logs do Vercel**

1. Acesse: https://vercel.com/dashboard
2. Vá para o projeto `clik-cilios2-0-three`
3. Clique em **Functions**
4. Procure por `/api/hotmart/webhook`
5. Verifique os logs de erro detalhados

### **Passo 3: Testar Webhook Simplificado**

Criar uma versão mínima do webhook para isolar o problema:

```typescript
export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Teste 1: Verificar se chega até aqui
    console.log('✅ Webhook iniciado');
    
    // Teste 2: Verificar variáveis
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    
    if (!supabaseUrl || !serviceKey) {
      return res.status(500).json({ error: 'Missing env vars' });
    }
    
    // Teste 3: Verificar conexão Supabase
    const supabase = createClient(supabaseUrl, serviceKey);
    
    // Teste 4: Verificar tabela webhook_events
    const { error } = await supabase
      .from('webhook_events')
      .insert({
        source: 'teste',
        event_type: 'TESTE',
        payload: { teste: true },
        received_at: new Date().toISOString()
      });
    
    if (error) {
      return res.status(500).json({ error: error.message });
    }
    
    return res.status(200).json({ message: 'Teste OK' });
    
  } catch (error) {
    console.error('Erro:', error);
    return res.status(500).json({ error: error.message });
  }
}
```

### **Passo 4: Verificar Outras Tabelas**

Certificar que existem:
- `users`
- `pre_users`
- `hotmart_users`

## 📊 Checklist de Verificação

### ✅ No Supabase:
- [ ] Tabela `webhook_events` existe
- [ ] Tabela `users` existe
- [ ] Tabela `pre_users` existe
- [ ] Tabela `hotmart_users` existe
- [ ] RLS configurado corretamente
- [ ] Service Role Key tem permissões

### ✅ No Vercel:
- [ ] Todas as variáveis de ambiente configuradas
- [ ] Deploy mais recente funcionando
- [ ] Logs de erro verificados
- [ ] Função não está em timeout

### ✅ No Código:
- [ ] Importações corretas
- [ ] Dependências instaladas
- [ ] Serviços funcionando

## 🎯 Ação Imediata Recomendada

**1. Verificar tabela `webhook_events` no Supabase** (mais provável)

**2. Se a tabela existir, verificar logs detalhados no Vercel**

**3. Considerar criar webhook simplificado para teste**

## 📞 Próximos Passos

1. Execute a verificação da tabela `webhook_events`
2. Se não existir, execute `criar-webhook-events-limpo.sql`
3. Faça redeploy no Vercel
4. Teste novamente o webhook
5. Se persistir, analise logs detalhados do Vercel

---

**💡 Dica:** O erro `FUNCTION_INVOCATION_FAILED` com variáveis corretas geralmente indica problema de estrutura do banco ou dependências faltando.