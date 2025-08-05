# 🔧 Configuração do Ambiente - CíliosClick

## 🚀 Início Rápido

### 1. Instalar Dependências
```bash
npm install
```

### 2. Iniciar Servidor
```bash
npm run dev
```

### 3. Acessar Aplicação
- **URL**: http://localhost:5173/
- **Status**: ✅ Funcionando em modo desenvolvimento

---

## ⚙️ Configuração Completa (Opcional)

### 📝 Variáveis de Ambiente

Para funcionalidade completa, configure as variáveis de ambiente:

#### 1. Copiar Arquivo de Exemplo
```bash
cp env.example .env.local
```

#### 2. Configurar Supabase
```env
# .env.local
VITE_SUPABASE_URL=https://seu-projeto.supabase.co
VITE_SUPABASE_ANON_KEY=sua-chave-anonima
```

#### 3. Configurar API de IA (Opcional)
```env
VITE_AI_API_URL=https://sua-api-de-ia.com/apply-lashes
VITE_AI_API_KEY=sua_chave_da_api
```

#### 4. Configurar Hotmart (Opcional)
```env
VITE_HOTMART_WEBHOOK_SECRET=seu-secret-webhook
```

---

## 🔧 Modo Desenvolvimento

### ✅ Funcionalidades Ativas (Sem Configuração)

- **🎨 Interface Completa**: Todas as páginas funcionando
- **🔐 Autenticação Mock**: Login/logout simulado
- **💄 Aplicação de Cílios**: Mock com 6 estilos
- **📊 Dashboard**: Navegação completa
- **🎫 Sistema de Cupons**: Interface funcional
- **🎓 Onboarding**: Tour guiado ativo

### 🔍 Usuário Mock Padrão
```json
{
  "id": "dev-user-123",
  "email": "dev@ciliosclick.com",
  "nome": "Usuária Desenvolvimento",
  "tipo": "profissional",
  "is_admin": false,
  "onboarding_completed": false
}
```

### 📱 Páginas Disponíveis

#### 🏠 Páginas Principais
- `/` → Dashboard (redireciona)
- `/login` → Login/Registro
- `/dashboard` → Dashboard principal
- `/aplicar-cilios` → Aplicação de cílios
- `/parcerias` → Página pública de parcerias

#### 🔧 Páginas Admin
- `/admin/cupons` → Gerenciar cupons
- `/admin/relatorio-cupons` → Relatórios
- `/admin/emails` → Templates de email
- `/admin/teste` → Teste de funcionalidades
- `/admin/webhook-teste` → Teste webhook

---

## 🎯 Como Testar

### 1. Fluxo de Usuária Normal
```bash
1. Acesse http://localhost:5173/
2. Faça login com qualquer email/senha
3. Veja o onboarding (primeiro login)
4. Teste aplicação de cílios
5. Explore o dashboard
```

### 2. Fluxo de Admin
```bash
1. Modifique mockUser.is_admin = true no código
2. Acesse /admin/cupons
3. Teste funcionalidades administrativas
```

### 3. Página de Parcerias
```bash
1. Acesse http://localhost:5173/parcerias
2. Teste formulário de contato
3. Verifique responsividade
```

---

## 🛠 Comandos Úteis

### Desenvolvimento
```bash
npm run dev          # Servidor desenvolvimento
npm run build        # Build produção
npm run preview      # Preview do build
```

### Limpeza
```bash
rm -rf node_modules  # Limpar dependências
npm install          # Reinstalar
npm run dev          # Reiniciar
```

### Debug
```bash
# Verificar console do navegador
# F12 → Console → Ver logs de desenvolvimento
```

---

## 🔍 Troubleshooting

### ❌ Erro: "Variáveis de ambiente não encontradas"
**Solução**: ✅ Já corrigido! Modo desenvolvimento ativo.

### ❌ Erro: "Cannot connect to Supabase"
**Solução**: Normal em modo desenvolvimento. Configure .env.local para produção.

### ❌ Erro: "Port 5173 in use"
**Solução**: Vite automaticamente usa próxima porta (5174, 5175, etc.)

### ❌ Página em branco
**Solução**: 
1. Verifique console (F12)
2. Reinicie servidor (Ctrl+C → npm run dev)
3. Limpe cache do navegador

---

## 📊 Status do Sistema

### ✅ Funcionando
- Interface completa
- Navegação entre páginas
- Autenticação mock
- Aplicação de cílios (mock)
- Sistema de onboarding
- Página de parcerias
- Painel administrativo

### ⚠️ Requer Configuração
- Banco de dados real (Supabase)
- API de IA real
- Webhook Hotmart
- Envio de emails

### 🎯 Para Produção
- Configure .env.local
- Execute migrações SQL
- Configure domínio
- Deploy no Vercel

---

## 🎉 Próximos Passos

### 1. Desenvolvimento Local ✅
- [x] Servidor funcionando
- [x] Interface completa
- [x] Modo desenvolvimento ativo

### 2. Configuração Produção
- [ ] Criar projeto Supabase
- [ ] Configurar .env.local
- [ ] Testar com dados reais

### 3. Deploy
- [ ] Configurar Vercel
- [ ] Registrar domínio
- [ ] Lançamento oficial

---

**🎯 A CíliosClick está pronta para desenvolvimento!**

Acesse http://localhost:5173/ e explore todas as funcionalidades em modo desenvolvimento.

**#CíliosClick #DesenvolvimentoLocal #ModoDev** 🚀 