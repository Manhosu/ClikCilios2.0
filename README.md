# 💄 CíliosClick - Plataforma de Cílios Virtuais

> A primeira plataforma brasileira de aplicação virtual de cílios com inteligência artificial

[![Deploy Status](https://img.shields.io/badge/deploy-ready-brightgreen)](https://ciliosclick.com)
[![Version](https://img.shields.io/badge/version-1.0.0-blue)](https://github.com/carina/ciliosclick)
[![License](https://img.shields.io/badge/license-MIT-green)](LICENSE)

**🚀 LANÇAMENTO OFICIAL - Dezembro 2024**

Plataforma completa que permite profissionais de extensão de cílios aplicar virtualmente diferentes estilos usando IA, com sistema de onboarding, parcerias e integração Hotmart.

## 🚀 Funcionalidades

### 🎯 Core Features
- ✅ **Autenticação Completa**: Registro, login, logout e recuperação de senha via Supabase
- ✅ **Dashboard Profissional**: Interface moderna com navegação intuitiva
- ✅ **Upload de Imagens**: Suporte a JPEG/PNG até 10MB com validação automática
- ✅ **IA para Aplicação de Cílios**: Processamento inteligente com 6 estilos profissionais
- ✅ **Download de Resultados**: Baixar imagens processadas com nomes personalizados
- ✅ **Feedback em Tempo Real**: Barras de progresso e tratamento de erros

### 🎫 Sistema de Parcerias
- ✅ **Gerenciamento de Cupons**: CRUD completo de cupons das parceiras
- ✅ **Relatórios de Comissão**: Controle de vendas e cálculo automático (20%)
- ✅ **Integração Hotmart**: Webhook para criação automática de usuários
- ✅ **Página Pública de Parcerias**: Landing page para captação (/parcerias)

### 🎓 Sistema de Onboarding
- ✅ **Welcome Modal**: Tour guiado em 5 passos para novas usuárias
- ✅ **Detecção Automática**: Primeiro login para usuárias recém-criadas
- ✅ **Templates de Email**: Boas-vindas e notificações automáticas
- ✅ **Painel Admin de Emails**: Gerenciamento de templates

### 🔧 Recursos Administrativos
- ✅ **Painel de Cupons**: Gestão completa de parceiras e comissões
- ✅ **Relatórios Detalhados**: Analytics de vendas e performance
- ✅ **Templates de Email**: Preview e gerenciamento de comunicações
- ✅ **Controle de Acesso**: Páginas protegidas para administradores

## 🎨 Estilos de Cílios Disponíveis

1. **Volume Fio a Fio D** - Volume fio a fio curvatura D
2. **Volume Brasileiro D** - Volume brasileiro curvatura D  
3. **Volume Egípcio 3D** - Volume egípcio 3D curvatura D
4. **Volume Russo D** - Volume russo curvatura D
5. **Boneca** - Efeito boneca clássico
6. **Fox Eyes** - Efeito fox eyes moderno

## 🛠 Tecnologias

- **Frontend**: React + TypeScript + Vite
- **Styling**: TailwindCSS customizado
- **Backend**: Supabase (Auth + Database)
- **IA**: API integrada para processamento de imagens
- **Deploy**: Pronto para Vercel/Netlify

## ⚙️ Configuração

### 1. Variáveis de Ambiente

Crie um arquivo `.env.local` na raiz do projeto:

```env
# Configurações do Supabase (obrigatório)
VITE_SUPABASE_URL=your-project-url.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key

# Configurações da API de IA (opcional - usa mock se não configurado)
VITE_AI_API_URL=https://sua-api-de-ia.com/apply-lashes
VITE_AI_API_KEY=sua_chave_da_api
```

### 2. Instalação

```bash
npm install
npm run dev
```

## 🤖 API de Inteligência Artificial

### Configuração da API Real

Para integrar com uma API de IA real, configure as variáveis de ambiente:

- `VITE_AI_API_URL`: Endpoint da API de processamento de cílios
- `VITE_AI_API_KEY`: Chave de autenticação da API

### Formato da Requisição

```json
{
  "image": "base64_string_sem_prefixo",
  "style": "VOLUME_BRASILEIRO_D",
  "quality": "high",
  "format": "jpeg"
}
```

### Códigos de Estilos

- `VOLUME_FIO_FIO_D` - Volume fio a fio curvatura D
- `VOLUME_BRASILEIRO_D` - Volume brasileiro curvatura D
- `VOLUME_EGIPCIO_3D_D` - Volume egípcio 3D curvatura D
- `VOLUME_RUSSO_D` - Volume russo curvatura D
- `BONECA` - Boneca
- `FOX_EYES` - Fox eyes

### Resposta Esperada

```json
{
  "success": true,
  "data": {
    "processedImage": "base64_string_resultado",
    "processingTime": 4500,
    "quality": 95
  }
}
```

### Mock para Desenvolvimento

Se as variáveis da API não estiverem configuradas, o sistema usa automaticamente um mock que:

- Simula tempo de processamento realista (2-5 segundos)
- Retorna diferentes qualidades por estilo
- Inclui 5% de chance de erro para testar tratamento
- Permite desenvolvimento sem dependência externa

## 🎫 Sistema de Cupons e Parceiras

### Funcionalidades

- **Gerenciamento de Cupons**: Criação, edição e exclusão de cupons únicos por parceira
- **Controle de Comissões**: Cálculo automático baseado em percentual configurável (padrão 20%)
- **Rastreamento de Vendas**: Registro detalhado de cada uso de cupom
- **Relatórios Completos**: Estatísticas por parceira, período e origem
- **Acesso Administrativo**: Páginas protegidas exclusivas para administradores

### Acesso Administrativo

As páginas administrativas estão disponíveis apenas para usuários com perfil de administrador:

- **Gerenciar Cupons** (`/admin/cupons`): CRUD completo de cupons
- **Relatórios** (`/admin/relatorio-cupons`): Análises detalhadas e registros manuais

### Cupons de Exemplo

O sistema vem com cupons pré-cadastrados para demonstração:

- `LANA20` - Lana Silva (20% comissão)
- `BIAFOX` - Beatriz Fox (22% comissão)
- `CARLA15` - Carla Santos (15% comissão)
- `MARI25` - Marina Costa (25% comissão)
- `JULIA18` - Julia Oliveira (18% comissão)

### Estrutura de Dados

```sql
-- Tabela de cupons
cupons (
  id UUID PRIMARY KEY,
  codigo TEXT UNIQUE NOT NULL,
  nome_parceira TEXT NOT NULL,
  email_parceira TEXT NOT NULL,
  comissao_percentual FLOAT DEFAULT 20.0,
  ativo BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ
)

-- Tabela de usos
usos_cupons (
  id UUID PRIMARY KEY,
  cupom_id UUID REFERENCES cupons(id),
  email_cliente TEXT NOT NULL,
  valor_venda FLOAT,
  comissao_calculada FLOAT,
  data_uso TIMESTAMPTZ DEFAULT NOW(),
  origem TEXT DEFAULT 'manual',
  observacoes TEXT
)
```

### Integração com Hotmart

O sistema está preparado para receber dados da Hotmart:
- Campo `origem` para identificar fonte da venda
- Webhook endpoint planejado para integração automática
- Estrutura de dados compatível com callbacks da Hotmart

## 🗄️ Banco de Dados

### Tabela de Usuários

```sql
create table users (
  id uuid default gen_random_uuid() primary key,
  email text unique not null,
  nome text not null,
  tipo text default 'profissional',
  auth_user_id uuid references auth.users(id) on delete cascade,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);
```

### Políticas RLS

- Usuários só podem ver e editar seus próprios dados
- Criação automática de perfil via trigger
- Segurança total com Row Level Security

## 🚦 Status do Projeto

- [x] **Fase 1**: Estrutura básica e UI ✅
- [x] **Fase 2**: Autenticação Supabase ✅
- [x] **Fase 3**: Integração API de IA ✅
- [x] **Fase 4**: Sistema de Cupons e Parceiras ✅
- [x] **Fase 5**: Sistema de Onboarding ✅
- [x] **Fase 6**: Integração Hotmart ✅
- [x] **Fase 7**: Templates de Email ✅
- [x] **Fase 8**: Página de Parcerias ✅
- [x] **Fase 9**: Deploy e Produção ✅

## 🚀 Deploy e Produção

### URLs Oficiais
- **🌐 Site Principal**: https://ciliosclick.com
- **👥 Página de Parcerias**: https://ciliosclick.com/parcerias
- **🔧 Painel Admin**: https://ciliosclick.com/admin/cupons

### Arquivos de Deploy
- `vercel.json` - Configuração do Vercel
- `DEPLOY_INSTRUCTIONS.md` - Instruções completas de deploy
- `CHECKLIST_LANCAMENTO.md` - Checklist de lançamento
- `migrations/` - Scripts SQL para produção

### Configuração de Produção
```bash
# Variáveis de ambiente necessárias
VITE_SUPABASE_URL=https://projeto-prod.supabase.co
VITE_SUPABASE_ANON_KEY=chave-producao
VITE_HOTMART_WEBHOOK_SECRET=secret-webhook
```

### Comando de Deploy
```bash
npm run build
git add .
git commit -m "🚀 Release v1.0.0"
git push origin main
```

## 🎯 Próximas Funcionalidades

- Histórico de processamentos
- Comparação antes/depois
- Compartilhamento de resultados
- Templates de cílios personalizados
- Sistema de favoritos
- Upload múltiplo de imagens

## 📱 Responsividade

Interface totalmente responsiva:
- 📱 **Mobile**: Layout otimizado para smartphones
- 💻 **Desktop**: Experiência completa com sidebar
- 🖥️ **Tablet**: Adaptação automática de componentes

## 🔒 Segurança

- Autenticação JWT via Supabase
- Validação de arquivos no frontend
- Row Level Security no banco
- Rate limiting automático
- Headers de segurança configurados

## 🎨 Design System

- **Cores Primárias**: Lilás (#a855f7) e Rosa (#ec4899)
- **Tipografia**: Inter (sistema)
- **Componentes**: Reutilizáveis e consistentes
- **Ícones**: Emojis e SVGs customizados
- **Gradientes**: Sutis e femininos

---

**Desenvolvido para profissionais de extensão de cílios** ✨
## 🔗 Integração Hotmart

### Webhook Endpoint

O sistema inclui integração completa com a Hotmart para:

- **Liberação automática de acesso** após compra aprovada
- **Registro de cupons** na tabela `usos_cupons`
- **Criação automática de usuários** no Supabase Auth
- **Validação de segurança** via HMAC-SHA256

### Configuração

1. **Endpoint de Webhook**:
   ```
   POST https://seudominio.vercel.app/api/hotmart-webhook
   ```

2. **Variáveis de Ambiente**:
   ```bash
   VITE_HOTMART_WEBHOOK_SECRET=seu_secret_hmac_da_hotmart
   ```

3. **Headers Requeridos**:
   ```
   Content-Type: application/json
   X-Hotmart-Signature: sha256=assinatura_hmac
   ```

### Como Funciona

1. **Compra Aprovada** → Hotmart envia webhook
2. **Validação HMAC** → Verificar autenticidade 
3. **Extrair Cupom** → De tracking/affiliations/commissions
4. **Criar Usuário** → Registro automático no Supabase Auth
5. **Registrar Cupom** → Gravar uso na tabela `usos_cupons`
6. **Resposta OK** → Confirmar processamento para Hotmart

### Teste de Desenvolvimento

Use a página **Admin → Teste Webhook** para simular:
- ✅ Compra com cupom
- ✅ Compra sem cupom  
- ✅ Cancelamento
- ✅ Webhook personalizado

### Status Suportados

- `APPROVED` - Libera acesso
- `COMPLETE` - Libera acesso  
- `PAID` - Libera acesso
- `CANCELED` - Registra cancelamento
- `REFUNDED` - Registra estorno
- `CHARGEBACK` - Registra chargeback

---

## 🎉 Lançamento Oficial

**A CíliosClick está oficialmente no ar!** 🚀

Primeira plataforma brasileira de aplicação virtual de cílios com IA, sistema completo de parcerias, onboarding profissional e integração Hotmart.

### 📊 Métricas de Sucesso

**KPIs Principais:**
- Taxa de conversão do onboarding: > 70%
- Tempo médio para primeira aplicação: < 5 min
- Retenção após 7 dias: > 40%
- Comissões geradas: R$ 10.000/mês

**Metas do Primeiro Mês:**
- 🎯 500 usuárias registradas
- 🤝 50 parceiras ativas
- 💄 2.000 aplicações de cílios
- 💰 R$ 50.000 em vendas

### 📞 Suporte e Contato

- **📧 Email**: contato@ciliosclick.com
- **📱 WhatsApp**: (11) 99999-9999
- **🌐 Site**: https://ciliosclick.com
- **📋 Documentação**: Ver arquivos `*.md` no repositório

**#CíliosClick #LançamentoOficial #RevoluçãoBeauty**

Criado com ❤️ para revolucionar o atendimento ao cliente no segmento de beleza. 