# 🚀 Instruções de Deploy - CíliosClick

## 📋 Pré-requisitos

- Conta no [Vercel](https://vercel.com)
- Conta no [Supabase](https://supabase.com) 
- Conta na [Hotmart](https://hotmart.com)
- Domínio registrado (ex: ciliosclick.com)
- Provedor de email (SendGrid, Mailgun, etc.)

## 🌐 1. Configuração do Domínio

### Registrar Domínio
1. Registre `ciliosclick.com` em qualquer registrar (GoDaddy, Registro.br, etc.)
2. Configure DNS para apontar para Vercel:
   ```
   Type: A
   Name: @
   Value: 76.76.19.61
   
   Type: CNAME  
   Name: www
   Value: cname.vercel-dns.com
   ```

## 🔧 2. Deploy no Vercel

### Conectar Repositório
1. Acesse [vercel.com](https://vercel.com)
2. Clique em "New Project"
3. Conecte sua conta GitHub
4. Selecione o repositório `CiliosClick`
5. Configure as variáveis de ambiente:

### Variáveis de Ambiente
```bash
# Supabase
VITE_SUPABASE_URL=https://seu-projeto.supabase.co
VITE_SUPABASE_ANON_KEY=sua-chave-anonima

# Hotmart
VITE_HOTMART_WEBHOOK_SECRET=seu-secret-webhook

# Email (opcional)
SENDGRID_API_KEY=sua-chave-sendgrid
```

### Configuração de Deploy
1. **Framework Preset**: Vite
2. **Build Command**: `npm run build`
3. **Output Directory**: `dist`
4. **Install Command**: `npm install`

## 🗄️ 3. Configuração do Supabase

### Criar Projeto de Produção
1. Acesse [supabase.com](https://supabase.com)
2. Clique em "New Project"
3. Escolha região mais próxima (South America)
4. Anote a URL e chave anônima

### Executar Migrações
```sql
-- 1. Criar tabela users
CREATE TABLE users (
  id UUID REFERENCES auth.users(id) PRIMARY KEY,
  nome TEXT,
  email TEXT UNIQUE NOT NULL,
  is_admin BOOLEAN DEFAULT FALSE,
  onboarding_completed BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Criar tabela cupons
CREATE TABLE cupons (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  codigo TEXT UNIQUE NOT NULL,
  parceira_nome TEXT NOT NULL,
  parceira_email TEXT,
  percentual_comissao DECIMAL(5,2) DEFAULT 20.00,
  ativo BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Criar tabela usos_cupons
CREATE TABLE usos_cupons (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  cupom_id UUID REFERENCES cupons(id),
  user_id UUID REFERENCES users(id),
  valor_compra DECIMAL(10,2),
  valor_comissao DECIMAL(10,2),
  origem TEXT DEFAULT 'manual',
  hotmart_transaction_id TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. Configurar RLS (Row Level Security)
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE cupons ENABLE ROW LEVEL SECURITY;
ALTER TABLE usos_cupons ENABLE ROW LEVEL SECURITY;

-- 5. Políticas de segurança
CREATE POLICY "Users can view own data" ON users
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own data" ON users
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Admins can view all cupons" ON cupons
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() 
      AND users.is_admin = true
    )
  );

CREATE POLICY "Admins can manage cupons" ON cupons
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() 
      AND users.is_admin = true
    )
  );

CREATE POLICY "Admins can view all usos_cupons" ON usos_cupons
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() 
      AND users.is_admin = true
    )
  );

-- 6. Inserir admin padrão (Carina)
INSERT INTO auth.users (id, email) VALUES 
  ('00000000-0000-0000-0000-000000000000', 'carina@ciliosclick.com');

INSERT INTO users (id, nome, email, is_admin) VALUES 
  ('00000000-0000-0000-0000-000000000000', 'Carina', 'carina@ciliosclick.com', true);
```

## 🔗 4. Configuração da Hotmart

### Criar Produto
1. Acesse o painel da Hotmart
2. Crie um novo produto digital
3. Configure preço: R$ 397,00
4. Configure comissão para afiliados: 20%

### Configurar Webhook
1. Vá em "Configurações" → "Webhooks"
2. Adicione nova URL: `https://ciliosclick.com/api/hotmart-webhook`
3. Selecione eventos:
   - `PURCHASE_COMPLETE`
   - `PURCHASE_APPROVED`
4. Configure secret (use uma string aleatória segura)
5. Teste o webhook

## 📧 5. Configuração de Email

### SendGrid (Recomendado)
1. Crie conta no [SendGrid](https://sendgrid.com)
2. Verifique seu domínio de email
3. Crie API Key
4. Configure DNS records para autenticação

### Configurar Templates
```typescript
// api/send-email.ts
import sgMail from '@sendgrid/mail'
import { EmailTemplatesService } from '../src/services/emailTemplates'

sgMail.setApiKey(process.env.SENDGRID_API_KEY!)

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const { type, data } = req.body

  try {
    let template
    
    switch (type) {
      case 'welcome':
        template = EmailTemplatesService.welcomeEmail(data)
        break
      case 'parceira':
        template = EmailTemplatesService.parceiraNotification(data)
        break
      default:
        return res.status(400).json({ error: 'Invalid template type' })
    }

    const msg = {
      to: data.userEmail || data.parceiraEmail,
      from: 'noreply@ciliosclick.com',
      subject: template.subject,
      text: template.textContent,
      html: template.htmlContent,
    }

    await sgMail.send(msg)
    res.status(200).json({ success: true })
  } catch (error) {
    console.error('Email error:', error)
    res.status(500).json({ error: 'Failed to send email' })
  }
}
```

## 🧪 6. Testes de Produção

### Teste Manual Completo
1. **Acesse** `https://ciliosclick.com`
2. **Registre** nova conta
3. **Faça login** e verifique onboarding
4. **Teste aplicação** de cílios
5. **Verifique download** de resultados

### Teste de Webhook
```bash
# Simular webhook da Hotmart
curl -X POST https://ciliosclick.com/api/hotmart-webhook \
  -H "Content-Type: application/json" \
  -H "X-Hotmart-Hottok: SEU_SECRET" \
  -d '{
    "event": "PURCHASE_COMPLETE",
    "data": {
      "buyer": {
        "name": "Teste Silva",
        "email": "teste@exemplo.com"
      },
      "purchase": {
        "price": {
          "value": 397.00
        }
      },
      "affiliates": [
        {
          "name": "LANA20"
        }
      ]
    }
  }'
```

## 📊 7. Monitoramento

### Vercel Analytics
1. Ative Vercel Analytics no dashboard
2. Configure alertas de erro
3. Monitore performance

### Supabase Monitoring
1. Configure alertas de uso
2. Monitore queries lentas
3. Verifique logs de erro

## 🔒 8. Segurança Final

### Headers de Segurança
Já configurados no `vercel.json`:
- CORS apropriado
- Content Security Policy
- Rate limiting

### Backup
1. Configure backup automático do Supabase
2. Exporte dados regularmente
3. Teste restauração

## 🚀 9. Go Live!

### Checklist Final
- [ ] Domínio funcionando
- [ ] SSL ativo
- [ ] Webhook testado
- [ ] Emails chegando
- [ ] Onboarding funcionando
- [ ] Aplicação de cílios OK
- [ ] Painel admin acessível

### Comando de Deploy
```bash
# Commit final
git add .
git commit -m "🚀 Release v1.0.0 - Lançamento oficial"
git push origin main

# Deploy automático no Vercel
```

## 📞 10. Suporte Pós-Deploy

### Monitoramento 24h
- Logs de erro no Vercel
- Métricas de uso no Supabase
- Entrega de emails
- Feedback de usuários

### Contatos de Emergência
- **Vercel**: support@vercel.com
- **Supabase**: support@supabase.io  
- **SendGrid**: support@sendgrid.com
- **Hotmart**: suporte@hotmart.com

---

## 🎉 Parabéns!

A CíliosClick está oficialmente no ar! 🚀

**URL de Produção**: https://ciliosclick.com
**Painel Admin**: https://ciliosclick.com/admin/cupons
**Página de Parcerias**: https://ciliosclick.com/parcerias

### Próximos Passos
1. Divulgar para primeiras usuárias
2. Recrutar parceiras iniciais
3. Coletar feedback e iterar
4. Expandir funcionalidades

**#CíliosClick #LançamentoOficial #SucessoGarantido** ✨ 