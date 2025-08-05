# 💄 CíliosClick - Guia do Desenvolvedor

> Plataforma de aplicação virtual de cílios com IA - Guia Essencial para Desenvolvedores

## 🚀 Início Rápido

### 1. Configuração Básica
```bash
# 1. Clonar repositório
git clone [url-do-repositorio]
cd CiliosClick

# 2. Instalar dependências  
npm install

# 3. Iniciar servidor de desenvolvimento
npm run dev

# 4. Acessar aplicação
# http://localhost:5173
```

### 2. Variáveis de Ambiente (Opcional para Dev)
```bash
# Copiar arquivo de exemplo
cp env.example .env.local

# Configurar para produção (opcional)
VITE_SUPABASE_URL=sua_url_supabase
VITE_SUPABASE_ANON_KEY=sua_chave_supabase
VITE_AI_API_URL=sua_api_ia
VITE_AI_API_KEY=sua_chave_ia
VITE_HOTMART_WEBHOOK_SECRET=secret_hotmart
```

**⚠️ Importante:** O projeto funciona em modo desenvolvimento sem configuração. Apenas configure .env.local para produção.

---

## 🏗️ Arquitetura do Projeto

### Estrutura Principal
```
src/
├── components/          # Componentes reutilizáveis
│   ├── Button.tsx      # Botão padrão
│   ├── ProtectedRoute.tsx  # Proteção de rotas
│   └── WelcomeModal.tsx    # Modal de onboarding
├── pages/              # Páginas da aplicação
│   ├── Dashboard.tsx   # Dashboard principal
│   ├── AplicarCiliosPage.tsx  # Aplicação de cílios
│   ├── LoginPage.tsx   # Login/registro
│   └── admin/          # Páginas administrativas
├── services/           # Serviços e APIs
│   ├── aiService.ts    # Integração com IA
│   ├── supabase.ts     # Cliente Supabase
│   ├── cuponsService.ts    # Sistema de cupons
│   └── hotmartService.ts   # Webhook Hotmart
├── contexts/           # Contextos React
│   ├── AuthContext.tsx # Autenticação
│   └── ThemeContext.tsx    # Tema/UI
└── hooks/              # Hooks customizados
    ├── useAuth.ts      # Hook de autenticação
    └── useOnboarding.ts    # Hook de onboarding
```

### Tecnologias Principais
- **Frontend:** React 18 + TypeScript + Vite
- **Styling:** TailwindCSS
- **Backend:** Supabase (Auth + Database)
- **Deploy:** Vercel
- **IA:** API externa para processamento de imagens

---

## 🔧 Funcionalidades Principais

### 1. Sistema de Autenticação
- **Registro/Login** via Supabase Auth
- **Rotas protegidas** com ProtectedRoute
- **Contexto global** de usuário autenticado
- **Recuperação de senha** por email

### 2. Aplicação de Cílios
- **Upload de imagens** (JPEG/PNG até 10MB)
- **6 estilos disponíveis:** Volume Brasileiro, Russo, Egípcio, Fox Eyes, etc.
- **Processamento IA** ou fallback local
- **Download do resultado** processado

### 3. Sistema de Cupons/Parcerias
- **CRUD completo** de cupons (apenas admin)
- **Cálculo automático** de comissões (20% padrão)
- **Relatórios** de vendas e performance
- **Integração Hotmart** via webhook

### 4. Sistema de Onboarding
- **Welcome modal** com tour em 5 passos
- **Detecção automática** para novos usuários
- **Templates de email** para boas-vindas

---

## 🗄️ Banco de Dados (Supabase)

### Tabelas Principais

