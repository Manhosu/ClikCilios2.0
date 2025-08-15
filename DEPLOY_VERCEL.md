# Guia de Deploy no Vercel - CíliosClick

## Pré-requisitos

1. Conta no Vercel (https://vercel.com)
2. Projeto conectado ao GitHub/GitLab
3. Variáveis de ambiente configuradas

## Variáveis de Ambiente Obrigatórias

Configure as seguintes variáveis no painel do Vercel:

### Supabase
```
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

### Hotmart
```
VITE_HOTMART_CLIENT_ID=your-hotmart-client-id
VITE_HOTMART_CLIENT_SECRET=your-hotmart-client-secret
VITE_HOTMART_BASIC_TOKEN=your-hotmart-basic-token
VITE_HOTMART_WEBHOOK_SECRET=your-webhook-secret
VITE_HOTMART_ENABLED=true
HOTMART_HOTTOK=your-hotmart-token
```

### SendGrid (Email)
```
SENDGRID_API_KEY=your-sendgrid-api-key
SENDGRID_FROM_EMAIL=noreply@ciliosclick.com
SENDGRID_FROM_NAME=CíliosClick
```

### Aplicação
```
NEXT_PUBLIC_APP_URL=https://your-domain.vercel.app
NODE_ENV=production
```

## Passos para Deploy

### 1. Conectar Repositório
1. Acesse o painel do Vercel
2. Clique em "New Project"
3. Conecte seu repositório GitHub/GitLab
4. Selecione o projeto CíliosClick

### 2. Configurar Build
O Vercel detectará automaticamente as configurações do `vercel.json`:
- Framework: Vite
- Build Command: `npm run build`
- Output Directory: `dist`

### 3. Configurar Variáveis de Ambiente
1. Na aba "Settings" do projeto
2. Vá para "Environment Variables"
3. Adicione todas as variáveis listadas acima
4. Certifique-se de marcar para todos os ambientes (Production, Preview, Development)

### 4. Deploy
1. Clique em "Deploy"
2. Aguarde o build completar
3. Verifique se não há erros no log

## Verificações Pós-Deploy

### ✅ Checklist de Validação
- [ ] Aplicação carrega sem erros
- [ ] Login/cadastro funcionando
- [ ] Conexão com Supabase ativa
- [ ] Upload de imagens funcionando
- [ ] Aplicação de cílios funcionando
- [ ] Webhook da Hotmart configurado
- [ ] Emails sendo enviados
- [ ] Performance adequada

### 🔧 Troubleshooting

**Erro de Build:**
- Verifique se todas as dependências estão no package.json
- Confirme se o terser está instalado
- Verifique logs de build no Vercel

**Erro de Variáveis de Ambiente:**
- Confirme se todas as variáveis VITE_ estão configuradas
- Verifique se não há espaços extras nos valores
- Teste localmente com as mesmas variáveis

**Erro de Conexão Supabase:**
- Verifique URL e chaves do Supabase
- Confirme se o projeto Supabase está ativo
- Teste conexão via Postman/Insomnia

**Erro de Webhook Hotmart:**
- Configure a URL do webhook: `https://your-domain.vercel.app/api/hotmart-webhook`
- Verifique se o secret está correto
- Teste com dados de exemplo

## Domínio Personalizado

1. Na aba "Settings" > "Domains"
2. Adicione seu domínio personalizado
3. Configure DNS conforme instruções do Vercel
4. Aguarde propagação (até 48h)
5. Atualize `NEXT_PUBLIC_APP_URL` com o novo domínio

## Monitoramento

- Use a aba "Functions" para monitorar APIs
- Verifique logs em "Functions" > "View Function Logs"
- Configure alertas no Vercel para erros
- Use Analytics do Vercel para métricas

## Comandos Úteis

```bash
# Build local para teste
npm run build

# Preview do build
npm run preview

# Verificar dependências
npm audit

# Instalar CLI do Vercel
npm i -g vercel

# Deploy via CLI
vercel --prod
```

## Suporte

Em caso de problemas:
1. Verifique logs do Vercel
2. Teste localmente primeiro
3. Confirme todas as variáveis de ambiente
4. Verifique status dos serviços externos (Supabase, Hotmart, SendGrid)