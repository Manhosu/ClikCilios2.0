# Deploy no Vercel - ClikCílios 2.0

## ✅ Pré-requisitos

- Build de produção criada com sucesso ✅
- Arquivos de configuração prontos ✅
- Variáveis de ambiente documentadas ✅

## 🚀 Passos para Deploy

### 1. Preparar o Projeto

```bash
# Build já foi executada com sucesso
npm run build
```

### 2. Configurar Variáveis de Ambiente no Vercel

No painel do Vercel, configure as seguintes variáveis:

#### Supabase (Obrigatórias)
```
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

#### Hotmart (Opcionais - para funcionalidades avançadas)
```
VITE_HOTMART_CLIENT_ID=your-hotmart-client-id
VITE_HOTMART_CLIENT_SECRET=your-hotmart-client-secret
VITE_HOTMART_BASIC_TOKEN=your-hotmart-basic-token
VITE_HOTMART_WEBHOOK_SECRET=your-webhook-secret
VITE_HOTMART_ENABLED=true
HOTMART_HOTTOK=your-hotmart-token
```

#### Ambiente
```
NODE_ENV=production
```

### 3. Arquivos de Configuração

#### vercel.json ✅
- Configurado para SPA routing
- API functions configuradas
- Headers CORS definidos

#### package.json ✅
- Scripts de build configurados
- Dependências corretas

### 4. Estrutura de Deploy

```
dist/
├── assets/
│   ├── cilios/          # Imagens dos cílios
│   ├── index-*.js       # JavaScript bundle
│   └── index-*.css      # CSS bundle
├── models/              # Modelos de IA
├── ciliosclick-icon.svg # Ícone da aplicação
└── index.html           # Página principal

api/
└── hotmart-webhook.ts   # Webhook da Hotmart
```

### 5. Comandos de Deploy

#### Via Vercel CLI
```bash
# Instalar Vercel CLI (se necessário)
npm i -g vercel

# Deploy
vercel --prod
```

#### Via GitHub (Recomendado)
1. Faça push para o repositório GitHub
2. Conecte o repositório no painel do Vercel
3. Configure as variáveis de ambiente
4. Deploy automático será executado

### 6. Verificações Pós-Deploy

- [ ] Aplicação carrega corretamente
- [ ] Login funciona (modo demo se não configurado)
- [ ] Detecção de cílios funciona
- [ ] Webhook da Hotmart responde (se configurado)
- [ ] Painel administrativo acessível

### 7. URLs Importantes

- **Aplicação Principal**: `https://your-app.vercel.app`
- **Webhook Hotmart**: `https://your-app.vercel.app/api/hotmart-webhook`
- **Admin Panel**: `https://your-app.vercel.app/admin`

## 🔧 Troubleshooting

### Erro de Build
- ✅ **Resolvido**: Tipos TypeScript corrigidos
- ✅ **Resolvido**: Métodos de serviço atualizados

### Erro de Runtime
- Verifique as variáveis de ambiente no Vercel
- Confirme se o Supabase está acessível
- Verifique logs no painel do Vercel

### Modo Desenvolvimento
- A aplicação funciona em modo demo sem configuração
- Configure variáveis para funcionalidades completas

## 📊 Performance

- **Bundle Size**: ~1.2MB (otimizado)
- **Chunks**: Separados para melhor cache
- **Assets**: Imagens e modelos otimizados

## 🔒 Segurança

- Service Role Key apenas no servidor
- Webhook com validação de assinatura
- CORS configurado adequadamente

---

**Status**: ✅ Pronto para deploy no Vercel
**Build**: ✅ Sem erros
**Configuração**: ✅ Completa