#### `users`
```sql
CREATE TABLE users (
  id UUID REFERENCES auth.users(id) PRIMARY KEY,
  nome TEXT,
  email TEXT UNIQUE NOT NULL,
  is_admin BOOLEAN DEFAULT FALSE,
  onboarding_completed BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

#### `cupons`
```sql
CREATE TABLE cupons (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  codigo TEXT UNIQUE NOT NULL,
  parceira_nome TEXT NOT NULL,
  parceira_email TEXT,
  percentual_comissao DECIMAL(5,2) DEFAULT 20.00,
  ativo BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

#### `usos_cupons`
```sql
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
```

### Políticas de Segurança (RLS)
- **Users:** Cada usuário vê apenas seus dados
- **Cupons/Usos:** Apenas admins têm acesso
- **Admin automático:** carina@ciliosclick.com

---

## 🔗 Integrações

### Hotmart Webhook
- **Endpoint:** `/api/hotmart-webhook.ts`
- **Segurança:** Validação HMAC-SHA256
- **Funcionalidade:** Criação automática de usuários após compra
- **Eventos:** PURCHASE_APPROVED, PURCHASE_CANCELED, etc.

### API de IA
- **Modo Dev:** Fallback local com overlay simulado
- **Modo Prod:** Integração com API real (OpenAI, Replicate, etc.)
- **Fallback:** Sistema sempre funciona, mesmo sem IA

---

## 📱 Páginas e Rotas

### Públicas
- `/` → Redireciona para dashboard
- `/login` → Login/registro
- `/parcerias` → Página de captação de parceiras

### Protegidas (Login obrigatório)
- `/dashboard` → Dashboard principal
- `/aplicar-cilios` → Aplicação de cílios
- `/minhas-imagens` → Histórico (futuro)
- `/configuracoes` → Configurações do usuário

### Admin (Apenas admins)
- `/admin/cupons` → Gerenciar cupons
- `/admin/relatorio-cupons` → Relatórios
- `/admin/emails` → Templates de email
- `/admin/teste` → Testes do sistema
- `/admin/webhook-teste` → Teste webhook Hotmart

---

## 🛠️ Comandos Úteis

### Desenvolvimento
```bash
npm run dev          # Servidor desenvolvimento (localhost:5173)
npm run build        # Build para produção
npm run preview      # Preview do build
npm run lint         # Verificar código
```

### Deploy
```bash
# Vercel (recomendado)
npm install -g vercel
vercel login
vercel

# Ou via git push (se conectado ao Vercel)
git add .
git commit -m "Deploy"
git push origin main
```

---

## 🔒 Segurança

### Configurações Importantes
- **RLS ativo** em todas as tabelas
- **CORS configurado** no vercel.json
- **Validação HMAC** no webhook Hotmart
- **Headers de segurança** configurados

### Acesso Admin
- **Email autorizado:** carina@ciliosclick.com
- **Verificação automática** via hook useAdmin
- **Páginas protegidas** com ProtectedRoute

---

## 🎨 Estilos e UI

### Design System
- **Cores principais:** Rosa (#E91E63) e Roxo (#9C27B0)
- **Tipografia:** Inter (sistema)
- **Componentes:** TailwindCSS + componentes customizados
- **Responsivo:** Mobile-first

### Componentes Reutilizáveis
- `Button` - Botão padrão do sistema
- `ProtectedRoute` - Proteção de rotas
- `WelcomeModal` - Modal de onboarding

---

## 🚨 Problemas Conhecidos e Soluções

### 1. IA não Configurada
**Problema:** Sistema usa fallback local  
**Solução:** Configure VITE_AI_API_URL e VITE_AI_API_KEY no .env.local

### 2. Erro de CORS
**Problema:** Webhook Hotmart bloqueado  
**Solução:** Verificar configuração no vercel.json

### 3. RLS Bloqueando Acesso
**Problema:** Usuário não consegue acessar dados  
**Solução:** Verificar políticas de segurança no Supabase

---

## 📞 Suporte e Recursos

### Links Importantes
- **Supabase Dashboard:** [supabase.com](https://supabase.com)
- **Vercel Dashboard:** [vercel.com](https://vercel.com)
- **TailwindCSS Docs:** [tailwindcss.com](https://tailwindcss.com)
- **React Docs:** [react.dev](https://react.dev)

### Arquivos de Configuração Importantes
- `package.json` - Dependências e scripts
- `vite.config.ts` - Configuração do Vite
- `tailwind.config.js` - Configuração do Tailwind
- `vercel.json` - Configuração de deploy
- `env.example` - Exemplo de variáveis de ambiente

---

## 🎯 Para Continuar o Desenvolvimento

### Próximas Funcionalidades (Sugestões)
1. **Histórico de processamentos** - Página "Minhas Imagens"
2. **Sistema de favoritos** - Salvar estilos preferidos
3. **Upload múltiplo** - Processar várias imagens
4. **Comparação antes/depois** - Interface split
5. **Compartilhamento** - Links para resultados
6. **Templates personalizados** - Cílios customizados

### Melhorias Técnicas
1. **Testes automatizados** - Jest + Testing Library
2. **Storybook** - Catálogo de componentes
3. **PWA** - App instalável
4. **Internacionalização** - Suporte multi-idioma
5. **Analytics** - Google Analytics/Mixpanel

---

**🎉 Sistema 100% funcional e pronto para desenvolvimento!**

**Acesse:** http://localhost:5173 após `npm run dev` 